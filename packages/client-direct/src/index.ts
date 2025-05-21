import {
    composeContext,
    elizaLogger,
    generateCaption,
    generateImage,
    generateMessageResponse,
    generateObject,
    getEmbeddingZeroVector,
    messageCompletionFooter,
    ModelClass,
    stringToUuid,
} from "@elizaos/core";

// Types imported from public API
import type {
    Client,
    Content,
    IAgentRuntime,
    Media,
    Memory,
    Plugin,
    Character,
    ClientInstance,
    Action,
    ICacheManager,
} from "@elizaos/core";

import type { ClientMessagePayload, ClientSettings, CommandSchema } from "./types.js";
import bodyParser from 'body-parser';
import cors from 'cors';
import express, { type Request as ExpressRequest } from 'express';
import * as fs from 'node:fs';
import multer from 'multer';
import OpenAI from 'openai';
import * as path from 'node:path';
import { z } from 'zod';
import { createApiRouter } from "./api.js";
import { createVerifiableLogApiRouter } from "./verifiable-log-api.js";
import handlebars from 'handlebars';

// Storage setup follows
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), "data", "uploads");
        // Create the directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    },
});

// some people have more memory than disk.io
const upload = multer({ storage /*: multer.memoryStorage() */ });

export const messageHandlerTemplate =
    // {{goals}}
    // "# Action Examples" is already included
    `{{actionExamples}}
(Action examples are for reference only. Do not use the information from them in your response.)

# Knowledge
{{knowledge}}

# Task: Generate dialog and actions for the character {{agentName}}.
About {{agentName}}:
{{bio}}
{{lore}}

{{providers}}

{{attachments}}

# Capabilities
Note that {{agentName}} is capable of reading/seeing/hearing various forms of media, including images, videos, audio, plaintext and PDFs. Recent attachments have been included above under the "Attachments" section.

{{messageDirections}}

{{recentMessages}}

{{actions}}

# Instructions: Write the next message for {{agentName}}.
` + messageCompletionFooter;

export const hyperfiHandlerTemplate = `{{actionExamples}}
(Action examples are for reference only. Do not use the information from them in your response.)

# Knowledge
{{knowledge}}

# Task: Generate dialog and actions for the character {{agentName}}.
About {{agentName}}:
{{bio}}
{{lore}}

{{providers}}

{{attachments}}

# Capabilities
Note that {{agentName}} is capable of reading/seeing/hearing various forms of media, including images, videos, audio, plaintext and PDFs. Recent attachments have been included above under the "Attachments" section.

{{messageDirections}}

{{recentMessages}}

{{actions}}

# Instructions: Write the next message for {{agentName}}.

Response format should be formatted in a JSON block like this:
\`\`\`json
{ "lookAt": "{{nearby}}" or null, "emote": "{{emotes}}" or null, "say": "string" or null, "actions": (array of strings) or null }
\`\`\`
`;

export class DirectClient {
    public app: express.Application;
    private agents: Map<string, IAgentRuntime>; // container management
    private server: any; // Store server instance
    public clients: ClientInstance[] = [];
    public actions: Action[] = [];
    public cacheManager: ICacheManager | null = null;
    public loadCharacterTryPath: Function; // Store loadCharacterTryPath functor
    public jsonToCharacter: Function; // Store jsonToCharacter functor

