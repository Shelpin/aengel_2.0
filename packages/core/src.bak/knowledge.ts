import type { Memory } from './types.js';
import type { IAgentRuntimeBridge } from './api/types.js';
import elizaLogger from './logger.js';

async function get(runtime: IAgentRuntimeBridge, message: Memory): Promise<any> {
    if (!runtime.knowledgeManager) {
        throw new Error("knowledgeManager is missing from runtime.");
    }
    return await runtime.knowledgeManager.getKnowledge(message);
}

async function set(runtime: IAgentRuntimeBridge, item: any): Promise<void> {
    if (!runtime.knowledgeManager) {
        throw new Error("knowledgeManager is missing from runtime.");
    }
    await runtime.knowledgeManager.setKnowledge(item);
}

export function preprocess(content: string): string {
    elizaLogger.debug("Preprocessing text:", {
        input: content,
        length: content?.length,
    });

    if (!content || typeof content !== "string") {
        elizaLogger.warn("Invalid input for preprocessing");
        return "";
    }

    return (
        content
            // Remove code blocks and their content
            .replace(/```[\s\S]*?```/g, "")
            // Remove inline code
            .replace(/`.*?`/g, "")
            // Convert headers to plain text with emphasis
            .replace(/#{1,6}\s*(.*)/g, "$1")
            // Remove image links but keep alt text
            .replace(/!\[(.*?)\]\(.*?\)/g, "$1")
            // Remove links but keep text
            .replace(/\[(.*?)\]\(.*?\)/g, "$1")
            // Simplify URLs: remove protocol and simplify to domain+path
            .replace(/(https?:\/\/)?(www\.)?([^\s]+\.[^\s]+)/g, "$3")
            // Remove Discord mentions specifically
            .replace(/<@[!&]?\d+>/g, "")
            // Remove HTML tags
            .replace(/<[^>]*>/g, "")
            // Remove horizontal rules
            .replace(/^\s*[-*_]{3,}\s*$/gm, "")
            // Remove comments
            .replace(/\/\*[\s\S]*?\*\//g, "")
            .replace(/\/\/.*/g, "")
            // Normalize whitespace
            .replace(/\s+/g, " ")
            // Remove multiple newlines
            .replace(/\n{3,}/g, "\n\n")
            // Remove special characters except those common in URLs
            .replace(/[^a-zA-Z0-9\s\-_./:?=&]/g, "")
            .trim()
            .toLowerCase()
    );
}

export default {
    get,
    set,
    preprocess,
};
