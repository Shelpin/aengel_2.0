import path from 'node:path';
import fs from "fs/promises";
import {
    type IAgentRuntime,
    type ICacheManager,
    type IDatabaseCacheAdapter,
    CacheStore,
    CacheKeyPrefix,
    type CacheOptions,
    type Character,
} from './types.js';
import type { UUID } from './uuid.js';

export interface ICacheAdapter {
    get(key: string): Promise<string | undefined>;
    set(key: string, value: string): Promise<void>;
    delete(key: string): Promise<void>;
}

export class MemoryCacheAdapter implements ICacheAdapter {
    data: Map<string, string>;

    constructor(initalData?: Map<string, string>) {
        this.data = initalData ?? new Map<string, string>();
    }

    async get(key: string): Promise<string | undefined> {
        return this.data.get(key);
    }

    async set(key: string, value: string): Promise<void> {
        this.data.set(key, value);
    }

    async delete(key: string): Promise<void> {
        this.data.delete(key);
    }
}

export class FsCacheAdapter implements ICacheAdapter {
    constructor(private dataDir: string) { }

    async get(key: string): Promise<string | undefined> {
        try {
            return await fs.readFile(path.join(this.dataDir, key), "utf8");
        } catch {
            // console.error(error);
            return undefined;
        }
    }

    async set(key: string, value: string): Promise<void> {
        try {
            const filePath = path.join(this.dataDir, key);
            // Ensure the directory exists
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, value, "utf8");
        } catch (error) {
            console.error(error);
        }
    }

    async delete(key: string): Promise<void> {
        try {
            const filePath = path.join(this.dataDir, key);
            await fs.unlink(filePath);
        } catch {
            // console.error(error);
        }
    }
}

export class DbCacheAdapter implements ICacheAdapter {
    constructor(
        private db: IDatabaseCacheAdapter,
        private agentId: UUID
    ) { }

    private namespaceKey(key: string): string {
        return `${CacheKeyPrefix.AGENT_CACHE}_${this.agentId}_${key}`;
    }

    async get(key: string): Promise<string | undefined> {
        const namespacedKey = this.namespaceKey(key);
        const result = await this.db.get(namespacedKey);
        return result === null ? undefined : result;
    }

    async set(key: string, value: string): Promise<void> {
        const namespacedKey = this.namespaceKey(key);
        await this.db.set(namespacedKey, value);
    }

    async delete(key: string): Promise<void> {
        const namespacedKey = this.namespaceKey(key);
        await this.db.delete(namespacedKey);
    }
}

export class CacheManager<CacheAdapter extends ICacheAdapter = ICacheAdapter>
    implements ICacheManager {
    adapter: CacheAdapter;

    constructor(adapter: CacheAdapter) {
        this.adapter = adapter;
    }

    async get<T = unknown>(key: string): Promise<T | undefined> {
        const data = await this.adapter.get(key);

        if (data) {
            const { value, expires } = JSON.parse(data) as {
                value: T;
                expires: number;
            };

            if (!expires || expires > Date.now()) {
                return value;
            }

            this.adapter.delete(key).catch(() => { });
        }

        return undefined;
    }

    async set<T>(key: string, value: T, opts?: CacheOptions): Promise<void> {
        return this.adapter.set(
            key,
            JSON.stringify({ value, expires: opts?.expires ?? 0 })
        );
    }

    async delete(key: string): Promise<void> {
        return this.adapter.delete(key);
    }
}
