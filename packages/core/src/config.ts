import dotenv from "dotenv";
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getModulePath } from './utils/module-path.js';
import { existsSync } from 'node:fs';

const modulePaths = getModulePath();
const effectiveDirname = modulePaths.dirname || process.cwd(); // Fallback to cwd if dirname is null

// Load environment variables from root .env file
// Resolve relative to effectiveDirname, trying ../../../ first, then root
let envPath = path.resolve(effectiveDirname, "../../../.env");
if (!existsSync(envPath)) {
    envPath = path.resolve(effectiveDirname, ".env"); // Try root relative to effectiveDirname
    if (!existsSync(envPath)) {
        envPath = path.resolve(process.cwd(), ".env"); // Fallback to cwd root
    }
}

if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`Loaded .env from: ${envPath}`);
} else {
    console.warn("Could not find .env file at expected locations.");
}
