declare class LocalEmbeddingModelManager {
    private static instance;
    private model;
    private initPromise;
    private initializationLock;
    private constructor();
    static getInstance(): LocalEmbeddingModelManager;
    private getRootPath;
    initialize(): Promise<void>;
    private initializeModel;
    generateEmbedding(input: string): Promise<number[]>;
    private processEmbedding;
    reset(): Promise<void>;
    static resetInstance(): void;
}
export default LocalEmbeddingModelManager;
