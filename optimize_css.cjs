const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf8');

// Replace filter: blur(80px) with something lighter or remove it
code = code.replace(/filter: blur\([0-9]+px\);/g, '');
code = code.replace(/mix-blend-mode: screen;/g, '');

fs.writeFileSync('src/index.css', code);
console.log("Optimized index.css");
