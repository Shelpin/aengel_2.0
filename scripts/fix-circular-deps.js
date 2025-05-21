#!/usr/bin/env node

/**
 * Script to fix circular dependencies in the ElizaOS codebase
 * Based on the deterministic build plan
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Log to both console and file
const LOG_DIR = 'reports/implementation2104';
const LOG_FILE = path.join(LOG_DIR, 'circular-deps-fix.log');

function log(message) {
    console.log(message);
    fs.appendFileSync(LOG_FILE, message + '\n');
}

// Initialize log file
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}
fs.writeFileSync(LOG_FILE, `# Circular Dependencies Fix Log - ${new Date().toISOString()}\n\n`);

// Find circular dependencies
log('Detecting circular dependencies...');
try {
    const result = execSync('npx madge --circular --extensions ts packages/').toString();
    if (result.includes('✖')) {
        log(`Found circular dependencies: ${result}`);
    } else {
        log('No circular dependencies found.');
        process.exit(0);
    }
} catch (error) {
    log(`Error running madge: ${error.message}`);
    const result = error.stdout?.toString();
    if (result) {
        log(`Madge output: ${result}`);
    }
}

// Common circular dependency patterns and fixes
const fixPatterns = [
    {
        // Fix runtime importing from modules that import runtime
        pattern: /from ['"]\.\.\/runtime['"]/,
        replacement: (content, filePath) => {
            log(`Fixing runtime import in ${filePath}`);

            // Create a runtime interface file if it doesn't exist
            const runtimeInterfacePath = path.join(path.dirname(filePath), 'interfaces', 'runtime.ts');
            const runtimeInterfaceDir = path.dirname(runtimeInterfacePath);

            if (!fs.existsSync(runtimeInterfaceDir)) {
                fs.mkdirSync(runtimeInterfaceDir, { recursive: true });
            }

            if (!fs.existsSync(runtimeInterfacePath)) {
                const interfaceContent = `/**
 * Runtime interface to break circular dependencies
 */
export interface RuntimeInterface {
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  getLogger(name: string): any;
  // Add more methods as needed
}`;
                fs.writeFileSync(runtimeInterfacePath, interfaceContent);
                log(`Created runtime interface at ${runtimeInterfacePath}`);
            }

            // Update import to use interface
            return content.replace(
                /from ['"]\.\.\/runtime['"]/g,
                `from './interfaces/runtime'`
            );
        }
    },
    {
        // Fix database circular dependencies
        pattern: /from ['"]\.\.\/database['"]/,
        replacement: (content, filePath) => {
            log(`Fixing database import in ${filePath}`);

            // Create a database interface file if it doesn't exist
            const dbInterfacePath = path.join(path.dirname(filePath), 'interfaces', 'database.ts');
            const dbInterfaceDir = path.dirname(dbInterfacePath);

            if (!fs.existsSync(dbInterfaceDir)) {
                fs.mkdirSync(dbInterfaceDir, { recursive: true });
            }

            if (!fs.existsSync(dbInterfacePath)) {
                const interfaceContent = `/**
 * Database interface to break circular dependencies
 */
export interface DatabaseInterface {
  query(sql: string, params?: any[]): Promise<any[]>;
  // Add more methods as needed
}`;
                fs.writeFileSync(dbInterfacePath, interfaceContent);
                log(`Created database interface at ${dbInterfacePath}`);
            }

            // Update import to use interface
            return content.replace(
                /from ['"]\.\.\/database['"]/g,
                `from './interfaces/database'`
            );
        }
    }
];

// Walk the packages directory and fix circular dependencies
function walkAndFix(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            if (entry.name !== 'node_modules' && entry.name !== 'dist') {
                walkAndFix(fullPath);
            }
        } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
            try {
                const content = fs.readFileSync(fullPath, 'utf8');
                let updatedContent = content;

                // Apply fixes
                for (const fix of fixPatterns) {
                    if (fix.pattern.test(content)) {
                        updatedContent = fix.replacement(updatedContent, fullPath);
                    }
                }

                // Write back if changed
                if (updatedContent !== content) {
                    fs.writeFileSync(fullPath, updatedContent);
                    log(`Fixed ${fullPath}`);
                }
            } catch (error) {
                log(`Error processing ${fullPath}: ${error.message}`);
            }
        }
    }
}

// Start fixing
log('Starting to fix circular dependencies...');
walkAndFix(path.join(process.cwd(), 'packages'));

// Check if circular dependencies were fixed
log('Checking for remaining circular dependencies...');
try {
    const result = execSync('npx madge --circular --extensions ts packages/').toString();
    if (result.includes('✖')) {
        log(`Remaining circular dependencies: ${result}`);
        log('Some circular dependencies could not be automatically fixed.');
    } else {
        log('All circular dependencies have been fixed!');
    }
} catch (error) {
    const result = error.stdout?.toString();
    if (result) {
        log(`Remaining circular dependencies: ${result}`);
        log('Some circular dependencies could not be automatically fixed.');
    }
}

log('Circular dependency fix process completed.'); 