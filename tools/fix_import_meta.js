const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all files using import.meta
const files = execSync('grep -r "import.meta.url" --include="*.ts" packages/').toString().split('\n');

// Process each file
files.filter(Boolean).forEach(line => {
  // Extract file path
  const filePath = line.split(':')[0];
  if (!filePath || !fs.existsSync(filePath)) return;
  
  // Read file content
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Don't modify files that already use the module-path utility
  if (content.includes('module-path') || content.includes('getModulePath')) return;
  
  // Replace direct import.meta usage with the utility
  const updated = content
    .replace(
      /(?:const|let|var)?\s*__filename\s*=\s*fileURLToPath\(import\.meta\.url\)/g,
      `const { filename: __filename, dirname: __dirname } = getModulePath()`
    )
    .replace(
      /(?:const|let|var)?\s*__dirname\s*=\s*dirname\(fileURLToPath\(import\.meta\.url\)\)/g,
      ''
    )
    .replace(
      /fileURLToPath\(import\.meta\.url\)/g,
      `getModulePath().filename`
    )
    .replace(
      /dirname\(fileURLToPath\(import\.meta\.url\)\)/g,
      `getModulePath().dirname`
    );
  
  // Add import if needed
  if (updated !== content && !updated.includes('getModulePath')) {
    const importStatement = `import { getModulePath } from './utils/module-path';\n`;
    // Find a good place to add the import
    const lines = updated.split('\n');
    const lastImportIndex = lines.findLastIndex(line => line.trim().startsWith('import '));
    
    if (lastImportIndex >= 0) {
      lines.splice(lastImportIndex + 1, 0, importStatement);
      updated = lines.join('\n');
    } else {
      updated = importStatement + updated;
    }
  }
  
  // Write updated content
  if (updated !== content) {
    fs.writeFileSync(filePath, updated);
    console.log(`Updated ${filePath}`);
  }
}); 