    constructor() {
        elizaLogger.log("DirectClient constructor");
        this.app = express();
        this.app.use(cors());
        this.agents = new Map();
        this.loadCharacterTryPath = () => '';
        this.jsonToCharacter = (json: unknown) => json as Character;

        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));

        // Serve both uploads and generated images
        this.app.use(
            "/media/uploads",
            express.static(path.join(process.cwd(), "/data/uploads"))
        );
        this.app.use(
            "/media/generated",
            express.static(path.join(process.cwd(), "/generatedImages"))
        );

        const apiRouter = createApiRouter(this.agents, this);
        this.app.use(apiRouter);

        const apiLogRouter = createVerifiableLogApiRouter(this.agents);
        this.app.use(apiLogRouter);

        // Define an interface that extends the Express Request interface
        interface CustomRequest extends ExpressRequest {
            file?: Express.Multer.File;
        }

        // Update the route handler to use CustomRequest instead of express.Request
        this.app.post(
            "/:agentId/whisper",
            upload.single("file"),
            async (req: CustomRequest, res: express.Response) => {
                const audioFile = req.file; // Access the uploaded file using req.file
                const agentId = req.params.agentId;

                if (!audioFile) {
                    res.status(400).send("No audio file provided");
                    return;
                }

                let runtime = this.agents.get(agentId);
                const apiKey = runtime.getSetting("OPENAI_API_KEY");

                // if runtime is null, look for runtime with the same name
                if (!runtime) {
                    runtime = Array.from(this.agents.values()).find(
                        (a) =>
                            a.character.name.toLowerCase() ===
                            agentId.toLowerCase()
                    );
                }

                if (!runtime) {
                    res.status(404).send("Agent not found");
                    return;
                }

                const openai = new OpenAI({
                    apiKey,
                });

                const transcription = await openai.audio.transcriptions.create({
                    file: fs.createReadStream(audioFile.path),
                    model: "whisper-1",
                });

                res.json(transcription);
            }
        );

        this.app.post(
            "/:agentId/message",
            upload.single("file"),
            async (req: express.Request, res: express.Response) => {
                const agentId = req.params.agentId;
                const roomId = stringToUuid(
                    req.body.roomId ?? "default-room-" + agentId
                );
                const userId = stringToUuid(req.body.userId ?? "user");

                let runtime = this.agents.get(agentId);

                // if runtime is null, look for runtime with the same name
                if (!runtime) {
                    runtime = Array.from(this.agents.values()).find(
                        (a) =>
                            a.character.name.toLowerCase() ===
                            agentId.toLowerCase()
                    );
                }

                if (!runtime) {
                    res.status(404).send("Agent not found");
                    return;
                }

                await runtime.ensureConnection(
                    userId,
                    roomId,
                    req.body.userName,
                    req.body.name,
                    "direct"
                );

                const text = req.body.text;
                // if empty text, directly return
                if (!text) {
                    res.json([]);
                    return;
                }

                const messageId = stringToUuid(Date.now().toString());

                const attachments: Media[] = [];
                if (req.file) {
                    const filePath = path.join(
                        process.cwd(),
                        "data",
                        "uploads",
                        req.file.filename
                    );
                    attachments.push({
                        id: Date.now().toString(),
                        url: filePath,
                        type: 'file',
                        mimeType: req.file.mimetype,
                        size: req.file.size,
                        createdAt: Date.now(),
                    });
                }

                const content: Content = {
                    text,
                    attachments,
                    source: "direct",
                    inReplyTo: undefined,
                };

                const userMessage: Memory = {
                    id: messageId,
                    agentId: runtime.agentId,
                    content,
                    userId,
                    roomId,
                    createdAt: Date.now(),
                    importance: 0,
                    lastAccessed: Date.now(),
                };

                await runtime.messageManager.createMemory(userMessage, true);

                let state = await runtime.composeState(userMessage as any, {
                    agentName: runtime.character.name,
                });

                const context = composeContext({
                    state,
                    template: messageHandlerTemplate,
                    templatingEngine: "handlebars"
                });

                const response = await generateMessageResponse({
                    runtime: runtime,
                    context,
                    modelClass: ModelClass.LARGE,
                });

                if (!response) {
                    res.status(500).send(
                        "No response from generateMessageResponse"
                    );
                    return;
                }

                // save response to memory
                const responseMessage: Memory = {
                    id: stringToUuid(Date.now().toString() + "-response"),
                    agentId: runtime.agentId,
                    ...userMessage,
                    userId: runtime.agentId,
                    content: response,
                    createdAt: Date.now(),
                    importance: 0,
                    lastAccessed: Date.now(),
                };

                await runtime.messageManager.createMemory(responseMessage);

                state = await runtime.updateRecentMessageState(state);

                let message = null as Content | null;

                await runtime.processActions(
                    userMessage,
                    [responseMessage] as unknown as Memory[],
                    state,
                    async (newMessages) => {
                        message = newMessages;
                        return [userMessage];
                    }
                );

                await runtime.evaluate(userMessage, state);

                // Check if we should suppress the initial message
                const action = runtime.actions.find(
                    (a) => a.name === response.action
                );
                const shouldSuppressInitialMessage =
                    action?.suppressInitialMessage;

                if (!shouldSuppressInitialMessage) {
                    if (message) {
                        res.json([response, message]);
                    } else {
                        res.json([response]);
                    }
                } else {
                    if (message) {
                        res.json([message]);
                    } else {
                        res.json([]);
                    }
                }
            }
        );

        this.app.post(
            "/agents/:agentIdOrName/hyperfi/v1",
            async (req: express.Request, res: express.Response) => {
                // get runtime
                const agentId = req.params.agentIdOrName;
                let runtime = this.agents.get(agentId);
                // if runtime is null, look for runtime with the same name
                if (!runtime) {
                    runtime = Array.from(this.agents.values()).find(
                        (a) =>
                            a.character.name.toLowerCase() ===
                            agentId.toLowerCase()
                    );
                }
                if (!runtime) {
                    res.status(404).send("Agent not found");
                    return;
                }

                // can we be in more than one hyperfi world at once
                // but you may want the same context is multiple worlds
                // this is more like an instanceId
                const roomId = stringToUuid(req.body.roomId ?? "hyperfi");

                const body = req.body;

                // hyperfi specific parameters
                let nearby = [];
                let availableEmotes = [];

                if (body.nearby) {
                    nearby = body.nearby;
                }
                if (body.messages) {
                    // loop on the messages and record the memories
                    // might want to do this in parallel
                    for (const msg of body.messages) {
                        const parts = msg.split(/:\s*/);
                        const mUserId = stringToUuid(parts[0]);
                        await runtime.ensureConnection(
                            mUserId,
                            roomId, // where
                            parts[0], // username
                            parts[0], // userScreeName?
                            "hyperfi"
                        );
                        const content: Content = {
                            text: parts[1] || "",
                            attachments: [],
                            source: "hyperfi",
                            inReplyTo: undefined,
                        };
                        const memory: Memory = {
                            id: stringToUuid(msg),
                            userId: mUserId,
                            roomId,
                            content,
                            createdAt: Date.now(),
                            importance: 0,
                            lastAccessed: Date.now(),
                        };
                        await runtime.messageManager.createMemory(memory);
                    }
                }
                if (body.availableEmotes) {
                    availableEmotes = body.availableEmotes;
                }

                const content: Content = {
                    // we need to compose who's near and what emotes are available
                    text: JSON.stringify(req.body),
                    attachments: [],
                    source: "hyperfi",
                    inReplyTo: undefined,
                };

                const userId = stringToUuid("hyperfi");
                const userMessage = {
                    content,
                    userId,
                    roomId,
                    agentId: runtime.agentId,
                };

                const state = await runtime.composeState(userMessage as any, {
                    agentName: runtime.character.name,
                });

                let template = hyperfiHandlerTemplate;
                template = template.replace(
                    "{{emotes}}",
                    availableEmotes.join("|")
                );
                template = template.replace("{{nearby}}", nearby.join("|"));
                const context = composeContext({
                    state,
                    template,
                    templatingEngine: "handlebars"
                });

                function createHyperfiOutSchema(
                    nearby: string[],
                    availableEmotes: string[]
                ) {
                    const lookAtSchema =
                        nearby.length > 1
                            ? z
                                .union(
                                    nearby.map((item) => z.literal(item)) as [
                                        z.ZodLiteral<string>,
                                        z.ZodLiteral<string>,
                                        ...z.ZodLiteral<string>[],
                                    ]
                                )
                                .nullable()
                            : nearby.length === 1
                                ? z.literal(nearby[0]).nullable()
                                : z.null(); // Fallback for empty array

                    const emoteSchema =
                        availableEmotes.length > 1
                            ? z
                                .union(
                                    availableEmotes.map((item) =>
                                        z.literal(item)
                                    ) as [
                                        z.ZodLiteral<string>,
                                        z.ZodLiteral<string>,
                                        ...z.ZodLiteral<string>[],
                                    ]
                                )
                                .nullable()
                            : availableEmotes.length === 1
                                ? z.literal(availableEmotes[0]).nullable()
                                : z.null(); // Fallback for empty array

                    return z.object({
                        lookAt: lookAtSchema,
                        emote: emoteSchema,
                        say: z.string().nullable(),
                        actions: z.array(z.string()).nullable(),
                    });
                }

                // Define the schema for the expected output
                const hyperfiOutSchema = createHyperfiOutSchema(
                    nearby,
                    availableEmotes
                );

                // Call LLM
                const response = await generateObject({
                    runtime,
                    context,
                    modelClass: ModelClass.SMALL, // 1s processing time on openai small
                    schema: hyperfiOutSchema,
                });

                if (!response) {
                    res.status(500).send(
                        "No response from generateMessageResponse"
                    );
                    return;
                }

                let hfOut;
                try {
                    hfOut = hyperfiOutSchema.parse(response.object);
                } catch {
                    elizaLogger.error(
                        "cant serialize response",
                        response.object
                    );
                    res.status(500).send("Error in LLM response, try again");
                    return;
                }

                // do this in the background
                new Promise((resolve) => {
                    const contentObj: Content = {
                        text: hfOut.say,
                    };

                    if (hfOut.lookAt !== null || hfOut.emote !== null) {
                        contentObj.text += ". Then I ";
                        if (hfOut.lookAt !== null) {
                            contentObj.text += "looked at " + hfOut.lookAt;
                            if (hfOut.emote !== null) {
                                contentObj.text += " and ";
                            }
                        }
                        if (hfOut.emote !== null) {
                            contentObj.text = "emoted " + hfOut.emote;
                        }
                    }

                    if (hfOut.actions !== null) {
                        // content can only do one action
                        contentObj.action = hfOut.actions[0];
                    }

                    // save response to memory
                    const responseMessage: Memory = {
                        id: stringToUuid(Date.now().toString() + "-agent-response"), // Unique ID for agent's response
                        agentId: runtime.agentId,
                        userId: runtime.agentId, // The agent is the user for this memory event
                        roomId: userMessage.roomId, // from the original userMessage
                        content: contentObj, // The agent's response content
                        createdAt: Date.now(),
                        importance: 0,
                        lastAccessed: Date.now(),
                        // embedding will be added by createMemory if needed
                    };

                    runtime.messageManager
                        .createMemory(responseMessage)
                        .then(() => {
                            const messageId = stringToUuid(
                                Date.now().toString()
                            );
                            const memory: Memory = {
                                id: messageId,
                                userId,
                                roomId,
                                content,
                                createdAt: Date.now(),
                                importance: 0,
                                lastAccessed: Date.now(),
                            };

                            // run evaluators (generally can be done in parallel with processActions)
                            // can an evaluator modify memory? it could but currently doesn't
                            runtime.evaluate(memory, state).then(() => {
                                // only need to call if responseMessage.content.action is set
                                if (contentObj.action) {
                                    // pass memory (query) to any actions to call
                                    runtime.processActions(
                                        memory,
                                        [responseMessage] as unknown as Memory[],
                                        state,
                                        async (_newMessages) => {
                                            // FIXME: this is supposed override what the LLM said/decided
                                            // but the promise doesn't make this possible
                                            //message = newMessages;
                                            return [memory];
                                        }
                                    ); // 0.674s
                                }
                                resolve(true);
                            });
                        });
                });
                res.json({ response: hfOut });
            }
        );

        this.app.post(
            "/:agentId/image",
            async (req: express.Request, res: express.Response) => {
                const agentId = req.params.agentId;
                const agent = this.agents.get(agentId);
                if (!agent) {
                    res.status(404).send("Agent not found");
                    return;
                }

                const images = await generateImage({ ...req.body }, agent);
                const imagesRes: { image: string; caption: string }[] = [];
                if (images.data && images.data.length > 0) {
                    for (let i = 0; i < images.data.length; i++) {
                        const caption = await generateCaption(
                            { imageUrl: images.data[i] },
                            agent
                        );
                        imagesRes.push({
                            image: images.data[i],
                            caption: caption.title,
                        });
                    }
                }
                res.json({ images: imagesRes });
            }
        );

        this.app.post(
            "/fine-tune",
            async (req: express.Request, res: express.Response) => {
                try {
                    const response = await fetch(
                        "https://api.bageldb.ai/api/v1/asset",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "X-API-KEY": `${process.env.BAGEL_API_KEY}`,
                            },
                            body: JSON.stringify(req.body),
                        }
                    );

                    const data = await response.json();
                    res.json(data);
                } catch (error) {
                    res.status(500).json({
                        error: "Please create an account at bakery.bagel.net and get an API key. Then set the BAGEL_API_KEY environment variable.",
                        details: error.message,
                    });
                }
            }
        );
        this.app.get(
            "/fine-tune/:assetId",
            async (req: express.Request, res: express.Response) => {
                const assetId = req.params.assetId;

                const ROOT_DIR = path.join(process.cwd(), "downloads");
                const downloadDir = path.resolve(ROOT_DIR, assetId);

                if (!downloadDir.startsWith(ROOT_DIR)) {
                    res.status(403).json({
                        error: "Invalid assetId. Access denied.",
                    });
                    return;
                }
                elizaLogger.log("Download directory:", downloadDir);

                try {
                    elizaLogger.log("Creating directory...");
                    await fs.promises.mkdir(downloadDir, { recursive: true });

                    elizaLogger.log("Fetching file...");
                    const fileResponse = await fetch(
                        `https://api.bageldb.ai/api/v1/asset/${assetId}/download`,
                        {
                            headers: {
                                "X-API-KEY": `${process.env.BAGEL_API_KEY}`,
                            },
                        }
                    );

                    if (!fileResponse.ok) {
                        throw new Error(
                            `API responded with status ${fileResponse.status}: ${await fileResponse.text()}`
                        );
                    }

                    elizaLogger.log("Response headers:", fileResponse.headers);

                    const fileName =
                        fileResponse.headers
                            .get("content-disposition")
                            ?.split("filename=")[1]
                            ?.replace(/"/g, /* " */ "") || "default_name.txt";

                    elizaLogger.log("Saving as:", fileName);

                    const arrayBuffer = await fileResponse.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);

                    const filePath = path.join(downloadDir, fileName);
                    elizaLogger.log("Full file path:", filePath);

                    await fs.promises.writeFile(filePath, new Uint8Array(buffer));

                    // Verify file was written
                    const stats = await fs.promises.stat(filePath);
                    elizaLogger.log(
                        "File written successfully. Size:",
                        stats.size,
                        "bytes"
                    );

                    res.json({
                        success: true,
                        message: "Single file downloaded successfully",
                        downloadPath: downloadDir,
                        fileCount: 1,
                        fileName: fileName,
                        fileSize: stats.size,
                    });
                } catch (error) {
                    elizaLogger.error("Detailed error:", error);
                    res.status(500).json({
                        error: "Failed to download files from BagelDB",
                        details: error.message,
                        stack: error.stack,
                    });
                }
            }
        );

        this.app.post("/:agentId/speak", async (req, res) => {
            const agentId = req.params.agentId;
            const roomId = stringToUuid(
                req.body.roomId ?? "default-room-" + agentId
            );
            const userId = stringToUuid(req.body.userId ?? "user");
            const text = req.body.text;

            if (!text) {
                res.status(400).send("No text provided");
                return;
            }

            let runtime = this.agents.get(agentId);

            // if runtime is null, look for runtime with the same name
            if (!runtime) {
                runtime = Array.from(this.agents.values()).find(
                    (a) =>
                        a.character.name.toLowerCase() === agentId.toLowerCase()
                );
            }

            if (!runtime) {
                res.status(404).send("Agent not found");
                return;
            }

            try {
                // Process message through agent (same as /message endpoint)
                await runtime.ensureConnection(
                    userId,
                    roomId,
                    req.body.userName,
                    req.body.name,
                    "direct"
                );

                const messageId = stringToUuid(Date.now().toString());

                const content: Content = {
                    text,
                    attachments: [],
                    source: "direct",
                    inReplyTo: undefined,
                };

                // This is the user's incoming message, ensure it's a full Memory object
                const userMessage: Memory = {
                    id: messageId, 
                    agentId: runtime.agentId, // The agent this message is directed to
                    userId: userId, // The actual user sending the message
                    roomId: roomId,
                    content: content,
                    createdAt: Date.now(),
                    importance: 0, // Default importance
                    lastAccessed: Date.now(),
                    // embedding will be added by createMemory if needed
                };

                // Persist the user's message to memory
                await runtime.messageManager.createMemory(userMessage, true);

                // Get agent's response
                const state = await runtime.composeState(userMessage, {
                    agentName: runtime.character.name,
                    // Add other necessary properties for composeState if any
                });

                const context = composeContext({
                    state,
                    template: messageHandlerTemplate, // Or hyperfiHandlerTemplate if appropriate
                    templatingEngine: "handlebars",
                });

                const responseContent = await generateMessageResponse({
                    runtime: runtime,
                    context,
                    modelClass: ModelClass.LARGE, // Or other if needed
                });

                if (!responseContent || !responseContent.text) {
                    res.status(500).send("Agent did not generate a text response.");
                    return;
                }

                // Save agent's response to memory
                const agentResponseMessage: Memory = {
                    id: stringToUuid(Date.now().toString() + "-agent-speak-response"),
                    agentId: runtime.agentId,
                    userId: runtime.agentId, // Agent is the user for its own message
                    roomId: roomId,
                    content: responseContent,
                    createdAt: Date.now(),
                    importance: 0,
                    lastAccessed: Date.now(),
                };
                await runtime.messageManager.createMemory(agentResponseMessage, true);

                // Process actions and evaluations if needed (based on hyperfi or message endpoints)
                await runtime.evaluate(userMessage, state); // Evaluate user's message
                if (responseContent.action) {
                    await runtime.processActions(
                        userMessage, // The message that might have triggered actions
                        [agentResponseMessage], // The agent's response
                        state,
                        async (newMessages) => { 
                            // This callback might modify messages or state
                            return newMessages; // Or original messages
                        }
                    );
                }

                // Get the text to convert to speech
                const textToSpeak = responseContent.text;

                // Convert to speech using ElevenLabs
                const elevenLabsApiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${runtime.getSetting("ELEVENLABS_VOICE_ID")}`;
                const apiKey = runtime.getSetting("ELEVENLABS_XI_API_KEY");

                if (!apiKey) {
                    throw new Error("ELEVENLABS_XI_API_KEY not configured in agent settings.");
                }
                if (!runtime.getSetting("ELEVENLABS_VOICE_ID")) {
                    throw new Error("ELEVENLABS_VOICE_ID not configured in agent settings.");
                }

                const speechResponse = await fetch(elevenLabsApiUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "xi-api-key": apiKey,
                    },
                    body: JSON.stringify({
                        text: textToSpeak,
                        model_id: runtime.getSetting("ELEVENLABS_MODEL_ID") || "eleven_multilingual_v2",
                        voice_settings: {
                            stability: Number.parseFloat(runtime.getSetting("ELEVENLABS_VOICE_STABILITY") || "0.5"),
                            similarity_boost: Number.parseFloat(runtime.getSetting("ELEVENLABS_VOICE_SIMILARITY_BOOST") || "0.9"),
                            style: Number.parseFloat(runtime.getSetting("ELEVENLABS_VOICE_STYLE") || "0.66"),
                            use_speaker_boost: runtime.getSetting("ELEVENLABS_VOICE_USE_SPEAKER_BOOST") === "true",
                        },
                    }),
                });

                if (!speechResponse.ok) {
                    throw new Error(`ElevenLabs API error: ${speechResponse.statusText} - ${await speechResponse.text()}`);
                }

                const audioBuffer = await speechResponse.arrayBuffer();

                // Set appropriate headers for audio streaming
                res.set({
                    "Content-Type": "audio/mpeg",
                    "Transfer-Encoding": "chunked",
                });

                res.send(Buffer.from(audioBuffer));

            } catch (error) {
                elizaLogger.error(
                    "Error processing message or generating speech:",
                    error
                );
                res.status(500).json({
                    error: "Error processing message or generating speech",
                    details: error.message,
                });
            }
        });

        this.app.post("/:agentId/tts", async (req, res) => {
            const text = req.body.text;

            if (!text) {
                res.status(400).send("No text provided");
                return;
            }

            try {
                // Convert to speech using ElevenLabs
                const elevenLabsApiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`;
                const apiKey = process.env.ELEVENLABS_XI_API_KEY;

                if (!apiKey) {
                    throw new Error("ELEVENLABS_XI_API_KEY not configured");
                }

                const speechResponse = await fetch(elevenLabsApiUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "xi-api-key": apiKey,
                    },
                    body: JSON.stringify({
                        text,
                        model_id:
                            process.env.ELEVENLABS_MODEL_ID ||
                            "eleven_multilingual_v2",
                        voice_settings: {
                            stability: Number.parseFloat(
                                process.env.ELEVENLABS_VOICE_STABILITY || "0.5"
                            ),
                            similarity_boost: Number.parseFloat(
                                process.env.ELEVENLABS_VOICE_SIMILARITY_BOOST ||
                                "0.9"
                            ),
                            style: Number.parseFloat(
                                process.env.ELEVENLABS_VOICE_STYLE || "0.66"
                            ),
                            use_speaker_boost:
                                process.env
                                    .ELEVENLABS_VOICE_USE_SPEAKER_BOOST ===
                                "true",
                        },
                    }),
                });

                if (!speechResponse.ok) {
                    throw new Error(
                        `ElevenLabs API error: ${speechResponse.statusText}`
                    );
                }

                const audioBuffer = await speechResponse.arrayBuffer();

                res.set({
                    "Content-Type": "audio/mpeg",
                    "Transfer-Encoding": "chunked",
                });

                res.send(Buffer.from(audioBuffer));
            } catch (error) {
                elizaLogger.error(
                    "Error processing message or generating speech:",
                    error
                );
                res.status(500).json({
                    error: "Error processing message or generating speech",
                    details: error.message,
                });
            }
        });
    } // End of constructor

    // Add startAgent method to satisfy IDirectClientMethods
    public async startAgent(character: Character): Promise<IAgentRuntime> {
        // Placeholder implementation - Actual logic might be injected or defined elsewhere
        elizaLogger.warn(
            "DirectClient.startAgent called, but not fully implemented. Returning rejected promise."
        );
        // If the actual startAgent function is assigned later, this might need adjustment
        // For now, we reject to indicate it needs proper setup.
        // A real implementation would create/add AgentRuntime and return it.
        return Promise.reject(
            new Error("startAgent not implemented or initialized.")
        );
    }

    // Add unregisterAgent method to satisfy IDirectClientMethods
    public unregisterAgent(agent: IAgentRuntime): void {
        elizaLogger.log(`Unregistering agent: ${agent.agentId}`);
        this.agents.delete(agent.agentId);
        // Potentially add agent.stop() here if not handled elsewhere
    }

    public async message(
        text: Content,
        userId: string,
        roomId: string,
        agentId: string
    ): Promise<Content[]> {
        // Implementation for message method
        // This is a placeholder and should be replaced with actual logic
        elizaLogger.warn(
            "DirectClient.message called, but not fully implemented. Returning empty array."
        );
        return [];
    }

    public registerAgent(runtime: IAgentRuntime) {
        // register any plugin endpoints?
        // but once and only once
        this.agents.set(runtime.agentId, runtime);
    }

    public start(port: number) {
        this.server = this.app.listen(port, () => {
            elizaLogger.success(
                `REST API bound to 0.0.0.0:${port}. If running locally, access it at http://localhost:${port}.`
            );
        });

        // Handle graceful shutdown
        const gracefulShutdown = () => {
            elizaLogger.log("Received shutdown signal, closing server...");
            this.server.close(() => {
                elizaLogger.success("Server closed successfully");
                process.exit(0);
            });

            // Force close after 5 seconds if server hasn't closed
            setTimeout(() => {
                elizaLogger.error(
                    "Could not close connections in time, forcefully shutting down"
                );
                process.exit(1);
            }, 5000);
        };

        // Handle different shutdown signals
        process.on("SIGTERM", gracefulShutdown);
        process.on("SIGINT", gracefulShutdown);
    }

    public async stop() {
        if (this.server) {
            this.server.close(() => {
                elizaLogger.success("Server stopped");
            });
        }
    }

    // Make DirectClient conform to ClientInstance
    public async sendMessage(message: any): Promise<any> {
        // Route via message method
        return this.message(
            message.text,
            message.userId,
            message.roomId,
            message.agentId
        );
    }
}

export const DirectClientInterface: Client = {
    name: 'direct',
    config: {},
    start: async (_runtime: IAgentRuntime): Promise<ClientInstance> => {
        elizaLogger.log("DirectClientInterface start");
        const client = new DirectClient();
        const serverPort = Number.parseInt(process.env.SERVER_PORT || "3000");
        client.start(serverPort);
        // Wrap DirectClient into a ClientInstance
        const instance: ClientInstance = {
            start: async () => {
                client.start(serverPort);
            },
            stop: async () => {
                await client.stop();
            },
            sendMessage: async (message) => {
                return client.message(
                    message.text,
                    message.userId,
                    message.roomId,
                    message.agentId
                );
            }
        };
        return instance;
    },
};

const directPlugin: Plugin = {
    name: "direct",
    clients: [DirectClientInterface],
};
export default directPlugin;
