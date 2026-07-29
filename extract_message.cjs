const fs = require('fs');
const code = fs.readFileSync('src/App.tsx', 'utf8');

const match = code.match(/displayMessages\.map\(\(msg, i\) => \(/);
if (match) {
  console.log("Found displayMessages.map");
} else {
  console.log("Not found displayMessages.map");
}
