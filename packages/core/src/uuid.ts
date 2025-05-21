import { createHash } from 'node:crypto';
import { z } from "zod";

// Keep track of used IDs to avoid collision
const usedIds = new Set<string>();

// UUID regex
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * UUID type with proper zod validation
 */
export const uuidSchema = z.string().regex(uuidRegex, "Invalid UUID format");

export type UUID = z.infer<typeof uuidSchema>;

/**
 * Validate a string is a valid UUID
 */
export function isUUID(id: string): boolean {
    return uuidRegex.test(id);
}

/**
 * Convert a string to UUID
 * If the string is not a valid UUID format, create a deterministic UUID from it
 */
export function stringToUuid(id: string): UUID {
    if (isUUID(id)) {
        return id as UUID;
    }
    // Convert non-UUID string to a deterministic UUID
    return deterministicUUID(id) as UUID;
}

/**
 * Generate a UUID (v4)
 */
export function v4(): string {
    const uuid = "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => {
        const randomValue = Math.floor(Math.random() * 16);
        return (
            c === "0"
                ? randomValue
                : c === "1"
                    ? 4
                    : (randomValue & 0x3) | 0x8
        ).toString(16);
    });

    // Check for collision and regenerate if needed
    if (usedIds.has(uuid)) {
        return v4();
    }

    usedIds.add(uuid);
    return uuid;
}

/**
 * Create a deterministic UUID from a string
 * This is useful for creating IDs that are the same
 * each time for the same input
 */
export function deterministicUUID(str: string): string {
    // Hash the string using SHA-1
    const hash = createHash('sha1').update(str).digest('hex');

    // Format as a UUID (8-4-4-4-12)
    const uuid = [
        hash.substring(0, 8),
        hash.substring(8, 12),
        // Version 5 UUID - Set the 4 most significant bits of the 7th byte to 0101 (5)
        (parseInt(hash.substring(12, 16), 16) & 0x0fff | 0x5000).toString(16),
        // Set the 2 most significant bits of the 9th byte to 10
        (parseInt(hash.substring(16, 20), 16) & 0x3fff | 0x8000).toString(16),
        hash.substring(20, 32)
    ].join('-');

    return uuid;
}
