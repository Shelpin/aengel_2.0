import { CoreDatabaseAdapter, AgentRuntime, elizaLogger } from '@elizaos/core';
import { ModelProviderName } from '@elizaos/core';
import type {
    Action,
    Evaluator,
    Provider,
    Account,
    Actor,
    Memory,
    Participant,
    Goal,
    RAGKnowledgeItem,
    Character,
    UUID,
    IDatabaseAdapter,
    IAgentRuntime,
    IMemoryManager
} from '@elizaos/core';
// import { SqlJsDatabaseAdapter } from "@elizaos/adapter-sqljs"; // Commented out - package not found
// import { SupabaseDatabaseAdapter } from "@elizaos/adapter-supabase"; // Commented out - package not found
// import { PGLiteDatabaseAdapter } from "@elizaos/adapter-pglite"; // Commented out - package not found
import {
    SUPABASE_ANON_KEY,
    SUPABASE_URL,
    TEST_EMAIL,
    TEST_PASSWORD,
    zeroUuid,
} from './constants.js';
import { SERVER_URL } from './constants.js';
import type { User } from './types.js';

// Mock SQLite adapter for testing purposes
class MockSqliteDatabaseAdapter extends CoreDatabaseAdapter<any> {
    constructor(dbPath: string) {
        super({});
        console.log(`[MockSqliteDatabaseAdapter] Created with path: ${dbPath}`);
    }

    // Connection methods
    async connect(): Promise<void> {
        console.log(`[MockSqliteDatabaseAdapter] connect override`);
    }

    async disconnect(): Promise<void> {
        console.log(`[MockSqliteDatabaseAdapter] disconnect override`);
    }

    async close(): Promise<void> {
        console.log(`[MockSqliteDatabaseAdapter] close override`);
    }

    // General query methods
    async query(sql: string, params?: any[]): Promise<any[]> {
        console.log(`[MockSqliteDatabaseAdapter] query override: ${sql}`);
        return [];
    }

    async execute(sql: string, params?: any[]): Promise<void> {
        console.log(`[MockSqliteDatabaseAdapter] execute override: ${sql}`);
    }

    async getAccountById(userId: UUID): Promise<Account | null> {
        console.log(`[MockSqliteDatabaseAdapter] getAccountById: ${userId}`);
        return null;
    }

    async createAccount(account: Account): Promise<boolean> {
        console.log(`[MockSqliteDatabaseAdapter] createAccount`);
        return true;
    }

    async getMemories(params: {
        agentId: UUID;
        roomId: UUID;
        count?: number;
        unique?: boolean;
        tableName: string;
        start?: number;
        end?: number;
    }): Promise<Memory[]> {
        console.log(`[MockSqliteDatabaseAdapter] getMemories: ${params.agentId}, ${params.roomId}`);
        return [];
    }

    async getMemoriesByRoomIds(params: any): Promise<Memory[]> {
        console.log(`[MockSqliteDatabaseAdapter] getMemoriesByRoomIds`);
        return [];
    }

    async getMemoryById(id: UUID): Promise<Memory | null> {
        console.log(`[MockSqliteDatabaseAdapter] getMemoryById: ${id}`);
        return null;
    }

    async getMemoriesByIds(ids: UUID[], tableName?: string): Promise<Memory[]> {
        console.log(`[MockSqliteDatabaseAdapter] getMemoriesByIds: ${ids.join(', ')}`);
        return [];
    }

    async getActorDetails(params: { roomId: UUID }): Promise<Actor[]> {
        console.log(`[MockSqliteDatabaseAdapter] getActorDetails: ${params.roomId}`);
        return [];
    }

    async log(params: {
        body: { [key: string]: unknown };
        userId: UUID;
        roomId: UUID;
        type: string;
    }): Promise<void> {
        console.log(`[MockSqliteDatabaseAdapter] log: ${params.type}`);
    }

