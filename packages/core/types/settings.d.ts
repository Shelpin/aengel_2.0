interface Settings {
    [key: string]: string | undefined;
}
/**
 * Recursively searches for a .env file starting from the current directory
 * and moving up through parent directories (Node.js only)
 * @param {string} [startDir=process.cwd()] - Starting directory for the search
 * @returns {string|null} Path to the nearest .env file or null if not found
 */
export declare function findNearestEnvFile(startDir?: string): string;
/**
 * Configures environment settings for browser usage
 * @param {Settings} settings - Object containing environment variables
 */
export declare function configureSettings(settings: Settings): void;
/**
 * Loads environment variables from the nearest .env file in Node.js
 * or returns configured settings in browser
 * @returns {Settings} Environment variables object
 * @throws {Error} If no .env file is found in Node.js environment
 */
export declare function loadEnvConfig(): Settings;
/**
 * Gets a specific environment variable
 * @param {string} key - The environment variable key
 * @param {string} [defaultValue] - Optional default value if key doesn't exist
 * @returns {string|undefined} The environment variable value or default value
 */
export declare function getEnvVariable(key: string, defaultValue?: string): string | undefined;
/**
 * Checks if a specific environment variable exists
 * @param {string} key - The environment variable key
 * @returns {boolean} True if the environment variable exists
 */
export declare function hasEnvVariable(key: string): boolean;
export declare const settings: Settings;
export default settings;
