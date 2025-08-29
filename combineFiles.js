const fs = require('fs').promises;
const path = require('path');

async function combineFiles(folderPath, outputFile) {
    let output = '';
    const files = await walkDir(folderPath);

    for (const file of files) {
        try {
            const content = await fs.readFile(file, 'utf8');
            output += `[File: ${file}]\n${content}\n\n`;
        } catch (err) {
            output += `[File: ${file}]\nError reading file: ${err.message}\n\n`;
        }
    }

    await fs.writeFile(outputFile, output);
    console.log(`Combined files into ${outputFile}`);
}

async function walkDir(dir) {
    let files = [];
    const items = await fs.readdir(dir, { withFileTypes: true });
    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
            if (!item.name.includes('node_modules') && !item.name.startsWith('.')) {
                files = files.concat(await walkDir(fullPath));
            }
        } else if (['.js', '.json', '.mjs'].includes(path.extname(fullPath))) {
            files.push(fullPath);
        }
    }
    return files;
}

combineFiles('.', 'combined_code.txt');












