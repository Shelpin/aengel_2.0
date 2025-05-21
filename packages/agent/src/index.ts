import {
    AgentRuntime,
    CacheManager,
    CacheStore,
    type Plugin,
    type Character,
    type ClientInstance,
    DbCacheAdapter,
    elizaLogger,
    FsCacheAdapter,
    type IDatabaseAdapter,
    type IDatabaseCacheAdapter,
    type IAgentRuntime,
    type Logger,
    ModelProviderName,
    parseBooleanFromText,
    stringToUuid,
    validateCharacterConfig,
    type Provider,
} from '@elizaos/core';
import { defaultCharacter } from "./defaultCharacter.js";

import bootstrapPlugin from "@elizaos/plugin-bootstrap";
import JSON5 from 'json5';

import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command } from "commander";
import yargs from 'yargs';
// Ensure no import for runtime-patch.js is here
import { createRequire } from 'node:module';

// Define __dirname_agent correctly for ES modules
const __filename_agent = fileURLToPath(import.meta.url);
const __dirname_agent = path.dirname(__filename_agent);

export const wait = (minTime = 1000, maxTime = 3000) => {
    const waitTime =
        Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;
    return new Promise((resolve) => setTimeout(resolve, waitTime));
};

const logFetch = async (url: string, options: any) => {
    elizaLogger.debug(`Fetching ${url}`);
    // Disabled to avoid disclosure of sensitive information such as API keys
    // elizaLogger.debug(JSON.stringify(options, null, 2));
    return fetch(url, options);
};

export function parseArguments(): { character?: string; characters?: string; clients?: string; plugins?: string; port?: number; 'log-level'?: string } {
    try {
        return yargs(process.argv.slice(2))
            .option('character', {
                alias: 'characters',
                type: 'string',
                describe: 'Path to character JSON file'
            })
            .option('clients', {
                type: 'string',
                describe: 'Comma-separated list of client modules'
            })
            .option('plugins', {
                type: 'string',
                describe: 'Comma-separated list of plugin modules'
            })
            .option('port', {
                type: 'number',
                describe: 'Port for agent HTTP server'
            })
            .option('log-level', {
                type: 'string',
                describe: 'Logging level'
            })
            .parseSync();
    } catch (error) {
        console.error('Error parsing arguments:', error);
        return {};
    }
}

function tryLoadFile(filePath: string): string | null {
    try {
        return fs.readFileSync(filePath, "utf8");
    } catch (e) {
        return null;
    }
}
function mergeCharacters(base: Character, child: Character): Character {
    const mergeObjects = (baseObj: any, childObj: any) => {
        const result: any = {};
        const keys = new Set([
            ...Object.keys(baseObj || {}),
            ...Object.keys(childObj || {}),
        ]);
        keys.forEach((key) => {
            if (
                typeof baseObj[key] === "object" &&
                typeof childObj[key] === "object" &&
                !Array.isArray(baseObj[key]) &&
                !Array.isArray(childObj[key])
            ) {
                result[key] = mergeObjects(baseObj[key], childObj[key]);
            } else if (
                Array.isArray(baseObj[key]) ||
                Array.isArray(childObj[key])
            ) {
                result[key] = [
                    ...(baseObj[key] || []),
                    ...(childObj[key] || []),
                ];
            } else {
                result[key] =
                    childObj[key] !== undefined ? childObj[key] : baseObj[key];
            }
        });
        return result;
    };
    return mergeObjects(base, child);
}

async function loadCharactersFromUrl(url: string): Promise<Character[]> {
    try {
        const response = await fetch(url);
        const responseJson = await response.json();

        let characters: Character[] = [];
        if (Array.isArray(responseJson)) {
            characters = await Promise.all(
                responseJson.map((character) => jsonToCharacter(url, character))
            );
        } else {
            const character = await jsonToCharacter(url, responseJson);
            characters.push(character);
        }
        return characters;
    } catch (e) {
        console.error(`Error loading character(s) from ${url}: `, e);
        process.exit(1); // Consider removing process.exit for library-like behavior
    }
    return []; // Should be unreachable if process.exit is used, but satisfies linter if not
}

function normalizeSecrets(character: any): void {
    if (character.secrets) {
        character.settings = character.settings || {};
        character.settings.secrets = {
            ...character.settings.secrets,
            ...character.secrets
        };
        character.secrets = { // Also overwrite top-level secrets
            ...character.settings.secrets
        };
    }
}

