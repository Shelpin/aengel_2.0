/**
 * Common type definitions
 */

// UUID type used across packages
export type UUID = string;

// Define standard result interfaces
export interface Result<T> {
    success: boolean;
    data?: T;
    error?: Error;
}

// Standard error types
export class ElizaOSError extends Error {
    constructor(message: string, public readonly code: string) {
        super(message);
        this.name = 'ElizaOSError';
    }
}

// Common configuration types
export interface ConfigOptions {
    [key: string]: any;
} 