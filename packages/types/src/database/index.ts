/**
 * Database interface definitions
 */

// Database connection options
export interface DatabaseConnectionOptions {
    readOnly?: boolean;
    timeout?: number;
    maxConnections?: number;
    path?: string;
}

// Query result type
export type QueryResult = any[];

// Database adapter interface
export interface DatabaseAdapter {
    /**
     * Connect to the database
     */
    connect(): Promise<void>;

    /**
     * Disconnect from the database
     */
    disconnect(): Promise<void>;

    /**
     * Execute a query with optional parameters
     */
    query(sql: string, params?: any[]): Promise<QueryResult>;

    /**
     * Execute a query and return a single result
     */
    queryOne(sql: string, params?: any[]): Promise<any>;

    /**
     * Execute a query that doesn't return results
     */
    execute(sql: string, params?: any[]): Promise<void>;

    /**
     * Begin a transaction
     */
    beginTransaction(): Promise<void>;

    /**
     * Commit a transaction
     */
    commitTransaction(): Promise<void>;

    /**
     * Rollback a transaction
     */
    rollbackTransaction(): Promise<void>;

    /**
     * Check if connected to the database
     */
    isConnected(): boolean;
}

/**
 * Database cache adapter interface
 */
export interface DatabaseCacheAdapter {
    /**
     * Get a cached value
     */
    getCache(params: { agentId: string; key: string }): Promise<string | undefined>;

    /**
     * Set a cached value
     */
    setCache(params: { agentId: string; key: string; value: string }): Promise<boolean>;

    /**
     * Delete a cached value
     */
    deleteCache(params: { agentId: string; key: string }): Promise<boolean>;
}

/**
 * Vector database adapter interface
 */
export interface VectorDatabaseAdapter {
    /**
     * Connect to the vector database
     */
    connect(): Promise<void>;

    /**
     * Disconnect from the vector database
     */
    disconnect(): Promise<void>;

    /**
     * Store an embedding vector
     */
    storeEmbedding(key: string, embedding: number[], metadata?: any): Promise<void>;

    /**
     * Search for similar embeddings
     */
    searchSimilar(query: number[], limit?: number): Promise<any[]>;
} 