async function jsonToCharacter(
    filePath: string,
    character: any
): Promise<Character> {
    validateCharacterConfig(character);
    normalizeSecrets(character);

    const characterId = character.id || character.name;
    const characterPrefix = `CHARACTER.${characterId
        .toUpperCase()
        .replace(/ /g, "_")}.`;

    const characterSettings = Object.entries(process.env)
        .filter(([key, value]) => key.startsWith(characterPrefix) && value !== undefined)
        .reduce((settingsAcc, [key, value]) => {
            const settingKey = key.slice(characterPrefix.length);
            return { ...settingsAcc, [settingKey]: value as string };
        }, {} as Record<string, string>);

    if (Object.keys(characterSettings).length > 0) {
        character.settings = character.settings || {};
        character.settings.secrets = {
            ...characterSettings, // Env vars take precedence
            ...character.settings.secrets,
        };
    }

    if (
        character.settings?.secrets?.TELEGRAM_BOT_TOKEN?.startsWith("\${") &&
        character.settings.secrets.TELEGRAM_BOT_TOKEN.endsWith("}")
    ) {
        const envVarName = character.settings.secrets.TELEGRAM_BOT_TOKEN.slice(2, -1);
        let envVarValue = process.env[envVarName] || process.env.TELEGRAM_BOT_TOKEN;
        if (envVarValue) {
            elizaLogger.debug(`Substituting ${envVarName} for TELEGRAM_BOT_TOKEN`);
            character.settings.secrets.TELEGRAM_BOT_TOKEN = envVarValue;
        } else {
            elizaLogger.warn(`Environment variable ${envVarName} (or TELEGRAM_BOT_TOKEN) not found for TELEGRAM_BOT_TOKEN substitution.`);
        }
        const token = character.settings.secrets.TELEGRAM_BOT_TOKEN;
        const maskedToken = token && token.length > 6 ?
            `${token.slice(0, 3)}...${token.slice(-3)}` : token;
        elizaLogger.debug(`[DEBUG] TELEGRAM_BOT_TOKEN after substitution: ${maskedToken}`);
    }

    if (character.extends) {
        elizaLogger.info(
            `Merging ${character.name} character with parent characters`
        );
        for (const extendPath of character.extends) {
            const baseCharacter = await loadCharacter(
                path.resolve(path.dirname(filePath), extendPath)
            );
            character = mergeCharacters(baseCharacter, character);
            elizaLogger.info(
                `Merged ${character.name} with ${baseCharacter.name}`
            );
        }
    }
    return character;
}

async function loadCharacter(filePath: string): Promise<Character> {
    const content = tryLoadFile(filePath);
    if (!content) {
        throw new Error(`Character file not found: ${filePath}`);
    }
    const character = JSON5.parse(content);
    return jsonToCharacter(filePath, character);
}

async function loadCharacterTryPath(characterPath: string): Promise<Character> {
    let content: string | null = null;
    let resolvedPath = "";

    const pathsToTry = [
        characterPath,
        path.resolve(process.cwd(), characterPath),
        path.resolve(process.cwd(), "agent", characterPath), // For cases where cwd is root but path is relative to agent
        path.resolve(__dirname_agent, characterPath),
        path.resolve(__dirname_agent, "characters", path.basename(characterPath)),
        path.resolve(__dirname_agent, "../characters", path.basename(characterPath)),
        path.resolve(
            __dirname_agent,
            "../../characters",
            path.basename(characterPath)
        ),
        path.resolve(
            __dirname_agent,
            "../../../characters", // This should be root characters/
            path.basename(characterPath)
        ),
    ];

    elizaLogger.debug(
        "Trying paths for character loading:",
        pathsToTry.map((p) => ({
            path: p,
            exists: fs.existsSync(p),
        }))
    );

    for (const tryPath of pathsToTry) {
        content = tryLoadFile(tryPath);
        if (content !== null) {
            resolvedPath = tryPath;
            break;
        }
    }

    if (content === null) {
        elizaLogger.error(
            `Error loading character from ${characterPath}: File not found in any of the expected locations.`
        );
        elizaLogger.error("Tried the following paths:");
        pathsToTry.forEach((p) => elizaLogger.error(` - ${p}`));
        throw new Error(
            `Error loading character from ${characterPath}: File not found.`
        );
    }
    try {
        const character: Character = await loadCharacter(resolvedPath);
        elizaLogger.success(`Successfully loaded character from: ${resolvedPath}`);
        return character;
    } catch (e) {
        console.error(`Error parsing character from ${resolvedPath}: `, e);
        throw new Error(`Error parsing character from ${resolvedPath}: ${e}`);
    }
}

function commaSeparatedStringToArray(commaSeparated?: string): string[] {
    return commaSeparated?.split(",").map((value) => value.trim()) || [];
}

async function readCharactersFromStorage(
    characterPaths: string[]
): Promise<string[]> {
    try {
        const uploadDir = path.join(process.cwd(), "data", "characters");
        await fs.promises.mkdir(uploadDir, { recursive: true });
        const fileNames = await fs.promises.readdir(uploadDir);
        fileNames.forEach((fileName) => {
            characterPaths.push(path.join(uploadDir, fileName));
        });
    } catch (err: any) {
        elizaLogger.error(`Error reading character storage directory: ${err.message}`);
    }
    return characterPaths;
}