    async getCachedEmbeddings(params: any): Promise<any[]> {
        console.log(`[MockSqliteDatabaseAdapter] getCachedEmbeddings`);
        return [];
    }

    async searchMemories(params: {
        tableName: string;
        agentId: UUID;
        roomId: UUID;
        embedding: number[];
        match_threshold: number;
        match_count: number;
        unique: boolean;
    }): Promise<Memory[]> {
        console.log(`[MockSqliteDatabaseAdapter] searchMemories: ${params.agentId}, ${params.roomId}`);
        return [];
    }

    async updateGoalStatus(params: {
        goalId: UUID;
        status: any; // Using any for GoalStatus for simplicity
    }): Promise<void> {
        console.log(`[MockSqliteDatabaseAdapter] updateGoalStatus: ${params.goalId}`);
    }

    async searchMemoriesByEmbedding(
        embedding: number[],
        params: {
            match_threshold?: number;
            count?: number;
            roomId?: UUID;
            agentId?: UUID;
            unique?: boolean;
            tableName: string;
        }
    ): Promise<Memory[]> {
        console.log(`[MockSqliteDatabaseAdapter] searchMemoriesByEmbedding: ${params.tableName}`);
        return [];
    }

    async createMemory(
        memory: Memory,
        tableName: string,
        unique?: boolean
    ): Promise<void> {
        console.log(`[MockSqliteDatabaseAdapter] createMemory: ${tableName}`);
    }

    async removeMemory(memoryId: UUID, tableName: string): Promise<void> {
        console.log(`[MockSqliteDatabaseAdapter] removeMemory: ${memoryId}`);
    }

    async removeAllMemories(roomId: UUID, tableName: string): Promise<void> {
        console.log(`[MockSqliteDatabaseAdapter] removeAllMemories: ${roomId}`);
    }

    async countMemories(
        roomId: UUID,
        unique?: boolean,
        tableName?: string
    ): Promise<number> {
        console.log(`[MockSqliteDatabaseAdapter] countMemories: ${roomId}`);
        return 0;
    }

    async getGoals(params: {
        agentId: UUID;
        roomId: UUID;
        userId?: UUID | null;
        onlyInProgress?: boolean;
        count?: number;
    }): Promise<Goal[]> {
        console.log(`[MockSqliteDatabaseAdapter] getGoals: ${params.agentId}, ${params.roomId}`);
        return [];
    }

    async updateGoal(goal: Goal): Promise<void> {
        console.log(`[MockSqliteDatabaseAdapter] updateGoal`);
    }

    async createGoal(goal: Goal): Promise<void> {
        console.log(`[MockSqliteDatabaseAdapter] createGoal`);
    }

    async removeGoal(goalId: UUID): Promise<void> {
        console.log(`[MockSqliteDatabaseAdapter] removeGoal: ${goalId}`);
    }

    async removeAllGoals(roomId: UUID): Promise<void> {
        console.log(`[MockSqliteDatabaseAdapter] removeAllGoals: ${roomId}`);
    }

    async getRoom(roomId: UUID): Promise<UUID | null> {
        console.log(`[MockSqliteDatabaseAdapter] getRoom: ${roomId}`);
        return null;
    }

    async createRoom(roomId?: UUID): Promise<UUID> {
        console.log(`[MockSqliteDatabaseAdapter] createRoom`);
        return zeroUuid;
    }

    async removeRoom(roomId: UUID): Promise<void> {
        console.log(`[MockSqliteDatabaseAdapter] removeRoom: ${roomId}`);
    }

    async getRoomsForParticipant(userId: UUID): Promise<UUID[]> {
        console.log(`[MockSqliteDatabaseAdapter] getRoomsForParticipant: ${userId}`);
        return [];
    }

    async getRoomsForParticipants(userIds: UUID[]): Promise<UUID[]> {
        console.log(`[MockSqliteDatabaseAdapter] getRoomsForParticipants`);
        return [];
    }

