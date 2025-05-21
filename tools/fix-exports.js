const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all package.json files in packages/
const packageJsonFiles = glob.sync('packages/*/*/package.json').concat(glob.sync('packages/*/package.json'));

console.log(`Found ${packageJsonFiles.length} package.json files to process`);

let updatedCount = 0;

packageJsonFiles.forEach(pkgPath => {
    console.log(`Processing: ${pkgPath}`);

    try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

        if (pkg.exports) {
            let modified = false;

            const processValue = (value, isTypes) => {
                if (typeof value === 'string') {
                    if (isTypes) {
                        // Ensure we have the right extension format: should be .d.ts
                        // First fix any .d.d.ts to .d.ts (over-correction)
                        let newValue = value.replace(/\.d\.d\.ts$/, '.d.ts');

                        // Then ensure .js endings are fixed to .d.ts
                        if (newValue.endsWith('.js')) {
                            newValue = newValue.replace(/\.js$/, '.d.ts');
                            modified = true;
                            console.log(`   Fixed JS extension: ${value} -> ${newValue}`);
                        }

                        // For typescript file references, ensure they use .d.ts
                        if (newValue.endsWith('.ts') && !newValue.endsWith('.d.ts')) {
                            newValue = newValue.replace(/\.ts$/, '.d.ts');
                            modified = true;
                            console.log(`   Fixed TS extension: ${value} -> ${newValue}`);
                        }

                        return newValue;
                    } else {
                        // Non-types exports should point to .js files not .ts
                        if (value.endsWith('.ts')) {
                            const newValue = value.replace(/\.ts$/, '.js');
                            modified = true;
                            console.log(`   Fixed import extension: ${value} -> ${newValue}`);
                            return newValue;
                        }
                    }
                }
                return value;
            };

            const processExports = (obj) => {
                Object.keys(obj).forEach(key => {
                    const value = obj[key];
                    const isTypes = key === 'types' || key.endsWith('.d.ts');

                    if (typeof value === 'object' && value !== null) {
                        processExports(value);
                    } else {
                        obj[key] = processValue(value, isTypes);
                    }
                });
            };

            processExports(pkg.exports);

            if (modified) {
                fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
                updatedCount++;
                console.log(`✅ Updated exports in ${pkgPath}`);
            } else {
                console.log(`ℹ️ No changes needed for ${pkgPath}`);
            }
        } else {
            console.log(`⚠️ No exports field found in ${pkgPath}`);
        }
    } catch (error) {
        console.error(`❌ Error processing ${pkgPath}:`, error.message);
    }
});

console.log(`Completed. Updated ${updatedCount} of ${packageJsonFiles.length} package.json files.`); 