export async function loadCharacters(
    charactersArg?: string 
): Promise<Character[]> {
    let effectiveCharacterArg = charactersArg;

    if (!effectiveCharacterArg) {
        const defaultAengelPath = path.resolve(__dirname_agent, '..', '..', '..', 'characters', 'aengel.json');
        elizaLogger.warn(
            `[DEBUG_AENGEL_LOAD] loadCharacters called with no charactersArg. Defaulting to: ${defaultAengelPath}`
        );
        effectiveCharacterArg = defaultAengelPath;
    }
    elizaLogger.info(`[DEBUG_AENGEL_LOAD] loadCharacters using effectiveCharacterArg: ${effectiveCharacterArg}`);

    let characterPaths = commaSeparatedStringToArray(effectiveCharacterArg);

    if (process.env.USE_CHARACTER_STORAGE === "true") {
        characterPaths = await readCharactersFromStorage(characterPaths);
    }

    const loadedCharacters: Character[] = [];

    if (characterPaths?.length > 0) {
        for (const characterPath of characterPaths) {
            try {
                const character: Character = await loadCharacterTryPath(
                    characterPath
                );
                loadedCharacters.push(character);
            } catch (e) {
                // If a specific character file fails to load, log and continue, or decide to exit.
                // Forcing exit as per original logic.
                elizaLogger.error(`Failed to load character ${characterPath}. Exiting.`);
                process.exit(1);
            }
        }
    }

    if (hasValidRemoteUrls()) {
        elizaLogger.info("Loading characters from remote URLs");
        const characterUrls = commaSeparatedStringToArray(
            process.env.REMOTE_CHARACTER_URLS
        );
        for (const characterUrl of characterUrls) {
            try {
                const characters = await loadCharactersFromUrl(characterUrl);
                loadedCharacters.push(...characters);
            } catch (e) {
                elizaLogger.error(`Failed to load characters from URL ${characterUrl}. Exiting.`);
                process.exit(1);
            }
        }
    }
    
    if (loadedCharacters.length === 0) {
        elizaLogger.info("No character file specified via arguments, or file(s) not found. Attempting to load 'characters/aengel.json' by default.");
        try {
            const aengelPath = path.resolve(__dirname_agent, '..', '..', '..', 'characters', 'aengel.json'); 
            elizaLogger.info(`Attempting to load default aengel from: ${aengelPath}`);
            const character = await loadCharacterTryPath(aengelPath);
            if (character) {
                elizaLogger.info(`Successfully loaded default character 'ængel' from: ${aengelPath}`);
                loadedCharacters.push(character);
            } else {
                elizaLogger.warn(`Could not load 'characters/aengel.json' by default. Path tried: ${aengelPath}`);
            }
        } catch (e: any) {
            elizaLogger.warn(`Error loading 'characters/aengel.json' by default: ${e.message}`);
        }
    }

    if (loadedCharacters.length === 0) {
        elizaLogger.info("No characters found (even after attempting aengel.json), using internal default Eliza character");
        loadedCharacters.push(defaultCharacter);
    }

    return loadedCharacters;
}

async function handlePluginImporting(plugins: string[]): Promise<Plugin[]> {
    elizaLogger.debug("[PLUGIN_IMPORT_DEBUG] handlePluginImporting received:", plugins);
    if (!Array.isArray(plugins)) {
        elizaLogger.error("[PLUGIN_IMPORT_ERROR] Input to handlePluginImporting is not an array!", plugins);
        return [];
    }
    if (plugins.some(p => typeof p !== 'string')) {
        elizaLogger.error("[PLUGIN_IMPORT_ERROR] Input array to handlePluginImporting contains non-string elements!", plugins);
        // Potentially throw an error or filter non-strings
    }

    const importedPlugins: Plugin[] = [];
    if (plugins.length > 0) {
        elizaLogger.debug("[PLUGIN_IMPORT_DEBUG] Processing plugins array...");
        for (const plugin of plugins) {
            if (typeof plugin !== 'string') {
                elizaLogger.warn(`[PLUGIN_IMPORT_SKIP] Plugin entry is not a string, skipping:`, plugin);
                continue;
            }
            elizaLogger.debug(`[PLUGIN_IMPORT_DEBUG] Attempting to import plugin: ${plugin}`);
            let importedModule: any;
            try {
                importedModule = await import(plugin);
            } catch (importError) {
                elizaLogger.warn(`[PLUGIN_IMPORT_DEBUG] Direct import failed for plugin: ${plugin}. Error: ${importError}`);
                elizaLogger.debug(`[PLUGIN_IMPORT_DEBUG] Entering fallback logic for plugin: ${plugin}`);
                try {
                    const pkgParts = plugin.split('/');
                    const pkgName = pkgParts.length > 1 ? pkgParts[1] : pkgParts[0]; // Handle cases like "my-plugin" vs "@scope/my-plugin"
                    const workspaceEntry = path.resolve(
                        __dirname_agent,             // .../packages/agent/dist
                        '../../..',            // up to /root/eliza
                        'packages',
                        pkgName,               // e.g., plugin-bootstrap
                        'dist',                // Look in dist first
                        'index.js'             // Common entry point
                    );
                     elizaLogger.debug(`[PLUGIN_IMPORT_DEBUG] Fallback workspace path: ${workspaceEntry}`);
                    try {
                         importedModule = await import(workspaceEntry);
                    } catch (workspaceError) {
                        elizaLogger.error(`Plugin import failed for ${plugin} (direct and workspace attempts). Direct error: ${importError}. Workspace error: ${workspaceError}`);
                        continue; // Skip this plugin
                    }
                } catch (splitError) {
                    elizaLogger.error(`[PLUGIN_IMPORT_ERROR] Error during path construction for plugin: ${plugin}. Error:`, splitError);
                    continue; // Skip this plugin
                }
            }

            // Standardize access to the plugin instance (default export or named export)
            const pluginInstance = importedModule?.default || importedModule?.[Object.keys(importedModule)[0]];

            if (pluginInstance && (typeof pluginInstance === 'function' || typeof pluginInstance === 'object')) {
                // It's common for plugins to be factory functions or direct objects.
                // If it's a function, it might need to be called to get the plugin object.
                // This logic might need adjustment based on how plugins are structured.
                // For now, assume pluginInstance is the plugin itself or a factory.
                // If it's a factory, ElizaOS core usually calls it.
                importedPlugins.push(pluginInstance as Plugin);
                elizaLogger.debug(`Successfully processed plugin: ${plugin}`);
            } else {
                elizaLogger.error(`Could not find a valid export for plugin ${plugin}. Module keys: ${importedModule ? Object.keys(importedModule) : 'null'}`);
            }
        }
        return importedPlugins;
    } else {
        return [];
    }
}

