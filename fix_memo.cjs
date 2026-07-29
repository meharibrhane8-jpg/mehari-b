const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

const startStr = `                    displayMessages.map((msg, i) => (`;
let startIndex = code.indexOf(startStr);

if (startIndex !== -1) {
  let depth = 0;
  let inString = false;
  let stringChar = '';
  let endIndex = -1;
  
  const searchStart = startIndex + startStr.length - 1; // Points to the opening '(' of the map body
  
  for (let i = searchStart; i < code.length; i++) {
    const char = code[i];
    
    if (inString) {
      if (char === stringChar && code[i - 1] !== '\\') {
        inString = false;
      }
    } else {
      if (char === '"' || char === "'" || char === '`') {
        inString = true;
        stringChar = char;
      } else if (char === '(') {
        depth++;
      } else if (char === ')') {
        depth--;
        if (depth === 0) {
          endIndex = i;
          break;
        }
      }
    }
  }
  
  if (endIndex !== -1) {
    const before = code.substring(0, startIndex);
    const mapContent = code.substring(startIndex, endIndex + 1);
    const after = code.substring(endIndex + 1);
    
    const dependencies = `[displayMessages, activeSessionId, currentTheme.isDark, isLiveMode, liveResponseTranscript, playingChatTtsIndex, editingMessageIndex, editMessageInput, chatLanguage, activeLanguage, isAssistantTyping, isPlayingTts]`;
    
    const replaced = `React.useMemo(() => \n${mapContent}\n, ${dependencies})`;
    
    fs.writeFileSync('src/App.tsx', before + replaced + after);
    console.log("Successfully wrapped displayMessages.map in useMemo!");
  } else {
    console.log("Could not find end of map content");
  }
} else {
  console.log("Could not find start string");
}

