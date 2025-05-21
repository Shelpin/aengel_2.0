import express from 'express';
import type { Router } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';

import {
    elizaLogger,
    type Character,
    type IAgentRuntime,
    isUUID,
    UUID,
    getEnvVariable,
    validateCharacterConfig,
} from "@elizaos/core";

// import type { TeeLogQuery, TeeLogService } from "@elizaos/plugin-tee-log";
// import { REST, Routes } from "discord.js";
// Remove direct import from index to break circular dependency
// import type { DirectClient } from "..js";

interface UUIDParams {
    agentId: UUID;
    roomId?: UUID;
}

// Create an interface for the methods we need from DirectClient
interface IDirectClientMethods {
    unregisterAgent(agent: IAgentRuntime): void;
    startAgent(character: any): Promise<IAgentRuntime>;
}

function validateUUIDParams(
    params: { agentId: string; roomId?: string },
    res: express.Response
): UUIDParams | null {
    if (!params.agentId || !isUUID(params.agentId)) {
        res.status(400).json({
            error: "Invalid or missing agentId format",
        });
        return null;
    }

    if (params.roomId) {
        if (!isUUID(params.roomId)) {
            res.status(400).json({
                error: "Invalid roomId format",
            });
            return null;
        }
        return { agentId: params.agentId, roomId: params.roomId };
    }

    return { agentId: params.agentId };
}

