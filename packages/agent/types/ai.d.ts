// Override problematic types from the @vercel/ai package
declare module '@vercel/ai' {
    // Define only the types you need with correct typing
    export function generateText(options: any): Promise<any>;
    export function streamText(options: any): Promise<any>;
    export type Message = {
        role: 'user' | 'assistant' | 'system';
        content: string;
    };
} 