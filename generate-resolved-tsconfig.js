#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all package.json files
const findPackageJsonFiles = () => {
    try {
        const output = execSync('find packages -name "package.json" | grep -v "node_modules"', { encoding: 'utf8' });
        return output.trim().split('\n');
    } catch (error) {
        console.error('Error finding package.json files:', error.message);
        return [];
    }
};

// Parse a JSON file
const parseJsonFile = (filePath) => {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        console.error(`Error parsing JSON file ${filePath}:`, error.message);
        return null;
    }
};

// Check if a file exists
const fileExists = (filePath) => {
    try {
        return fs.existsSync(filePath);
    } catch (error) {
        return false;
    }
};

// Read all the base tsconfig files
const readBaseTsConfigs = () => {
    const baseConfigs = {};

    // Read tsconfig.json
    if (fileExists('tsconfig.json')) {
        baseConfigs.tsconfig = parseJsonFile('tsconfig.json');
    }

    // Read tsconfig.base.json
    if (fileExists('tsconfig.base.json')) {
        baseConfigs.tsconfigBase = parseJsonFile('tsconfig.base.json');
    }

    // Read tsconfig.build.base.json
    if (fileExists('tsconfig.build.base.json')) {
        baseConfigs.tsconfigBuildBase = parseJsonFile('tsconfig.build.base.json');
    }

    return baseConfigs;
};

// Resolve extends in tsconfig
const resolveExtends = (tsconfig, basePath, baseConfigs) => {
    if (!tsconfig || !tsconfig.extends) {
        return tsconfig;
    }

    let extendsPath = tsconfig.extends;
    let parentConfig;

    // Check if it's one of the base configs
    if (extendsPath === '../../tsconfig.json') {
        parentConfig = baseConfigs.tsconfig;
    } else if (extendsPath === '../../tsconfig.base.json') {
        parentConfig = baseConfigs.tsconfigBase;
    } else if (extendsPath === '../../tsconfig.build.base.json') {
        parentConfig = baseConfigs.tsconfigBuildBase;
    } else {
        // Resolve the path relative to the current tsconfig
        const resolvedPath = path.resolve(basePath, extendsPath);
        if (fileExists(resolvedPath)) {
            parentConfig = parseJsonFile(resolvedPath);

            // Recursively resolve extends in the parent
            parentConfig = resolveExtends(parentConfig, path.dirname(resolvedPath), baseConfigs);
        } else {
            console.error(`Cannot resolve extends: ${extendsPath} from ${basePath}`);
            return tsconfig;
        }
    }

    if (!parentConfig) {
        return tsconfig;
    }

    // Merge with parent, giving precedence to child values
    const result = { ...parentConfig };
    delete result.extends;

    // Deep merge compilerOptions
    if (parentConfig.compilerOptions && tsconfig.compilerOptions) {
        result.compilerOptions = { ...parentConfig.compilerOptions, ...tsconfig.compilerOptions };
    }

    // Copy other properties from child
    for (const key in tsconfig) {
        if (key !== 'extends' && key !== 'compilerOptions') {
            result[key] = tsconfig[key];
        }
    }

    return result;
};

// Generate tsconfig.build.resolved.json
const generateResolvedTsConfig = () => {
    const baseConfigs = readBaseTsConfigs();
    let json = {};

    const packageJsonFiles = findPackageJsonFiles();

    packageJsonFiles.forEach(packageJsonPath => {
        const packageJson = parseJsonFile(packageJsonPath);

        if (!packageJson) {
            return;
        }

        const packageName = packageJson.name;
        const packageDir = path.dirname(packageJsonPath);
        const tsconfigPath = path.join(packageDir, 'tsconfig.build.json');

        if (fileExists(tsconfigPath)) {
            try {
                const tsconfig = parseJsonFile(tsconfigPath);
                if (tsconfig) {
                    const resolvedConfig = resolveExtends(tsconfig, packageDir, baseConfigs);
                    json[packageName] = resolvedConfig;
                } else {
                    json[packageName] = { error: 'Failed to parse tsconfig.build.json' };
                }
            } catch (error) {
                json[packageName] = { error: error.message };
            }
        } else {
            json[packageName] = { error: 'No tsconfig.build.json found' };
        }
    });

    return JSON.stringify(json, null, 2);
};

// Main function
const main = () => {
    const resolvedTsConfig = generateResolvedTsConfig();
    fs.writeFileSync('Eliza/DBIG/tsconfig.build.resolved.json', resolvedTsConfig);
    console.log('Resolved TSConfig written to Eliza/DBIG/tsconfig.build.resolved.json');
};

main(); 