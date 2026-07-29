const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `                    )\n, [displayMessages, activeSessionId, currentTheme.isDark, isLiveMode, liveResponseTranscript, playingChatTtsIndex, editingMessageIndex, editMessageInput, chatLanguage, activeLanguage, isAssistantTyping, playingChatTtsIndex]))`;
const replace1 = `                    )), [displayMessages, activeSessionId, currentTheme.isDark, isLiveMode, liveResponseTranscript, playingChatTtsIndex, editingMessageIndex, editMessageInput, chatLanguage, activeLanguage, isAssistantTyping, playingChatTtsIndex])`;

const target2 = `                    ), [displayMessages, activeSessionId, currentTheme.isDark, isLiveMode, liveResponseTranscript, playingChatTtsIndex, editingMessageIndex, editMessageInput, chatLanguage, activeLanguage, isAssistantTyping, playingChatTtsIndex]))`;
const replace2 = `                    )), [displayMessages, activeSessionId, currentTheme.isDark, isLiveMode, liveResponseTranscript, playingChatTtsIndex, editingMessageIndex, editMessageInput, chatLanguage, activeLanguage, isAssistantTyping, playingChatTtsIndex])`;

if (code.includes(target1)) {
  code = code.replace(target1, replace1);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Fixed target1");
} else if (code.includes(target2)) {
  code = code.replace(target2, replace2);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Fixed target2");
} else {
  // Let's use string manipulation
  let idx = code.indexOf(', [displayMessages, activeSessionId');
  if (idx !== -1) {
     // Find the closing bracket ']))'
     let endIdx = code.indexOf(']))', idx);
     if (endIdx !== -1) {
        // Backtrack to find the ')' before the comma
        let beforeComma = code.lastIndexOf(')', idx);
        if (beforeComma !== -1) {
           let newCode = code.substring(0, beforeComma) + '))' + code.substring(beforeComma + 1, endIdx) + '])' + code.substring(endIdx + 3);
           fs.writeFileSync('src/App.tsx', newCode);
           console.log("Fixed dynamically!");
        }
     }
  }
}
