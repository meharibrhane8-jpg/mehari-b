const fs = require('fs');
const glob = require('fs').readdirSync;
const path = require('path');

function replaceInFile(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  let originalCode = code;
  
  // Replace backdrop-blur with empty string or something
  code = code.replace(/backdrop-blur-[a-z0-9]+/g, '');
  code = code.replace(/backdrop-blur/g, '');
  
  if (code !== originalCode) {
    fs.writeFileSync(filePath, code);
    console.log("Updated", filePath);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      replaceInFile(fullPath);
    }
  }
}

walkDir('src');