export function getTokenForProvider(
    provider: ModelProviderName,
    character: Character
): string | undefined {
    switch (provider) {
        case ModelProviderName.LLAMALOCAL: return "";
        case ModelProviderName.OLLAMA: return "";
        case ModelProviderName.LMSTUDIO: return "";
        case ModelProviderName.GAIANET: return character.settings?.secrets?.GAIA_API_KEY || process.env.GAIA_API_KEY;
        case ModelProviderName.BEDROCK: return ""; // AWS SDK handles creds via env/profile
        case ModelProviderName.OPENAI: return character.settings?.secrets?.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
        case ModelProviderName.ETERNALAI: return character.settings?.secrets?.ETERNALAI_API_KEY || process.env.ETERNALAI_API_KEY;
        case ModelProviderName.NINETEEN_AI: return ""; // Assuming no key needed
        case ModelProviderName.LLAMACLOUD: // Fallthrough
        case ModelProviderName.TOGETHER:
            return character.settings?.secrets?.LLAMACLOUD_API_KEY || process.env.LLAMACLOUD_API_KEY ||
                   character.settings?.secrets?.TOGETHER_API_KEY || process.env.TOGETHER_API_KEY ||
                   character.settings?.secrets?.OPENAI_API_KEY || process.env.OPENAI_API_KEY; // Common fallback
        case ModelProviderName.CLAUDE_VERTEX: // Fallthrough
        case ModelProviderName.ANTHROPIC:
            return character.settings?.secrets?.ANTHROPIC_API_KEY || character.settings?.secrets?.CLAUDE_API_KEY ||
                   process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
        case ModelProviderName.REDPILL: return character.settings?.secrets?.REDPILL_API_KEY || process.env.REDPILL_API_KEY;
        case ModelProviderName.OPENROUTER: return character.settings?.secrets?.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;
        case ModelProviderName.GROK: return character.settings?.secrets?.GROK_API_KEY || process.env.GROK_API_KEY;
        case ModelProviderName.HEURIST: return character.settings?.secrets?.HEURIST_API_KEY || process.env.HEURIST_API_KEY;
        case ModelProviderName.GROQ: return character.settings?.secrets?.GROQ_API_KEY || process.env.GROQ_API_KEY;
        case ModelProviderName.GALADRIEL: return character.settings?.secrets?.GALADRIEL_API_KEY || process.env.GALADRIEL_API_KEY;
        case ModelProviderName.FAL: return character.settings?.secrets?.FAL_API_KEY || process.env.FAL_API_KEY;
        case ModelProviderName.ALI_BAILIAN: return character.settings?.secrets?.ALI_BAILIAN_API_KEY || process.env.ALI_BAILIAN_API_KEY;
        case ModelProviderName.VOLENGINE: return character.settings?.secrets?.VOLENGINE_API_KEY || process.env.VOLENGINE_API_KEY;
        case ModelProviderName.NANOGPT: return character.settings?.secrets?.NANOGPT_API_KEY || process.env.NANOGPT_API_KEY;
        case ModelProviderName.HYPERBOLIC: return character.settings?.secrets?.HYPERBOLIC_API_KEY || process.env.HYPERBOLIC_API_KEY;
        case ModelProviderName.VENICE: return character.settings?.secrets?.VENICE_API_KEY || process.env.VENICE_API_KEY;
        case ModelProviderName.ATOMA: return character.settings?.secrets?.ATOMASDK_BEARER_AUTH || process.env.ATOMASDK_BEARER_AUTH;
        case ModelProviderName.NVIDIA: return character.settings?.secrets?.NVIDIA_API_KEY || process.env.NVIDIA_API_KEY;
        case ModelProviderName.AKASH_CHAT_API:
            return character.settings?.secrets?.AKASH_CHAT_API_KEY || character.settings?.secrets?.AKASH_API_KEY ||
                   process.env.AKASH_CHAT_API_KEY || process.env.AKASH_API_KEY;
        case ModelProviderName.GOOGLE: return character.settings?.secrets?.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        case ModelProviderName.MISTRAL: return character.settings?.secrets?.MISTRAL_API_KEY || process.env.MISTRAL_API_KEY;
        case ModelProviderName.LETZAI: return character.settings?.secrets?.LETZAI_API_KEY || process.env.LETZAI_API_KEY;
        case ModelProviderName.INFERA: return character.settings?.secrets?.INFERA_API_KEY || process.env.INFERA_API_KEY;
        case ModelProviderName.DEEPSEEK: return character.settings?.secrets?.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY;
        case ModelProviderName.LIVEPEER: return character.settings?.secrets?.LIVEPEER_GATEWAY_URL || process.env.LIVEPEER_GATEWAY_URL;
        case ModelProviderName.SECRETAI: return character.settings?.secrets?.SECRET_AI_API_KEY || process.env.SECRET_AI_API_KEY;
        case ModelProviderName.NEARAI:
            try {
                const config = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.nearai/config.json'), 'utf8'));
                return JSON.stringify(config?.auth);
            } catch (e) {
                elizaLogger.warn(`Error loading NEAR AI config: ${e}`);
            }
            return character.settings?.secrets?.NEARAI_API_KEY || process.env.NEARAI_API_KEY;
        default:
            const errorMessage = `Failed to get token - unsupported model provider: ${provider}`;
            elizaLogger.error(errorMessage);
            return undefined; 
    }
}

