import type {
    IAgentRuntime,
    Actor,
    Content,
    Memory,
    UUID,
    State,
    IDatabaseAdapter,
} from './types.js';
import { elizaLogger } from './logger.js';

const logger = elizaLogger;

/**
 * Get details for a list of actors.
 */
export async function getActorDetails({
    runtime,
    roomId,
}: {
    runtime: IAgentRuntime;
    roomId: string;
}) {
    if (!runtime.databaseAdapter) {
        console.warn("Database adapter is not available in getActorDetails");
        return [];
    }
    const participantIds =
        await runtime.databaseAdapter.getParticipantsForRoom(roomId);
    const actors = await Promise.all(
        participantIds.map(async (userId: string) => {
            if (!runtime.databaseAdapter) {
                console.warn("Database adapter is not available during actor mapping in getActorDetails");
                return null;
            }
            const account =
                await runtime.databaseAdapter.getAccountById(userId);
            if (account) {
                return {
                    id: account.id,
                    name: account.name,
                    username: account.username,
                    details: account.details,
                };
            }
            return null;
        })
    );

    return actors.filter((actor: any): actor is Actor => actor !== null);
}

/**
 * Format actors into a string
 * @param actors - list of actors
 * @returns string
 */
export function formatActors({ actors }: { actors: Actor[] }) {
    const actorStrings = actors.map((actor: Actor) => {
        const header = `${actor.name}${actor.details?.tagline ? ": " + actor.details?.tagline : ""}${actor.details?.summary ? "\n" + actor.details?.summary : ""}`;
        return header;
    });
    const finalActorStrings = actorStrings.join("\n");
    return finalActorStrings;
}

/**
 * Format messages into a string
 * @param messages - list of messages
 * @param actors - list of actors
 * @returns string
 */
export const formatMessages = ({
    messages,
    actors,
}: {
    messages: Memory[];
    actors: Actor[];
}) => {
    const messageStrings = messages
        .reverse()
        .filter((message: Memory) => message.userId)
        .map((message: Memory) => {
            if (!message.userId) {
                console.warn("Message found with undefined userId:", message.id);
                return "";
            }
            const messageContent = (message.content as Content).text;
            const messageAction = (message.content as Content).action;
            const formattedName =
                actors.find((actor: Actor) => actor.id === message.userId)
                    ?.name || "Unknown User";

            const attachments = (message.content as Content).attachments;

            const attachmentString =
                attachments && attachments.length > 0
                    ? ` (Attachments: ${attachments.map((media: { id: string; title: string; url: string }) => `[${media.id} - ${media.title} (${media.url})]`).join(", ")})`
                    : "";

            const timestamp = message.createdAt ? formatTimestamp(message.createdAt) : "unknown time";

            const shortId = message.userId ? message.userId.slice(-5) : "?????";

            return `(${timestamp}) [${shortId}] ${formattedName}: ${messageContent}${attachmentString}${messageAction && messageAction !== "null" ? ` (${messageAction})` : ""}`;
        })
        .join("\n");
    return messageStrings;
};

export const formatTimestamp = (messageDate: number) => {
    const now = new Date();
    const diff = now.getTime() - messageDate;

    const absDiff = Math.abs(diff);
    const seconds = Math.floor(absDiff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (absDiff < 60000) {
        return "just now";
    } else if (minutes < 60) {
        return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
    } else if (hours < 24) {
        return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    } else {
        return `${days} day${days !== 1 ? "s" : ""} ago`;
    }
};

// New function to format messages for LLM API
export interface LlmMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export function formatMessagesForLlm(memories: Memory[], agentId: string): LlmMessage[] {
    if (!memories || memories.length === 0) {
        return [];
    }
    // Ensure messages are in chronological order (oldest first)
    const sortedMemories = [...memories].sort((a, b) => a.createdAt - b.createdAt);

    return sortedMemories.map(memory => {
        const role = memory.userId === agentId ? 'assistant' : 'user';
        const content = memory.content?.text || '';
        return { role, content } as LlmMessage;
    }).filter(msg => msg.content.trim() !== '');
}
