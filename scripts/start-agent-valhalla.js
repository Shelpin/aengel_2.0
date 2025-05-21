#!/usr/bin/env node
// Load environment variables
import 'dotenv/config';
import path from 'path';

// ==== Begin Valhalla startup injection ====
// Derive AGENT_ID and normalize TELEGRAM_BOT_TOKEN from character flag
const rawArgs = process.argv.slice(2);
let charArg = rawArgs.find(a => a.startsWith('--character=')) || rawArgs.find(a => a.startsWith('--characters='));
if (charArg) {
    const charPath = charArg.split('=')[1];
    const agentId = path.basename(charPath, '.json');
    process.env.AGENT_ID = agentId;
    const tokenVar = `TELEGRAM_BOT_TOKEN_${agentId}`;
    if (process.env[tokenVar]) {
        process.env.TELEGRAM_BOT_TOKEN = process.env[tokenVar];
        console.log(`🔑 Mapped ${tokenVar} -> TELEGRAM_BOT_TOKEN`);
    } else {
        console.warn(`⚠️ ${tokenVar} not set, TELEGRAM_BOT_TOKEN unchanged`);
    }
}
// Default database path for SQLite
if (!process.env.SQLITE_FILE && !process.env.DATABASE_PATH) {
    process.env.SQLITE_FILE = path.resolve(process.cwd(), 'packages/agent/data/multiagent.db');
    console.warn(`⚠️ No DB path specified; defaulting to ${process.env.SQLITE_FILE}`);
}
// ==== End Valhalla startup injection ====

// Apply runtime patches inside this agent process
await import('../patches/runtime-patch.js');

// Spawn the real agent
import { spawn } from 'child_process';
const args = process.argv.slice(2);
// Resolve character paths to absolute for both --character and --characters flags
const resolvedArgs = args.map(arg => {
    if (arg.startsWith('--character=') || arg.startsWith('--characters=')) {
        const [key, val] = arg.split('=');
        const absolute = path.resolve(process.cwd(), val);
        return `${key}=${absolute}`;
    }
    return arg;
});
// Spawn the official agent CLI runner via pnpm exec
// The preload flags (-r) are handled by the parent wrapper process
spawn('pnpm', [
    '--filter', '@elizaos/agent', 'start',
    ...resolvedArgs
], { stdio: 'inherit' });

// Keep-alive without opening extra ports
process.stdin.resume(); 