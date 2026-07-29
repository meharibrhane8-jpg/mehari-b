const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace mix-blend-soft-light
code = code.replace(/mix-blend-soft-light/g, 'opacity-10');

// Replace neural-circuitry opacity-20
code = code.replace(/neural-circuitry opacity-20/g, 'opacity-5');

fs.writeFileSync('src/App.tsx', code);
console.log("Optimized effects");
