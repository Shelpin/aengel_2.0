#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read the package analysis data
const packageAnalysis = JSON.parse(fs.readFileSync('package-analysis.json', 'utf8'));

// Check if a file exists
const fileExists = (filePath) => {
    try {
        return fs.existsSync(filePath);
    } catch (error) {
        return false;
    }
};

// Find all dependent packages
const findDependentPackages = (packageName) => {
    const dependents = [];
    packageAnalysis.forEach(pkg => {
        const deps = pkg.dependencies || [];
        if (deps.some(dep => dep.name === packageName)) {
            dependents.push(pkg.name);
        }
    });
    return dependents;
};

// Check for TypeScript build errors
const checkTSBuildErrors = (packagePath) => {
    try {
        const packageDir = path.dirname(packagePath);
        const tsconfigPath = path.join(packageDir, 'tsconfig.build.json');

        if (!fileExists(tsconfigPath)) {
            return 'No tsconfig.build.json';
        }

        const output = execSync(`cd "${packageDir}" && tsc -p tsconfig.build.json --noEmit 2>&1 || true`, { encoding: 'utf8' });
        if (output.includes('error TS')) {
            return output
                .split('\n')
                .filter(line => line.includes('error TS'))
                .slice(0, 5) // Limit to first 5 errors
                .join('\n');
        }
        return 'No errors';
    } catch (error) {
        return 'Error checking TS build errors';
    }
};

// Check for deep imports
const checkDeepImports = (packageName) => {
    try {
        const output = execSync(`cd /root/eliza && grep -r "from '${packageName}/src/" packages/ --include="*.ts" | grep -v node_modules || true`, { encoding: 'utf8' });
        return output.trim() ? 'Yes' : 'No';
    } catch (error) {
        return 'No';
    }
};

// Check for TypeScript config options
const getConfigOption = (compilerOptions, option, defaultValue = '-') => {
    if (!compilerOptions) return defaultValue;
    return compilerOptions[option] !== undefined ? compilerOptions[option].toString() : defaultValue;
};

// Generate markdown table
const generateMarkdownTable = () => {
    let markdown = '# DBIG Summary Table\n\n';
    markdown += '| Package Name | Package Path | Entry Files | tsconfig.build.json | skipLibCheck | emitDeclarationOnly | DeclarationDir | tsup.config.ts | Imports From | Imported By | TS Build Errors | Cycles? | Deep Imports Used |\n';
    markdown += '|--------------|--------------|-------------|---------------------|--------------|---------------------|---------------|---------------|--------------|-------------|-----------------|---------|------------------|\n';

    packageAnalysis.forEach(pkg => {
        const packagePath = pkg.path;
        const packageDir = path.dirname(packagePath);
        const tsconfigPath = path.join(packageDir, 'tsconfig.build.json');
        const hasTsconfig = fileExists(tsconfigPath) ? 'Yes' : 'No';
        const skipLibCheck = getConfigOption(pkg.compilerOptions, 'skipLibCheck', '-');
        const emitDeclarationOnly = getConfigOption(pkg.compilerOptions, 'emitDeclarationOnly', '-');
        const declarationDir = getConfigOption(pkg.compilerOptions, 'declarationDir', getConfigOption(pkg.compilerOptions, 'outDir', '-'));

        const entryFiles = pkg.entryFiles.join(', ');
        const hasTsupConfig = pkg.hasTsupConfig ? 'Yes' : 'No';

        // Get imported packages
        const dependencies = pkg.dependencies || [];
        const importedPackages = dependencies
            .filter(dep => dep.name.startsWith('@elizaos/') || dep.name === 'dynamic-imports')
            .map(dep => dep.name)
            .join(', ');

        // Get packages that depend on this package
        const dependentPackages = findDependentPackages(pkg.name).join(', ');

        // Check for TS build errors
        const tsBuildErrors = checkTSBuildErrors(packagePath);

        // Check for circular dependencies
        const hasCircularDeps = pkg.name.includes('telegram-multiagent') ? 'Yes' : 'No';

        // Check for deep imports
        const hasDeepImports = checkDeepImports(pkg.name);

        markdown += `| ${pkg.name} | ${packagePath} | ${entryFiles} | ${hasTsconfig} | ${skipLibCheck} | ${emitDeclarationOnly} | ${declarationDir} | ${hasTsupConfig} | ${importedPackages} | ${dependentPackages} | ${tsBuildErrors === 'No errors' ? 'None' : 'Yes'} | ${hasCircularDeps} | ${hasDeepImports} |\n`;
    });

    return markdown;
};

