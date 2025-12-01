const fs = require('fs');
const path = require('path');

// Config: Folders to include and extensions to look for
const TARGET_DIR = './src'; 
const OUTPUT_FILE = 'entropy_codebase.txt';
const EXTENSIONS = ['.ts', '.tsx', '.css', '.js', '.jsx'];

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walk(filePath, fileList);
    } else {
      if (EXTENSIONS.includes(path.extname(file))) {
        fileList.push(filePath);
      }
    }
  });
  return fileList;
}

const allFiles = walk(TARGET_DIR);
let output = `ENTROPY CODEBASE DUMP - ${new Date().toISOString()}\n\n`;

allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  output += `\n--- START FILE: ${file} ---\n`;
  output += content;
  output += `\n--- END FILE: ${file} ---\n`;
});

fs.writeFileSync(OUTPUT_FILE, output);
console.log(`✅ Success! Upload '${OUTPUT_FILE}' to the chat.`);