    async addParticipant(userId: UUID, roomId: UUID): Promise<boolean> {
        console.log(`[MockSqliteDatabaseAdapter] addParticipant: ${userId}, ${roomId}`);
        return true;
    }

    async removeParticipant(userId: UUID, roomId: UUID): Promise<boolean> {
        console.log(`[MockSqliteDatabaseAdapter] removeParticipant: ${userId}, ${roomId}`);
        return true;
    }

    async getParticipantsForAccount(userId: UUID): Promise<Participant[]> {
        console.log(`[MockSqliteDatabaseAdapter] getParticipantsForAccount: ${userId}`);
        return [];
    }

    async getParticipantsForRoom(roomId: UUID): Promise<UUID[]> {
        console.log(`[MockSqliteDatabaseAdapter] getParticipantsForRoom: ${roomId}`);
        return [];
    }

    async getParticipantUserState(roomId: UUID, userId: UUID): Promise<"FOLLOWED" | "MUTED" | null> {
        console.log(`[MockSqliteDatabaseAdapter] getParticipantUserState: ${roomId}, ${userId}`);
        return null;
    }

    async setParticipantUserState(roomId: UUID, userId: UUID, state: "FOLLOWED" | "MUTED" | null): Promise<void> {
        console.log(`[MockSqliteDatabaseAdapter] setParticipantUserState: ${roomId}, ${userId}, ${state}`);
    }

    async createRelationship(params: { userA: UUID; userB: UUID }): Promise<boolean> {
        console.log(`[MockSqliteDatabaseAdapter] createRelationship: ${params.userA}, ${params.userB}`);
        return true;
    }

    async getRelationship(params: { userA: UUID; userB: UUID }): Promise<any | null> {
        console.log(`[MockSqliteDatabaseAdapter] getRelationship: ${params.userA}, ${params.userB}`);
        return null;
    }

    async getRelationships(params: { userId: UUID }): Promise<any[]> {
        console.log(`[MockSqliteDatabaseAdapter] getRelationships: ${params.userId}`);
        return [];
    }

    async getKnowledge(params: {
        id?: UUID;
        agentId: UUID;
        limit?: number;
        query?: string;
        conversationContext?: string;
    }): Promise<RAGKnowledgeItem[]> {
        console.log(`[MockSqliteDatabaseAdapter] getKnowledge: ${params.agentId}`);
        return [];
    }

    async searchKnowledge(params: {
        agentId: UUID;
        embedding: Float32Array;
        match_threshold: number;
        match_count: number;
        searchText?: string;
    }): Promise<RAGKnowledgeItem[]> {
        console.log(`[MockSqliteDatabaseAdapter] searchKnowledge: ${params.agentId}`);
        return [];
    }

    async createKnowledge(knowledge: RAGKnowledgeItem): Promise<void> {
        console.log(`[MockSqliteDatabaseAdapter] createKnowledge`);
    }

    async removeKnowledge(id: UUID): Promise<void> {
        console.log(`[MockSqliteDatabaseAdapter] removeKnowledge: ${id}`);
    }

    async clearKnowledge(agentId: UUID, shared?: boolean): Promise<void> {
        console.log(`[MockSqliteDatabaseAdapter] clearKnowledge: ${agentId}`);
    }
}

/**
 * Creates a runtime environment for the agent.
 *
 * @param {Object} param - The parameters for creating the runtime.
 * @param {Record<string, string> | NodeJS.ProcessEnv} [param.env] - The environment variables.
 * @param {number} [param.conversationLength] - The length of the conversation.
 * @param {Evaluator[]} [param.evaluators] - The evaluators to be used.
 * @param {Action[]} [param.actions] - The actions to be used.
 * @param {Provider[]} [param.providers] - The providers to be used.
 * @returns {Object} An object containing the created user, session, and runtime.
 */