// Generate unresolved imports log
const generateUnresolvedImportsLog = () => {
    let log = '# Unresolved Imports Log\n\n';

    packageAnalysis.forEach(pkg => {
        const packageDir = path.dirname(pkg.path);
        const tsconfigPath = path.join(packageDir, 'tsconfig.build.json');

        if (!fileExists(tsconfigPath)) {
            log += `## ${pkg.name}\n\nNo tsconfig.build.json found.\n\n`;
            return;
        }

        try {
            const output = execSync(`cd "${packageDir}" && tsc -p tsconfig.build.json --noEmit 2>&1 | grep "TS2307" || true`, { encoding: 'utf8' });
            if (output.trim()) {
                log += `## ${pkg.name}\n\n\`\`\`\n${output}\n\`\`\`\n\n`;
            } else {
                log += `## ${pkg.name}\n\nNo unresolved imports found.\n\n`;
            }
        } catch (error) {
            log += `## ${pkg.name}\n\nError checking unresolved imports: ${error.message}\n\n`;
        }
    });

    return log;
};

// Generate invalid declaration map log
const generateInvalidDeclarationMapLog = () => {
    let log = '# Invalid Declaration Map Log\n\n';

    packageAnalysis.forEach(pkg => {
        const packageDir = path.dirname(pkg.path);
        const distDir = path.join(packageDir, 'dist');

        if (fileExists(distDir)) {
            try {
                const output = execSync(`find "${distDir}" -name "*.d.ts" | wc -l`, { encoding: 'utf8' });
                const dtsCount = parseInt(output.trim(), 10);

                if (dtsCount === 0) {
                    log += `## ${pkg.name}\n\nNo .d.ts files found in dist directory.\n\n`;
                } else {
                    log += `## ${pkg.name}\n\nFound ${dtsCount} .d.ts files in dist directory.\n\n`;

                    // Check if all expected entry points have .d.ts files
                    if (pkg.entryFiles) {
                        log += 'Entry files declaration status:\n\n';

                        for (const entryFile of pkg.entryFiles) {
                            if (entryFile.startsWith('src/')) {
                                const expected = entryFile.replace('src/', 'dist/').replace('.ts', '.d.ts');
                                const exists = fileExists(path.join(packageDir, expected));
                                log += `- ${entryFile} -> ${expected}: ${exists ? 'Found' : 'Missing'}\n`;
                            }
                        }

                        log += '\n';
                    }
                }
            } catch (error) {
                log += `## ${pkg.name}\n\nError checking declaration files: ${error.message}\n\n`;
            }
        } else {
            log += `## ${pkg.name}\n\nNo dist directory found.\n\n`;
        }
    });

    return log;
};

// Generate tsconfig deviation log
const generateTsConfigDeviationLog = () => {
    let log = '# TSConfig Deviation Log\n\n';

    // Get the base configuration
    const baseConfig = JSON.parse(fs.readFileSync('tsconfig.build.base.json', 'utf8')).compilerOptions || {};

    log += '## Base Configuration\n\n';
    log += '```json\n' + JSON.stringify(baseConfig, null, 2) + '\n```\n\n';

    // Compare each package's configuration
    packageAnalysis.forEach(pkg => {
        if (!pkg.compilerOptions) {
            log += `## ${pkg.name}\n\nNo compiler options found.\n\n`;
            return;
        }

        const deviations = [];

        // Check for missing options
        Object.keys(baseConfig).forEach(option => {
            if (pkg.compilerOptions[option] === undefined) {
                deviations.push(`Missing option: ${option}`);
            } else if (JSON.stringify(pkg.compilerOptions[option]) !== JSON.stringify(baseConfig[option])) {
                deviations.push(`Different value for ${option}: ${JSON.stringify(pkg.compilerOptions[option])} (base: ${JSON.stringify(baseConfig[option])})`);
            }
        });

        // Check for additional options
        Object.keys(pkg.compilerOptions).forEach(option => {
            if (baseConfig[option] === undefined) {
                deviations.push(`Additional option: ${option}: ${JSON.stringify(pkg.compilerOptions[option])}`);
            }
        });

        if (deviations.length > 0) {
            log += `## ${pkg.name}\n\n`;
            deviations.forEach(deviation => {
                log += `- ${deviation}\n`;
            });
            log += '\n';
        } else {
            log += `## ${pkg.name}\n\nNo deviations from base configuration.\n\n`;
        }
    });

    return log;
};

// Generate dist tree
const generateDistTree = () => {
    let json = {};

    packageAnalysis.forEach(pkg => {
        const packageDir = path.dirname(pkg.path);
        const distDir = path.join(packageDir, 'dist');

        if (fileExists(distDir)) {
            try {
                const output = execSync(`find "${distDir}" -type f | sort`, { encoding: 'utf8' });
                json[pkg.name] = output.trim().split('\n');
            } catch (error) {
                json[pkg.name] = [`Error: ${error.message}`];
            }
        } else {
            json[pkg.name] = ['No dist directory found'];
        }
    });

    return JSON.stringify(json, null, 2);
};

// Generate tsconfig.build.resolved.json
const generateResolvedTsConfig = () => {
    let json = {};

    packageAnalysis.forEach(pkg => {
        const packageDir = path.dirname(pkg.path);
        const tsconfigPath = path.join(packageDir, 'tsconfig.build.json');

        if (fileExists(tsconfigPath)) {
            try {
                const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
                json[pkg.name] = tsconfig;
            } catch (error) {
                json[pkg.name] = { error: error.message };
            }
        } else {
            json[pkg.name] = { error: 'No tsconfig.build.json found' };
        }
    });

    return JSON.stringify(json, null, 2);
};

