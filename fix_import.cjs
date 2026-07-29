const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const reactImportMatch = code.match(/import\s+{([^}]+)}\s+from\s+["']react["']/);
if (reactImportMatch) {
  const imports = reactImportMatch[1];
  if (!imports.includes('useMemo')) {
    const newImports = imports + ', useMemo';
    code = code.replace(reactImportMatch[0], `import {${newImports}} from "react"`);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Added useMemo to react imports");
  } else {
    console.log("useMemo already imported");
  }
} else {
  // If no named react imports, add a new one
  code = `import { useMemo } from "react";\n` + code;
  fs.writeFileSync('src/App.tsx', code);
  console.log("Added new useMemo import");
}
