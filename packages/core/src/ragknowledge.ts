import { embed } from './embedding.js';
import { splitChunks } from './generation.js';
import elizaLogger from './logger.js';
import {
    type IAgentRuntime,
    type IRAGKnowledgeManager,
    KnowledgeScope,
    type Character,
    type RAGKnowledgeItem,
    type KnowledgeItem,
    type Memory,
} from './types.js';
import { stringToUuid, type UUID } from './uuid.js';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Manage knowledge in the database.
 */
export class RAGKnowledgeManager implements IRAGKnowledgeManager {
    /**
     * The AgentRuntime instance associated with this manager.
     */
    runtime: IAgentRuntime;

    /**
     * The name of the database table this manager operates on.
     */
    tableName: string;

    /**
     * The root directory where RAG knowledge files are located (internal)
     */
    knowledgeRoot: string;

    /**
     * Constructs a new KnowledgeManager instance.
     * @param opts Options for the manager.
     * @param opts.tableName The name of the table this manager will operate on.
     * @param opts.runtime The AgentRuntime instance associated with this manager.
     */
    constructor(opts: {
        tableName: string;
        runtime: IAgentRuntime;
        knowledgeRoot: string;
    }) {
        this.runtime = opts.runtime;
        this.tableName = opts.tableName;
        this.knowledgeRoot = opts.knowledgeRoot;
    }

    private readonly defaultRAGMatchThreshold = 0.85;
    private readonly defaultRAGMatchCount = 8;

    /**
     * Common English stop words to filter out from query analysis
     */
    private readonly stopWords = new Set([
        "a",
        "an",
        "and",
        "are",
        "as",
        "at",
        "be",
        "by",
        "does",
        "for",
        "from",
        "had",
        "has",
        "have",
        "he",
        "her",
        "his",
        "how",
        "hey",
        "i",
        "in",
        "is",
        "it",
        "its",
        "of",
        "on",
        "or",
        "that",
        "the",
        "this",
        "to",
        "was",
        "what",
        "when",
        "where",
        "which",
        "who",
        "will",
        "with",
        "would",
        "there",
        "their",
        "they",
        "your",
        "you",
    ]);

    /**
     * Filters out stop words and returns meaningful terms
     */
    private getQueryTerms(query: string): string[] {
        return query
            .toLowerCase()
            .split(" ")
            .filter((term) => term.length > 2) // Filter very short words
            .filter((term) => !this.stopWords.has(term)); // Filter stop words
    }

    /**
     * Preprocesses text content for better RAG performance.
     * @param content The text content to preprocess.
     * @returns The preprocessed text.
     */