export async function initializeClients(
    runtimeCharacter: Character, // Pass character for token/config access
    clientArg: string, // Comma-separated client names or package names
    logger: Logger,
): Promise<ClientInstance[]> { // Return an array of initialized client instances
    if (!clientArg) {
        logger.info('No --clients argument provided by CLI or character. Skipping client initialization.');
        return []; // Return empty array
    }
    logger.info(`Initializing clients based on argument: ${clientArg}`);
    const clientNames = clientArg.split(',').map(name => name.trim()).filter(Boolean);
    const initializedClientInstances: ClientInstance[] = [];

    for (const clientName of clientNames) {
        let actualClientInstance: ClientInstance | null = null;
        try {
            let clientModule: any;
            logger.info(`[CLIENT_INIT] Attempting to import client: ${clientName}`);
            try {
                clientModule = await import(clientName);
            } catch (directImportError) {
                logger.warn(`[CLIENT_INIT] Direct import for '${clientName}' failed: ${directImportError}. Attempting workspace path...`);
                const clientPackageName = clientName.startsWith('@elizaos/') ? clientName.split('/')[1] : clientName;
                const relativePathToClient = `../../clients/${clientPackageName}/dist/index.js`;
                const absolutePathToClient = path.resolve(__dirname_agent, relativePathToClient);
                logger.info(`[CLIENT_INIT] Fallback workspace path for '${clientName}': ${absolutePathToClient}`);
                try {
                    clientModule = await import(absolutePathToClient);
                } catch (workspaceImportError) {
                    logger.error(`[CLIENT_INIT] Both direct and workspace import failed for '${clientName}'. Direct: ${directImportError}, Workspace: ${workspaceImportError}`);
                    continue;
                }
            }
            
            logger.debug(`[CLIENT_INIT] Module imported for ${clientName}. Keys: ${clientModule ? Object.keys(clientModule).join(', ') : 'null'}`);

            let instanceFactory: any = null;
            if (clientModule.Client && typeof clientModule.Client === 'function') {
                instanceFactory = clientModule.Client;
                logger.info(`[CLIENT_INIT] Using 'Client' class export for ${clientName}`);
            } else if (clientModule.default && typeof clientModule.default === 'function') {
                instanceFactory = clientModule.default;
                logger.info(`[CLIENT_INIT] Using 'default' export factory for ${clientName}`);
            } else if (clientModule.start && typeof clientModule.start === 'function') {
                logger.info(`[CLIENT_INIT] Using 'start' function for ${clientName}`);
                // Pass runtimeCharacter here, not the full runtime yet as it's not created
                const startResult = await clientModule.start(runtimeCharacter, null /* no runtime yet */, logger);
                actualClientInstance = startResult?.client || startResult;
            } else {
                logger.error(`[CLIENT_INIT] No recognized client export for ${clientName}.`);
                continue;
            }

            if (instanceFactory && !actualClientInstance) {
                actualClientInstance = new instanceFactory();
            }
            
            if (actualClientInstance) {
                if (typeof (actualClientInstance as any).initialize === 'function') {
                    logger.info(`[CLIENT_INIT] Instance for ${clientName} created and has an initialize method. Initialization will be handled by AgentRuntime.`);
                } else {
                    logger.warn(`[CLIENT_INIT] Instance for ${clientName} created, but it does not have an initialize() method. This might be okay if initialization is handled differently or not needed.`);
                }
            } else {
                logger.error(`[CLIENT_INIT] Failed to create instance for ${clientName}.`);
            }

            if (actualClientInstance) {
                logger.info(`[CLIENT_INIT_SUCCESS] Client ${clientName} initialized successfully.`);
                // Add a name property to the client instance for easier identification later
                if (!(actualClientInstance as any).name) {
                    (actualClientInstance as any).name = clientName.includes('telegram') ? 'telegram' :
                                                  clientName.includes('twitter') ? 'twitter' :
                                                  clientName.split('/').pop() || clientName;
                }
                initializedClientInstances.push(actualClientInstance as ClientInstance);
            } else {
                logger.warn(`[CLIENT_INIT_FAIL] Client ${clientName} could not be initialized.`);
            }
        } catch (error) {
            logger.error(`[CLIENT_INIT_FATAL] Error initializing client ${clientName}: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
            if (error instanceof Error) logger.error(error.stack);
        }
    }
    logger.info("Finished client initialization process. Returning instances.");
    return initializedClientInstances;
}

export async function createAgent(
    character: Character,
    token: string | undefined,
    initializedPluginsAndClients: Provider[] // Combined list of actual client instances and plugin providers
): Promise<AgentRuntime> {
    elizaLogger.log(`Creating runtime for character ${character.name}`);
    // Plugins (including clients) are now passed in initializedPluginsAndClients
    // The AgentRuntime constructor expects these in its 'plugins' property.

    // Convert character.settings object to a Map<string, string> for RuntimeConfig
    const settingsMap = new Map<string, string>();
    if (character.settings) {
        for (const [key, value] of Object.entries(character.settings)) {
            if (typeof value === 'string') {
                settingsMap.set(key, value);
            } else if (typeof value === 'object' && value !== null) {
                // Handle nested objects like 'secrets' by prefixing or flattening
                // For now, let's specifically handle OPENAI_MODEL_NAME if it's top-level in character.settings
                // or within a 'secrets' object inside character.settings.
                // A more robust solution might flatten all nested settings or use a more specific config structure.
                if (key === 'OPENAI_MODEL_NAME' && typeof value ==='string') { //This case should not happen based on aengel.json
                     settingsMap.set(key, value);
                }
                // If OPENAI_MODEL_NAME is within character.settings (but not nested further in 'secrets')
                if (character.settings.OPENAI_MODEL_NAME && typeof character.settings.OPENAI_MODEL_NAME === 'string') {
                    settingsMap.set('OPENAI_MODEL_NAME', character.settings.OPENAI_MODEL_NAME);
                }

                // Specifically for OPENAI_MODEL_NAME inside character.settings.settings (as per aengel.json)
                // This is a bit of a hack due to the current structure.
                // The getSetting in runtime looks for top-level keys.
                // aengel.json has: character.settings.OPENAI_MODEL_NAME
                // So we should ensure OPENAI_MODEL_NAME is directly in the map.
            }
        }
    }
    // Ensure OPENAI_MODEL_NAME from character.settings is correctly added to the map
    // It's expected at character.settings.OPENAI_MODEL_NAME by aengel.json structure
    if (character.settings && typeof character.settings.OPENAI_MODEL_NAME === 'string') {
        settingsMap.set('OPENAI_MODEL_NAME', character.settings.OPENAI_MODEL_NAME);
    }


    return new AgentRuntime({
        token: token || '',
        modelProvider: character.modelProvider,
        evaluators: character.evaluators || [], // Use evaluators from character if present
        character,
        plugins: initializedPluginsAndClients, // Pass the combined list here
        fetch: logFetch,
        actions: character.actions || [], // Use actions from character if present
        settings: settingsMap, // Pass the converted settings map
        // Removed messageManager, agentId, serverUrl as AgentRuntime seems to set defaults
    });
}

async function initializeCache(runtime: AgentRuntime, character: Character): Promise<CacheManager | null> {
    // Try to get cache config from character, then from environment variables directly
    const characterCacheConfig = character.cache;
    const envCacheStore = process.env.CACHE_STORE as CacheStore | undefined;
    const envCachePath = process.env.CACHE_FS_PATH;

    let cacheStoreToUse: CacheStore | undefined = characterCacheConfig?.store;
    let cachePathToUse: string | undefined = characterCacheConfig?.path;

    if (!cacheStoreToUse && envCacheStore) {
        cacheStoreToUse = envCacheStore;
        elizaLogger.info(`Using CACHE_STORE from environment: ${envCacheStore}`);
    }
    if (!cachePathToUse && cacheStoreToUse === CacheStore.FILESYSTEM && envCachePath) {
        cachePathToUse = envCachePath;
        elizaLogger.info(`Using CACHE_FS_PATH from environment: ${envCachePath}`);
    }
    
    if (!cacheStoreToUse) {
        elizaLogger.warn("Cache store not configured (in character.cache.store or env CACHE_STORE). Skipping cache initialization.");
        return null;
    }

    let cacheAdapter;

    switch (cacheStoreToUse) {
        case CacheStore.DATABASE:
            elizaLogger.info("Using Database cache store.");
            const dbCacheAdapter = await findDatabaseAdapter(runtime); 
            if (!dbCacheAdapter || !(dbCacheAdapter as any).get || !(dbCacheAdapter as any).set) { 
                elizaLogger.error("Database adapter does not support caching (missing get/set methods). Cannot initialize Database cache.");
                return null;
            }
            cacheAdapter = new DbCacheAdapter(dbCacheAdapter as IDatabaseCacheAdapter, runtime.agentId);
            break;
        case CacheStore.FILESYSTEM:
            elizaLogger.info("Using Filesystem cache store.");
            const fsCachePathFinal = cachePathToUse || path.join(process.cwd(), 'data', 'cache'); // Default path if still not set
            if (!fsCachePathFinal){
                 elizaLogger.error("Filesystem cache path not configured. Skipping cache initialization.");
                 return null;
            }
            await fs.promises.mkdir(fsCachePathFinal, { recursive: true }); 
            cacheAdapter = new FsCacheAdapter(fsCachePathFinal);
            break;
        default:
            elizaLogger.error(`Unsupported cache store type: ${cacheStoreToUse}. Supported: DATABASE, FILESYSTEM.`);
            return null;
    }

    const cache = new CacheManager(cacheAdapter);
    elizaLogger.info(`Cache initialized with store: ${cacheStoreToUse}`);
    return cache;
}

async function findDatabaseAdapter(runtime: AgentRuntime): Promise<IDatabaseAdapter & IDatabaseCacheAdapter | undefined> {
    const { adapters } = runtime; // These are plugin instances
    let adapterInstance: (IDatabaseAdapter & IDatabaseCacheAdapter) | undefined;

    // Check if a DB adapter was provided by a plugin
    const dbPluginAdapter = adapters.find(p => p.name === 'SQLiteAdapter' || (p as any).isDatabaseAdapter === true); // Example check

    if (dbPluginAdapter && typeof (dbPluginAdapter as any).connect === 'function') {
        elizaLogger.info(`Using database adapter from plugin: ${dbPluginAdapter.name}`);
        adapterInstance = await (dbPluginAdapter as any).connect(process.env.SQLITE_FILE || `${runtime.agentId}.sqlite`);
    } else if (adapters.length > 0 && !dbPluginAdapter) {
         elizaLogger.info('Other plugins are present, but no specific database adapter plugin found. Defaulting to SQLiteAdapter.');
    }
    
    if (!adapterInstance) {
        // Dynamically import the SQLite adapter and connect using configured file path if no plugin provided one
        const { SQLiteAdapter } = await import('@elizaos/adapter-sqlite');
        const dbPath = process.env.SQLITE_FILE || `${runtime.agentId}.sqlite`; // Default to agentId specific DB
        elizaLogger.info(`Connecting to SQLite database at path: ${dbPath}`);
        adapterInstance = await SQLiteAdapter.connect(dbPath) as IDatabaseAdapter & IDatabaseCacheAdapter;
    }
    
    if (!adapterInstance) {
        elizaLogger.error('Failed to initialize any database adapter.');
    }
    return adapterInstance;
}

async function startAgent(
    character: Character,
    clientsArg?: string // Comma-separated from CLI
): Promise<AgentRuntime> {
    const agentId = character.id || stringToUuid(character.name);
    elizaLogger.log("Starting agent:", character.name, agentId);
    let db: (IDatabaseAdapter & IDatabaseCacheAdapter) | undefined;
    try {
        character.id ??= stringToUuid(character.name);
        character.username ??= character.name;

        // Initialize actual client instances first
        let clientInstances: ClientInstance[] = [];
        let clientsToInitialize = clientsArg; // From CLI
        if (!clientsToInitialize && character.clients && character.clients.length > 0) {
            const clientStringFromCharacter = character.clients
                .map((client: string | { name?: string }) => (typeof client === 'string' ? client : client?.name))
                .filter(Boolean)
                .join(',');
            if (clientStringFromCharacter) {
                elizaLogger.info(`No --clients CLI arg, using clients from character config: "${clientStringFromCharacter}"`);
                clientsToInitialize = clientStringFromCharacter;
            }
        }

        if (clientsToInitialize) {
            // initializeClients now takes character (for config) and returns ClientInstance[]
            clientInstances = await initializeClients(character, clientsToInitialize, elizaLogger);
        } else {
            elizaLogger.info('No clients specified. Skipping client specific initialization.');
        }

        // Prepare plugins from character config (these are typically strings or config objects)
        let characterPluginProviders: Provider[] = [];
        if (character.plugins && Array.isArray(character.plugins)) {
            // We assume handlePluginImporting can take the raw character.plugins array
            // and process it into Provider[] that AgentRuntime can use.
            // This might need refinement if handlePluginImporting expects only strings.
            characterPluginProviders = await handlePluginImporting(character.plugins as any[]); 
        }

        // Combine actual client instances with plugin providers for AgentRuntime
        const allProvidersForRuntime: Provider[] = [
            ...(clientInstances as Provider[]), // Cast ClientInstance[] to Provider[]
            ...characterPluginProviders
        ];

        const token = getTokenForProvider(character.modelProvider, character);

        const runtime: AgentRuntime = await createAgent(
            character,
            token,
            allProvidersForRuntime // Pass combined list to createAgent
        );
        (globalThis as any).__elizaRuntime = runtime; 

        db = await findDatabaseAdapter(runtime);
        if (db) {
            runtime.databaseAdapter = db;
        } else {
            elizaLogger.error("Critical: Database adapter could not be initialized.");
        }

        const cache = await initializeCache(runtime, character);
        runtime.cacheManager = cache;

        // Runtime initialize will process all providers (clients and plugins)
        await runtime.initialize();

        elizaLogger.debug(`Started ${character.name} as ${runtime.agentId}`);
        if (runtime.clients && Object.keys(runtime.clients).length > 0) {
            elizaLogger.info(`Agent ${character.name} started with active clients: ${Object.keys(runtime.clients).join(', ')}`);
        } else {
            elizaLogger.warn(`Agent ${character.name} started with NO active clients.`);
        }

        return runtime;
    } catch (error) {
        elizaLogger.error(
            `Error starting agent for character ${character.name}:`,
            error
        );
        if (db && typeof db.disconnect === 'function') {
            await db.disconnect();
        } else if (db && typeof (db as any).close === 'function') { // Fallback for older adapter style
            await (db as any).close();
        }
        throw error; // Re-throw to be caught by startAgents
    }
}

const checkPortAvailable = (port: number): Promise<boolean> => {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once("error", (err: any) => { // Using NodeJS.ErrnoException might require @types/node
            if (err.code === "EADDRINUSE") {
                resolve(false);
            } else {
                resolve(true); // Other errors don't mean port is in use
            }
        });
        server.once("listening", () => {
            server.close(() => resolve(true));
        });
        server.listen(port, '127.0.0.1'); // Listen on localhost
        server.on('close', () => { /* elizaLogger.debug(`Port check server closed for ${port}`) */ });
    });
};

const hasValidRemoteUrls = (): boolean => {
    const urls = process.env.REMOTE_CHARACTER_URLS;
    return !!urls && urls !== "" && urls.startsWith("http");
};

const handlePostCharacterLoaded = async (character: Character): Promise<Character> => {
    let processedCharacter = { ...character }; // Clone to avoid modifying original
    // Ensure postProcessors is an array before filtering
    const processors = Array.isArray(character.postProcessors) 
        ? character.postProcessors.filter((p: { name?: string, handlePostCharacterLoaded?: (char: Character) => Promise<Character> }) => p && typeof p.handlePostCharacterLoaded === 'function') 
        : [];

    if (processors.length > 0) {
        processedCharacter = { ...character, postProcessors: undefined }; // Remove for processing
        for (const processor of processors) {
            try {
                processedCharacter = await processor.handlePostCharacterLoaded!(processedCharacter);
            } catch (e) {
                elizaLogger.error(`Error in postProcessor ${processor.name || 'unknown'} for character ${character.name}:`, e);
                // Decide if we should continue or re-throw
            }
        }
    }
    return processedCharacter;
}

const startAgents = async (args: ReturnType<typeof parseArguments>) => {
    // Uses args parameter now
    const characters = await loadCharacters(args.characters);
    if (!characters || characters.length === 0) {
        elizaLogger.error("No character(s) loaded. Exiting.");
        process.exit(1);
    }

    for (const character of characters) {
        try {
            // Ensure agentPort uses args.port first, then process.env.AGENT_PORT, then default
            // Uses args parameter now
            const agentPort = args.port || parseInt(process.env.AGENT_PORT || "3000");
            const isPortAvailable = await checkPortAvailable(agentPort);
            if (!isPortAvailable && characters.length === 1) {
                 elizaLogger.error(`Port ${agentPort} is already in use. Please choose a different port or stop the existing service.`);
                 process.exit(1);
            }
            
            // Uses args parameter now
            const agent = await startAgent(character, args.clients);
            elizaLogger.success(`Agent ${character.name} (ID: ${agent.agentId}) started successfully.`);

        } catch (error) {
            elizaLogger.error(`Failed to start agent for ${character.name}: ${error}`);
        }
    }
    if (characters.length > 0) {
         elizaLogger.info("All specified agents have been processed.");
    }
};


const main = async () => {
    const args = parseArguments(); // Parse arguments here
    
    const logLevelFromArgs = args["log-level"]; // Uses local args
    const logLevelFromEnv = process.env.LOG_LEVEL;
    const finalLogLevel = logLevelFromArgs || logLevelFromEnv || "info";
    
    elizaLogger.info(`Attempting to run with log level: ${finalLogLevel} (Note: elizaLogger is basic and may not filter by this level).`);

    try {
        await startAgents(args); // Pass args here
    } catch (error) {
        elizaLogger.error("Unhandled critical error in startAgents:", error);
        process.exit(1);
    }
};

main().catch((error) => {
    elizaLogger.error("Unhandled critical error in main:", error);
    process.exit(1);
});

// Ensure no lingering applyPatch() call at the end of the file

if (
    process.env.PREVENT_UNHANDLED_EXIT &&
    parseBooleanFromText(process.env.PREVENT_UNHANDLED_EXIT)
) {
    process.on("uncaughtException", (err) => {
        console.error("UNCAUGHT EXCEPTION:", err);
    });
    process.on("unhandledRejection", (reason, promise) => {
        console.error("UNHANDLED REJECTION:", reason);
    });
}