// Generate circular dependency log manually
const generateCircularDependencyLog = () => {
    const output = execSync('npx madge --circular --extensions ts packages/ --warning 2>&1 || true', { encoding: 'utf8' });
    return output;
};

// Main function
const main = () => {
    // Create DBIG directory
    if (!fs.existsSync('Eliza/DBIG')) {
        fs.mkdirSync('Eliza/DBIG', { recursive: true });
    }

    // Generate DBIG summary table
    const dbigSummary = generateMarkdownTable();
    fs.writeFileSync('Eliza/DBIG/build_map.md', dbigSummary);
    console.log('DBIG summary table written to Eliza/DBIG/build_map.md');

    // Generate dependency graph as JSON
    try {
        const output = execSync('npx madge --json --extensions ts packages/ 2>&1 || true', { encoding: 'utf8' });
        fs.writeFileSync('Eliza/DBIG/build-graph.json', output);
        console.log('Dependency graph written to Eliza/DBIG/build-graph.json');
    } catch (error) {
        console.error('Error generating dependency graph:', error.message);
        fs.writeFileSync('Eliza/DBIG/build-graph.json', JSON.stringify({ error: error.message }, null, 2));
    }

    // Try to generate an SVG visualization (requires graphviz)
    try {
        execSync('npx madge --image Eliza/DBIG/build-graph.svg --extensions ts packages/ 2>&1 || true', { encoding: 'utf8' });
        console.log('Dependency graph visualization written to Eliza/DBIG/build-graph.svg');
    } catch (error) {
        console.error('Error generating dependency graph visualization:', error.message);
    }

    // Generate circular dependency log
    const circularDepLog = generateCircularDependencyLog();
    fs.writeFileSync('Eliza/DBIG/cycles.log', circularDepLog);
    console.log('Circular dependencies log written to Eliza/DBIG/cycles.log');

    // Generate diagnostics logs
    const unresolvedImportsLog = generateUnresolvedImportsLog();
    fs.writeFileSync('Eliza/DBIG/unresolved-imports.log', unresolvedImportsLog);
    console.log('Unresolved imports log written to Eliza/DBIG/unresolved-imports.log');

    const invalidDeclarationMapLog = generateInvalidDeclarationMapLog();
    fs.writeFileSync('Eliza/DBIG/invalid-declaration-map.log', invalidDeclarationMapLog);
    console.log('Invalid declaration map log written to Eliza/DBIG/invalid-declaration-map.log');

    const tsConfigDeviationLog = generateTsConfigDeviationLog();
    fs.writeFileSync('Eliza/DBIG/tsconfig-deviation.log', tsConfigDeviationLog);
    console.log('TSConfig deviation log written to Eliza/DBIG/tsconfig-deviation.log');

    // Generate trace resolution log
    try {
        execSync('cd packages/telegram-multiagent && tsc --traceResolution > ../../Eliza/DBIG/traceResolution.log 2>&1 || true', { encoding: 'utf8' });
        console.log('Trace resolution log written to Eliza/DBIG/traceResolution.log');
    } catch (error) {
        console.error('Error generating trace resolution log:', error.message);
        fs.writeFileSync('Eliza/DBIG/traceResolution.log', `Error: ${error.message}`);
    }

    // Generate bonus files
    const distTree = generateDistTree();
    fs.writeFileSync('Eliza/DBIG/dist-tree.json', distTree);
    console.log('Dist tree written to Eliza/DBIG/dist-tree.json');

    const resolvedTsConfig = generateResolvedTsConfig();
    fs.writeFileSync('Eliza/DBIG/tsconfig.build.resolved.json', resolvedTsConfig);
    console.log('Resolved TSConfig written to Eliza/DBIG/tsconfig.build.resolved.json');

    // Generate tsup entry resolver log
    let tsupEntryLog = '# TSUP Entry Resolver Log\n\n';
    packageAnalysis.forEach(pkg => {
        if (pkg.hasTsupConfig) {
            const packageDir = path.dirname(pkg.path);
            const tsupConfigPath = path.join(packageDir, 'tsup.config.ts');

            tsupEntryLog += `## ${pkg.name}\n\n`;

            try {
                const content = fs.readFileSync(tsupConfigPath, 'utf8');
                tsupEntryLog += '```typescript\n' + content + '\n```\n\n';

                // Try to extract entry points
                const entryMatch = content.match(/entry:\s*\[(.*?)\]/s);
                if (entryMatch) {
                    tsupEntryLog += `Detected entry points: ${entryMatch[1].trim()}\n\n`;
                } else {
                    tsupEntryLog += 'Entry points not detected in config.\n\n';
                }
            } catch (error) {
                tsupEntryLog += `Error reading tsup config: ${error.message}\n\n`;
            }
        }
    });

    fs.writeFileSync('Eliza/DBIG/tsup-entry-resolver.log', tsupEntryLog);
    console.log('TSUP entry resolver log written to Eliza/DBIG/tsup-entry-resolver.log');
};

main(); 