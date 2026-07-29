const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace mix-blend-soft-light
code = code.replace(/mix-blend-soft-light/g, 'opacity-10');

// Wrap displayMessages.map in useMemo
const searchStr = `                    displayMessages.map((msg, i) => (`;
const replaceStr = `                    useMemo(() => displayMessages.map((msg, i) => (`;

// We also need to find the matching parenthesis for useMemo.
// But wait, it's easier to just do it via exact lines.