export async function createRuntime({
    env,
    conversationLength,
    evaluators = [],
    actions = [],
    providers = [],
}: {
    env?: Record<string, string> | NodeJS.ProcessEnv;
    conversationLength?: number;
    evaluators?: Evaluator[];
    actions?: Action[];
    providers?: Provider[];
}) {
    let adapter: CoreDatabaseAdapter<any>;
    // Initialize user with a default value to ensure it's always defined
    let user: User = {
        id: zeroUuid,
        email: "test@example.com",
    };
    let session: {
        user: User;
    } = { user };

    switch (env?.TEST_DATABASE_CLIENT as string) {
        /* // Case commented out due to missing @elizaos/adapter-sqljs package
        case "sqljs":
            {
                const module = await import("sql.js");

                const initSqlJs = module.default;

                // SQLite adapter
                const SQL = await initSqlJs({});
                const db = new SQL.Database();

                adapter = new SqlJsDatabaseAdapter(db);

                // Load sqlite-vss
                loadVecExtensions((adapter as SqlJsDatabaseAdapter).db);
                // Create a test user and session
                session = {
                    user: {
                        id: zeroUuid,
                        email: "test@example.com",
                    },
                };
                user = session.user;
            }
            break;
        */
        /* // Case commented out due to missing @elizaos/adapter-supabase package
        case "supabase": {
            const module = await import("@supabase/supabase-js");

            const { createClient } = module;

            const supabase = createClient(
                env?.SUPABASE_URL ?? SUPABASE_URL,
                env?.SUPABASE_SERVICE_API_KEY ?? SUPABASE_ANON_KEY
            );

            const { data } = await supabase.auth.signInWithPassword({
                email: TEST_EMAIL!,
                password: TEST_PASSWORD!,
            });

            user = data.user as User;
            session = data.session as unknown as { user: User };

            if (!session) {
                const response = await supabase.auth.signUp({
                    email: TEST_EMAIL!,
                    password: TEST_PASSWORD!,
                });

                // Change the name of the user
                const { error } = await supabase
                    .from("accounts")
                    .update({ name: "Test User" })
                    .eq("id", response.data.user?.id);

                if (error) {
                    throw new Error(
                        "Create runtime error: " + JSON.stringify(error)
                    );
                }

                user = response.data.user as User;
                session = response.data.session as unknown as { user: User };
            }

            adapter = new SupabaseDatabaseAdapter(
                env?.SUPABASE_URL ?? SUPABASE_URL,
                env?.SUPABASE_SERVICE_API_KEY ?? SUPABASE_ANON_KEY
            );
            break;
        }
        */
        /* // Case commented out due to missing @elizaos/adapter-pglite package
        case "pglite":
            {
                // Import the PGLite adapter
                await import("@electric-sql/pglite");

                // PGLite adapter
                adapter = new PGLiteDatabaseAdapter({ dataDir: "../pglite" });

                // Create a test user and session
                session = {
                    user: {
                        id: zeroUuid,
                        email: "test@example.com",
                    },
                };
                user = session.user;
            }
            break;
        */
        case "sqlite":
        default:
            {
                // Use a mock SQLiteDatabaseAdapter to avoid dependency on @elizaos/adapter-sqlite
                adapter = new MockSqliteDatabaseAdapter(":memory:");

                // Create a test user and session
                session = {
                    user: {
                        id: zeroUuid,
                        email: "test@example.com",
                    },
                };
                // Assign the user created in the default session
                user = session.user;
            }
            break;
    }

    // Ensure adapter is assigned before creating AgentRuntime
    if (!adapter) {
        throw new Error("Database adapter was not initialized.");
    }

    // Create runtime instance before any await operations on it
    const runtime = new AgentRuntime({
        serverUrl: SERVER_URL,
        conversationLength,
        token: env?.OPENAI_API_KEY!,
        modelProvider: ModelProviderName.OPENAI,
        actions,
        evaluators,
        databaseAdapter: adapter,
        character: {} as Character
    });

    // User and session should be defined by this point due to default initialization
    // No need for additional checks here

    return { user, session, runtime };
}