    private preprocess(content: string): string {
        if (!content || typeof content !== "string") {
            elizaLogger.warn("Invalid input for preprocessing");
            return "";
        }

        return (
            content
                .replace(/```[\s\S]*?```/g, "")
                .replace(/`.*?`/g, "")
                .replace(/#{1,6}\s*(.*)/g, "$1")
                .replace(/!\[(.*?)\]\(.*?\)/g, "$1")
                .replace(/\[(.*?)\]\(.*?\)/g, "$1")
                .replace(/(https?:\/\/)?(www\.)?([^\s]+\.[^\s]+)/g, "$3")
                .replace(/<@[!&]?\d+>/g, "")
                .replace(/<[^>]*>/g, "")
                .replace(/^\s*[-*_]{3,}\s*$/gm, "")
                .replace(/\/\*[\s\S]*?\*\//g, "")
                .replace(/\/\/.*/g, "")
                .replace(/\s+/g, " ")
                .replace(/\n{3,}/g, "\n\n")
                // .replace(/[^a-zA-Z0-9\s\-_./:?=&]/g, "") --this strips out CJK characters
                .trim()
                .toLowerCase()
        );
    }

    private hasProximityMatch(text: string, terms: string[]): boolean {
        if (!text || !terms.length) {
            return false;
        }

        const words = text.toLowerCase().split(" ").filter(w => w.length > 0);

        // Find all positions for each term (not just first occurrence)
        const allPositions = terms.flatMap(term =>
            words.reduce((positions, word, idx) => {
                if (word.includes(term)) positions.push(idx);
                return positions;
            }, [] as number[])
        ).sort((a, b) => a - b);

        if (allPositions.length < 2) return false;

        // Check proximity
        for (let i = 0; i < allPositions.length - 1; i++) {
            if (Math.abs(allPositions[i] - allPositions[i + 1]) <= 5) {
                elizaLogger.debug("[Proximity Match]", {
                    terms,
                    positions: allPositions,
                    matchFound: `${allPositions[i]} - ${allPositions[i + 1]}`
                });
                return true;
            }
        }

        return false;
    }

    async getKnowledge(params: {
        query?: string;
        id?: UUID;
        conversationContext?: string;
        limit?: number;
        agentId?: UUID;
    }): Promise<RAGKnowledgeItem[]> {
        const agentId = params.agentId || this.runtime.agentId;

        // If id is provided, do direct lookup first
        if (params.id) {
            const directResults =
                await this.runtime.databaseAdapter?.getKnowledge({
                    id: params.id,
                    agentId: agentId,
                });

            if (directResults && directResults.length > 0) {
                return directResults;
            }
        }

        // If no id or no direct results, perform semantic search
        if (params.query) {
            try {
                const processedQuery = this.preprocess(params.query);

                // Build search text with optional context
                let searchText = processedQuery;
                if (params.conversationContext) {
                    const relevantContext = this.preprocess(
                        params.conversationContext
                    );
                    searchText = `${relevantContext} ${processedQuery}`;
                }

                const embeddingArray = await embed(this.runtime, searchText);

                const embedding = new Float32Array(embeddingArray);

                // Get results with single query
                const results =
                    await this.runtime.databaseAdapter?.searchKnowledge({
                        agentId: this.runtime.agentId,
                        embedding: embedding,
                        match_threshold: this.defaultRAGMatchThreshold,
                        match_count:
                            (params.limit || this.defaultRAGMatchCount) * 2,
                        searchText: processedQuery,
                    });

                if (!results) {
                    elizaLogger.warn("[RAGKnowledge] searchKnowledge returned undefined, returning empty array for query:", params.query);
                    return [];
                }

                // Enhanced reranking with sophisticated scoring
                const rerankedResults = results
                    .map((result: RAGKnowledgeItem) => {
                        let score = result.similarity;
                        const queryTerms = this.getQueryTerms(processedQuery);
                        // Calculate matchingTerms outside the score check
                        const matchingTerms = queryTerms.filter((term) =>
                            result.content.text.toLowerCase().includes(term)
                        );

                        // Ensure score is a number before modifying
                        if (typeof score === 'number') {
                            if (matchingTerms.length > 0) {
                                // Much stronger boost for matches
                                score *=
                                    1 +
                                    (matchingTerms.length / queryTerms.length) * 2; // Double the boost
                            }

                            // Proximity boost
                            if (this.hasProximityMatch(result.content.text, queryTerms)) {
                                score *= 1.5;
                            }
                        }

                        return { ...result, similarity: score };
                    })
                    .sort((a: RAGKnowledgeItem, b: RAGKnowledgeItem) => {
                        // Ensure similarity is a number for sorting, default to 0 if not
                        const simA = typeof a.similarity === 'number' ? a.similarity : 0;
                        const simB = typeof b.similarity === 'number' ? b.similarity : 0;
                        return simB - simA; // Descending order by score
                    })
                    .slice(0, params.limit || this.defaultRAGMatchCount);

                elizaLogger.debug("[RAG ReRanked Results]:", rerankedResults);

                return rerankedResults;
            } catch (error: any) {
                elizaLogger.error(
                    "[RAGKnowledge] Error during RAG semantic search:",
                    error.message
                );
                return [];
            }
        }

        // If no query or id, return empty or handle as error
        elizaLogger.warn(
            "[RAGKnowledge] getKnowledge called without query or id, returning empty array"
        );
        return [];
    }

    async createKnowledge(item: RAGKnowledgeItem): Promise<void> {
        if (!this.runtime.databaseAdapter) {
            elizaLogger.error("[RAGKnowledge] Database adapter not available for createKnowledge");
            return;
        }
        await this.runtime.databaseAdapter.createKnowledge(item);
    }

    async updateKnowledge(item: RAGKnowledgeItem): Promise<void> {
        if (!this.runtime.databaseAdapter) {
            elizaLogger.error("[RAGKnowledge] Database adapter not available for updateKnowledge");
            return;
        }
        // Assuming createKnowledge handles updates if item with same ID exists
        await this.runtime.databaseAdapter.createKnowledge(item);
    }

    async deleteKnowledge(id: UUID): Promise<void> {
        if (!this.runtime.databaseAdapter) {
            elizaLogger.error("[RAGKnowledge] Database adapter not available for deleteKnowledge");
            return;
        }
        await this.runtime.databaseAdapter.removeKnowledge(id);
    }

    async searchKnowledge(params: {
        agentId: UUID;
        embedding: Float32Array | number[];
        match_threshold?: number;
        match_count?: number;
        searchText?: string;
    }): Promise<RAGKnowledgeItem[]> {
        if (!this.runtime.databaseAdapter) {
            elizaLogger.error("[RAGKnowledge] Database adapter not available for searchKnowledge");
            return [];
        }
        const resolvedParams = {
            ...params,
            match_threshold: params.match_threshold || this.defaultRAGMatchThreshold,
            match_count: params.match_count || this.defaultRAGMatchCount,
        };
        return this.runtime.databaseAdapter.searchKnowledge(resolvedParams);
    }

    async removeKnowledge(id: UUID): Promise<void> {
        if (!this.runtime.databaseAdapter) {
            elizaLogger.error("[RAGKnowledge] Database adapter not available for removeKnowledge");
            return;
        }
        await this.runtime.databaseAdapter.removeKnowledge(id);
    }

    async clearKnowledge(shared?: boolean): Promise<void> {
        if (!this.runtime.databaseAdapter) {
            elizaLogger.error("[RAGKnowledge] Database adapter not available for clearKnowledge");
            return;
        }
        await this.runtime.databaseAdapter.clearKnowledge(this.runtime.agentId, shared);
    }

    /**
     * Lists all knowledge entries for an agent without semantic search or reranking.
     * Used primarily for administrative tasks like cleanup.
     *
     * @param agentId The agent ID to fetch knowledge entries for
     * @returns Array of RAGKnowledgeItem entries
     */
    async listAllKnowledge(agentId: UUID): Promise<RAGKnowledgeItem[]> {
        if (!this.runtime.databaseAdapter) {
            elizaLogger.error("[RAGKnowledge] Database adapter not available for listAllKnowledge");
            return [];
        }
        return this.runtime.databaseAdapter.getKnowledge({ agentId }); // Assuming getKnowledge can list all by agentId if no other params
    }

    async cleanupDeletedKnowledgeFiles() {
        try {
            elizaLogger.debug(
                "[Cleanup] Starting knowledge cleanup process, agent: ",
                this.runtime.agentId
            );

            elizaLogger.debug(
                `[Cleanup] Knowledge root path: ${this.knowledgeRoot}`
            );

            const existingKnowledge = await this.listAllKnowledge(
                this.runtime.agentId
            );
            // Only process parent documents, ignore chunks
            const parentDocuments = existingKnowledge.filter(
                (item) =>
                    !item.id.includes("chunk") && item.content.metadata?.source // Must have a source path
            );

            elizaLogger.debug(
                `[Cleanup] Found ${parentDocuments.length} parent documents to check`
            );

            for (const item of parentDocuments) {
                const relativePath = item.content.metadata?.source;
                // Check if relativePath is a string before joining
                if (typeof relativePath === 'string') {
                    const filePath = join(this.knowledgeRoot, relativePath);

                    elizaLogger.debug(
                        `[Cleanup] Checking joined file path: ${filePath}`
                    );

                    if (!existsSync(filePath)) {
                        elizaLogger.warn(
                            `[Cleanup] File not found, starting removal process: ${filePath}`
                        );

                        const idToRemove = item.id;
                        elizaLogger.debug(
                            `[Cleanup] Using ID for removal: ${idToRemove}`
                        );

                        try {
                            await this.removeKnowledge(idToRemove);
                            elizaLogger.success(
                                `[Cleanup] Successfully removed knowledge for file: ${filePath}`
                            );
                        } catch (deleteError) {
                            elizaLogger.error(
                                `[Cleanup] Error during deletion process for ${filePath}:`,
                                deleteError instanceof Error
                                    ? {
                                        message: deleteError.message,
                                        stack: deleteError.stack,
                                        name: deleteError.name,
                                    }
                                    : deleteError
                            );
                        }
                    } // else: File exists, do nothing
                } else {
                    elizaLogger.warn(`[Cleanup] Skipping item ${item.id} due to missing or invalid source path.`);
                }
            }

            elizaLogger.debug("[Cleanup] Finished knowledge cleanup process");
        } catch (error) {
            elizaLogger.error(
                "[Cleanup] Error cleaning up deleted knowledge files:",
                error
            );
        }
    }

    public generateScopedId(path: string, isShared: boolean): UUID {
        // Prefix the path with scope before generating UUID to ensure different IDs for shared vs private
        const scope = isShared ? KnowledgeScope.SHARED : KnowledgeScope.PRIVATE;
        const scopedPath = `${scope}-${path}`;
        return stringToUuid(scopedPath);
    }

    async processFile(file: {
        path: string;
        content: string;
        type: "pdf" | "md" | "txt";
        isShared?: boolean;
    }): Promise<void> {
        const timeMarker = (label: string) => {
            const time = (Date.now() - startTime) / 1000;
            elizaLogger.info(`[Timing] ${label}: ${time.toFixed(2)}s`);
        };

        const startTime = Date.now();
        const content = file.content;

        try {
            const fileSizeKB = new TextEncoder().encode(content).length / 1024;
            elizaLogger.info(
                `[File Progress] Starting ${file.path} (${fileSizeKB.toFixed(2)} KB)`
            );

            // Generate scoped ID for the file
            const scopedId = this.generateScopedId(
                file.path,
                file.isShared || false
            );

            // Step 1: Preprocessing
            //const preprocessStart = Date.now();
            const processedContent = this.preprocess(content);
            timeMarker("Preprocessing");

            // Step 2: Main document embedding
            const mainEmbeddingArray = await embed(
                this.runtime,
                processedContent
            );
            const mainEmbedding = new Float32Array(mainEmbeddingArray);
            timeMarker("Main embedding");

            // Step 3: Create main document
            await this.runtime.databaseAdapter?.createKnowledge({
                id: scopedId,
                agentId: this.runtime.agentId,
                content: {
                    text: content,
                    metadata: {
                        source: file.path,
                        type: file.type,
                        isShared: file.isShared || false,
                    },
                },
                embedding: mainEmbedding,
                createdAt: Date.now(),
            });
            timeMarker("Main document storage");

            // Step 4: Generate chunks
            const chunks = await splitChunks(processedContent, 512, 20);
            const totalChunks = chunks.length;
            elizaLogger.info(`Generated ${totalChunks} chunks`);
            timeMarker("Chunk generation");

            // Step 5: Process chunks with larger batches
            const BATCH_SIZE = 10; // Increased batch size
            let processedChunks = 0;

            for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
                const batchStart = Date.now();
                const batch = chunks.slice(
                    i,
                    Math.min(i + BATCH_SIZE, chunks.length)
                );

                // Process embeddings in parallel
                const embeddings = await Promise.all(
                    batch.map((chunk) => embed(this.runtime, chunk))
                );

                // Batch database operations
                await Promise.all(
                    embeddings.map(async (embeddingArray, index) => {
                        const chunkId =
                            `${scopedId}-chunk-${i + index}` as UUID;
                        const chunkEmbedding = new Float32Array(embeddingArray);

                        await this.runtime.databaseAdapter?.createKnowledge({
                            id: chunkId,
                            agentId: this.runtime.agentId,
                            content: {
                                text: batch[index],
                                metadata: {
                                    source: file.path,
                                    type: file.type,
                                    isShared: file.isShared || false,
                                    isChunk: true,
                                    originalId: scopedId,
                                    chunkIndex: i + index,
                                    originalPath: file.path,
                                },
                            },
                            embedding: chunkEmbedding,
                            createdAt: Date.now(),
                        });
                    })
                );

                processedChunks += batch.length;
                const batchTime = (Date.now() - batchStart) / 1000;
                elizaLogger.info(
                    `[Batch Progress] ${file.path}: Processed ${processedChunks}/${totalChunks} chunks (${batchTime.toFixed(2)}s for batch)`
                );
            }

            const totalTime = (Date.now() - startTime) / 1000;
            elizaLogger.info(
                `[Complete] Processed ${file.path} in ${totalTime.toFixed(2)}s`
            );
        } catch (error) {
            if (
                file.isShared &&
                (error as any)?.code === "SQLITE_CONSTRAINT_PRIMARYKEY"
            ) {
                elizaLogger.info(
                    `Shared knowledge ${file.path} already exists in database, skipping creation`
                );
                return;
            }
            elizaLogger.error(`Error processing file ${file.path}:`, error);
            throw error;
        }
    }
}
