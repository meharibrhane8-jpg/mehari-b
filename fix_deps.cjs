const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// The inserted string was React.useMemo(() => ... )
// Let's replace React.useMemo with useMemo (import is probably 'import { ..., useMemo } from "react"')
code = code.replace(/React\.useMemo\(/g, 'useMemo(');

// Let's replace isPlayingTts with playingChatTtsIndex (or whatever is correct)
code = code.replace(/isPlayingTts\]\)/g, 'playingChatTtsIndex])');
// wait, playingChatTtsIndex is already there. So just remove isPlayingTts
code = code.replace(/, isPlayingTts\]/g, ']');

fs.writeFileSync('src/App.tsx', code);
