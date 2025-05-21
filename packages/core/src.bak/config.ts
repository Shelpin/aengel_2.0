import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { getModulePath } from './utils/module-path.js';

const { filename: __filename, dirname: __dirname } = getModulePath();

// Load environment variables from root .env file
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
