// Placeholder types specific to client-direct

export interface ClientMessagePayload {
    roomId?: string;
    userId?: string;
    userName?: string;
    name?: string;
    text?: string;
    // Add other expected fields based on usage in index.ts
    [key: string]: any; // Allow other properties
}

export interface ClientSettings {
    // Define properties based on usage
    [key: string]: any;
}

export interface CommandSchema {
    // Define properties based on usage
    [key: string]: any;
} 