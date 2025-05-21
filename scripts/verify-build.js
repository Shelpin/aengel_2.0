const fs = require('fs');
const path = require('path');
const pkgDirs = fs.readdirSync('packages').filter(dir =>
    fs.statSync(path.join('packages', dir)).isDirectory() &&
    !['characters', 'plugin-multiagent-coordinator'].includes(dir)
);

console.log('Build Verification Report:');
console.log('=========================\n');

let allPassed = true;
for (const dir of pkgDirs) {
    const pkgPath = path.join('packages', dir);
    const pkgJson = require(path.join(process.cwd(), pkgPath, 'package.json'));
    const distPath = path.join(pkgPath, 'dist');

    console.log(`Package: ${pkgJson.name}`);

    // Check dist folder exists
    const distExists = fs.existsSync(distPath);
    console.log(`- Dist folder exists: ${distExists ? '✅' : '❌'}`);
    if (!distExists) {
        allPassed = false;
        continue;
    }

    // Check index.d.ts exists
    const dtsExists = fs.existsSync(path.join(distPath, 'index.d.ts'));
    console.log(`- index.d.ts exists: ${dtsExists ? '✅' : '❌'}`);
    if (!dtsExists) allPassed = false;

    // Check ESM output
    const esmExists = fs.existsSync(path.join(distPath, 'index.js'));
    console.log(`- ESM output: ${esmExists ? '✅' : '❌'}`);
    if (!esmExists) allPassed = false;

    // Check CJS output
    const cjsExists = fs.existsSync(path.join(distPath, 'index.cjs'));
    console.log(`- CJS output: ${cjsExists ? '✅' : '❌'}`);
    if (!cjsExists) allPassed = false;

    // Check public API if core package
    if (dir === 'core') {
        const publicApiDtsExists = fs.existsSync(path.join(distPath, 'public-api.d.ts'));
        console.log(`- public-api.d.ts exists: ${publicApiDtsExists ? '✅' : '❌'}`);
        if (!publicApiDtsExists) allPassed = false;
    }

    console.log(''); // Empty line between packages
}

console.log(`\nOverall verification: ${allPassed ? '✅ PASSED' : '❌ FAILED'}`);
process.exit(allPassed ? 0 : 1); 