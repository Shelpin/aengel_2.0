import { elizaLogger } from "@elizaos/core";

export function load(db) {
    try {
        // Just a placeholder for now
        elizaLogger.info("Loading SQLite vector extensions");
        return true;
    } catch (error) {
        elizaLogger.error("Error loading SQLite vector extensions:", error);
        return false;
    }
} 