export function createApiRouter(
    agents: Map<string, IAgentRuntime>,
    directClient: IDirectClientMethods
): Router {
    const router = express.Router();

    router.use(cors());
    router.use(bodyParser.json());
    router.use(bodyParser.urlencoded({ extended: true }));
    router.use(
        express.json({
            limit: getEnvVariable("EXPRESS_MAX_PAYLOAD") || "100kb",
        })
    );

    router.get("/", (req, res) => {
        res.send("Welcome, this is the REST API!");
    });

    router.get("/hello", (req, res) => {
        res.json({ message: "Hello World!" });
    });

    router.get("/agents", (req, res) => {
        const agentsList = Array.from(agents.values()).map((agent) => ({
            id: agent.agentId,
            name: agent.character.name,
            clients: Object.keys(agent.clients ?? {}),
        }));
        res.json({ agents: agentsList });
    });

    router.get('/storage', async (req, res) => {
        try {
            const uploadDir = path.join(process.cwd(), "data", "characters");
            const files = await fs.promises.readdir(uploadDir);
            res.json({ files });
        } catch (error: any) {
            elizaLogger.error(error.stack || error);
            res.status(500).json({ error: String(error) });
        }
    });

    router.get("/agents/:agentId", (req, res) => {
        const { agentId } = validateUUIDParams(req.params, res) ?? {
            agentId: null,
        };
        if (!agentId) return;

        const runtime = agents.get(agentId);
        if (!runtime) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        try {
            const character = runtime.character;
            if (character?.settings?.secrets) {
                delete character.settings.secrets;
            }

            res.json({
                id: runtime.agentId,
                character: runtime.character,
            });
        } catch (error: any) {
            elizaLogger.error(error.stack || error);
            res.status(500).json({ error: String(error) });
        }
    });

    router.delete("/agents/:agentId", async (req, res) => {
        const { agentId } = validateUUIDParams(req.params, res) ?? {
            agentId: null,
        };
        if (!agentId) return;

        const agent: IAgentRuntime = agents.get(agentId);

        if (agent) {
            agent.stop();
            directClient.unregisterAgent(agent);
            res.status(204).json({ success: true });
        } else {
            res.status(404).json({ error: "Agent not found" });
        }
    });

    router.post("/agents/:agentId/set", async (req, res) => {
        const { agentId } = validateUUIDParams(req.params, res) ?? {
            agentId: null,
        };
        if (!agentId) return;

        let agent: IAgentRuntime = agents.get(agentId);

        // update character
        if (agent) {
            // stop agent
            agent.stop();
            directClient.unregisterAgent(agent);
            // if it has a different name, the agentId will change
        }

        // stores the json data before it is modified with added data
        const characterJson = { ...req.body };

        // load character from body
        let character: Character;
        if (characterJson) {
            // Use provided JSON directly
            character = characterJson as Character;
        } else if (req.body.characterPath) {
            // Load and parse character file from disk
            const fileContent = await fs.promises.readFile(req.body.characterPath, 'utf8');
            character = JSON.parse(fileContent) as Character;
        } else {
            throw new Error("No character path or JSON provided");
        }
        try {
            validateCharacterConfig(character);
        } catch (error: any) {
            elizaLogger.error(error.stack || error);
            res.status(400).json({ error: String(error) });
            return;
        }

        // start it up (and register it)
        try {
            agent = await directClient.startAgent(character);
            elizaLogger.log(`${character.name} started`);
        } catch (error: any) {
            elizaLogger.error(error.stack || error);
            res.status(500).json({ error: String(error) });
            return;
        }

        if (process.env.USE_CHARACTER_STORAGE === "true") {
            try {
                const filename = `${agent.agentId}.json`;
                const uploadDir = path.join(
                    process.cwd(),
                    "data",
                    "characters"
                );
                const filepath = path.join(uploadDir, filename);
                await fs.promises.mkdir(uploadDir, { recursive: true });
                await fs.promises.writeFile(
                    filepath,
                    JSON.stringify(
                        { ...characterJson, id: agent.agentId },
                        null,
                        2
                    )
                );
                elizaLogger.info(
                    `Character stored successfully at ${filepath}`
                );
            } catch (error: any) {
                elizaLogger.error(error.stack || error);
            }
        }

        res.json({
            id: character.id,
            character: character,
        });
    });

    // router.get("/agents/:agentId/channels", async (req, res) => {
    //     const { agentId } = validateUUIDParams(req.params, res) ?? {
    //         agentId: null,
    //     };
    //     if (!agentId) return;

    //     const runtime = agents.get(agentId);

    //     if (!runtime) {
    //         res.status(404).json({ error: "Runtime not found" });
    //         return;
    //     }

    //     const API_TOKEN = runtime.getSetting("DISCORD_API_TOKEN") as string;
    //     const rest = new REST({ version: "10" }).setToken(API_TOKEN);

    //     try {
    //         const guilds = (await rest.get(Routes.userGuilds())) as Array<any>;

    //         res.json({
    //             id: runtime.agentId,
    //             guilds: guilds,
    //             serverCount: guilds.length,
    //         });
    //     } catch (error) {
    //         console.error("Error fetching guilds:", error);
    //         res.status(500).json({ error: "Failed to fetch guilds" });
    //     }
    // });

    router.get("/agents/:agentId/:roomId/memories", async (req, res) => {
        const { agentId, roomId } = validateUUIDParams(req.params, res) ?? {
            agentId: null,
            roomId: null,
        };
        if (!agentId || !roomId) return;

        const runtime = agents.get(agentId);
        if (!runtime) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        try {
            const memories = await runtime.messageManager.getMemories({
                roomId,
            });
            const response = {
                agentId,
                roomId,
                memories: memories.map((memory) => ({
                    id: memory.id,
                    userId: memory.userId,
                    agentId: memory.agentId,
                    createdAt: memory.createdAt,
                    content: {
                        text: memory.content.text,
                        action: memory.content.action,
                        source: memory.content.source,
                        url: memory.content.url,
                        inReplyTo: memory.content.inReplyTo,
                        attachments: memory.content.attachments?.map(
                            (attachment) => ({
                                id: attachment.id,
                                url: attachment.url,
                                title: attachment.title,
                                source: attachment.source,
                                description: attachment.description,
                                text: attachment.text,
                                contentType: attachment.contentType,
                            })
                        ),
                    },
                    embedding: memory.embedding,
                    roomId: memory.roomId,
                    unique: memory.unique,
                    similarity: memory.similarity,
                })),
            };

            res.json(response);
        } catch (error: any) {
            elizaLogger.error(error.stack || error);
            res.status(500).json({ error: String(error) });
        }
    });

    // router.get("/tee/agents", async (req, res) => {
    //     try {
    //         const allAgents = [];

    //         for (const agentRuntime of agents.values()) {
    //             const teeLogService = agentRuntime
    //                 .getService<TeeLogService>(ServiceType.TEE_LOG)
    //                 .getInstance();

    //             const agents = await teeLogService.getAllAgents();
    //             allAgents.push(...agents);
    //         }

    //         const runtime: IAgentRuntime = agents.values().next().value;
    //         const teeLogService = runtime
    //             .getService<TeeLogService>(ServiceType.TEE_LOG)
    //             .getInstance();
    //         const attestation = await teeLogService.generateAttestation(
    //             JSON.stringify(allAgents)
    //         );
    //         res.json({ agents: allAgents, attestation: attestation });
    //     } catch (error) {
    //         elizaLogger.error("Failed to get TEE agents:", error);
    //         res.status(500).json({
    //             error: "Failed to get TEE agents",
    //         });
    //     }
    // });

    // router.get("/tee/agents/:agentId", async (req, res) => {
    //     try {
    //         const agentId = req.params.agentId;
    //         const agentRuntime = agents.get(agentId);
    //         if (!agentRuntime) {
    //             res.status(404).json({ error: "Agent not found" });
    //             return;
    //         }

    //         const teeLogService = agentRuntime
    //             .getService<TeeLogService>(ServiceType.TEE_LOG)
    //             .getInstance();

    //         const teeAgent = await teeLogService.getAgent(agentId);
    //         const attestation = await teeLogService.generateAttestation(
    //             JSON.stringify(teeAgent)
    //         );
    //         res.json({ agent: teeAgent, attestation: attestation });
    //     } catch (error) {
    //         elizaLogger.error("Failed to get TEE agent:", error);
    //         res.status(500).json({
    //             error: "Failed to get TEE agent",
    //         });
    //     }
    // });

    // router.post(
    //     "/tee/logs",
    //     async (req: express.Request, res: express.Response) => {
    //         try {
    //             const query = req.body.query || {};
    //             const page = Number.parseInt(req.body.page) || 1;
    //             const pageSize = Number.parseInt(req.body.pageSize) || 10;

    //             const teeLogQuery: TeeLogQuery = {
    //                 agentId: query.agentId || "",
    //                 roomId: query.roomId || "",
    //                 userId: query.userId || "",
    //                 type: query.type || "",
    //                 containsContent: query.containsContent || "",
    //                 startTimestamp: query.startTimestamp || undefined,
    //                 endTimestamp: query.endTimestamp || undefined,
    //             };
    //             const agentRuntime: IAgentRuntime = agents.values().next().value;
    //             const teeLogService = agentRuntime
    //                 .getService<TeeLogService>(ServiceType.TEE_LOG)
    //                 .getInstance();
    //             const pageQuery = await teeLogService.getLogs(
    //                 teeLogQuery,
    //                 page,
    //                 pageSize
    //             );
    //             const attestation = await teeLogService.generateAttestation(
    //                 JSON.stringify(pageQuery)
    //             );
    //             res.json({
    //                 logs: pageQuery,
    //                 attestation: attestation,
    //             });
    //         } catch (error) {
    //             elizaLogger.error("Failed to get TEE logs:", error);
    //             res.status(500).json({
    //                 error: "Failed to get TEE logs",
    //             });
    //         }
    //     }
    // );

    router.post("/agent/start", async (req, res) => {
        const { characterPath, characterJson } = req.body;
        console.log("characterPath:", characterPath);
        console.log("characterJson:", characterJson);
        try {
            let character: Character;
            if (characterJson) {
                // Use provided JSON directly
                character = characterJson as Character;
            } else if (characterPath) {
                // Load and parse character file from disk
                const fileContent = await fs.promises.readFile(characterPath, 'utf8');
                character = JSON.parse(fileContent) as Character;
            } else {
                throw new Error("No character path or JSON provided");
            }
            const runtime = await directClient.startAgent(character);
            if (!runtime) {
                return res.status(500).json({ error: 'Failed to start agent' });
            }
            elizaLogger.log(`${character.name} started`);

            res.json({
                id: character.id,
                character: character,
            });
        } catch (error: any) {
            elizaLogger.error(error.stack || error);
            res.status(500).json({ error: String(error) });
            return;
        }
    });

    router.post("/agents/:agentId/stop", async (req, res) => {
        const { agentId } = validateUUIDParams(req.params, res) ?? {
            agentId: null,
        };
        if (!agentId) return;

        const runtime = agents.get(agentId);
        if (!runtime) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        try {
            runtime.stop();
            directClient.unregisterAgent(runtime);
            res.json({ success: true });
        } catch (error: any) {
            elizaLogger.error(error.stack || error);
            res.status(500).json({ error: String(error) });
        }
    });

    return router;
}
