/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
} from "react";
import {  motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { 
  MessageSquare,
  MessageSquarePlus,
  Send,
  Bot,
  User,
  Delete,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Space,
  CornerDownLeft,
  Globe,
  Copy,
  Volume2,
  ClipboardPaste,
  Trash2,
  Check,
  Settings2,
  RotateCcw,
  X,
  Save,
  Languages,
  Mic,
  MicOff,
  Palette,
  Smile,
  Rows,
  Wand2,
  Sparkles,
  Loader2,
  ArrowLeftRight,
  Type,
  ClipboardList,
  Pin,
  PinOff,
  Search,
  Bold,
  Italic,
  Underline,
  Zap,
  Plus,
  Trash,
  CheckCircle2,
  Maximize2,
  Minimize2,
  CornerDownRight,
  BrainCircuit,
  History,
  Pencil,
  Download,
  Keyboard,
  Highlighter,
  Image,
  Pause,
  Play,
  CheckCircle,
  Scissors,
  Feather,
  ShieldCheck,
  HelpCircle,
  Clock,
  Users,
  AlertTriangle,
  LayoutGrid,
  PenTool,
  AudioLines,
  FileCode,
  Printer,
  BarChart2,
} from "lucide-react";
import {  GEEZ_MAP, VOWEL_MAP, PHONETIC_MAP } from "./geezUtils";
import { 
  getSuggestions,
  TIGRINYA_DICTIONARY,
  AUTOCORRECT_MAP,
} from "./lib/autocorrect";
import { 
  startAIChat,
  sendMessageToAI,
  sendMessageStreamToAI,
  generateTTS,
  generateSuggestions,
  ChatMessage,
  connectToLiveAPI,
  refineText,
  translateText,
  callGeminiAPI,
  callGeminiImageAPI,
  geminiTranscribe,
} from "./services/geminiService";
import { 
  getAudioContext,
  playBase64Audio,
  playConfirmationTone,
  resumeAudioContext,
  stopAllAudio,
  speakWithWebSpeech,
} from "./services/audioService";
import {  downloadWav } from "./lib/wavUtils";
import {  AudioRecorder } from "./lib/audioRecorder";
import {  AudioStreamer } from "./lib/audioStreamer";
import { 
  Headphones,
  Radio,
  Mic2,
  Eye,
  EyeOff,
  Camera,
  CameraOff,
  Video,
  MessageCircle,
  File as FileIcon,
  Folder,
  FolderOpen,
} from "lucide-react";
import {  SettingsDrawer } from "./components/SettingsDrawer";
import {  LiveVoiceSelectionDrawer } from "./components/LiveVoiceSelectionDrawer";
import {  TIGRINYA_VOICES } from "./data/tigrinyaVoiceProfiles";
import {  FileAttachmentModule } from "./components/FileAttachmentModule";
import {  MemoryBankDrawer } from "./components/MemoryBankDrawer";
import {  AiModesManager, AI_MODES_LIST } from "./components/AiModesManager";


import {  DailyTip } from "./components/DailyTip";
import {  OnboardingGuide } from "./components/OnboardingGuide";
import {  TtsStudioModal } from "./components/TtsStudioModal";
import {  SpeechBooth } from "./components/SpeechBooth";

import {  useLocalTime } from "./lib/useLocalTime";
import {  AttachedFile } from "./types";
import {  MessageLinksAndSources } from "./components/MessageLinksAndSources";
import ChatMessageComponent from "./components/ChatMessage";
import {  ThinkingBox } from "./components/ThinkingBox";
import {  SearchingBadge } from "./components/SearchingBadge";
import {  auth, googleSignIn, logout } from "./services/firebaseAuthService";
import {  onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { 
  loadUserMemories,
  saveUserMemories,
  testConnection,
} from "./services/firebaseDbService";
import {  Link2, ExternalLink, ArrowUpRight } from "lucide-react";

// Predefined Emoji List
const EMOJIS = [
  "😀",
  "😂",
  "😍",
  "🥰",
  "😊",
  "🤔",
  "🙌",
  "👏",
  "🔥",
  "✨",
  "❤️",
  "🇪🇷",
  "🇪🇹",
  "👍",
  "🙏",
  "🎉",
  "🌟",
  "😎",
  "😜",
  "😢",
  "📍",
  "✅",
  "❌",
  "💯",
];

const getFlagEmoji = (code: string) => {
  const flags: Record<string, string> = {
    en: "🇺🇸",
    es: "🇪🇸",
    fr: "🇫🇷",
    zh: "🇨🇳",
    tr: "🇹🇷",
    de: "🇩🇪",
    it: "🇮🇹",
    ru: "🇷🇺",
    ja: "🇯🇵",
    ko: "🇰🇷",
    ar: "🇸🇦",
    ti: "🇪🇷",
    am: "🇪🇹",
    hi: "🇮🇳",
    pt: "🇵🇹",
    gez: "📜",
    tig: "🇪🇷",
    om: "🇪🇹",
    byn: "🇪🇷",
    sgw: "🇪🇹",
    sid: "🇪🇹",
  };
  return flags[code] || "🌐";
};

const WORLD_LANGUAGES = [
  { code: "auto", name: "Auto-Detect" },
  { code: "ti", name: "Tigrinya" },
  { code: "en", name: "English" },
  { code: "am", name: "Amharic" },
  { code: "gez", name: "Ge'ez (Classical Ethiopic)" },
  { code: "tig", name: "Tigre" },
  { code: "om", name: "Oromo (Ethiopic)" },
  { code: "byn", name: "Blin" },
  { code: "sgw", name: "Sebat Bet Gurage" },
  { code: "sid", name: "Sidamo" },
  { code: "ar", name: "Arabic" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "zh", name: "Chinese" },
  { code: "tr", name: "Turkish" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "ru", name: "Russian" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "af", name: "Afrikaans" },
  { code: "sq", name: "Albanian" },
  { code: "hy", name: "Armenian" },
  { code: "az", name: "Azerbaijani" },
  { code: "eu", name: "Basque" },
  { code: "be", name: "Belarusian" },
  { code: "bn", name: "Bengali" },
  { code: "bs", name: "Bosnian" },
  { code: "bg", name: "Bulgarian" },
  { code: "ca", name: "Catalan" },
  { code: "ceb", name: "Cebuano" },
  { code: "ny", name: "Chichewa" },
  { code: "co", name: "Corsican" },
  { code: "hr", name: "Croatian" },
  { code: "cs", name: "Czech" },
  { code: "da", name: "Danish" },
  { code: "nl", name: "Dutch" },
  { code: "eo", name: "Esperanto" },
  { code: "et", name: "Estonian" },
  { code: "tl", name: "Filipino" },
  { code: "fi", name: "Finnish" },
  { code: "fy", name: "Frisian" },
  { code: "gl", name: "Galician" },
  { code: "ka", name: "Georgian" },
  { code: "el", name: "Greek" },
  { code: "gu", name: "Gujarati" },
  { code: "ht", name: "Haitian Creole" },
  { code: "ha", name: "Hausa" },
  { code: "haw", name: "Hawaiian" },
  { code: "iw", name: "Hebrew" },
  { code: "hi", name: "Hindi" },
  { code: "hmn", name: "Hmong" },
  { code: "hu", name: "Hungarian" },
  { code: "is", name: "Icelandic" },
  { code: "ig", name: "Igbo" },
  { code: "id", name: "Indonesian" },
  { code: "ga", name: "Irish" },
  { code: "jw", name: "Javanese" },
  { code: "kn", name: "Kannada" },
  { code: "kk", name: "Kazakh" },
  { code: "km", name: "Khmer" },
  { code: "ku", name: "Kurdish" },
  { code: "ky", name: "Kyrgyz" },
  { code: "lo", name: "Lao" },
  { code: "la", name: "Latin" },
  { code: "lv", name: "Latvian" },
  { code: "lt", name: "Lithuanian" },
  { code: "lb", name: "Luxembourgish" },
  { code: "mk", name: "Macedonian" },
  { code: "mg", name: "Malagasy" },
  { code: "ms", name: "Malay" },
  { code: "ml", name: "Malayalam" },
  { code: "mt", name: "Maltese" },
  { code: "mi", name: "Maori" },
  { code: "mr", name: "Marathi" },
  { code: "mn", name: "Mongolian" },
  { code: "my", name: "Myanmar (Burmese)" },
  { code: "ne", name: "Nepali" },
  { code: "no", name: "Norwegian" },
  { code: "ps", name: "Pashto" },
  { code: "fa", name: "Persian" },
  { code: "pl", name: "Polish" },
  { code: "pt", name: "Portuguese" },
  { code: "pa", name: "Punjabi" },
  { code: "ro", name: "Romanian" },
  { code: "sm", name: "Samoan" },
  { code: "gd", name: "Scots Gaelic" },
  { code: "sr", name: "Serbian" },
  { code: "st", name: "Sesotho" },
  { code: "sn", name: "Shona" },
  { code: "sd", name: "Sindhi" },
  { code: "si", name: "Sinhala" },
  { code: "sk", name: "Slovak" },
  { code: "sl", name: "Slovenian" },
  { code: "so", name: "Somali" },
  { code: "su", name: "Sundanese" },
  { code: "sw", name: "Swahili" },
  { code: "sv", name: "Swedish" },
  { code: "tg", name: "Tajik" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "th", name: "Thai" },
  { code: "uk", name: "Ukrainian" },
  { code: "ur", name: "Urdu" },
  { code: "uz", name: "Uzbek" },
  { code: "vi", name: "Vietnamese" },
  { code: "cy", name: "Welsh" },
  { code: "xh", name: "Xhosa" },
  { code: "yi", name: "Yiddish" },
  { code: "yo", name: "Yoruba" },
  { code: "zu", name: "Zulu" },
];

// Unified UI Translations
const UI_TRANSLATIONS: Record<string, any> = {
  ti: {
    title: "ትግርኛ AI",
    subtitle: "",
    placeholder: "መጽሓፍቲ ይጀምሩ...",
    chatPlaceholder: "ን AI ሕተቶ...",
    welcome: "ከመይ ኣለኹም? እንታይ ክሕግዘኩም?",
    liveTalk: "ቀጥታ ዘረባ",
    layoutEditor: "አሰራርዓ ቁልፍታት",
    settings: "ምድላዋት",
    theme: "ሕብሪ",
    history: "ታሪኽ",
    save: "ዕቅብ",
    reset: "ከም ቀደሙ",
    startEditing: "ምቕያር ጀምር",
    aiProcessing: "AI እናሰርሐ እዩ...",
    ready: "ድሉው",
    listening: "እናሰምዐ እዩ",
    memories: "መዝገብ ዝኽሪ",
    switchLanguage: "ቋንቋ ቀይር",
    conversations: "ዝርርባት",
    newChat: "ሓድሽ ዝርርብ",
    searchHistory: "ታሪኽ ድለ...",
    appearance: "ገጽታ",
    aiPersona: "ናይ AI ማንነት",
    voice: "ድምጺ",
    speed: "ቅልጣፈ",
    microphone: "ማይክሮፎን",
    preferences: "ምርጫታት",
    physicalSync: "ናይ ኮምፒተር ምትእስሳር",
    factoryReset: "ኩሉ ረሲት ግበር",
    memoryVault: "መዝገብ ዝኽሪ",
    memoryActive: "ዝኽሪ ንጡፍ እዩ",
    memoryPaused: "ዝኽሪ ተቋሪጹ እዩ",
    connectProfile: "ተመዝገብ",
    importMemory: "ዝኽሪ ኣምጽእ",
    clear: "ኣጽሪ",
    addDetail: "ሓበሬታ ወስኽ",
    activeContexts: "ንጡፋት ዝኽርታት",
    howMemoryWorks: "ዝኽሪ ከመይ ይሰርሕ፧",
    voicePreview: "ሰላም ከመይ ኣለኹም፧ እዚ ናይ ድምጺ ፈተነ እዩ።",
    neuralActive: "ናይ ቻት ፕሮቶኮል ንጡፍ እዩ",
    assistant: "ረዳቲ",
    you: "ንስኻ",
  },
  am: {
    title: "አማርኛ AI",
    subtitle: "",
    placeholder: "መጻፍ ይጀምሩ...",
    chatPlaceholder: "AIን ይጠይቁ...",
    welcome: "እንዴት ኖት? በምን ልረዳዎት እችላለሁ?",
    liveTalk: "ቀጥታ ንግግር",
    layoutEditor: "የቁልፍ አቀማመጥ",
    settings: "ቅንጅቶች",
    theme: "ጭብጥ",
    history: "ታሪክ",
    save: "አስቀምጥ",
    reset: "ወደ መጀመሪያ",
    startEditing: "ማስተካከል ጀምር",
    aiProcessing: "AI እየሰራ ነው...",
    ready: "ዝግጁ",
    listening: "እየሰማ ነው",
    memories: "የማህደረ ትውስታ ጓዳ",
    switchLanguage: "ቋንቋ ቀይር",
    conversations: "ውይይቶች",
    newChat: "አዲስ ውይይት",
    searchHistory: "ታሪክ ፈልግ...",
    appearance: "ገጽታ",
    aiPersona: "የAI ማንነት",
    voice: "ድምጽ",
    speed: "ፍጥነት",
    microphone: "ማይክሮፎን",
    preferences: "ምርጫዎች",
    physicalSync: "የኮምፒተር ማመሳሰል",
    factoryReset: "ሁሉንም አጥፋ",
    memoryVault: "የማህደረ ትውስታ ጓዳ",
    memoryActive: "ትውስታ ንቁ ነው",
    memoryPaused: "ትውስታ ቆሟል",
    connectProfile: "ተገናኝ",
    importMemory: "ትውስታ አምጣ",
    clear: "አጽዳ",
    addDetail: "መረጃ ጨምር",
    activeContexts: "ንቁ ትውስታዎች",
    howMemoryWorks: "ትውስታ እንዴት ይሰራል?",
    voicePreview: "ጤና ይስጥልኝ እንደምን አላችሁ? ይህ የድምጽ ሙከራ ነው።",
    neuralActive: "የቻት ፕሮቶኮል ንቁ ነው",
    assistant: "ረዳት",
    you: "እርስዎ",
  },
  en: {
    title: "English AI",
    subtitle: "",
    placeholder: "Start typing...",
    chatPlaceholder: "Ask AI...",
    welcome: "How are you? How can I help you?",
    liveTalk: "Live Talk",
    layoutEditor: "Layout Editor",
    settings: "Settings",
    theme: "Theme",
    history: "History",
    save: "Save",
    reset: "Reset",
    startEditing: "Start Editing",
    aiProcessing: "AI Processing...",
    ready: "Ready",
    listening: "Listening",
    memories: "Memory Vault",
    switchLanguage: "Switch Language",
    conversations: "Conversations",
    newChat: "New Chat",
    searchHistory: "Search history...",
    appearance: "Appearance",
    aiPersona: "AI Persona",
    voice: "Voice",
    speed: "Speed",
    microphone: "Microphone",
    preferences: "Preferences",
    physicalSync: "Physical Sync",
    factoryReset: "Factory Reset",
    memoryVault: "Memory Vault",
    memoryActive: "Memory Active",
    memoryPaused: "Memory Paused",
    connectProfile: "Connect Profile",
    importMemory: "Import Memory",
    clear: "Clear",
    addDetail: "Add Detail",
    activeContexts: "Active Contexts",
    howMemoryWorks: "How Memory Works",
    voicePreview: "Hello, how are you? This is a voice test.",
    neuralActive: "Neural Chat Protocol Active",
    assistant: "Assistant",
    you: "You",
  },
};

// Audio Tick Utility for Keyboard Feedback
const playKeySound = () => {
  try {
    const audioCtx = getAudioContext();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = "sine";
    // Slightly higher frequency for a crisp "tick"
    oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);

    gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.0001,
      audioCtx.currentTime + 0.05,
    );

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.05);
  } catch (e) {
    // Fail silently if AudioContext is blocked or not supported
  }
};

const THEMES = {
  system: {
    name: "Neural Cosmic",
    bg: "#000000",
    mesh: ["#1e1b4b", "#2e1065", "#083344"],
    accent: "indigo-500",
    accentBg: "bg-white/5",
    accentText: "text-white",
    accentBorder: "border-white/10",
    isDark: true,
    isSystem: true,
  },
  light: {
    name: "Day Theme",
    bg: "#ffffff",
    mesh: ["#f8fafc", "#f1f5f9", "#e2e8f0"],
    accent: "indigo-600",
    accentBg: "bg-indigo-50",
    accentText: "text-indigo-900",
    accentBorder: "border-slate-200",
    isDark: false,
  },
  dark: {
    name: "Neural Dark",
    bg: "#000000",
    mesh: ["#1e1b4b", "#2e1065", "#083344"],
    accent: "indigo-500",
    accentBg: "bg-white/5",
    accentText: "text-white",
    accentBorder: "border-white/10",
    isDark: true,
  },
  neutral: {
    name: "Nordic Blue",
    bg: "#020617",
    mesh: ["#0f172a", "#1e293b", "#334155"],
    accent: "slate-400",
    accentBg: "bg-slate-800",
    accentText: "text-slate-100",
    accentBorder: "border-slate-700",
    isDark: true,
  },
};

type ThemeKey = keyof typeof THEMES;

const EN_LABELS: Record<string, string> = {
  ሀ: "h",
  ለ: "l",
  ሐ: "H",
  መ: "m",
  ረ: "r",
  ሰ: "s",
  ሸ: "sh",
  ቀ: "q",
  በ: "b",
  ተ: "t",
  ቸ: "c",
  ኘ: "N",
  አ: "a",
  ከ: "k",
  ኸ: "x",
  ወ: "w",
  ዐ: "o",
  ዘ: "z",
  የ: "y",
  ደ: "d",
  ጀ: "j",
  ገ: "g",
  ጠ: "T",
  ጸ: "ts",
  ፈ: "f",
  ጰ: "P",
  ፀ: "S",
  ዠ: "zh",
  ጨ: "c_",
  ቨ: "v",
};

const LATIN_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", "p"],
  ["shift", "z", "x", "c", "v", "b", "n", "m"],
  ["123", "globe", "mic", "asr", "emoji", "space", "backspace", "enter"],
];

const TIGRINYA_ROWS = [
  ["ሀ", "ለ", "ሐ", "መ", "ረ", "ሰ", "ሸ", "ቀ", "በ"],
  ["ተ", "ቸ", "ኘ", "አ", "ከ", "ኸ", "ወ", "ዐ", "ዘ"],
  ["shift", "የ", "ደ", "ጀ", "ገ", "ጠ", "ጸ", "ፈ", "backspace"],
  ["123", "globe", "mic", "asr", "emoji", "space", "enter"],
];

const AMHARIC_ROWS = [
  ["ሀ", "ለ", "ሐ", "መ", "ረ", "ሰ", "ሸ", "ቀ", "በ"],
  ["ተ", "ቸ", "ኘ", "አ", "ከ", "ኸ", "ወ", "ዐ", "ዘ"],
  ["shift", "የ", "ደ", "ጀ", "ገ", "ጠ", "ጸ", "ፈ", "backspace"],
  ["123", "globe", "mic", "asr", "emoji", "space", "enter"],
];

const DEFAULT_ROWS = TIGRINYA_ROWS;

const SYMBOL_ROWS = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  ["-", "/", "(", ")", "$", "&", "@", '"', ".", ","],
  ["shift", "፣", "፤", "።", "፥"],
  ["ABC", "globe", "mic", "asr", "emoji", "space", "backspace", "enter"],
];

const EMOJI_ROWS = [
  ["😀", "😂", "😍", "🥰", "😊", "🤔", "🙌", "👏"],
  ["🔥", "✨", "❤️", "🇪🇷", "🇪🇹", "👍", "🙏", "🎉"],
  ["🌟", "😎", "😜", "😢", "📍", "✅", "❌", "💯"],
  ["ABC", "globe", "mic", "asr", "emoji", "space", "backspace", "enter"],
];

const getSessionTimestamp = (s: any) => {
  if (s.id.startsWith("live-")) {
    const numericPart = s.id.replace("live-", "").split("_")[0];
    const parsed = parseInt(numericPart, 10);
    return isNaN(parsed) ? 0 : parsed;
  } else if (s.id.startsWith("trans-")) {
    return s.timestamp || 0;
  } else {
    if (s.id === "default") return 1; // Base case for the default session
    const parsed = parseInt(s.id, 10);
    return isNaN(parsed) ? 0 : parsed;
  }
};

// Generate stable multi-tiered stardust particle configurations for realistic galactic spiral orbits
const makeGalaxyTier = (
  count: number,
  startMin: number,
  startMax: number,
  endMin: number,
  endMax: number,
  colors: string[],
  speedMin: number,
  speedMax: number,
  baseDelay: number,
) => {
  return Array.from({ length: count }).map((_, i) => {
    // Deterministic angles based on golden ratio distribution to prevent clumping
    const angle = i * (360 / count) + Math.sin(i) * 15;
    const angleRad = (angle * Math.PI) / 180;
    const startDist =
      startMin + Math.abs(Math.sin(i * 3.7)) * (startMax - startMin);
    const endDist = endMin + Math.abs(Math.cos(i * 4.9)) * (endMax - endMin);
    const duration =
      speedMin + Math.abs(Math.sin(i * 2.1)) * (speedMax - speedMin);
    const delay = baseDelay + Math.abs(Math.cos(i * 1.5)) * 2.5;
    const size = 0.8 + Math.abs(Math.sin(i * 5.5)) * 1.6;
    const color = colors[i % colors.length];
    return {
      startX: Math.cos(angleRad) * startDist,
      startY: Math.sin(angleRad) * startDist,
      endX: Math.cos(angleRad) * endDist,
      endY: Math.sin(angleRad) * endDist,
      duration,
      delay,
      size,
      color,
    };
  });
};

const STATIC_STARDUST_GROUPS = [
  // Fast Inner Ring Particles: Electric Teal and Bright Aqua
  makeGalaxyTier(
    14,
    5,
    12,
    35,
    55,
    ["#22d3ee", "#06b6d4", "#e2f8ff"],
    1.5,
    2.4,
    0.1,
  ),
  // Medium Mid Disk Particles: Vibrant Violet and Radiant Magenta
  makeGalaxyTier(
    16,
    10,
    22,
    60,
    90,
    ["#8b5cf6", "#a855f7", "#ec4899", "#d946ef"],
    2.4,
    4.0,
    0.4,
  ),
  // Slow Outer Arm Particles: Soft Rose, Deep Indigo, and Sparkling Gold Stardust
  makeGalaxyTier(
    18,
    18,
    32,
    90,
    135,
    ["#f43f5e", "#6366f1", "#fbbf24", "#ffffff"],
    3.5,
    5.8,
    0.8,
  ),
];

const CosmicThinkingIndicator = ({ isDark }: { isDark: boolean }) => {
  const [stage, setStage] = useState(0);
  const stages = [
    {
      en: "Analyzing conversation context...",
      ti: "ታሪኽ ዘተ ይመረምር ኣሎ...",
      am: "የውይይት ይዘት እየመረመረ ነው...",
    },
    {
      en: "Recalling memories and preferences...",
      ti: "መዘክርን ምርጫታትን ይዝክር ኣሎ...",
      am: "ትዝታዎችንና ምርጫዎችን እያስታወሰ ነው...",
    },
    {
      en: "Formulating a precise response...",
      ti: "ትክክለኛ መልሲ የዳልው ኣሎ...",
      am: "ትክክለኛ ምላሽ እያዘጋጀ ነው...",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStage((prev) => (prev + 1) % stages.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col gap-4 mt-3 p-4 rounded-2xl border border-indigo-500/15 bg-indigo-500/[0.03] dark:bg-indigo-500/[0.02] overflow-hidden max-w-md relative">
      {/* Ambient glowing radial light matching the Cosmic Orb */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
        <motion.div
          animate={{
            scale: [1, 1.25, 0.9, 1.15, 1],
            opacity: [0.12, 0.22, 0.12, 0.28, 0.12],
            background: [
              "radial-gradient(circle, rgba(168,85,247,0.3) 0%, transparent 60%)", // Violet
              "radial-gradient(circle, rgba(34,211,238,0.3) 0%, transparent 60%)", // Cyan
              "radial-gradient(circle, rgba(244,63,94,0.3) 0%, transparent 60%)", // Rose
              "radial-gradient(circle, rgba(79,70,229,0.3) 0%, transparent 60%)", // Indigo
              "radial-gradient(circle, rgba(168,85,247,0.3) 0%, transparent 60%)",
            ],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-10 -left-10 w-40 h-40 rounded-full blur-2xl"
        />
        <motion.div
          animate={{
            scale: [1, 0.85, 1.25, 0.95, 1],
            opacity: [0.08, 0.18, 0.1, 0.22, 0.08],
            background: [
              "radial-gradient(circle, rgba(34,211,238,0.25) 0%, transparent 60%)", // Cyan
              "radial-gradient(circle, rgba(168,85,247,0.25) 0%, transparent 60%)", // Violet
              "radial-gradient(circle, rgba(79,70,229,0.25) 0%, transparent 60%)", // Indigo
              "radial-gradient(circle, rgba(244,63,94,0.25) 0%, transparent 60%)", // Rose
              "radial-gradient(circle, rgba(34,211,238,0.25) 0%, transparent 60%)",
            ],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4,
          }}
          className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-2xl"
        />
      </div>

      <div className="flex items-center gap-4 relative z-10">
        {/* Swirling Cosmic Orb Thinking Graphic */}
        <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
          {/* Swirling Outer Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border border-dashed border-indigo-500/30"
          />

          {/* Glow Pulse Waves */}
          <motion.div
            animate={{
              scale: [1, 1.35, 1],
              opacity: [0.25, 0.08, 0.25],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-8 h-8 rounded-full bg-gradient-to-r from-purple-500/25 via-indigo-500/25 to-cyan-500/25 blur-sm"
          />

          <motion.div
            animate={{
              scale: [0.8, 1.15, 0.8],
              opacity: [0.15, 0.35, 0.15],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
            className="absolute w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500/15 via-pink-500/15 to-purple-500/15 blur-sm"
          />

          {/* Inner Glowing Core */}
          <motion.div
            animate={{
              scale: [0.93, 1.08, 0.93],
              boxShadow: [
                "0 0 6px rgba(168,85,247,0.4)",
                "0 0 12px rgba(34,211,238,0.5)",
                "0 0 6px rgba(168,85,247,0.4)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-5 h-5 rounded-full bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400 z-10"
          />
        </div>

        {/* Dynamic Analyzing Text */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={stage}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex flex-col gap-0.5"
            >
              <p
                className={`text-xs font-black uppercase tracking-wider ${isDark ? "text-indigo-400" : "text-indigo-750"}`}
              >
                {stages[stage].en}
              </p>
              <p className="text-[10px] font-medium text-slate-500 font-ethiopic">
                {stages[stage].ti} • {stages[stage].am}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const getVoiceForModeAndGender = (
  mode: string,
  gender: "female" | "male",
): string => {
  const mapping: Record<string, { female: string; male: string }> = {
    teacher: { female: "Kore", male: "Charon" },
    business: { female: "Kore", male: "Fenrir" },
    creative: { female: "Aoede", male: "Charon" },
    fitness: { female: "Aoede", male: "Puck" },
    linguist: { female: "Kore", male: "Charon" },
    tech: { female: "Kore", male: "Fenrir" },
    wellness: { female: "Aoede", male: "Puck" },
    researcher: { female: "Kore", male: "Charon" },
    langbuddy: { female: "Aoede", male: "Puck" },
    default: { female: "Kore", male: "Charon" },
  };
  return mapping[mode]?.[gender] || "Kore";
};

const YOUTUBE_WIZARD_INSTRUCTIONS = `
// YOUTUBE SCRIPT WIZARD DIRECTIVE:
// By default, act as a normal, intelligent, and helpful AI assistant.
// ONLY activate the "AI Video Director" persona and the 11-stage process if the user explicitly mentions creating a video, starting a YouTube project, or triggers a YouTube-related action.

[DIRECTOR PERSONA - ONLY WHEN TRIGGERED]:
You are the "AI Video Director" for a professional faceless YouTube production suite, and the user is your "Editor". 
Your job is to script, storyboard, and direct a video project from start to finish.
You must guide the user step-by-step through an 11-stage interactive blueprinting process inside the chat.
At every step, you MUST proactively offer tailored suggestions, and the user can freely discuss/adjust details naturally without breaking the process. Always remember the current step and context.
At every step, you MUST use the interactive option format: "[OPTION: Label Text | SelectValue]" so the UI can render clickable option pills.

THE 11 STEPS ARE AS FOLLOWS:
- **Step 1: Video Length**. 
  - First, ask: "What duration should this video be, from 1 to 10 minutes?" Provide options:
    "[OPTION: Shorts/Reels | Length: 1 min]"
    "[OPTION: 3 Minutes | Length: 3 mins]"
    "[OPTION: 5 Minutes | Length: 5 mins]"
    "[OPTION: 10 Minutes | Length: 10 mins]"

- **Step 2: Audience & Goal**. 
  - Ask: "Who is your target audience, and what is your goal for this video?" 
  - Once the user answers, suggest the best audience type: "Is your audience kids, teenagers, students, adults, or all ages?" Provide options:
    "[OPTION: Kids | Audience: Kids]"
    "[OPTION: Teenagers | Audience: Teenagers]"
    "[OPTION: Students | Audience: Students]"
    "[OPTION: Adults | Audience: Adults]"
    "[OPTION: All Ages | Audience: All Ages]"
  - After selection, ask: "Would you like to proceed step-by-step manually, or would you prefer the AI to fully take over based on our past conversation?" Provide options:
    "[OPTION: Manual Step-by-Step Flow | Manual Step-by-Step Flow]"
    "[OPTION: Let AI Take Over (Auto Mode) | Let AI Take Over (Auto Mode)]"
  - IF they choose "Auto Mode", SKIP steps 3-9 and immediately jump to **Step 10: Script Delivery**!
  - IF they choose "Manual Step-by-Step Flow", proceed to Step 3.

- **Step 3: Language**. 
  - Propose languages:
    "[OPTION: English 🇬🇧 | Language: English]"
    "[OPTION: Tigrinya 🇪🇷 | Language: Tigrinya]"
    "[OPTION: Amharic 🇪🇹 | Language: Amharic]"

- **Step 4: Niche Selection**. 
  - Suggest 4 popular niches: Tech & AI, Personal Finance, History & Mystery, Self-Improvement using "[OPTION: Niche: Name | Niche: Name]" pills.

- **Step 5: Viral Concept**. 
  - Propose 3-4 clickable, highly interesting viral topics. Use "[OPTION: Title | Concept: Title]" pills.

- **Step 6: Voiceover Tone**. 
  - Propose 4 voice personalities (e.g., Deep & Serious Cinematic, Energetic YouTuber, Calm & Educational, Professional & Direct) using "[OPTION: Tone Name | Tone: Tone Name]" pills.

- **Step 7: Video Structure / Outline**. 
  - Suggest 4 structural formats (e.g., Hook-Body-CTA, Listicle with 5 points, Myth vs Reality, Cinematic Documentary Storytelling) using "[OPTION: Structure Name | Structure: Structure Name]" pills.

- **Step 8: Visual Style Suggestions**. 
  - Suggest 4 visual styles (e.g., Moody Cinematic B-Roll, Stock Footage & overlays, Dark Minimalist Motion Graphics, Dynamic Kinetic Typography) using "[OPTION: Style Name | Style: Style Name]" pills.

- **Step 9: Final Review**. 
  - Summarize all choices clearly. Provide options:
    "[OPTION: Yes, Generate Script! | Generate Script]"
    "[OPTION: Adjust some details | Adjust details]"

- **Step 10: Script Delivery (The Masterpiece)**.
  - Produce the COMPLETE, fully-finished YouTube video script with Title proposals, Tags, Description, Thumbnail idea, Visual Style, Pacing & Captions, Voiceover script, and Detailed prompts. Append "[SAVE_PROJECT_CARD]".

- **Step 11: Save Project & Complete**.
  - UI displays the inline save card.

Maintain a supportive, expert, director-like persona ONLY when in video mode. Otherwise, remain a helpful global assistant.
`;

const getModeSystemInstruction = (mode: string): string => {
  const instructions: Record<string, string> = {
    teacher:
      "AI MODE - TEACHER: You are a calm, patient, encouraging Teacher and tutor. Break down complex concepts step-by-step, explain ideas clearly, and guide the user's learning journey with supportive and educational feedback.",
    business:
      "AI MODE - BUSINESS ADVISOR: You are a professional, confident, and direct Business Advisor and consultant. Offer strategic advice, professional business planning ideas, and highly accurate and practical financial insights. Deliver responses with clear, actionable takeaways and structured bullet points.",
    creative:
      "AI MODE - CREATIVE WRITER: You are a warm, highly imaginative, and expressive Creative Writer and storyteller. Assist the user with story writing, creative brainstorming, character design, poetry, and crafting beautiful, expressive narratives filled with rich imagery.",
    fitness:
      "AI MODE - FITNESS COACH: You are an energetic, extremely supportive, and upbeat Fitness Coach and personal trainer. Provide motivating fitness plans, workout routines, practical health & nutrition tips, and highly enthusiastic, upbeat guidance to pump up the user and keep them moving!",
    linguist:
      "AI MODE - LINGUIST: You are an expert linguist and translator specializing in Ethiopic languages. Provide accurate, context-aware translations, explain grammatical nuances, and assist with language learning.",
    tech: "AI MODE - TECH ADVISOR: You are a brilliant tech advisor and developer. Offer logical, analytical, and efficient advice on coding, software architecture, and technology trends.",
    wellness:
      "AI MODE - WELLNESS COACH: You are a gentle, empathetic, and calming wellness coach. Focus on mindfulness, stress relief, healthy habits, and emotional balance.",
    researcher:
      "AI MODE - RESEARCHER: You are a curious, objective, and thorough researcher. Synthesize complex information, provide detailed insights, and help the user investigate topics deeply.",
    langbuddy:
      "AI MODE - LANGUAGE BUDDY: You are a friendly, informal, and encouraging conversational partner. Help the user practice their target language in a casual, supportive, and engaging way.",
    youtube_wizard: YOUTUBE_WIZARD_INSTRUCTIONS,
    default:
      "AI MODE - DEFAULT: You are a highly intelligent, helpful, and general-purpose AI assistant (Google Gemini). Provide balanced, neutral, and informative responses without specialized personality constraints. Speak naturally and globally.",
  };
  return instructions[mode] || "";
};

const LiveSpokenText = ({ text, streamerRef, isDark }: { text: string; streamerRef: any; isDark: boolean }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf: number;
    const loop = () => {
      if (streamerRef.current) {
        setProgress(streamerRef.current.getPlaybackProgress());
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [streamerRef]);

  // We split the text into words and spaces to preserve whitespace
  const tokens = useMemo(() => {
    return (text || "").split(/(\s+)/);
  }, [text]);

  const targetIndex = Math.floor(progress * tokens.length);

  return (
    <span className="whitespace-pre-wrap">
      {tokens.map((token, idx) => {
        const isHighlighted = idx <= targetIndex;
        return (
          <span
            key={idx}
            className={`transition-colors duration-150 ${
              isHighlighted
                ? isDark
                  ? "text-white"
                  : "text-slate-900"
                : isDark
                ? "text-white/30"
                : "text-slate-400"
            }`}
          >
            {token}
          </span>
        );
      })}
    </span>
  );
};

function getRotatingSuggestions(lang: string, hour: number): string[] {
  // Morning (5am - 12pm) - Learning & Fresh Mind
  if (hour >= 5 && hour < 12) {
    if (lang === "ti") {
      return [
        "ትግርኛ ከመይ ክምሃር ይኽእል፧",
        "ናይ ሎሚ መዓልቲ ምስላ ትግርኛ",
        "ብኸመይ ፊደላት ግዕዝ ክጽሕፍ ይኽእል፧",
        "መዝገበ ቃላት ትግርኛ ኣርእየኒ"
      ];
    } else if (lang === "am") {
      return [
        "ትግርኛ እንዴት መማር እችላለሁ፧",
        "የዛሬው የትግርኛ ምሳሌያዊ አነጋገር",
        "በግዕዝ ፊደላት እንዴት መጻፍ እችላለሁ፧",
        "የዕለቱ የትግርኛ ቃላት መዝገብ"
      ];
    } else {
      return [
        "How can I learn Tigrinya?",
        "Tigrinya proverb of the day",
        "How to type in Ge'ez script?",
        "Show me Tigrinya vocabulary"
      ];
    }
  }
  // Afternoon (12pm - 6pm) - Practical Voice, TTS & Translation
  else if (hour >= 12 && hour < 18) {
    if (lang === "ti") {
      return [
        "እንግሊዝኛ ናብ ትግርኛ ተርጉመለይ",
        "ብድምጺ ከመይ ገይረ ክጽሕፍ ይኽእል፧",
        "ብሉጽ ናይ ድምጺ ስቱድዮ (TTS) ኣበይ ይረኽቦ፧",
        "ሰዋስው ትግርኛ ከመይ ይዓይይ፧"
      ];
    } else if (lang === "am") {
      return [
        "እንግሊዝኛ ወደ ትግርኛ ተርጉምልኝ",
        "በድምፅ እንዴት መጻፍ እችላለሁ፧",
        "ምርጥ የድምፅ ስቱድዮ (TTS) የት ነው ያለው፧",
        "የትግርኛ ሰዋስው እንዴት ይሰራል፧"
      ];
    } else {
      return [
        "Translate English to Tigrinya",
        "How can I use voice input/dictation?",
        "Where is the professional TTS Studio?",
        "How does Tigrinya grammar work?"
      ];
    }
  }
  // Evening / Night (6pm - 5am) - Creative, Stories & Memory
  else {
    if (lang === "ti") {
      return [
        "ሓጺር ናይ ምሸት ዛንታ ወይ ግጥሚ ጸሓፈለይ።",
        "ትግርኛ ምስላታት ምስ ትርጉሞም ኣብርሃለይ",
        "ናይ ውልቀይ ዝኽሪ ባንኪ (Memory Bank) እንታይ እዩ፧",
        "መጻሕፍቲ ብትግርኛ ንምንባብ ሓግዘኒ"
      ];
    } else if (lang === "am") {
      return [
        "አጭር የምሽት ታሪክ ወይም ግጥም ጻፍልኝ።",
        "የትግርኛ ምሳሌዎችን ከትርጉማቸው ጋር አብራራልኝ",
        "የግል መረጃ ባንክ (Memory Bank) ምንድን ነው፧",
        "በትግርኛ መጽሐፍትን ለማንበብ እርዳኝ"
      ];
    } else {
      return [
        "Write a short evening story or poem.",
        "Explain Tigrinya proverbs and meanings",
        "How does the local Memory Bank work?",
        "Help me read books in Tigrinya"
      ];
    }
  }
}

function getTimeBasedGreetingAndStatus(lang: string, statusText: string): string {
  const hour = new Date().getHours();
  if (lang === "ti") {
    if (hour >= 5 && hour < 12) {
      return `ከመይ ሓዲርኩም፧ ${statusText}`;
    } else if (hour >= 12 && hour < 18) {
      return `ከመይ ውዒልኩም፧ ${statusText}`;
    } else {
      return `ከመይ ኣምሲኹም፧ ${statusText}`;
    }
  } else if (lang === "am") {
    if (hour >= 5 && hour < 12) {
      return `እንደምን አደራችሁ፧ ${statusText}`;
    } else if (hour >= 12 && hour < 18) {
      return `እንደምን ዋላችሁ፧ ${statusText}`;
    } else {
      return `እንደምን አመሻችሁ፧ ${statusText}`;
    }
  } else {
    if (hour >= 5 && hour < 12) {
      return `Good morning, ${statusText}`;
    } else if (hour >= 12 && hour < 18) {
      return `Good afternoon, ${statusText}`;
    } else {
      return `Good evening, ${statusText}`;
    }
  }
}

export default function App() {
  const localTime = useLocalTime();
  const [text, setText] = useState("");
  const [isShift, setIsShift] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState<string>("ti");
  const [isSymbols, setIsSymbols] = useState(false);
  const [isEmojiMode, setIsEmojiMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showMicPermissionModal, setShowMicPermissionModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingPage, setOnboardingPage] = useState(0);
  const [onboardingSteps, setOnboardingSteps] = useState({
    enabled: false,
    selected: false,
    typed: false,
  });
  const [themeKey, setThemeKey] = useState<ThemeKey>(() => {
    return (
      (localStorage.getItem("geez_keyboard_theme") as ThemeKey) || "system"
    );
  });

  const [systemIsDark, setSystemIsDark] = useState(() => {
    return (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    localStorage.setItem("geez_keyboard_theme", themeKey);
  }, [themeKey]);

  const [keyboardStyle, setKeyboardStyle] = useState<
    "neon-glow" | "minimalist" | "high-contrast"
  >(() => {
    return (
      (localStorage.getItem("geez_keyboard_style") as
        "neon-glow" | "minimalist" | "high-contrast") || "minimalist"
    );
  });
  const [isThemeScheduled, setIsThemeScheduled] = useState<boolean>(() => {
    return localStorage.getItem("is_theme_scheduled") === "true";
  });

  const [isScheduledDark, setIsScheduledDark] = useState<boolean>(() => {
    const hour = new Date().getHours();
    return hour < 7 || hour > 19;
  });

  useEffect(() => {
    if (!isThemeScheduled) return;
    const interval = setInterval(() => {
      const hour = new Date().getHours();
      setIsScheduledDark(hour < 7 || hour > 19);
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [isThemeScheduled]);

  useEffect(() => {
    localStorage.setItem("is_theme_scheduled", String(isThemeScheduled));
    localStorage.setItem("geez_keyboard_style", keyboardStyle);
  }, [isThemeScheduled, keyboardStyle]);
  const [listeningTarget, setListeningTarget] = useState<"main" | "chat">(
    "main",
  );
  const listeningTargetRef = useRef<"main" | "chat">("main");
  const [pastLiveSessions, setPastLiveSessions] = useState<
    {
      id: string;
      timestamp: string;
      transcript: ChatMessage[];
      summary?: string;
      title?: string;
    }[]
  >(() => {
    const saved = localStorage.getItem("past_live_sessions");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(
      "past_live_sessions",
      JSON.stringify(pastLiveSessions),
    );
  }, [pastLiveSessions]);
  const [chatSessions, setChatSessions] = useState<
    { id: string; title: string; messages: ChatMessage[] }[]
  >(() => {
    try {
      const saved = localStorage.getItem("chat_sessions");
      return saved
        ? JSON.parse(saved)
        : [{ id: "default", title: "New Chat", messages: [] }];
    } catch (e) {
      return [{ id: "default", title: "New Chat", messages: [] }];
    }
  });

  const [translationHistory, setTranslationHistory] = useState<
    {
      id: string;
      sourceText: string;
      translatedText: string;
      sourceLang: string;
      targetLang: string;
      timestamp: number;
    }[]
  >(() => {
    try {
      const saved = localStorage.getItem("translation_history");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(
      "translation_history",
      JSON.stringify(translationHistory),
    );
  }, [translationHistory]);
  const [activeSessionId, setActiveSessionId] = useState<string>("default");
  const activeSessionIdRef = useRef<string>("default");
  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  const [chatInput, setChatInput] = useState("");
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const [chatCursorIndex, setChatCursorIndex] = useState(0);
  const [keyboardTarget, setKeyboardTarget] = useState<"main" | "chat">("chat");
  const [voice, setVoice] = useState("en-US-Standard-A");
  const [speechRate, setSpeechRate] = useState(1);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [customLogo, setCustomLogo] = useState<string | null>(() =>
    localStorage.getItem("app_custom_logo"),
  );

  useEffect(() => {
    if (customLogo) localStorage.setItem("app_custom_logo", customLogo);
  }, [customLogo]);

  // AI Agent Mode
  const [isAIAgentMode, setIsAIAgentMode] = useState(false);
  const [activeAgentAction, setActiveAgentAction] = useState<string | null>(null);

  // Faceless YT Creator wizard & project panel state
  const [isYTCreatorMode, setIsYTCreatorMode] = useState(false);
  const [ytActiveScriptData, setYtActiveScriptData] = useState<any>(null);
  const [showYTProjectPanel, setShowYTProjectPanel] = useState(false);
  const [ytInitialContext, setYtInitialContext] = useState("");
  const [chatProjectNames, setChatProjectNames] = useState<
    Record<number, string>
  >({});
  const [chatSavedProjects, setChatSavedProjects] = useState<
    Record<number, boolean>
  >({});
  const [activeProject, setActiveProject] = useState<any>(null);

  // Target-aware setters and getters
  const isMainTarget = keyboardTarget === "main";
  const getTargetText = () => (isMainTarget ? text : chatInput);
  const getTargetIndex = () => (isMainTarget ? cursorIndex : chatCursorIndex);

  const updateTargetText = (newVal: string | ((prev: string) => string)) => {
    if (isMainTarget) setText(newVal);
    else setChatInput(newVal);
  };

  const updateTargetIndex = (newVal: number | ((prev: number) => number)) => {
    if (isMainTarget) setCursorIndex(newVal);
    else setChatCursorIndex(newVal);
  };

  useEffect(() => {
    localStorage.setItem("chat_sessions", JSON.stringify(chatSessions));
  }, [chatSessions]);

  const activeSessionChat = chatSessions.find((s) => s.id === activeSessionId);
  const activeSessionLive = activeSessionId.startsWith("live-")
    ? pastLiveSessions.find(
        (s) => s.id === activeSessionId.replace("live-", ""),
      )
    : null;
  const activeSession =
    activeSessionChat ||
    (activeSessionLive
      ? {
          id: activeSessionId,
          title:
            activeSessionLive.title ||
            (activeSessionLive.summary
              ? `Voice: ${activeSessionLive.summary.slice(0, 30)}...`
              : "Voice Session"),
          messages: activeSessionLive.transcript,
        }
      : chatSessions[0]);
  const chatMessages = activeSession.messages;

  const setChatMessages = (updater: (prev: ChatMessage[]) => ChatMessage[]) => {
    const curId = activeSessionIdRef.current;
    if (curId.startsWith("live-")) {
      const liveId = curId.replace("live-", "");
      setPastLiveSessions((prev) =>
        prev.map((s) =>
          s.id === liveId
            ? { ...s, transcript: updater(s.transcript || []) }
            : s,
        ),
      );
      return;
    }
    setChatSessions((prev) =>
      prev.map((s) =>
        s.id === curId ? { ...s, messages: updater(s.messages) } : s,
      ),
    );
  };

  // Sync YouTube script wizard context with latest chat messages in real-time
  useEffect(() => {
    if (isYTCreatorMode && chatMessages.length > 0) {
      const lastMsg = chatMessages[chatMessages.length - 1];
      if (lastMsg && lastMsg.parts && lastMsg.role === "model") {
        setYtInitialContext(lastMsg.parts);
      }
    }
  }, [chatMessages, isYTCreatorMode]);

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingSessionTitle, setEditingSessionTitle] = useState("");

  const saveSessionRename = (
    id: string,
    type: "chat" | "live" | "translation",
  ) => {
    const trimmedTitle = editingSessionTitle.trim();
    if (!trimmedTitle) return;

    if (type === "chat") {
      setChatSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, title: trimmedTitle } : s)),
      );
      showToast("Chat renamed successfully");
    } else if (type === "live") {
      const rawId = id.replace("live-", "");
      setPastLiveSessions((prev) =>
        prev.map((s) => (s.id === rawId ? { ...s, title: trimmedTitle } : s)),
      );
      showToast("Voice session renamed successfully");
    }
    setEditingSessionId(null);
  };

  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [showChatSearch, setShowChatSearch] = useState(false);

  const [historyFilter, setHistoryFilter] = useState<
    "all" | "chat" | "live"
  >("all");
  const [historySearch, setHistorySearch] = useState("");
  const [historyDateRange, setHistoryDateRange] = useState<
    "all" | "today" | "week" | "month"
  >("all");

  const combinedHistory = useMemo(() => {
    const chats = chatSessions.map((s) => ({ ...s, type: "chat" as const }));
    const lives = pastLiveSessions.map((s) => ({
      id: `live-${s.id}`,
      title:
        s.title ||
        (s.summary
          ? `Voice: ${s.summary.slice(0, 30)}...`
          : `Voice: ${s.timestamp}`),
      messages: s.transcript || [],
      type: "live" as const,
      timestampStr: s.timestamp,
    }));

    let items = [...chats, ...lives];

    // Filter by type
    if (historyFilter !== "all") {
      items = items.filter((s) => s.type === historyFilter);
    }

    // Filter by search query (keyword or title)
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase();
      items = items.filter((s) => {
        const matchesTitle = s.title.toLowerCase().includes(q);
        const matchesMessages = s.messages.some(
          (m) =>
            m.parts &&
            typeof m.parts === "string" &&
            m.parts.toLowerCase().includes(q),
        );
        return matchesTitle || matchesMessages;
      });
    }

    // Filter by date range
    if (historyDateRange !== "all") {
      const now = new Date();
      items = items.filter((s) => {
        let timestampNum = 0;
        if (s.id.startsWith("live-")) {
          const numericPart = s.id.replace("live-", "").split("_")[0];
          timestampNum = parseInt(numericPart, 10);
        } else {
          if (s.id === "default") return true;
          timestampNum = parseInt(s.id, 10);
        }

        if (isNaN(timestampNum) || timestampNum <= 0) return true;
        const itemDate = new Date(timestampNum);
        const diffMs = now.getTime() - itemDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (historyDateRange === "today") {
          return diffDays <= 1;
        } else if (historyDateRange === "week") {
          return diffDays <= 7;
        } else if (historyDateRange === "month") {
          return diffDays <= 30;
        }
        return true;
      });
    }

    return items;
  }, [
    chatSessions,
    pastLiveSessions,
    historyFilter,
    historySearch,
    historyDateRange,
  ]);

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportSessionTarget, setExportSessionTarget] = useState<string>("active");

  const handleExportTranscript = (targetId: string, format: "markdown" | "pdf") => {
    let sessionToExport: { id: string; title: string; messages: ChatMessage[] } | null = null;

    if (targetId === "all") {
      let compiledText = `# Full Session History Transcript Archive\n\n`;
      compiledText += `**Export Date:** ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
      compiledText += `**Total Chat Sessions:** ${chatSessions.length}\n`;
      compiledText += `**Total Voice Sessions:** ${pastLiveSessions.length}\n\n---\n\n`;

      chatSessions.forEach((cs) => {
        compiledText += `## 💬 Chat Session: ${cs.title}\n\n`;
        if (!cs.messages || cs.messages.length === 0) {
          compiledText += `*No messages in this chat session.*\n\n`;
        } else {
          cs.messages.forEach((m) => {
            const role = m.role === "user" ? "👤 User" : "🤖 AI Assistant";
            const contentStr = typeof m.parts === "string" ? m.parts : JSON.stringify(m.parts);
            compiledText += `### ${role}\n\n${contentStr}\n\n`;
          });
        }
        compiledText += `---\n\n`;
      });

      pastLiveSessions.forEach((ls) => {
        const title = ls.title || ls.summary || `Voice Session (${ls.timestamp})`;
        compiledText += `## 🎙️ Voice Session: ${title}\n\n`;
        if (!ls.transcript || ls.transcript.length === 0) {
          compiledText += `*No voice transcripts recorded.*\n\n`;
        } else {
          ls.transcript.forEach((m) => {
            const role = m.role === "user" ? "👤 User" : "🤖 AI Assistant";
            const contentStr = typeof m.parts === "string" ? m.parts : JSON.stringify(m.parts);
            compiledText += `### ${role}\n\n${contentStr}\n\n`;
          });
        }
        compiledText += `---\n\n`;
      });

      if (format === "markdown") {
        const blob = new Blob([compiledText], { type: "text/markdown;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `full_transcript_archive_${Date.now()}.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast("Full history exported as Markdown (.md)");
      } else {
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
          showToast("Pop-up blocked. Please allow pop-ups.");
          return;
        }
        const formattedHtml = compiledText
          .replace(/# (.*)/g, '<h1 style="font-size:24px; font-weight:800; border-bottom:2px solid #cbd5e1; padding-bottom:8px;">$1</h1>')
          .replace(/## (.*)/g, '<h2 style="font-size:18px; font-weight:700; color:#4f46e5; margin-top:24px;">$1</h2>')
          .replace(/### (.*)/g, '<h3 style="font-size:14px; font-weight:700; color:#1e293b; margin-top:12px;">$1</h3>')
          .replace(/\n/g, "<br/>");

        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Full Session History Transcript Archive</title>
              <meta charset="utf-8" />
              <style>
                body { font-family: system-ui, -apple-system, sans-serif; padding: 32px; color: #0f172a; max-width: 800px; margin: 0 auto; line-height: 1.6; }
                @media print { body { padding: 0; } }
              </style>
            </head>
            <body>
              ${formattedHtml}
              <script>window.onload = function() { window.print(); };</script>
            </body>
          </html>
        `);
        printWindow.document.close();
        showToast("PDF Print window opened.");
      }
      setShowExportModal(false);
      return;
    }

    if (targetId === "active") {
      sessionToExport = activeSessionChat || {
        id: activeSessionId,
        title: "Current Active Session",
        messages: chatMessages,
      };
    } else if (targetId.startsWith("live-")) {
      const rawId = targetId.replace("live-", "");
      const liveItem = pastLiveSessions.find((ls) => ls.id === rawId);
      if (liveItem) {
        sessionToExport = {
          id: targetId,
          title: liveItem.title || liveItem.summary || "Voice Session",
          messages: liveItem.transcript || [],
        };
      }
    } else {
      const chatItem = chatSessions.find((cs) => cs.id === targetId);
      if (chatItem) {
        sessionToExport = chatItem;
      }
    }

    if (!sessionToExport) {
      sessionToExport = {
        id: activeSessionId,
        title: "Current Active Session",
        messages: chatMessages,
      };
    }

    const title = sessionToExport.title || "Session Transcript";
    const msgs = sessionToExport.messages || [];

    if (format === "markdown") {
      let md = `# Transcript: ${title}\n\n`;
      md += `**Date:** ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
      md += `**Total Messages:** ${msgs.length}\n\n---\n\n`;

      if (msgs.length === 0) {
        md += `*No messages recorded in this session.*\n`;
      } else {
        msgs.forEach((m) => {
          const role = m.role === "user" ? "👤 User" : "🤖 AI Assistant";
          const body = typeof m.parts === "string" ? m.parts : JSON.stringify(m.parts);
          md += `### ${role}\n\n${body}\n\n---\n\n`;
        });
      }

      const blob = new Blob([md], { type: "text/markdown;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safeName = title.replace(/[^a-zA-Z0-9_\-]/g, "_").toLowerCase();
      link.download = `${safeName}_transcript.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(`Exported "${title}" as Markdown (.md)`);
    } else if (format === "pdf") {
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        showToast("Pop-up blocked. Please allow pop-ups to print PDF.");
        return;
      }

      const messagesHtml = msgs.map((m) => {
        const isUser = m.role === "user";
        const body = typeof m.parts === "string" ? m.parts : JSON.stringify(m.parts);
        const formattedBody = body.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");

        return `
          <div style="margin-bottom: 20px; padding: 16px; border-radius: 12px; background: ${isUser ? '#f1f5f9' : '#eef2ff'}; border-left: 4px solid ${isUser ? '#64748b' : '#6366f1'};">
            <div style="font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: ${isUser ? '#475569' : '#4f46e5'}; margin-bottom: 8px;">
              ${isUser ? '👤 User' : '🤖 AI Assistant'}
            </div>
            <div style="font-size: 14px; line-height: 1.6; color: #1e293b; font-family: system-ui, sans-serif;">
              ${formattedBody}
            </div>
          </div>
        `;
      }).join("");

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title} - Transcript</title>
            <meta charset="utf-8" />
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #0f172a; max-width: 800px; margin: 0 auto; }
              h1 { font-size: 24px; font-weight: 900; margin-bottom: 4px; color: #0f172a; }
              .meta { font-size: 12px; color: #64748b; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 2px solid #e2e8f0; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>
            <h1>${title}</h1>
            <div class="meta">Exported on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()} • Total Messages: ${msgs.length}</div>
            <div>${messagesHtml || '<em>No messages recorded in this session.</em>'}</div>
            <script>
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      showToast("PDF Print window opened.");
    }

    setShowExportModal(false);
  };

  const [interimTranscript, setInterimTranscript] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingStartTime, setThinkingStartTime] = useState<number | null>(
    null,
  );
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState("");
  const [displayedStreamingResponse, setDisplayedStreamingResponse] =
    useState("");

  // Typewriter effect layer
  useEffect(() => {
    if (!streamingResponse) {
      setDisplayedStreamingResponse("");
      return;
    }

    const diff = streamingResponse.length - displayedStreamingResponse.length;
    if (diff > 0) {
      // If we are lagging far behind (e.g., large chunk arrived), type faster by taking larger chunks
      const charsToAdd = Math.max(1, Math.ceil(diff / 8));

      const timeoutId = setTimeout(() => {
        setDisplayedStreamingResponse(
          streamingResponse.slice(
            0,
            displayedStreamingResponse.length + charsToAdd,
          ),
        );
      }, 15); // Real-time typewriter speed

      return () => clearTimeout(timeoutId);
    }
  }, [streamingResponse, displayedStreamingResponse]);
  const [streamingThought, setStreamingThought] = useState("");
  const [streamingSources, setStreamingSources] = useState<
    { title: string; uri: string }[]
  >([]);
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(
    null,
  );
  const [playingChatTtsIndex, setPlayingChatTtsIndex] = useState<number | null>(
    null,
  );
  const [editMessageInput, setEditMessageInput] = useState("");
  const [isGeneratingTTS, setIsGeneratingTTS] = useState(false);
  const [audioData, setAudioData] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatIsMaximized, setChatIsMaximized] = useState(false);
  const [showChatKeyboard, setShowChatKeyboard] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const [chatLanguage, setChatLanguage] = useState(
    () => localStorage.getItem("chat_language") || "auto",
  );
  const [chatTone, setChatTone] = useState<
    "Casual" | "Friendly" | "Professional" | "Poetic" | "Urgent" | "Formal"
  >("Friendly");
  const [aiModelMode, setAiModelMode] = useState<
    "general" | "lite" | "thinking" | "search" | "maps"
  >(() => (localStorage.getItem("ai_model_mode") as any) || "general");

  useEffect(() => {
    localStorage.setItem("ai_model_mode", aiModelMode);
  }, [aiModelMode]);
  const [chatSuggestions, setChatSuggestions] = useState<string[]>([]);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [userDictionary, setUserDictionary] = useState<
    Record<string, string[]>
  >(() => JSON.parse(localStorage.getItem("user_dictionary") || "{}"));

  const learnWord = (word: string, phrase: string) => {
    setUserDictionary((prev) => {
      const newDict = { ...prev };
      if (!newDict[word]) newDict[word] = [];
      if (!newDict[word].includes(phrase)) newDict[word].push(phrase);
      localStorage.setItem("user_dictionary", JSON.stringify(newDict));
      return newDict;
    });
  };

  // Debounced context-aware suggestion generation
  useEffect(() => {
    if (chatInput.length < 5 || quotaExceeded) {
      setChatSuggestions([]);
      return;
    }
    const handler = setTimeout(() => {
      generateSuggestions(chatMessages, chatLanguage, chatInput, chatTone)
        .then((s) => setChatSuggestions(s))
        .catch((err) => {
          if (err.message === "QUOTA_EXCEEDED") {
            setQuotaExceeded(true);
          }
        });
    }, 3000);
    return () => clearTimeout(handler);
  }, [chatInput, chatMessages, chatLanguage, chatTone, quotaExceeded]);

  // Automatically reset quota exceeded after 60 seconds
  useEffect(() => {
    if (quotaExceeded) {
      const timer = setTimeout(() => setQuotaExceeded(false), 60000);
      return () => clearTimeout(timer);
    }
  }, [quotaExceeded]);

  const [showGroundingPanel, setShowGroundingPanel] = useState(false);
  const [speakerALabel, setSpeakerALabel] = useState(
    () => localStorage.getItem("speaker_a_label") || "Speaker A",
  );
  const [speakerBLabel, setSpeakerBLabel] = useState(
    () => localStorage.getItem("speaker_b_label") || "Speaker B",
  );
  const [useSpeakerLabels, setUseSpeakerLabels] = useState(() => {
    const saved = localStorage.getItem("use_speaker_labels");
    return saved === null ? true : saved === "true";
  });

  useEffect(() => {
    localStorage.setItem("speaker_a_label", speakerALabel);
    localStorage.setItem("speaker_b_label", speakerBLabel);
    localStorage.setItem("use_speaker_labels", String(useSpeakerLabels));
  }, [speakerALabel, speakerBLabel, useSpeakerLabels]);

  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isSessionTimedOut, setIsSessionTimedOut] = useState(false);
  const [sessionTimeoutReason, setSessionTimeoutReason] = useState("");
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [liveResponseTranscript, setLiveResponseTranscript] = useState("");
  const liveTranscriptRef = useRef("");
  const liveResponseTranscriptRef = useRef("");
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [liveTalkState, setLiveTalkState] = useState<
    | "connecting"
    | "listening"
    | "thinking"
    | "speaking"
    | "paused"
    | "searching"
  >("connecting");
  const [isLivePaused, setIsLivePaused] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const isMicMutedRef = useRef(false);
  const [lastWasInterrupted, setLastWasInterrupted] = useState(false);
  const [liveSessionHistory, setLiveSessionHistory] = useState<
    { role: "user" | "model"; parts: string }[]
  >([]);
  const liveSessionHistoryRef = useRef<
    { role: "user" | "model"; parts: string }[]
  >([]);
  const [showPastLiveSessionsDrawer, setShowPastLiveSessionsDrawer] =
    useState(false);
  const liveRecorderRef = useRef<AudioRecorder | null>(null);
  const liveStreamerRef = useRef<AudioStreamer | null>(null);
  const liveSessionRef = useRef<any>(null);
  const isLivePausedRef = useRef(false);
  const liveSubtitleEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [liveTextPrompt, setLiveTextPrompt] = useState("");
  const [showLiveKeyboardInput, setShowLiveKeyboardInput] = useState(false);

  // Auto-scroll inside Gemini Live subtitles
  useEffect(() => {
    if (isLiveMode) {
      const timer = setTimeout(() => {
        liveSubtitleEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [liveSessionHistory, liveTranscript, liveResponseTranscript, isLiveMode]);

  // Auto-vision capture loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCameraActive && liveSessionRef.current && !isLivePaused) {
      interval = setInterval(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas && video.readyState >= 2) {
          try {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const base64 = canvas.toDataURL("image/jpeg", 0.6).split(",")[1];
              liveSessionRef.current.sendImage(base64);
              console.log(
                "Real-time vision stream frame synchronized to Gemini Live API",
              );
            }
          } catch (err) {
            console.error("Auto-vision frame capture failed:", err);
          }
        }
      }, 1500); // Send frame every 1.5 seconds (responsive, under the 1 FPS limit)
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCameraActive, isLivePaused]);

  // Dynamic visual viewport scale on mobile to prevent native keyboard obscuring input
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;

    const handleResize = () => {
      setViewportHeight(window.visualViewport.height);
    };

    window.visualViewport.addEventListener("resize", handleResize);

    // Set initial layout height
    setViewportHeight(window.visualViewport.height);

    return () => {
      window.visualViewport?.removeEventListener("resize", handleResize);
    };
  }, []);

  const [panelSources, setPanelSources] = useState<
    { title: string; uri: string }[]
  >([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scaling logic for chat input textarea
  useLayoutEffect(() => {
    const handleResize = () => {
      const textarea = chatInputRef.current;
      if (textarea) {
        textarea.style.height = "auto";
        const maxHeight = window.innerWidth < 640 ? 180 : 400;
        const newHeight = Math.min(textarea.scrollHeight, maxHeight);
        textarea.style.height = `${newHeight}px`;

        // Ensure the chat container scrolls with the input growth if focused
        if (isInputFocused && chatContainerRef.current) {
          chatContainerRef.current.scrollTop =
            chatContainerRef.current.scrollHeight;
        }
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [chatInput, isInputFocused]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<any>(null);

  const [masterScale, setMasterScale] = useState<number>(() => {
    const saved = localStorage.getItem("master_scale");
    return saved ? parseFloat(saved) : 1.0;
  });
  const [lastSnap, setLastSnap] = useState<number>(1.0);

  // Translation Helper
  const t = useCallback(
    (key: string) => {
      const lang =
        activeLanguage === "en" ||
        activeLanguage === "ti" ||
        activeLanguage === "am"
          ? activeLanguage
          : "ti";
      return UI_TRANSLATIONS[lang]?.[key] || UI_TRANSLATIONS.en[key] || key;
    },
    [activeLanguage],
  );
  const [themeTransparency, setThemeTransparency] = useState<number>(() => {
    const saved = localStorage.getItem("theme_transparency");
    return saved ? parseInt(saved) : 80;
  });

  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPasteTranslationPrompt, setShowPasteTranslationPrompt] = useState<{
    text: string;
    startIndex: number;
    endIndex: number;
  } | null>(null);
  const [isInputHighlighted, setIsInputHighlighted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [layout, setLayout] = useState<string[][]>(DEFAULT_ROWS);
  const [selectedKey, setSelectedKey] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [selectedPastSession, setSelectedPastSession] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isToneAdjusting, setIsToneAdjusting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isHighlightMode, setIsHighlightMode] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageAspectRatio, setImageAspectRatio] = useState("1:1");

  const cycleLanguage = useCallback(() => {
    const langs = ["ti", "am", "en"];
    const currentIndex = langs.indexOf(activeLanguage);
    const nextIndex = (currentIndex + 1) % langs.length;
    const nextCode = langs[nextIndex];

    setActiveLanguage(nextCode);
    setChatLanguage(nextCode);

    if (!isSymbols) {
      if (nextCode === "en") setLayout(LATIN_ROWS);
      else if (nextCode === "am") setLayout(AMHARIC_ROWS);
      else setLayout(TIGRINYA_ROWS);
    }

    const langNames: Record<string, string> = {
      en: "English",
      ti: "ትግርኛ (Tigrinya)",
      am: "አማርኛ (Amharic)",
    };
    showToast(`Language: ${langNames[nextCode] || nextCode}`);
  }, [activeLanguage, isSymbols]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 2000);
  };
  const [activeMenus, setActiveMenus] = useState({
    theme: false,
    emoji: false,
    tone: false,
    translationBar: false,
    format: false,
    shortcuts: false,
    clipboard: false,
    export: false,
    region: false,
    history: false,
    chatTone: false,
    layoutEditor: false,
    settings: false,
    chatOptions: false,
  });

  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);
  const [selectedTone, setSelectedTone] = useState<string | null>(null);

  const [proactiveSuggestionsEnabled, setProactiveSuggestionsEnabled] =
    useState<boolean>(() => {
      return localStorage.getItem("proactive_suggestions") === "true";
    });

  const [habitTrackingEnabled, setHabitTrackingEnabled] = useState<boolean>(
    () => {
      return localStorage.getItem("habit_tracking") === "true";
    },
  );

  useEffect(() => {
    localStorage.setItem(
      "proactive_suggestions",
      String(proactiveSuggestionsEnabled),
    );
  }, [proactiveSuggestionsEnabled]);

  useEffect(() => {
    localStorage.setItem("habit_tracking", String(habitTrackingEnabled));
  }, [habitTrackingEnabled]);

  // AI Real-Time Memory Vault states & handlers
  const [customSystemInstructions, setCustomSystemInstructions] =
    useState<string>(() => {
      try {
        return localStorage.getItem("custom_system_instructions") || "";
      } catch {
        return "";
      }
    });

  const handleSaveCustomSystemInstructions = (instructions: string) => {
    setCustomSystemInstructions(instructions);
    try {
      localStorage.setItem("custom_system_instructions", instructions);
    } catch (err) {
      console.error(err);
    }
  };

  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    testConnection();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Load memories from Firestore
        try {
          const dbData = await loadUserMemories(user.uid);
          if (dbData) {
            setMemories(dbData.memories);
            setIsMemoryEnabled(dbData.isEnabled);
            localStorage.setItem(
              "gemini_memories",
              JSON.stringify(dbData.memories),
            );
            localStorage.setItem(
              "gemini_memory_enabled",
              String(dbData.isEnabled),
            );
          } else {
            // If no document exists in Firestore, migrate local memories to cloud securely!
            const localMemories = JSON.parse(
              localStorage.getItem("gemini_memories") || "[]",
            );
            const localEnabled =
              localStorage.getItem("gemini_memory_enabled") !== "false";
            await saveUserMemories(user.uid, localMemories, localEnabled);
          }
        } catch (e) {
          console.error("[AuthSync] Error syncing memories with Firestore:", e);
        }
      } else {
        // If logged out, load from local storage
        try {
          const localMemories = JSON.parse(
            localStorage.getItem("gemini_memories") || "[]",
          );
          const localEnabled =
            localStorage.getItem("gemini_memory_enabled") !== "false";
          setMemories(localMemories);
          setIsMemoryEnabled(localEnabled);
        } catch {}
      }
    });
    return () => unsubscribe();
  }, []);

  const [memories, setMemories] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("gemini_memories") || "[]");
    } catch {
      return [];
    }
  });
  const [isMemoryDrawerOpen, setIsMemoryDrawerOpen] = useState(false);
  const [isLiveVoiceDrawerOpen, setIsLiveVoiceDrawerOpen] = useState(false);

  // AI Personas and Modes States
  const [activeAiMode, setActiveAiMode] = useState<string>(() => {
    try {
      return localStorage.getItem("active_ai_mode") || "default";
    } catch {
      return "default";
    }
  });
  const [activeVoiceGender, setActiveVoiceGender] = useState<"female" | "male">(
    () => {
      try {
        return (
          (localStorage.getItem("active_voice_gender") as "female" | "male") ||
          "female"
        );
      } catch {
        return "female";
      }
    },
  );
  const [isPreviewingVoice, setIsPreviewingVoice] = useState(false);
  const [previewingModeId, setPreviewingModeId] = useState<string | null>(null);
  const [previewingGender, setPreviewingGender] = useState<
    "female" | "male" | null
  >(null);

  const [activeModel, setActiveModel] = useState<string>("Gemini Flash");
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>(() => {
    try {
      return localStorage.getItem("selected_speaker") || "Kore";
    } catch {
      return "Kore";
    }
  });
  const [selectedSpeechModel, setSelectedSpeechModel] = useState<string>(() => {
    try {
      return (
        localStorage.getItem("selected_speech_model") ||
        "gemini-3.1-flash-tts-preview"
      );
    } catch {
      return "gemini-3.1-flash-tts-preview";
    }
  });
  const [isTtsStudioOpen, setIsTtsStudioOpen] = useState(false);
  const [ttsInitialBlocks, setTtsInitialBlocks] = useState<any[] | undefined>(undefined);
  const [ttsInitialScene, setTtsInitialScene] = useState<string | undefined>(undefined);
  const [ttsInitialContext, setTtsInitialContext] = useState<string | undefined>(undefined);

  const handleOpenInTTS = useCallback((scriptText: string, sceneTitle: string, contextDescription: string) => {
    // Basic formatting from script text to speech blocks
    const paragraphs = scriptText
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    const blocks = paragraphs.map((para, idx) => {
      let speaker = "Standard Male";
      let text = para;
      // Extract voice role if present (e.g., "Narrator: blah blah" or "Speaker: blah blah")
      const speakerMatch = para.match(/^([^:\n]{1,30}):\s*([\s\S]+)$/);
      if (speakerMatch) {
        speaker = speakerMatch[1].trim();
        text = speakerMatch[2].trim();
      }
      return {
        id: `block_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 4)}`,
        speaker,
        text
      };
    });

    setTtsInitialBlocks(blocks);
    setTtsInitialScene(sceneTitle);
    setTtsInitialContext(contextDescription);
    setIsTtsStudioOpen(true);
    showToast("Opened Script in TTS Studio Pro!");
  }, [showToast]);

  const [showSpeechBooth, setShowSpeechBooth] = useState(false);
  const [speed, setSpeed] = useState<number>(1.0);
  const [selectedMic, setSelectedMic] = useState<string>("");
  const [availableMicrophones, setAvailableMicrophones] = useState<
    MediaDeviceInfo[]
  >([]);

  useEffect(() => {
    const fetchMicrophones = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputDevices = devices.filter(
          (device) => device.kind === "audioinput",
        );
        setAvailableMicrophones(audioInputDevices);
        if (audioInputDevices.length > 0 && !selectedMic) {
          setSelectedMic(audioInputDevices[0].deviceId);
        }
      } catch (err) {
        console.error("Error accessing microphone:", err);
      }
    };
    fetchMicrophones();
  }, []);

  const handleSelectMode = (modeId: string) => {
    setActiveAiMode(modeId);
    try {
      localStorage.setItem("active_ai_mode", modeId);
    } catch {}
    const modeName = AI_MODES_LIST.find((m) => m.id === modeId)?.name || modeId;
    showToast(`✨ Enabled ${modeName}`);
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    showToast(`⚡ Speed set to ${newSpeed}x`);
  };

  const handleMicSelect = (mic: string) => {
    setSelectedMic(mic);
    showToast(`🎤 Mic set to ${mic}`);
  };

  const handleModelSelect = (model: string) => {
    setActiveModel(model);
    showToast(`🤖 Model set to ${model}`);
  };

  const handleSelectGender = (gender: "female" | "male") => {
    setActiveVoiceGender(gender);
    try {
      localStorage.setItem("active_voice_gender", gender);
    } catch {}
    showToast(`🗣️ Voice Gender: ${gender === "female" ? "Female" : "Male"}`);
  };

  const handlePreviewVoice = async (
    modeId: string,
    gender: "female" | "male",
    previewText: string,
    specificVoiceName?: string,
    isLooping?: boolean,
    speedRate?: number,
  ) => {
    await resumeAudioContext();
    if (isPreviewingVoice) {
      stopAllAudio();
      setIsPreviewingVoice(false);
      setPreviewingModeId(null);
      setPreviewingGender(null);
      return;
    }
    setIsPreviewingVoice(true);
    setPreviewingModeId(modeId);
    setPreviewingGender(gender);
    try {
      const voiceName =
        specificVoiceName ||
        selectedSpeaker ||
        getVoiceForModeAndGender(modeId, gender);

      const cacheKey = `tts_sample_cache_${voiceName}_${previewText}`;
      let audioBase64: string | null = null;
      try {
        audioBase64 = localStorage.getItem(cacheKey);
      } catch {}

      if (!audioBase64) {
        audioBase64 = await generateTTS(
          previewText,
          voiceName,
          'gemini-3.1-flash-tts-preview',
        );
        if (audioBase64) {
          try {
            localStorage.setItem(cacheKey, audioBase64);
          } catch (e) {
            console.warn("Could not cache audio sample in localStorage:", e);
          }
        }
      } else {
        console.log("Playing cached voice sample from local storage:", voiceName);
      }

      if (audioBase64) {
        await playBase64Audio(
          audioBase64, 
          24000, 
          isLooping || false, 
          speedRate !== undefined ? speedRate : speed
        );
      } else {
        throw new Error("No audio returned from preview generator");
      }
    } catch (err: any) {
      console.error("Preview voice failed:", err);
      if (err?.message === "QUOTA_EXCEEDED") {
        showToast("Gemini TTS quota reached. Playing with web speech fallback...");
      } else {
        showToast("Playing with web speech fallback...");
      }
      await speakWithWebSpeech(previewText, 'ti');
    } finally {
      setIsPreviewingVoice(false);
      setPreviewingModeId(null);
      setPreviewingGender(null);
    }
  };
  const [isMemoryEnabled, setIsMemoryEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem("gemini_memory_enabled") !== "false";
    } catch {
      return true;
    }
  });

  const handleToggleMemoryEnabled = async (enabled: boolean) => {
    setIsMemoryEnabled(enabled);
    localStorage.setItem("gemini_memory_enabled", String(enabled));
    showToast(enabled ? "🧠 Memory Vault Active" : "🧠 Memory Vault Paused");
    if (currentUser) {
      try {
        await saveUserMemories(currentUser.uid, memories, enabled);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleAddMemory = async (memory: string) => {
    const isDuplicate = memories.some(
      (m) =>
        m.toLowerCase() === memory.toLowerCase() ||
        m.toLowerCase().includes(memory.toLowerCase()),
    );
    if (!isDuplicate) {
      const nextMemories = [...memories, memory];
      setMemories(nextMemories);
      localStorage.setItem("gemini_memories", JSON.stringify(nextMemories));
      showToast("🧠 Memory saved");
      if (currentUser) {
        try {
          await saveUserMemories(
            currentUser.uid,
            nextMemories,
            isMemoryEnabled,
          );
        } catch (e) {
          console.error(e);
        }
      }
    } else {
      showToast("🧠 Memory already exists");
    }
  };

  const handleEditMemory = async (index: number, newText: string) => {
    const nextMemories = [...memories];
    nextMemories[index] = newText;
    setMemories(nextMemories);
    localStorage.setItem("gemini_memories", JSON.stringify(nextMemories));
    showToast("🧠 Memory updated");
    if (currentUser) {
      try {
        await saveUserMemories(currentUser.uid, nextMemories, isMemoryEnabled);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleDeleteMemory = async (index: number) => {
    const nextMemories = memories.filter((_, i) => i !== index);
    setMemories(nextMemories);
    localStorage.setItem("gemini_memories", JSON.stringify(nextMemories));
    showToast("🧠 Memory deleted");
    if (currentUser) {
      try {
        await saveUserMemories(currentUser.uid, nextMemories, isMemoryEnabled);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleClearAllMemories = async () => {
    setMemories([]);
    localStorage.setItem("gemini_memories", "[]");
    showToast("🧠 Memory bank cleared");
    if (currentUser) {
      try {
        await saveUserMemories(currentUser.uid, [], isMemoryEnabled);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSignIn = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        showToast("Logged in with Google securely!");
      }
    } catch (err: any) {
      console.error("[Auth] Sign in failed:", err);
      const isIframe = window.self !== window.top;
      const errMsg = err?.message || "";
      if (
        isIframe ||
        errMsg.includes("popup") ||
        errMsg.includes("block") ||
        errMsg.includes("closed-by-user")
      ) {
        showToast(
          "⚠️ Popup blocked/restricted. Please click 'Open in New Tab' (top-right) and sign in there!",
        );
      } else {
        showToast("Failed to authenticate Google account.");
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      showToast("Signed out securely");
    } catch (err) {
      console.error(err);
      showToast("Failed to sign out");
    }
  };

  // Fallback and Brave Search Logging state
  interface FallbackLog {
    id: string;
    timestamp: string;
    query: string;
    geminiError: string;
    usingBraveApiKey: boolean;
    success: boolean;
    details?: string;
    source?: string;
  }

  const [fallbackLogs, setFallbackLogs] = useState<FallbackLog[]>([]);
  const [quotaWarning, setQuotaWarning] = useState<{
    attempt: number;
    delayMs: number;
    error: string;
  } | null>(null);

  useEffect(() => {
    const handleQuota = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setQuotaWarning(detail);
    };
    const handleQuotaSuccess = () => {
      setQuotaWarning(null);
      showToast(
        activeLanguage === "ti"
          ? "ምስ ጀሚኒ ርክብ ብዓወት ተመሊሱ ኣሎ!"
          : activeLanguage === "am"
            ? "ከጀሚኒ ጋር ያለው ግንኙነት በስኬት ተመልሷል!"
            : "Gemini connection successfully restored!",
      );
    };

    window.addEventListener("gemini-api-quota", handleQuota);
    window.addEventListener("gemini-api-quota-success", handleQuotaSuccess);

    return () => {
      window.removeEventListener("gemini-api-quota", handleQuota);
      window.removeEventListener(
        "gemini-api-quota-success",
        handleQuotaSuccess,
      );
    };
  }, [activeLanguage]);

  const extractMemoriesFromConversation = async (messages: ChatMessage[]) => {
    if (!isMemoryEnabled) return;
    try {
      const recentContext = messages
        .slice(-4)
        .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.parts}`)
        .join("\n");
      const currentMemoriesStr =
        memories.length > 0 ? memories.join(", ") : "None";

      const prompt = `You are a quiet background memory-extraction tool. Your job is to extract important user preferences, personal details, facts, or instructions that should be remembered across sessions.
Recent conversation turns:
${recentContext}

Current stored memories:
[${currentMemoriesStr}]

Task:
Identify any NEW specific, permanent, or important facts about the user (e.g. name, location, dialect choice, tone preference, interests, family details, or things they explicitly asked to remember).
- Do NOT extract conversational fluff, greetings, temporary questions, or generic facts.
- Keep memories highly concise, clear, and focused (e.g. "User's name is Samuel", "User is learning Tigrinya with a formal tone").
- If there is a new memory, output exactly the new memory text (one per line, maximum 2).
- If no new memory is found, output nothing (empty response).
- If the user explicitly asks to forget something or change a memory, output "FORGET: [exact memory or detail to forget]".
- Return ONLY the exact memory line(s) or "FORGET: [detail]". Do NOT include any intro, outro, headers, bullet points, or numbering. Just the raw string.`;

      const response = await callGeminiAPI("gemini-3.5-flash", prompt);
      const responseText = response?.text || "";
      if (responseText && responseText.trim()) {
        const lines = responseText
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 0);
        let updatedMemories = [...memories];
        let hasChanges = false;

        for (const line of lines) {
          if (line.toUpperCase().startsWith("FORGET:")) {
            const query = line.slice(7).trim();
            updatedMemories = updatedMemories.filter(
              (m) => !m.toLowerCase().includes(query.toLowerCase()),
            );
            hasChanges = true;
          } else {
            const isDuplicate = updatedMemories.some(
              (m) =>
                m.toLowerCase() === line.toLowerCase() ||
                m.toLowerCase().includes(line.toLowerCase()),
            );
            if (!isDuplicate) {
              updatedMemories.push(line);
              hasChanges = true;
              showToast(`🧠 Gemini memorized: "${line}"`);
            }
          }
        }
        if (hasChanges) {
          setMemories(updatedMemories);
          localStorage.setItem(
            "gemini_memories",
            JSON.stringify(updatedMemories),
          );
          if (currentUser) {
            await saveUserMemories(
              currentUser.uid,
              updatedMemories,
              isMemoryEnabled,
            );
          }
        }
      }
    } catch (err) {
      console.error("Failed to background-extract memory:", err);
    }
  };

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const keyboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!keyboardRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setKeyboardHeight(entry.contentRect.height);
      }
    });

    observer.observe(keyboardRef.current);
    return () => observer.disconnect();
  }, [showChatKeyboard]);

  const toggleMenu = (menuKey: keyof typeof activeMenus) => {
    setActiveMenus((prev) => ({
      ...Object.keys(prev).reduce(
        (acc, key) => ({ ...acc, [key]: false }),
        {} as typeof activeMenus,
      ),
      [menuKey]: !prev[menuKey],
    }));
    if (menuKey === "settings") {
      setIsSettingsDrawerOpen((prev) => !prev);
    }
  };

  const showErrorMessage = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 3000);
  };
  const [translationInput, setTranslationInput] = useState("");
  const [translationOutput, setTranslationOutput] = useState("");
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("ti");
  const [isTranslatingRealtime, setIsTranslatingRealtime] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState<{
    type: "source" | "target";
    open: boolean;
  }>({ type: "target", open: false });
  const [langSearch, setLangSearch] = useState("");
  const [keyScale, setKeyScale] = useState<number>(() => {
    const saved = localStorage.getItem("key_scale");
    return saved ? parseInt(saved) : 100;
  });
  const [physicalKeyboardSync, setPhysicalKeyboardSync] = useState<boolean>(
    () => {
      const saved = localStorage.getItem("physical_keyboard_sync");
      return saved ? JSON.parse(saved) : false;
    },
  );

  useEffect(() => {
    localStorage.setItem("physical_keyboard_sync", JSON.stringify(physicalKeyboardSync));
  }, [physicalKeyboardSync]);

  // Keyboard Style helper
  const factoryReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  // Keyboard Style helper
  const getKeyboardKeyClasses = (
    key: string,
    isSpecial: boolean,
    isPressed: boolean,
    style: string,
  ) => {
    let classes =
      "relative rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer font-ethiopic min-h-[44px] sm:min-h-[54px] max-h-[60px] h-[6dvh] ";
    if (isPressed) classes += "z-50 shadow-2xl scale-95 ";
    else classes += "z-10 ";

    if (style === "neon-glow")
      classes +=
        (isSpecial
          ? "bg-slate-900/60 text-indigo-400 border-indigo-500/30 "
          : "bg-slate-900/40 text-indigo-300 border-indigo-500/20 ") +
        "shadow-[0_0_8px_rgba(99,102,241,0.2)] ";
    else if (style === "minimalist")
      classes +=
        (isSpecial
          ? "bg-slate-800/20 text-slate-400 "
          : "bg-white/5 text-slate-200 ") + "border-slate-700/30 ";
    else if (style === "high-contrast")
      classes +=
        (isSpecial
          ? "bg-black text-white border-white "
          : "bg-black text-white border-white ") + "border-white ";

    classes +=
      " border px-1 text-[clamp(14px,3.5vw,26px)] select-none ";
    if (isSpecial)
      classes +=
        "text-[clamp(0.6rem,1.8vw,0.85rem)] uppercase tracking-widest font-black ";

    if (key === "space")
      classes +=
        (style === "neon-glow"
          ? "bg-indigo-900/20 text-indigo-400 "
          : "bg-white/10 text-white/50 ") +
        "flex-[5] tracking-[0.3em] min-w-0 ";
    else if (["shift", "backspace", "123", "ABC"].includes(key))
      classes += "flex-[1.5] ";
    else if (["enter"].includes(key)) classes += "";
    else classes += "flex-1 ";

    if (key === "123" && isSymbols)
      classes += "text-emerald-400 border-emerald-500/50 bg-emerald-500/10 ";
    if (key === "globe") classes += "text-emerald-500/80 bg-emerald-500/5 ";
    if (key === "emoji") classes += "text-white/40 ";
    if (key === "enter")
      classes +=
        "bg-emerald-500 text-[#0a1a12] border-emerald-400 shadow-lg shadow-emerald-500/30 font-black flex-[1.5] ";

    return classes;
  };

  const displayMessages = useMemo(() => {
    let msgs = [...chatMessages];
    if (isLiveMode) {
      msgs = [...msgs, ...liveSessionHistory];
      if (liveTranscript.trim())
        msgs.push({ role: "user", parts: liveTranscript });
      if (liveResponseTranscript.trim())
        msgs.push({ role: "model", parts: liveResponseTranscript });
    }
    return msgs;
  }, [
    chatMessages,
    isLiveMode,
    liveSessionHistory,
    liveTranscript,
    liveResponseTranscript,
  ]);

  const renderLiveTalkUI = () => {
    if (!isLiveMode) return null;

    if (isQuotaExceeded) {
      return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 ">
          <div className="w-full max-w-md bg-[#0a0c10] p-8 rounded-[40px] border-2 border-white/5 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-6 mx-auto text-amber-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white mb-4 uppercase tracking-wider">
              {activeLanguage === "ti"
                ? "ዓቐን ተበጺሑ"
                : activeLanguage === "am"
                  ? "ገደብ አልፏል"
                  : "Quota Exceeded"}
            </h3>
            <p className="text-white/60 mb-6 font-medium text-sm">
              {activeLanguage === "ti"
                ? "ናይ ሕቶ ዓቐንኩም ተበጺሑ ኣሎ።"
                : activeLanguage === "am"
                  ? "የጥያቄ ገደብዎ አልቋል።"
                  : "You have reached your request quota."}
            </p>
            <button
              onClick={() => setIsLiveMode(false)}
              className="w-full py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold transition-all"
            >
              Close
            </button>
          </div>
        </div>
      );
    }

    return (
      <AnimatePresence>
        {isLiveMode && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="relative w-full max-w-lg mx-auto px-2 pointer-events-none mb-3 z-30"
          >
            {/* Outer Magical Glow behind the entire container */}
            <div
              className={`absolute -inset-2 px-2 pointer-events-none transition-all duration-1000 ${isLivePaused ? "opacity-0" : "opacity-100"}`}
            >
              <div
                className={`w-full h-full rounded-[30px] blur-2xl transition-all duration-1000 ${
                  liveTalkState === "listening"
                    ? "bg-gradient-to-r from-cyan-500/50 via-blue-500/50 to-indigo-500/50 animate-pulse"
                    : liveTalkState === "thinking"
                      ? "bg-gradient-to-r from-indigo-500/60 via-purple-500/60 to-pink-500/60 animate-[pulse_3s_ease-in-out_infinite]"
                      : liveTalkState === "speaking"
                        ? "bg-gradient-to-r from-fuchsia-500/70 via-purple-500/70 to-cyan-500/70 animate-breathing scale-105"
                        : "bg-gradient-to-r from-emerald-500/40 via-teal-500/40 to-emerald-500/40"
                }`}
              />
            </div>

            {/* Main Glowing Container - Even more compact */}
            <motion.div className="relative w-full bg-[#0a0c10]/98 rounded-[24px] border border-white/10 overflow-hidden flex flex-col pointer-events-auto ">
              {/* Top Bar - Minimalist */}
              <div className="relative z-10 flex items-center justify-between px-5 pt-3">
                <div className="flex items-center gap-2.5">
                  <div className="relative flex items-center justify-center w-2 h-2">
                    {/* Magical Aura */}
                    <div
                      className={`absolute -inset-1.5 rounded-full mix-blend-screen transition-all duration-700 ${
                        isLivePaused
                          ? "bg-slate-500/20 opacity-0"
                          : liveTalkState === "listening"
                            ? "bg-cyan-400/60 blur-[3px] animate-pulse opacity-100 scale-110"
                            : liveTalkState === "thinking"
                              ? "bg-indigo-500/60 blur-[4px] animate-[pulse_3s_ease-in-out_infinite] opacity-100 scale-100"
                              : liveTalkState === "speaking"
                                ? "bg-fuchsia-500/60 blur-[5px] animate-pulse opacity-100 scale-125"
                                : "bg-emerald-400/50 blur-[3px] animate-[pulse_2s_ease-in-out_infinite] opacity-80 scale-100"
                      }`}
                    />
                    {/* Core Dot */}
                    <div
                      className={`relative w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                        isLivePaused
                          ? "bg-slate-400 shadow-[0_0_8px_rgba(100,116,139,0.5)]"
                          : liveTalkState === "listening"
                            ? "bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,1)]"
                            : liveTalkState === "thinking"
                              ? "bg-indigo-300 shadow-[0_0_12px_rgba(99,102,241,1)]"
                              : liveTalkState === "speaking"
                                ? "bg-fuchsia-200 shadow-[0_0_15px_rgba(217,70,239,1)] scale-110"
                                : "bg-emerald-300 shadow-[0_0_10px_rgba(52,211,153,1)]"
                      }`}
                    />
                  </div>

                  <span className="text-white/50 font-black tracking-[0.25em] text-[7px] uppercase">
                    {isLivePaused ? "Paused" : "Live Bridge"}
                  </span>
                </div>

                <div className="bg-white/5  border border-white/10 px-2 py-0.5 rounded-full flex items-center gap-1.5">
                  <Globe className="w-2 h-2 text-indigo-400" />
                  <span className="text-white/50 text-[7px] font-bold uppercase tracking-wider">
                    {activeLanguage === "en"
                      ? "English"
                      : activeLanguage === "am"
                        ? "Amharic"
                        : "Tigrinya"}
                  </span>
                </div>
              </div>

              {/* Center Content: Status & Vision View */}
              <div className="flex-1 relative flex flex-col items-center justify-center py-1 min-h-[80px]">
                {isCameraActive ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-[110px] aspect-video rounded-lg overflow-hidden border border-white/10 shadow-xl relative"
                  >
                    <video
                      ref={videoRef}
                      className={`w-full h-full object-cover ${isLivePaused ? "grayscale opacity-50" : ""}`}
                      playsInline
                      muted
                    />
                    {!isLivePaused && (
                      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden opacity-20">
                        <div className="w-full h-[1px] bg-emerald-400 absolute top-0 animate-[scan_4s_linear_infinite]" />
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="text-center space-y-0.5">
                    <h2
                      className={`text-sm font-bold tracking-[0.1em] font-geez ${isLivePaused ? "text-white/20" : "text-white/40 animate-pulse"}`}
                    >
                      {isLivePaused
                        ? activeLanguage === "en"
                          ? "Session Paused"
                          : activeLanguage === "am"
                            ? "ለጊዜው ቆሟል"
                            : "ብግዝያዊ ደው ኢሉ"
                        : activeLanguage === "en"
                          ? "Listening..."
                          : activeLanguage === "am"
                            ? "እንከታተል ኣለን..."
                            : "እንከታተል ኣለና..."}
                    </h2>
                    <div className="flex items-center justify-center gap-3 opacity-10">
                      <div className="flex items-center gap-1">
                        <Search className="w-2 h-2 text-indigo-400" />
                        <span className="text-[6px] font-black uppercase tracking-widest text-white">
                          Search
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-2 h-2 text-emerald-400" />
                        <span className="text-[6px] font-black uppercase tracking-widest text-white">
                          Vision
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Controls Bar - Mini Controls */}
              <div className="relative z-10 flex items-center justify-center gap-3 pb-3.5">
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={toggleCamera}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all border ${
                      isCameraActive
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                        : "bg-white/5 border-white/10 text-white/20 hover:text-white"
                    }`}
                  >
                    {isCameraActive ? (
                      <CameraOff className="w-3 h-3" />
                    ) : (
                      <Camera className="w-3 h-3" />
                    )}
                  </button>
                  <span className="text-[6px] text-white/50 uppercase tracking-wider">{isCameraActive ? 'Cam On' : 'Cam Off'}</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={toggleMicMute}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all border ${
                      isMicMuted
                        ? "bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.2)]"
                        : "bg-white/5 border-white/10 text-white/20 hover:text-white"
                    }`}
                  >
                    {isMicMuted ? (
                      <MicOff className="w-3 h-3" />
                    ) : (
                      <Mic className="w-3 h-3" />
                    )}
                  </button>
                  <span className="text-[6px] text-white/50 uppercase tracking-wider">{isMicMuted ? 'Mic Muted' : 'Mic On'}</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={captureVisionFrame}
                    className="w-7 h-7 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all"
                    title="Capture Vision"
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                  <span className="text-[6px] text-white/50 uppercase tracking-wider">Vision</span>
                </div>

                <button
                  onClick={toggleLivePause}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    isLivePaused
                      ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                      : "bg-[#fca311] shadow-[0_0_10px_rgba(252,163,17,0.3)]"
                  } hover:scale-105 active:scale-95`}
                >
                  {isLivePaused ? (
                    <Play className="w-3.5 h-3.5 text-black fill-black ml-0.5" />
                  ) : (
                    <Pause className="w-3.5 h-3.5 text-[#0a0c10] fill-[#0a0c10]" />
                  )}
                </button>

                <button
                  onClick={stopLiveSession}
                  className="w-7 h-7 rounded-full flex items-center justify-center bg-[#f43f5e] hover:bg-[#e11d48] text-white transition-all hover:scale-105"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  const renderKeyboardUI = () => {
    return (
      <motion.div
        ref={keyboardRef}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.5 }}
        onDragEnd={(e, info) => {
          if (info.offset.y > 50 || info.velocity.y > 500) {
            setShowChatKeyboard(false);
          }
        }}
        className={`fixed bottom-0 inset-x-0 w-full z-[100] select-none pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 px-2 sm:px-4 flex flex-col transition-all duration-300 bg-transparent border-none text-white`}
        onMouseDown={(e) => {
          e.preventDefault();
          setKeyboardTarget("chat");
        }}
      >
        <div
          className={`mx-auto w-full max-w-2xl flex flex-col relative gap-1 sm:gap-1.5 p-2 rounded-t-[2rem] border-x border-t transition-all duration-300 ${
            currentTheme.isDark
              ? "bg-black/40 border-white/10  shadow-[0_-10px_40px_rgba(0,0,0,0.3)]"
              : "bg-white/95 border-slate-200  shadow-[0_-10px_40px_rgba(15,23,42,0.1)]"
          }`}
        >
          {/* Header */}
          <div className="flex justify-between items-center px-2 mb-1">
            <div />

            <div className="flex items-center gap-2">
              <button
                onClick={cycleLanguage}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider  transition-all ${
                  isSymbols
                    ? currentTheme.isDark
                      ? "bg-white/10 text-white border border-white/20"
                      : "bg-slate-200 text-slate-800 border border-slate-300"
                    : currentTheme.isDark
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                }`}
              >
                <Globe className="w-3 h-3" />
                {isSymbols
                  ? "NUM"
                  : activeLanguage === "en"
                    ? "ENGLISH"
                    : activeLanguage === "am"
                      ? "አማርኛ"
                      : "ትግርኛ"}
              </button>
              <button
                onClick={() => setShowChatKeyboard(false)}
                className={`p-1 rounded-full transition-colors ${
                  currentTheme.isDark
                    ? "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                }`}
                title="Minimize Keyboard"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
          {isEditing && (
            <div className="flex justify-between items-center mb-4 px-2">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    saveLayout();
                    showToast("Layout Saved");
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2"
                >
                  <Check className="w-4 h-4" /> Save
                </button>
                <button
                  onClick={() => {
                    if (selectedKey) {
                      const { row, col } = selectedKey;
                      const newLayout = [...layout.map((r) => [...r])];
                      newLayout[row].splice(col, 1);
                      setLayout(newLayout);
                      setSelectedKey(null);
                      showToast("Key Removed");
                    } else {
                      showToast("Select a key to remove");
                    }
                  }}
                  className={`px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${!selectedKey ? "opacity-50" : ""}`}
                >
                  <Trash className="w-4 h-4" /> Remove
                </button>
              </div>

              {selectedKey && (
                <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => moveKey("left")}
                    className="p-2 hover:bg-white/10 rounded-lg"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                  </button>
                  <span className="text-[10px] uppercase font-bold text-white/40 px-2 border-x border-white/5">
                    Move Key
                  </span>
                  <button
                    onClick={() => moveKey("right")}
                    className="p-2 hover:bg-white/10 rounded-lg"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              <button
                onClick={() => {
                  setIsEditing(false);
                  setSelectedKey(null);
                }}
                className="p-2 hover:bg-white/10 rounded-full text-white/40"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          )}

          {/* Clipboard Overlay */}
          <AnimatePresence>
            {activeMenus.clipboard && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`absolute inset-0 z-[120] rounded-3xl p-4 flex flex-col gap-4 overflow-hidden  border border-white/20 ${currentTheme.isDark ? "bg-black/80" : "bg-white/80"}`}
              >
                <div className="flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2">
                    <ClipboardList
                      className={`w-4 h-4 ${currentTheme.isDark ? "text-orange-400" : "text-orange-600"}`}
                    />
                    <span
                      className={`text-[10px] uppercase tracking-widest font-bold ${currentTheme.isDark ? "text-white/60" : "text-black/60"}`}
                    >
                      Smart Clipboard
                    </span>
                  </div>
                  <button
                    onClick={clearClipboard}
                    className={`text-[10px] px-2 py-1 rounded-lg ${currentTheme.isDark ? "bg-white/10 hover:bg-white/20" : "bg-black/10 hover:bg-black/20"}`}
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => toggleMenu("clipboard")}
                    className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 opacity-50" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6 pr-1">
                  {/* Pinned Section */}
                  {(pinnedItems.length > 0 || isEditing) && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 opacity-40 px-1">
                        <Pin className="w-3 h-3" />
                        <span className="text-[9px] uppercase tracking-wider font-mono">
                          Pinned Items
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {pinnedItems.map((item, i) => (
                          <motion.button
                            key={`pinned-${item}-${i}`}
                            onClick={() => {
                              const curIndex = getTargetIndex();
                              updateTargetText(
                                (prev) =>
                                  prev.slice(0, curIndex) +
                                  item +
                                  prev.slice(curIndex),
                              );
                              updateTargetIndex((p: number) => p + item.length);
                              setIsClipboardOpen(false);
                              toggleMenu("clipboard");
                            }}
                            onContextMenu={(e) =>
                              handleClipboardLongPress(item, true, e)
                            }
                            className={`px-3 py-2 rounded-xl text-xs flex items-center gap-2 border transition-all active:scale-95 ${currentTheme.isDark ? "bg-orange-500/10 border-orange-500/20 text-orange-100 hover:bg-orange-500/20" : "bg-orange-50/50 border-orange-200 text-orange-900 hover:bg-orange-100"}`}
                          >
                            <span className="truncate max-w-[120px] font-ethiopic">
                              {item}
                            </span>
                          </motion.button>
                        ))}
                        {pinnedItems.length === 0 && (
                          <span className="p-4 text-[10px] opacity-20 italic">
                            No pinned items yet...
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Recents Section */}
                  <div className="flex flex-col gap-2 pb-4">
                    <div className="flex items-center gap-2 opacity-40 px-1">
                      <RotateCcw className="w-3 h-3" />
                      <span className="text-[9px] uppercase tracking-wider font-mono">
                        Recent History
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {clipboardItems.map((item, i) => (
                        <motion.button
                          key={`recent-${item}-${i}`}
                          onClick={() => {
                            const curIndex = getTargetIndex();
                            updateTargetText(
                              (prev) =>
                                prev.slice(0, curIndex) +
                                item +
                                prev.slice(curIndex),
                            );
                            updateTargetIndex((p: number) => p + item.length);
                            setIsClipboardOpen(false);
                            toggleMenu("clipboard");
                          }}
                          onContextMenu={(e) =>
                            handleClipboardLongPress(item, false, e)
                          }
                          className={`px-3 py-2 rounded-xl text-xs flex items-center gap-2 border transition-all active:scale-95 ${currentTheme.isDark ? "bg-white/5 border-white/10 text-white/80 hover:bg-white/10" : "bg-black/5 border-black/10 text-black/80 hover:bg-black/10"}`}
                        >
                          <span className="truncate max-w-[120px] font-ethiopic">
                            {item}
                          </span>
                        </motion.button>
                      ))}
                      {clipboardItems.length === 0 && (
                        <span className="p-4 text-[10px] opacity-20 italic">
                          History is empty...
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Clipboard Action Menu */}
                <AnimatePresence>
                  {clipboardActionMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: -10 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      className="absolute z-[130] bg-white/10  border border-white/20 p-1.5 rounded-2xl shadow-2xl flex gap-1"
                      style={{
                        left: Math.min(
                          window.innerWidth - 150,
                          clipboardActionMenu.x - 70,
                        ),
                        top: clipboardActionMenu.y - 60,
                      }}
                    >
                      <button
                        onClick={() => {
                          togglePin(clipboardActionMenu.item);
                          setClipboardActionMenu(null);
                        }}
                        className="p-2 hover:bg-white/10 rounded-xl transition-all"
                        title={clipboardActionMenu.isPinned ? "Unpin" : "Pin"}
                      >
                        {clipboardActionMenu.isPinned ? (
                          <PinOff className="w-4 h-4 text-orange-400" />
                        ) : (
                          <Pin className="w-4 h-4 text-white/60" />
                        )}
                      </button>
                      <button
                        onClick={() =>
                          deleteClipboardItem(
                            clipboardActionMenu.item,
                            clipboardActionMenu.isPinned,
                          )
                        }
                        className="p-2 hover:bg-red-500/20 rounded-xl transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                      <button
                        onClick={() => setClipboardActionMenu(null)}
                        className="p-2 hover:bg-white/10 rounded-xl transition-all"
                        title="Cancel"
                      >
                        <X className="w-4 h-4 opacity-50" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Symbol Overlay Indicator */}
          {isSymbols && (
            <div className="absolute -top-5 sm:-top-6 left-4 text-[9px] sm:text-[10px] uppercase tracking-widest text-white/30 font-mono">
              Symbols & Numbers
            </div>
          )}

          {/* Contextual Bars Area (Suggestions, Vowel Variations, Emojis) */}
          <div
            className={`flex flex-col gap-2 ${suggestions.length > 0 || vowelMenu || activeMenus.emoji ? "mb-2" : ""}`}
          >
            {/* Vowel Menu (Character Variations) - Now Inline */}
            <AnimatePresence>
              {vowelMenu && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="w-full overflow-hidden"
                >
                  <div
                    className={`p-2 rounded-2xl flex justify-center gap-1 sm:gap-2 border  shadow-xl ${
                      currentTheme.isDark
                        ? "bg-slate-800/80 border-white/10"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    {vowelMenu.variations.map((v, i) => (
                      <button
                        key={`var-${v}-${i}`}
                        onClick={() => selectVariation(v)}
                        className={`w-11 h-14 sm:w-13 sm:h-16 rounded-xl flex items-center justify-center text-xl sm:text-2xl font-ethiopic border transition-all hover:scale-105 active:scale-95 shrink-0 shadow-sm font-bold ${
                          currentTheme.isDark
                            ? "bg-white/5 border-white/10 text-white hover:bg-indigo-500/40"
                            : "bg-white border-slate-200 text-slate-800 hover:bg-indigo-50"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Emoji Picker - Inline (Removed as it is now integrated into keyboard layout) */}

            {/* Predictive Suggestions Bar */}
            <AnimatePresence mode="wait">
              {suggestions.length > 0 && (
                <motion.div
                  key="suggestions-bar"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="w-full overflow-hidden"
                >
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 px-1 w-full h-[44px]">
                    {suggestions.map((s, idx) => (
                      <button
                        key={`sug-${s}-${idx}`}
                        onClick={() => applySuggestion(s)}
                        className={`px-4 py-1.5 border rounded-xl font-ethiopic text-sm whitespace-nowrap transition-all flex-shrink-0 shadow-sm ${
                          currentTheme.isDark
                            ? "bg-white/5 border-white/10 hover:bg-white/10 active:bg-indigo-500/30 text-white"
                            : "bg-white border-slate-200 hover:bg-slate-50 active:bg-indigo-50 text-slate-800 font-medium"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-1 flex flex-col gap-1 sm:gap-2">
            {(isEmojiMode ? EMOJI_ROWS : isSymbols ? SYMBOL_ROWS : layout).map(
              (row, rowIndex) => (
                <div
                  key={`row-${rowIndex}`}
                  className="flex justify-center gap-1 sm:gap-2 flex-1 items-stretch w-full relative group"
                >
                  {isEditing && (
                    <div className="absolute -left-10 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => moveRow(rowIndex, "up")}
                        className="p-1 hover:bg-white/10 rounded-md text-white/40"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveRow(rowIndex, "down")}
                        className="p-1 hover:bg-white/10 rounded-md text-white/40"
                      >
                        <ChevronUp className="w-4 h-4 rotate-180" />
                      </button>
                    </div>
                  )}

                  {row.map((key, colIndex) => {
                    if (
                      key === "mic" &&
                      !isSpeechRecognitionSupported &&
                      !enhancedTigrinyaMode
                    )
                      return null;
                    const isSpecial = [
                      "shift",
                      "backspace",
                      "globe",
                      "space",
                      "enter",
                      "123",
                      "mic",
                      "emoji",
                      "ABC",
                      "asr",
                    ].includes(key);
                    const isPressed = activeKey === key;
                    const isSelected =
                      selectedKey?.row === rowIndex &&
                      selectedKey?.col === colIndex;
                    const currentLabel = isShift
                      ? key.toUpperCase()
                      : key.toLowerCase();
                    const displayChar =
                      activeLanguage === "en" || isSymbols || isEmojiMode
                        ? currentLabel
                        : GEEZ_MAP[key.toUpperCase()]?.[0] || key;

                    return (
                      <motion.button
                        key={`${rowIndex}-${colIndex}-${key}`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{
                          scale: 0.95,
                          backgroundColor: "rgba(255,255,255,0.2)",
                        }}
                        title={
                          key === "asr"
                            ? enhancedTigrinyaMode
                              ? "Disable Voice Recording Enhancer"
                              : "Enable Voice Recording Enhancer"
                            : key === "mic"
                              ? isEnhancedRecording
                                ? "Voice Recording Enhancer active - recording..."
                                : isListening
                                  ? "Listening..."
                                  : "Voice Input"
                              : undefined
                        }
                        onMouseDown={(e) => {
                          if (key === "space") handleSpaceSwipeStart(e);
                          else handleKeyPress(key, rowIndex, colIndex);
                          if (!isSpecial) startLongPress(key, e);
                        }}
                        onMouseMove={(e) => {
                          if (key === "space") handleSpaceSwipeMove(e);
                        }}
                        onMouseUp={() => {
                          if (key === "space") handleSpaceSwipeEnd();
                          cancelLongPress();
                        }}
                        onMouseLeave={() => {
                          if (key === "space") handleSpaceSwipeEnd();
                          cancelLongPress();
                        }}
                        onTouchStart={(e) => {
                          e.preventDefault();
                          if (key === "space") handleSpaceSwipeStart(e);
                          else handleKeyPress(key, rowIndex, colIndex);
                          if (!isSpecial) startLongPress(key, e);
                        }}
                        onTouchMove={(e) => {
                          if (key === "space") handleSpaceSwipeMove(e);
                        }}
                        onTouchEnd={() => {
                          if (key === "space") handleSpaceSwipeEnd();
                          cancelLongPress();
                        }}
                        aria-label={`Keyboard key ${key}`}
                        className={`
                    relative rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer font-ethiopic
                    min-h-[44px] sm:min-h-[54px] max-h-[60px] h-[6dvh]
                    ${isPressed ? "z-50 shadow-2xl scale-95" : "z-10"}
                    ${
                      currentTheme.isDark
                        ? isSpecial
                          ? "bg-white/[0.08] text-white/50 border-white/10 hover:bg-white/[0.12]"
                          : "bg-white/[0.05] border-white/5 text-white hover:bg-white/[0.08]"
                        : isSpecial
                          ? "bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300/80 shadow-sm"
                          : "bg-slate-50 border-slate-200/60 text-slate-800 hover:bg-slate-100 shadow-sm"
                    }
                     border px-1 text-[clamp(14px,3.5vw,26px)] select-none
                    ${isSpecial ? "text-[clamp(0.6rem,1.8vw,0.85rem)] uppercase tracking-widest font-black" : ""}
                    ${key === "space" ? (currentTheme.isDark ? "bg-white/10 text-white/50 flex-[5] tracking-[0.3em] min-w-0" : "bg-slate-100 border-slate-300 text-slate-600 flex-[5] tracking-[0.3em] min-w-0") : ["enter", "space"].includes(key) ? "" : ["shift", "backspace", "123", "ABC"].includes(key) ? "flex-[1.5]" : "flex-1"}
                    ${key === "123" && isSymbols ? (currentTheme.isDark ? "text-indigo-400 border-indigo-500/50 bg-indigo-500/10" : "text-indigo-600 border-indigo-300 bg-indigo-50") : ""}
                    ${key === "globe" ? (currentTheme.isDark ? "text-indigo-400 bg-indigo-500/5" : "text-indigo-600 bg-indigo-50") : ""}
                    ${key === "emoji" ? (isEmojiMode ? (currentTheme.isDark ? "text-indigo-400 border-indigo-500/50 bg-indigo-500/10" : "text-indigo-600 border-indigo-300 bg-indigo-50") : currentTheme.isDark ? "text-white/40" : "text-slate-500") : ""}
                    ${key === "enter" ? `${currentTheme.isDark ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/35 font-black" : "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20 font-black"} flex-[1.5]` : ""}
                    ${key === "shift" && isShift ? `${currentTheme.isDark ? "bg-indigo-500 border-indigo-400 text-white" : "bg-indigo-600 border-indigo-500 text-white"}` : ""}
                    ${isSelected ? `ring-4 ring-indigo-500/50 scale-105 z-20 shadow-2xl transition-all` : ""}
                  `}
                      >
                        <AnimatePresence>
                          {isPressed && !isSpecial && !isEditing && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1.5, y: -40 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className={`absolute z-50 p-3 sm:p-4 rounded-xl font-bold text-3xl transition-all duration-150 shadow-xl pointer-events-none ${
                                currentTheme.isDark
                                  ? "bg-slate-900/98 text-white border border-white/20 shadow-black/80"
                                  : "bg-white text-slate-800 border border-slate-200"
                              }`}
                            >
                              {displayChar}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Key Content */}
                        <span className="relative z-10 flex flex-col items-center justify-center w-full h-full">
                          {key === "shift" && (
                            <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6" />
                          )}
                          {key === "backspace" && (
                            <Delete className="w-5 h-5 sm:w-6 sm:h-6" />
                          )}
                          {key === "mic" && (
                            <div className="relative">
                              {isListening || isEnhancedRecording ? (
                                <MicOff className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400" />
                              ) : (
                                <Mic
                                  className={`w-5 h-5 sm:w-6 sm:h-6 ${enhancedTigrinyaMode ? "text-amber-500" : "opacity-60"}`}
                                />
                              )}
                            </div>
                          )}
                          {key === "asr" && (
                            <div className="relative">
                              <Zap
                                className={`w-5 h-5 sm:w-6 sm:h-6 ${enhancedTigrinyaMode ? "text-amber-500 animate-pulse" : "opacity-40"}`}
                              />
                            </div>
                          )}
                          {key === "emoji" && (
                            <Smile className="w-5 h-5 sm:w-6 sm:h-6 opacity-60" />
                          )}
                          {key === "globe" && (
                            <Globe
                              className={`w-5 h-5 sm:w-6 sm:h-6 ${activeLanguage === "en" ? "text-blue-500" : activeLanguage === "am" ? "text-amber-500" : "text-emerald-500"}`}
                            />
                          )}
                          {key === "space" && (
                            <span className="text-[9px] sm:text-[10px] font-black tracking-[0.3em]">
                              {isCursorMode
                                ? "SWIPE"
                                : activeLanguage === "en"
                                  ? "ENGLISH"
                                  : activeLanguage === "am"
                                    ? "AMHARIC"
                                    : "TIGRINYA"}
                            </span>
                          )}
                          {key === "enter" && (
                            <CornerDownLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                          )}
                          {key === "123" && <span>123</span>}
                          {key === "ABC" && <span>ABC</span>}

                          {!isSpecial && (
                            <>
                              {GEEZ_MAP[key.toUpperCase()] &&
                                activeLanguage !== "en" &&
                                !isSymbols && (
                                  <span
                                    className="absolute top-1 right-1.5 text-[8px] sm:text-[10px] text-white/20 font-ethiopic"
                                    style={{
                                      fontSize: `${8 * (keyScale / 100)}px`,
                                    }}
                                  >
                                    {key.toLowerCase()}
                                  </span>
                                )}
                              {EN_LABELS[key.toUpperCase()] &&
                                activeLanguage !== "en" &&
                                !isSymbols && (
                                  <span
                                    className="absolute top-1 left-1.5 text-[7px] sm:text-[9px] text-white/40 font-sans font-bold"
                                    style={{
                                      fontSize: `${7 * (keyScale / 100)}px`,
                                    }}
                                  >
                                    {EN_LABELS[key.toUpperCase()].toLowerCase()}
                                  </span>
                                )}
                              <span
                                className={`text-center leading-none px-[2%] break-words overflow-hidden flex items-center justify-center h-full w-full ${
                                  activeLanguage === "en"
                                    ? "text-blue-100"
                                    : activeLanguage === "am"
                                      ? "text-amber-100"
                                      : "text-emerald-100"
                                }`}
                                style={{
                                  // Fully Dynamic Font: Scales by viewport width but stays within key boundaries
                                  fontSize: `clamp(10px, ${3.5 * (keyScale / 100)}vw, 28px)`,
                                }}
                              >
                                {displayChar}
                              </span>
                            </>
                          )}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              ),
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  useEffect(() => {
    localStorage.setItem("chat_language", chatLanguage);
    // Restart session when language changes to apply new system instruction
    chatSessionRef.current = null;
  }, [chatLanguage]);

  useEffect(() => {
    if (chatInput === "") {
      const textarea = document.getElementById("chat-input-textarea");
      if (textarea) textarea.style.height = "auto";
    }
  }, [chatInput]);

  const handleEditSave = async (index: number, newText: string) => {
    if (index < 0 || index >= displayMessages.length) return;
    const msgToEdit = displayMessages[index];
    if (!msgToEdit || msgToEdit.role !== "user") return;

    const historyBefore = displayMessages.slice(0, index);
    const originalAttachments = msgToEdit.attachedFiles || [];

    // Reset editing state
    setEditingMessageIndex(null);
    setEditMessageInput("");

    // Set attachments for the new request
    setAttachedFiles(originalAttachments);

    // Truncate the chat to before the edited message
    setChatMessages(() => historyBefore);

    // Re-trigger AI with the new text
    await sendToAI(newText, historyBefore);
  };

  const executeAppAction = (actionName: string, args: any) => {
    setActiveAgentAction(`Executing ${actionName}...`);
    setTimeout(() => setActiveAgentAction(null), 3000);

    switch (actionName) {
      case "changeLanguage":
        if (args.lang) {
          setActiveLanguage(args.lang);
          showToast(`Agent changed language to ${args.lang}`);
        }
        break;
      case "setTheme":
        if (args.theme) {
          setThemeKey(args.theme);
          showToast(`Agent changed theme to ${args.theme}`);
        }
        break;
      case "openSpeechBooth":
        setActiveAiMode("live_speech_translation");
        showToast("Agent opened Speech Booth");
        break;

      case "openSettings":
        setIsSettingsDrawerOpen(true);
        showToast("Agent opened Settings");
        break;
      case "openMemory":
        setIsMemoryDrawerOpen(true);
        showToast("Agent opened Memory Panel");
        break;
      case "setTTSVoice":
        if (args.voiceId) {
          setVoice(args.voiceId);
          showToast(`Agent set voice to ${args.voiceId}`);
        }
        break;
      case "saveProject":
        if (args.title && args.content) {
          const updatedProjects = { ...chatProjectNames };
          const updatedSaved = { ...chatSavedProjects };
          
          // Find next available ID
          const nextId = Object.keys(updatedProjects).length > 0 
            ? Math.max(...Object.keys(updatedProjects).map(Number)) + 1 
            : Date.now();
            
          updatedProjects[nextId] = args.title;
          updatedSaved[nextId] = true;
          
          setChatProjectNames(updatedProjects);
          setChatSavedProjects(updatedSaved);
          
          // Save to local storage as an array
          let existingProjects: any[] = [];
          const stored = localStorage.getItem("faceless_yt_projects");
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              existingProjects = Array.isArray(parsed) ? parsed : Object.values(parsed);
            } catch (e) {
              console.error(e);
            }
          }
          const newProjItem = {
            id: `proj_${nextId}_${Math.random().toString(36).substr(2, 5)}`,
            title: args.title,
            niche: "AI Creator Studio",
            concept: args.title,
            tone: "Informative",
            outline: "Saved by AI Agent",
            visualStyle: "Standard",
            scriptText: args.content,
            savedAt: new Date().toISOString()
          };
          const updatedProjList = [newProjItem, ...existingProjects];
          localStorage.setItem("faceless_yt_projects", JSON.stringify(updatedProjList));
          
          showToast(`Agent saved project: ${args.title}`);
        }
        break;
      default:
        console.warn("Unknown app action:", actionName);
    }
  };

  const processAppActions = (text: string): string => {
    const actionRegex = /<APP_ACTION>([\s\S]*?)<\/APP_ACTION>/g;
    let match;
    let newText = text;
    while ((match = actionRegex.exec(text)) !== null) {
      try {
        const payload = JSON.parse(match[1].trim());
        executeAppAction(payload.action, payload.args || {});
        // Remove the action block from text
        newText = newText.replace(match[0], "").trim();
      } catch (err) {
        console.error("Failed to parse APP_ACTION:", err);
      }
    }
    return newText;
  };

  const sendToAI = async (
    textToSend: string,
    historyContext: ChatMessage[],
  ) => {
    // Learn new words
    textToSend.split(/\s+/).forEach((word) => {
      if (word.length > 3) {
        learnWord(word, word);
      }
    });

    const currentAttachments = [...attachedFiles];
    const userMessage: ChatMessage = {
      role: "user",
      parts: textToSend,
      attachedFiles: currentAttachments,
    };
    setChatMessages((prev) => [...historyContext, userMessage]);
    setChatInput("");
    setAttachedFiles([]); // Reset attachments
    setIsAssistantTyping(true);
    setStreamingResponse("");
    setStreamingThought("");
    setStreamingSources([]);
    setIsSearching(false);

    // Update session title if it's still default
    if (activeSession.title === "New Chat") {
      const summaryTitle =
        textToSend.slice(0, 30) + (textToSend.length > 30 ? "..." : "");
      setChatSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId ? { ...s, title: summaryTitle } : s,
        ),
      );
    }

    try {
      const tonePrompts: Record<string, string> = {
        Casual:
          "TONE: Be extra relaxed, informal, and friendly. Use casual language and occasional appropriate slang.",
        Friendly:
          "TONE: Be warm, approachable, and supportive. Use person-centered language.",
        Professional:
          "TONE: Be highly professional, concise, and technical. Use a business-appropriate vocabulary and structured bullet points.",
        Poetic:
          "TONE: Be artistic, eloquent, and creative. Use metaphors and rhythmic language.",
        Urgent:
          "TONE: Be extremely direct and brief. Provide the most critical information first without any fluff.",
        Formal:
          "TONE: Be traditionally respectful and formal. Use high-level vocabulary and formal Ethiopic address (erswo) where applicable.",
      };

      const memoryString =
        isMemoryEnabled && memories.length > 0
          ? `\n\nREAL-TIME MEMORY VAULT (Important details you MUST remember about the user in all your responses): \n${memories.map((m, i) => `- ${m}`).join("\n")}`
          : "";
      const customInstructionsString = customSystemInstructions.trim()
        ? `\n\nCUSTOM USER RULES & SYSTEM INSTRUCTIONS (You must absolutely follow these instructions at all times):\n${customSystemInstructions}`
        : "";
      const proactiveString = proactiveSuggestionsEnabled
        ? `\n\nPROACTIVE SUGGESTIONS ENABLED: You are an intelligent, adaptive assistant. Recognize patterns in the user's behavior and gently offer relevant, context-aware suggestions, reflection prompts, or helpful next steps. Keep the interaction flexible and supportive.`
        : "";
      const habitString = habitTrackingEnabled
        ? `\n\nHABIT TRACKING ENABLED: Support the user in building and tracking habits gently and naturally. If relevant to their context, offer nudges or options to set reminders without enforcing rigid rules.`
        : "";
      const activeModeInstruction = getModeSystemInstruction(activeAiMode);
      const modeString = activeModeInstruction
        ? `\n\n${activeModeInstruction}`
        : "";

      const agentModeString = isAIAgentMode
        ? `\n\n=== AUTONOMOUS AI AGENT MODE ENABLED ===\nYou are now acting as the overarching Project Manager and Autonomous Agent for this entire application. You have the ability to CONTROL the application directly on behalf of the user.\n\nTo execute an action, you MUST output an exact XML tag anywhere in your response. The application will intercept it and execute it silently.\nAvailable Actions:\n<APP_ACTION>{"action": "changeLanguage", "args": {"lang": "en" | "am" | "ti"}}</APP_ACTION> - Changes the app language.\n<APP_ACTION>{"action": "setTheme", "args": {"theme": "light" | "dark" | "system"}}</APP_ACTION> - Changes the visual theme.\n<APP_ACTION>{"action": "openSpeechBooth", "args": {}}</APP_ACTION> - Opens the Speech Booth / TTS feature.\n<APP_ACTION>{"action": "openYouTubeWizard", "args": {}}</APP_ACTION> - Opens the Faceless YouTube Creator Studio.\n<APP_ACTION>{"action": "openSettings", "args": {}}</APP_ACTION> - Opens the app settings menu.\n<APP_ACTION>{"action": "openMemory", "args": {}}</APP_ACTION> - Opens the user's saved memory/history panel.\n<APP_ACTION>{"action": "setTTSVoice", "args": {"voiceId": "..."}}</APP_ACTION> - Sets the TTS voice.\n\nWorkflow:\n1. Understand the user's goal.\n2. Formulate a plan and briefly explain what you are doing.\n3. Output the necessary <APP_ACTION> tags to execute the steps.\n4. Do NOT output markdown codeblocks around the tag, just the raw tag.`
        : "";

      const baseRules = `Role: You are a highly intelligent, helpful, and global AI assistant (Google Gemini).${modeString}${agentModeString}

Maintain a supportive, intelligent, and helpful persona.

NATURAL CONVERSATION DIRECTIVE:
1. Response Length (CRITICAL): Always provide concise, powerful, and useful short answers by default. DO NOT provide long, large text responses unless the user explicitly asks for more detail.
2. NEVER Ask Unnecessary Questions: NEVER end your response with a question. NEVER ask the user what to do next or if they want to hear more. Only answer questions, do not ask them.
3. Proactive Task Completion: Complete all tasks fully and efficiently. Avoid unnecessary verbosity unless the user asks for in-depth details.
4. Intelligent Human Partner: Communicate like an intelligent human conversational partner. Prioritize brevity, directness, and utility by default.
5. Seamless Flow: When the user's intent is clear, continue explanations naturally, moving from one idea to the next without stopping.

Tone Directive: ${tonePrompts[chatTone] || tonePrompts.Friendly}${memoryString}${customInstructionsString}${proactiveString}${habitString}

FORMATTING DIRECTIVE:
1. Universal Structure: Organize your responses clearly and make everything well-structured and scannable.
2. Headings: Use **Bold Headings** (or ### Markdown headers) for all main sections.
3. Lists: Use bullet points ( - or * ) for lists to keep information concise and easy to read.
4. Spacing: Use double line breaks between sections to keep the layout clean and scannable.
5. Key Terms: Use **Bold** for emphasis on critical terms or data points.

STRICT Language Matching Rules:
1. DETECT the exact language the user is speaking (e.g. English, Tigrinya, Amharic).
2. RESPOND 100% in that SAME language.
3. NEVER mix languages (No English definitions, no translations, no summaries in a different language) unless explicitly asked to translate.

Source Links:
- Format links as [Source Name](URL).

Tool Usage:
- For informational queries that require current or specific, verifiable information, explicitly use the Google Search tool to ground your response with up-to-date sources. If search is used, you MUST provide links in the response.`;

      const instructions: Record<string, string> = {
        ti: `${baseRules}\n\nLanguage Directive: The user is using Tigrinya. Always respond 100% in Tigrinya. Prioritize cultural authenticity and proper Ge'ez script variants.`,
        am: `${baseRules}\n\nLanguage Directive: The user is using Amharic. Always respond 100% in Amharic. Prioritize cultural accuracy, formal/informal nuances (erswo/ante/anchi), and appropriate Ge'ez script usage.`,
        en: `${baseRules}\n\nLanguage Directive: The user is using English. Always respond 100% in English.`,
        auto: `${baseRules}\n\nLanguage Directive: Detect the language the user speaks and respond 100% in that exact language (prioritizing Ethiopic nuances if detected).`,
      };

      // Automatically detect and scrape links inside textToSend in real time
      const urlRegex = /(https?:\/\/[^\s]+)/gi;
      const urls = textToSend.match(urlRegex);
      let linkAnalysisText = "";

      if (urls && urls.length > 0) {
        setIsSearching(true);
        showToast(`Analyzing ${urls.length} link(s) in real-time...`);
        try {
          const scrapeResults = await Promise.all(
            urls.map(async (url) => {
              try {
                const res = await fetch("/api/gemini/scrapeUrl", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ url }),
                });
                if (res.ok) {
                  const data = await res.json();
                  return {
                    url,
                    title: data.title,
                    content: data.content,
                    ok: true,
                  };
                }
              } catch (err) {
                console.error("Link scraper error:", err);
              }
              return {
                url,
                title: "Failed to fetch webpage",
                content: "",
                ok: false,
              };
            }),
          );

          scrapeResults.forEach((res) => {
            if (res.ok) {
              linkAnalysisText += `\n\n=== [REAL-TIME WEBPAGE CONTENT ANALYZED FROM LINK: ${res.url}] ===\nTitle: ${res.title}\nContent:\n${res.content}\n=======================================================\n`;
              showToast(`Analyzed page: "${res.title}"`);
            }
          });
        } catch (err) {
          console.error("Link analysis failed:", err);
        } finally {
          setIsSearching(false);
        }
      }

      // Process raw text extracts
      let textToGen = userMessage.parts;
      if (linkAnalysisText) {
        textToGen += linkAnalysisText;
      }
      const textFiles = currentAttachments.filter(
        (f) =>
          f.textAlternative || (!f.mimeType.startsWith("image/") && !f.base64),
      );
      if (textFiles.length > 0) {
        textToGen += "\n\n=== [Attached Documents/Files] ===\n";
        textFiles.forEach((tf) => {
          textToGen += `\n[File Name: ${tf.name}]\n${tf.textAlternative || "[Binary File content metadata]"}\n`;
        });
        textToGen += "\n==================================\n";
      }

      textToGen += `\n[System Info: Current local date and time is ${localTime.full}]\n`;

      // Process image and video payloads for Multimodal ingest
      const multimodalParts = currentAttachments
        .filter(
          (f) =>
            (f.mimeType.startsWith("image/") ||
              f.mimeType.startsWith("video/")) &&
            f.base64,
        )
        .map((file) => ({
          inlineData: {
            data: file.base64,
            mimeType: file.mimeType,
          },
        }));

      const payload =
        multimodalParts.length > 0
          ? [...multimodalParts, textToGen]
          : textToGen;

      // Always restart the session with the exact history context provided to allow temporal branching (editing)
      chatSessionRef.current = {
        ...startAIChat(
          historyContext,
          instructions[chatLanguage] || instructions.auto,
        ),
        aiModelMode,
      };

      const stream = await sendMessageStreamToAI(
        chatSessionRef.current,
        payload,
      );
      let fullResponse = "";
      let fullThought = "";
      let sources: { title: string; uri: string }[] = [];

      for await (const chunk of stream) {
        const candidate = chunk.candidates?.[0];

        // Detect if a search was triggered
        if (
          candidate?.groundingMetadata?.webSearchQueries ||
          candidate?.groundingMetadata?.searchEntryPoint ||
          candidate?.groundingMetadata?.groundingChunks
        ) {
          setIsThinking(false);
          setIsSearching(true);
          if (candidate?.groundingMetadata?.webSearchQueries) {
            setSearchKeyword(candidate.groundingMetadata.webSearchQueries[0]);
          }
        }

        if (candidate?.content?.parts) {
          for (const part of candidate.content.parts) {
            // Also check for explicit tool calls
            if (
              part.executableCode ||
              (part as any).functionCall ||
              (part as any).call?.googleSearch
            ) {
              setIsThinking(false);
              setIsSearching(true);
            }
            if (part.thought) {
              if (!isThinking) {
                setIsThinking(true);
                setThinkingStartTime(Date.now());
                setIsSearching(false);
              }
              fullThought += part.thought;
              setStreamingThought(fullThought);
            }
            if (part.text) {
              setIsThinking(false);
              setIsSearching(false);
              fullResponse += part.text;
              setStreamingResponse(fullResponse);
            }
          }
        }

        // Extract Google Search grounding chunks
        if (candidate?.groundingMetadata?.groundingChunks) {
          const newSources = candidate.groundingMetadata.groundingChunks
            .filter((g: any) => g.web?.uri && g.web?.title)
            .map((g: any) => ({ title: g.web.title, uri: g.web.uri }));

          newSources.forEach((src: any) => {
            if (!sources.find((s) => s.uri === src.uri)) {
              sources.push(src);
            }
          });
          setStreamingSources([...sources]);
        }
      }

      // Process any app actions requested by the AI Agent
      if (isAIAgentMode) {
        fullResponse = processAppActions(fullResponse);
      }

      const assistantMessage: ChatMessage = {
        role: "model",
        parts: fullResponse,
        groundingSources: sources,
      };
      if (sources.length > 0) {
        setPanelSources(sources);
      }
      setChatMessages((prev) => {
        // Because of the async await delay, carefully append only to the newly generated branch
        const newHistory = [...historyContext, userMessage, assistantMessage];
        // Generate new suggestions after assistant finishes
        if (!quotaExceeded) {
          generateSuggestions(newHistory, chatLanguage)
            .then((s) => setChatSuggestions(s))
            .catch((err) => {
              if (err.message === "QUOTA_EXCEEDED") {
                setQuotaExceeded(true);
              }
            });
        }

        // Extract memories from the conversation in real-time background
        setTimeout(() => {
          extractMemoriesFromConversation(newHistory);
        }, 800);

        return newHistory;
      });
      setStreamingResponse("");
      setStreamingThought("");
      setStreamingSources([]);
      setIsSearching(false);
    } catch (err: any) {
      console.error("Chat failed:", err);
      const errMsg = err?.message || String(err);
      if (
        errMsg.includes("quota") ||
        errMsg.includes("429") ||
        errMsg.includes("exceeded") ||
        errMsg.includes("RESOURCE_EXHAUSTED")
      ) {
        showToast("⚠️ API Quota Limit. Using offline mode!");
        const warningMsg: ChatMessage = {
          role: "model",
          parts: `### ⚠️ **API Quota Exceeded (ግዝያዊ መጠን ጻቕጢ)**\n\nYou have temporarily reached the Gemini API rate limit or quota.\n\n**Suggestions / Available Fallbacks:**\n1. **Use Integrated Offline Tools:** You can continue to translate, autocorrect, and type in Tigrigna (ትግርኛ) or Amharic (አማርኛ) seamlessly using our local Ge'ez Keyboards and offline spelling suggestions.\n2. **Retry shortly:** Gemini free-tier quotas reset every 1-2 minutes. Just wait a brief moment and press send again.\n\n*ኣገልግሎት ኣይፒ (AI) ብሰንኪ ብዝሒ ተጠቀምቲ ግዝያዊ ጻቕጢ የሕልፍ ኣሎ። በጃኹም ቁሩብ ጸኒሕኩም ፈትኑ። እቲ ናይ ትግርኛ ኪቦርድን ናይ ቃላት መእረምታን ግን ብዘይ መስመር (offline) ይሰርሕ እዩ።*`,
        };
        setChatMessages((prev) => [
          ...prev.slice(0, -1),
          userMessage,
          warningMsg,
        ]);
      } else if (
        errMsg.includes("unavailable") ||
        errMsg.includes("503") ||
        errMsg.includes("high demand") ||
        errMsg.includes("spikes") ||
        errMsg.includes("UNAVAILABLE")
      ) {
        showToast("⚠️ Gemini high demand. Retrying shortly...");
        const warningMsg: ChatMessage = {
          role: "model",
          parts: `### ⚠️ **Gemini High Demand (ከቢድ ጻቕጢ)**\n\nThe AI model is currently under a wave of heavy traffic. This is typically temporary.\n\n**Suggestions / Available Fallbacks:**\n1. **Retry in a few seconds:** These spikes usually resolve in 10-20 seconds. Press the send button or write again.\n2. **Use Offline Ge'ez Engine:** You can still compose, edit, and copy text freely using our custom phonetic keyboard rules.\n\n*ናይ ግዝያዊ ጻቕጢ ተፈጥሩ ስለዘሎ ቃላትካ ብምዕቃብ ቁሩብ ጸኒሕካ ፈትን።*`,
        };
        setChatMessages((prev) => [
          ...prev.slice(0, -1),
          userMessage,
          warningMsg,
        ]);
      } else {
        showToast("Assistant handles: " + errMsg.substring(0, 50));
      }
    } finally {
      setIsAssistantTyping(false);
      setIsSearching(false);
    }
  };

  const exportLayout = () => {
    const layout = localStorage.getItem("geez_keyboard_layout");
    if (!layout) {
      alert("No layout found to export.");
      return;
    }
    const blob = new Blob([layout], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "keyboard_layout.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const getKeyboardStyleClasses = (isSpecial: boolean) => {
    switch (keyboardStyle) {
      case "neon-glow":
        return isSpecial
          ? "bg-slate-800 text-indigo-400 border-indigo-500/50 shadow-[0_0_10px_rgba(79,70,229,0.3)]"
          : "bg-slate-900 border-indigo-500/30 text-indigo-100 shadow-[0_0_5px_rgba(79,70,229,0.2)]";
      case "minimalist":
        return isSpecial
          ? "bg-white/5 text-white/30 border-transparent"
          : "bg-white/5 border-transparent text-white/80";
      case "high-contrast":
        return isSpecial
          ? "bg-black text-white border-white"
          : "bg-black border-white text-white";
      default:
        return isSpecial
          ? "bg-white/[0.08] text-white/50 border-white/10"
          : "bg-white/[0.05] border-white/10 text-white";
    }
  };

  const importLayout = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event: any) => {
        try {
          const layout = JSON.parse(event.target.result);
          localStorage.setItem("geez_keyboard_layout", JSON.stringify(layout));
          window.location.reload();
        } catch (err) {
          alert("Invalid layout file.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const startNewChatSession = () => {
    const newId = Date.now().toString();
    const newTitle = `New Chat ${chatSessions.length + 1}`;
    setChatSessions((prev) => [
      ...prev,
      { id: newId, title: newTitle, messages: [] },
    ]);
    setActiveSessionId(newId);
    setChatInput("");
    if (isLiveMode) stopLiveSession();
  };

  const toggleCamera = async () => {
    if (isCameraActive) {
      // Stop camera cleanly via tracked stream ref
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
        cameraStreamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsCameraActive(false);
      return;
    }

    if (!liveSessionRef.current) {
      showToast("Live session must be active to open camera.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      cameraStreamRef.current = stream;

      // 1. Mount <video> in DOM first
      setIsCameraActive(true);

      // 2. Wait for mounting complete, then bind stream
      setTimeout(async () => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch (playErr) {
            console.error("Failed to play video stream:", playErr);
          }
        } else {
          // Polling fallback
          let attempts = 0;
          const pollRef = setInterval(async () => {
            attempts++;
            if (videoRef.current) {
              clearInterval(pollRef);
              videoRef.current.srcObject = stream;
              try {
                await videoRef.current.play();
              } catch (playErr) {
                console.error(
                  "Failed to play video stream on polled ref:",
                  playErr,
                );
              }
            } else if (attempts > 12) {
              clearInterval(pollRef);
              stream.getTracks().forEach((track) => track.stop());
              cameraStreamRef.current = null;
              setIsCameraActive(false);
              showToast("Failed to initialize video preview.");
            }
          }, 80);
        }
      }, 50);

      showToast(
        activeLanguage === "en"
          ? "Camera active. Tap capture to discuss."
          : "ካሜራ ተከፍቷል። ለመወያየት ምስል ቅረጹ።",
      );
    } catch (err) {
      console.error("Camera access failed:", err);
      showToast(
        activeLanguage === "en" ? "Failed to access camera" : "ካሜራ ማግኘት አልተቻለም",
      );
      setIsCameraActive(false);
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
        cameraStreamRef.current = null;
      }
    }
  };

  const captureVisionFrame = () => {
    if (!liveSessionRef.current) {
      showToast("Live session must be active to capture.");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
        liveSessionRef.current.sendImage(base64);
        showToast(
          activeLanguage === "en"
            ? "Vision frame captured!"
            : activeLanguage === "am"
              ? "ምስል ተቀርጿል!"
              : "ምስሊ ተቐሪጹ ኣሎ!",
        );
      }
    }
  };

  const stopLiveSession = useCallback(() => {
    setIsSessionTimedOut(false);
    setIsQuotaExceeded(false);
    setIsLiveMode(false);
    setLiveTalkState("paused");

    // Save final pending messages from refs
    const finalUser = liveTranscriptRef.current.trim();
    const finalModel = liveResponseTranscriptRef.current.trim();
    const endingMessages: ChatMessage[] = [];
    if (finalUser) endingMessages.push({ role: "user", parts: finalUser });
    if (finalModel) endingMessages.push({ role: "model", parts: finalModel });

    const finalTranscriptList = [
      ...liveSessionHistoryRef.current,
      ...endingMessages,
    ];

    // Cleanup camera stream robustly via ref tracking
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);

    // Save updated lists
    setLiveSessionHistory(finalTranscriptList);
    liveSessionHistoryRef.current = finalTranscriptList;

    if (finalTranscriptList.length > 0) {
      // Save all live session messages cleanly into the persistent chat session history!
      setChatMessages((existing) => {
        const uniqueNew = finalTranscriptList.filter(
          (newMsg) =>
            !existing.some(
              (existingMsg) =>
                existingMsg.parts === newMsg.parts &&
                existingMsg.role === newMsg.role,
            ),
        );
        return [...existing, ...uniqueNew];
      });

      // Add to past live sessions database/localStorage
      const newSession = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toLocaleString(),
        transcript: finalTranscriptList,
      };

      setPastLiveSessions((past) => {
        const filteredPast = (past || []).filter(
          (s) => s && s.id && s.id !== newSession.id,
        );
        return [newSession, ...filteredPast];
      });
    }

    // Clear buffer refs and states
    liveTranscriptRef.current = "";
    liveResponseTranscriptRef.current = "";
    setLiveTranscript("");
    setLiveResponseTranscript("");

    try {
      liveSessionRef.current?.close();
    } catch (e) {}
    try {
      liveRecorderRef.current?.stop();
    } catch (e) {}
    try {
      liveStreamerRef.current?.stop();
    } catch (e) {}

    liveSessionRef.current = null;
    liveRecorderRef.current = null;
    liveStreamerRef.current = null;
    isLivePausedRef.current = false;
    setIsLivePaused(false);
    setIsAiSpeaking(false);
    setLastWasInterrupted(false);
  }, [setChatMessages, activeLanguage, chatTone]);

  const handleLiveSessionTimeout = useCallback(
    (reason: string) => {
      // Save final pending messages from refs before shutting down
      const finalUser = liveTranscriptRef.current.trim();
      const finalModel = liveResponseTranscriptRef.current.trim();
      const endingMessages: ChatMessage[] = [];
      if (finalUser) endingMessages.push({ role: "user", parts: finalUser });
      if (finalModel) endingMessages.push({ role: "model", parts: finalModel });

      const finalTranscriptList = [
        ...liveSessionHistoryRef.current,
        ...endingMessages,
      ];

      setLiveSessionHistory(finalTranscriptList);
      liveSessionHistoryRef.current = finalTranscriptList;

      if (finalTranscriptList.length > 0) {
        setChatMessages((existing) => {
          const uniqueNew = finalTranscriptList.filter(
            (newMsg) =>
              !existing.some(
                (existingMsg) =>
                  existingMsg.parts === newMsg.parts &&
                  existingMsg.role === newMsg.role,
              ),
          );
          return [...existing, ...uniqueNew];
        });

        const newSession = {
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toLocaleString(),
          transcript: finalTranscriptList,
        };

        setPastLiveSessions((past) => {
          const filteredPast = (past || []).filter(
            (s) => s && s.id && s.id !== newSession.id,
          );
          return [newSession, ...filteredPast];
        });
      }

      // Clear active buffers so they don't show trailing states
      liveTranscriptRef.current = "";
      liveResponseTranscriptRef.current = "";
      setLiveTranscript("");
      setLiveResponseTranscript("");

      try {
        liveSessionRef.current?.close();
      } catch (e) {}
      try {
        liveRecorderRef.current?.stop();
      } catch (e) {}
      try {
        liveStreamerRef.current?.stop();
      } catch (e) {}

      liveSessionRef.current = null;
      liveRecorderRef.current = null;
      liveStreamerRef.current = null;
      isLivePausedRef.current = false;
      setIsLivePaused(false);
      setIsAiSpeaking(false);
      setLastWasInterrupted(false);

      // Enter the timeout state so we show the beautiful prompt inside renderLiveTalkUI
      setIsSessionTimedOut(true);
      setSessionTimeoutReason(reason || "Live Session Limit Reached");
      setLiveTalkState("paused");
    },
    [setChatMessages, activeLanguage, chatTone],
  );

  const handleLiveSessionQuotaExceeded = useCallback(
    (reason: string) => {
      // Save final pending messages from refs before shutting down
      const finalUser = liveTranscriptRef.current.trim();
      const finalModel = liveResponseTranscriptRef.current.trim();
      const endingMessages: ChatMessage[] = [];
      if (finalUser) endingMessages.push({ role: "user", parts: finalUser });
      if (finalModel) endingMessages.push({ role: "model", parts: finalModel });

      const finalTranscriptList = [
        ...liveSessionHistoryRef.current,
        ...endingMessages,
      ];

      setLiveSessionHistory(finalTranscriptList);
      liveSessionHistoryRef.current = finalTranscriptList;

      if (finalTranscriptList.length > 0) {
        setChatMessages((existing) => {
          const uniqueNew = finalTranscriptList.filter(
            (newMsg) =>
              !existing.some(
                (existingMsg) =>
                  existingMsg.parts === newMsg.parts &&
                  existingMsg.role === newMsg.role,
              ),
          );
          return [...existing, ...uniqueNew];
        });

        const newSession = {
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toLocaleString(),
          transcript: finalTranscriptList,
        };

        setPastLiveSessions((past) => {
          const filteredPast = (past || []).filter(
            (s) => s && s.id && s.id !== newSession.id,
          );
          return [newSession, ...filteredPast];
        });
      }

      // Clear active buffers so they don't show trailing states
      liveTranscriptRef.current = "";
      liveResponseTranscriptRef.current = "";
      setLiveTranscript("");
      setLiveResponseTranscript("");

      try {
        liveSessionRef.current?.close();
      } catch (e) {}
      try {
        liveRecorderRef.current?.stop();
      } catch (e) {}
      try {
        liveStreamerRef.current?.stop();
      } catch (e) {}

      liveSessionRef.current = null;
      liveRecorderRef.current = null;
      liveStreamerRef.current = null;
      isLivePausedRef.current = false;
      setIsLivePaused(false);
      setIsAiSpeaking(false);
      setLastWasInterrupted(false);

      // Enter the quota exceeded state so we show the beautiful prompt inside renderLiveTalkUI
      setIsQuotaExceeded(true);
      setLiveTalkState("paused");
    },
    [setChatMessages, activeLanguage, chatTone],
  );

  const startLiveSession = useCallback(
    async (isAutoRestart = false) => {
      setIsSessionTimedOut(false);
      setIsQuotaExceeded(false);
      if (isLiveMode && !isAutoRestart) return;

      // Auto-dismiss custom virtual keyboard to prevent layout blocking
      setShowChatKeyboard(false);

      // Ensure shared audio context is resumed
      const ctx = getAudioContext();
      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      // Play quick activation tone
      playConfirmationTone();

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showToast("Your browser does not support voice input.");
        return;
      }

      setLiveTalkState("connecting");
      isLivePausedRef.current = false;
      setIsLivePaused(false);
      setLastWasInterrupted(false);

      if (!isAutoRestart) {
        setLiveSessionHistory([]);
        liveSessionHistoryRef.current = [];
      } else {
        // If it's an auto-restart, cleanly close previous session first
        try {
          liveSessionRef.current?.close();
        } catch (e) {}
        liveSessionRef.current = null;
      }

      try {
        // Init Recorder and get Mic permission if not already initialized
        if (!liveRecorderRef.current) {
          const recorder = new AudioRecorder((base64) => {
            if (isLivePausedRef.current) return;
            if (isMicMutedRef.current) return;
            if (
              liveSessionRef.current &&
              typeof (liveSessionRef.current as any).sendRealtimeInput ===
                "function"
            ) {
              liveSessionRef.current.sendRealtimeInput({
                audio: { data: base64, mimeType: "audio/pcm;rate=16000" },
              });
            }
          });

          await recorder.start(); // This triggers the browser prompt
          liveRecorderRef.current = recorder;
        }

        setIsLiveMode(true);
        setLiveTranscript("");
        setLiveResponseTranscript("");
        liveTranscriptRef.current = "";
        liveResponseTranscriptRef.current = "";
        setIsAiSpeaking(false);

        if (!liveStreamerRef.current) {
          liveStreamerRef.current = new AudioStreamer();
        }

        const callbacks = {
          onopen: () => {
            showToast(
              isAutoRestart
                ? "Live Talk Session Restored"
                : "Live Talk Connected",
            );
            setLiveTalkState("listening");
          },
          onclose: () => {
            if (!isLivePausedRef.current) {
              stopLiveSession();
              showToast("Live Talk Ended");
            }
          },
          onerror: (err: any) => {
            const errStr = String(err).toLowerCase();
            const isQuotaOrLimit =
              errStr.includes("quota") ||
              errStr.includes("limit") ||
              errStr.includes("exceeded");
            const isDisconnect =
              errStr.includes("1006") ||
              errStr.includes("code: 1006") ||
              errStr.includes("closed") ||
              errStr.includes("disconnected") ||
              errStr.includes("completed");

            if (isQuotaOrLimit) {
              console.warn("Live Session Notice (Quota/Limit):", err);
              handleLiveSessionQuotaExceeded(
                typeof err === "string" ? err : "Usage limit exceeded",
              );
            } else if (isDisconnect) {
              console.log("Live Talk session disconnected gracefully:", err);
              stopLiveSession();
            } else {
              console.error("Live Error:", err);
              stopLiveSession();
              showToast(
                typeof err === "string" ? err : "Check your connection",
              );
            }
          },
          onmessage: (message: any) => {
            if (isLivePausedRef.current) return;

            if (message && message.info) {
              console.log("Gemini Live server notice:", message.info, message.details);
              stopLiveSession();
              if (message.details) {
                showToast(message.details);
              }
              return;
            }

            // Check for errors sent from the server-side WebSocket bridge
            if (message && message.error) {
              const isGoAway =
                String(message.error).toLowerCase().includes("goaway") ||
                String(message.details || "")
                  .toLowerCase()
                  .includes("goaway") ||
                String(message.error).toLowerCase().includes("completed") ||
                String(message.details || "")
                  .toLowerCase()
                  .includes("completed");
              const isTimeout =
                message.error === "Live Session Completed" ||
                String(message.error).toLowerCase().includes("duration") ||
                String(message.details || "")
                  .toLowerCase()
                  .includes("duration");
              const isQuota =
                String(message.error).toLowerCase().includes("quota") ||
                String(message.details || "")
                  .toLowerCase()
                  .includes("quota") ||
                String(message.error).toLowerCase().includes("limit") ||
                String(message.details || "")
                  .toLowerCase()
                  .includes("limit") ||
                String(message.error).toLowerCase().includes("exceeded") ||
                String(message.details || "")
                  .toLowerCase()
                  .includes("exceeded");
              const isDisconnect =
                String(message.error).toLowerCase().includes("1006") ||
                String(message.error).toLowerCase().includes("disconnected") ||
                String(message.details || "").toLowerCase().includes("1006") ||
                String(message.details || "").toLowerCase().includes("disconnected");

              if (isGoAway || isTimeout || isQuota || isDisconnect) {
                console.warn(
                  "Gemini Live server-side notice:",
                  message.error,
                  message.details,
                );
              } else {
                console.error(
                  "Gemini Live server-side error:",
                  message.error,
                  message.details,
                );
              }

              if (isGoAway) {
                showToast("Resuming Live Talk session...");
                startLiveSession(true); // Seamless auto-restart!
                return;
              }
              if (isTimeout) {
                handleLiveSessionTimeout(
                  message.details || "Your session reached its limit",
                );
              } else if (isQuota) {
                handleLiveSessionQuotaExceeded(
                  message.details ||
                    "You have reached your current usage quota.",
                );
              } else if (isDisconnect) {
                stopLiveSession();
              } else {
                showToast(`${message.error}: ${message.details || ""}`);
                stopLiveSession();
              }
              return;
            }

            // 1. Audio Output (AI Voice)
            const base64Audio =
              message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              setIsAiSpeaking(true);
              setLiveTalkState("speaking");
              liveStreamerRef.current?.play(base64Audio);
            }

            // 2. USER Transcription (Real-time & Final)
            const realTimeUserText =
              message.serverContent?.inputTranscription?.text;
            const finalUserText =
              message.serverContent?.userTurn?.parts?.[0]?.text ||
              message.transcription?.transcription ||
              message.inputAudioTranscription?.text;

            if (finalUserText) {
              setIsAiSpeaking(false);
              setLiveTalkState("thinking");
              setLiveTranscript(finalUserText);
              liveTranscriptRef.current = finalUserText;
            } else if (realTimeUserText) {
              setIsAiSpeaking(false);
              setLiveTalkState("thinking");
              setLiveTranscript((prev) => {
                const next = prev + realTimeUserText;
                liveTranscriptRef.current = next;
                return next;
              });
            }

            // 3. MODEL Transcription (Real-time & Final)
            const realTimeModelText =
              message.outputAudioTranscription?.text ||
              message.serverContent?.outputTranscription?.text;
            const finalModelTurn = message.serverContent?.modelTurn;
            const finalModelText = finalModelTurn?.parts?.[0]?.text;
            const groundingMetadata = finalModelTurn?.groundingMetadata;

            if (finalModelText) {
              setIsAiSpeaking(true);
              setLiveTalkState("speaking");
              setLiveResponseTranscript(finalModelText);
              liveResponseTranscriptRef.current = finalModelText;
              if (groundingMetadata) {
                // Store grounding metadata for the final message display
                (window as any)._lastLiveGroundingMetadata = groundingMetadata;
              }
            } else if (realTimeModelText) {
              setIsAiSpeaking(true);
              setLiveTalkState("speaking");
              setLiveResponseTranscript((prev) => {
                const next = prev + realTimeModelText;
                liveResponseTranscriptRef.current = next;
                return next;
              });
            }

            // 4. Tool Calls (Searching)
            if (message.toolCall) {
              setLiveTalkState("searching");
            }
            if (message.toolResponse) {
              setLiveTalkState("thinking");
            }

            // 5. Interruption
            if (message.serverContent?.interrupted) {
              liveStreamerRef.current?.stop();
              setIsAiSpeaking(false);
              setLiveTalkState("listening");
              setLastWasInterrupted(true);

              const trimmedU = liveTranscriptRef.current.trim();
              const trimmedM = liveResponseTranscriptRef.current.trim();
              if (trimmedU || trimmedM) {
                const userMsg = {
                  role: "user" as const,
                  parts: trimmedU || "[Interrupted]",
                };
                const modelMsg = {
                  role: "model" as const,
                  parts: trimmedM
                    ? trimmedM + " [Interrupted]"
                    : "[Interrupted]",
                };
                liveSessionHistoryRef.current = [
                  ...liveSessionHistoryRef.current,
                  userMsg,
                  modelMsg,
                ];
                setLiveSessionHistory(liveSessionHistoryRef.current);
                setChatMessages((prev) => [...prev, userMsg, modelMsg]);
              }
              liveTranscriptRef.current = "";
              liveResponseTranscriptRef.current = "";
              setLiveTranscript("");
              setLiveResponseTranscript("");
            }

            // 5. TURN COMPLETE (Save to History)
            if (message.serverContent?.turnComplete) {
              // Small delay to ensure all packets are processed
              setTimeout(() => {
                setIsAiSpeaking(false);
                setLiveTalkState("listening");
                setLastWasInterrupted(false);

                const trimmedU = liveTranscriptRef.current.trim();
                const trimmedM = liveResponseTranscriptRef.current.trim();
                if (trimmedU || trimmedM) {
                  const userMsg = {
                    role: "user" as const,
                    parts: trimmedU || "[Voice input]",
                  };
                  const modelMsg = {
                    role: "model" as const,
                    parts: trimmedM,
                    groundingMetadata: (window as any)
                      ._lastLiveGroundingMetadata,
                  };
                  (window as any)._lastLiveGroundingMetadata = null;

                  liveSessionHistoryRef.current = [
                    ...liveSessionHistoryRef.current,
                    userMsg,
                    modelMsg,
                  ];
                  setLiveSessionHistory(liveSessionHistoryRef.current);
                  setChatMessages((prev) => [...prev, userMsg, modelMsg]);

                  // Background memory extraction for real-time voice
                  setTimeout(() => {
                    extractMemoriesFromConversation([userMsg, modelMsg]);
                  }, 500);
                }
                liveTranscriptRef.current = "";
                liveResponseTranscriptRef.current = "";
                setLiveTranscript("");
                setLiveResponseTranscript("");
              }, 400);
            }
          },
        };

        const tonePrompts: Record<string, string> = {
          Casual:
            "TONE: Be extra relaxed, informal, and friendly. Use casual language and occasional appropriate slang.",
          Friendly:
            "TONE: Be warm, approachable, and supportive. Use person-centered language.",
          Professional:
            "TONE: Be highly professional, concise, and technical. Use a business-appropriate vocabulary.",
          Poetic:
            "TONE: Be artistic, eloquent, and creative. Use metaphors and rhythmic language.",
          Urgent:
            "TONE: Be extremely direct and brief. Provide the most critical information first without any fluff.",
          Formal:
            "TONE: Be traditionally respectful and formal. Use high-level vocabulary and formal Ethiopic address (erswo) where applicable.",
        };

        const memoryString =
          isMemoryEnabled && memories.length > 0
            ? `\n\nREAL-TIME MEMORY VAULT (Important details you MUST remember about the user in all your responses): \n${memories.map((m, i) => `- ${m}`).join("\n")}`
            : "";

        const customInstructionsString = customSystemInstructions.trim()
          ? `\n\nCUSTOM USER RULES & SYSTEM INSTRUCTIONS (You must absolutely follow these instructions at all times):\n${customSystemInstructions}`
          : "";

        const recentHistory = chatMessages.slice(-12);
        const historyContextString =
          recentHistory.length > 0
            ? `\n\nRECENT CHAT HISTORY (Use this context to continue the conversation seamlessly. Be aware of what was said previously and refer to it if relevant): \n${recentHistory.map((m) => `- ${m.role === "user" ? "User" : "Assistant"}: ${m.parts}`).join("\n")}`
            : "";

        const activeModeInstruction = getModeSystemInstruction(activeAiMode);
        const modeString = activeModeInstruction
          ? `\n\n${activeModeInstruction}`
          : "";
        const proactiveString = proactiveSuggestionsEnabled
          ? `\n\nPROACTIVE SUGGESTIONS ENABLED: You are an intelligent, adaptive assistant. Recognize patterns in the user's behavior and gently offer relevant, context-aware suggestions.`
          : "";
        const habitString = habitTrackingEnabled
          ? `\n\nHABIT TRACKING ENABLED: Support the user in building and tracking habits gently and naturally.`
          : "";

        const agentModeString = isAIAgentMode
          ? `\n\n=== AUTONOMOUS AI AGENT MODE ENABLED ===\nYou are now acting as the overarching Project Manager, Autonomous AI Agent, and Professional Partner for this entire application. You have the ability to CONTROL the application directly on behalf of the user. You should proactively suggest improvements and manage tasks.\n\nTo execute an action, output an exact XML tag anywhere in your response. The application will intercept it and execute it silently.\nAvailable Actions:\n<APP_ACTION>{"action": "changeLanguage", "args": {"lang": "en" | "am" | "ti"}}</APP_ACTION>\n<APP_ACTION>{"action": "setTheme", "args": {"theme": "light" | "dark" | "system"}}</APP_ACTION>\n<APP_ACTION>{"action": "openSpeechBooth", "args": {}}</APP_ACTION>\n<APP_ACTION>{"action": "openYouTubeWizard", "args": {}}</APP_ACTION>\n<APP_ACTION>{"action": "openSettings", "args": {}}</APP_ACTION>\n<APP_ACTION>{"action": "openMemory", "args": {}}</APP_ACTION>\n<APP_ACTION>{"action": "setTTSVoice", "args": {"voiceId": "..."}}</APP_ACTION>\n<APP_ACTION>{"action": "saveProject", "args": {"title": "Title here", "content": "Script or content here"}}</APP_ACTION>`
          : "";

        const instructions = `You are a highly intelligent, real-time AI assistant (Google Gemini) specializing in Ethiopic languages and English. Current session language: ${activeLanguage === "en" ? "English" : activeLanguage === "am" ? "Amharic" : "Tigrinya"}.${modeString}${agentModeString}

Tone Directive: ${tonePrompts[chatTone] || tonePrompts.Friendly}${memoryString}${customInstructionsString}${proactiveString}${habitString}${historyContextString}

FORMATTING DIRECTIVE:
- **Structure**: Organize responses clearly using bold headings for main sections and bullet points for lists.
- **Scannability**: Keep formatting clean, well-structured, and easy to read.

CONVERSATIONAL BEHAVIOR & VOICE DIRECTIVES:
- **Response Length (CRITICAL)**: Always provide concise, powerful, and useful short answers by default. DO NOT provide long, large text responses unless the user explicitly asks for more detail.
- **NEVER Ask Unnecessary Questions**: NEVER end your response with a question. NEVER ask the user what to do next or if they want to hear more. Only answer questions, do not ask them unless explicitly told to do so.
- **Proactive Task Completion**: Complete all tasks fully and efficiently. Avoid unnecessary verbosity unless the user asks for in-depth details.
- **Intelligent Human Partner**: Communicate like an intelligent human conversational partner. Prioritize brevity, directness, and utility by default.
- **Expressive Prosody**: For voice generation, act with natural prosody, varied pacing, realistic rhythm, and clear pronunciation.
- **Adaptability**: Adapt naturally to the tone of the conversation. Handle interruptions gracefully and pick up the context seamlessly.
- **Multilingual Naturalness**: Maintain this expressive, human-like conversational quality across all supported languages (English, Amharic, Tigrinya), ensuring cultural and linguistic authenticity.

Language Instructions:
1. Language Match: Detect and match the user's language and regional nuance PERFECTLY, especially for Amharic, Tigrinya, and English.
2. Amharic Guidance: Prioritize cultural accuracy and appropriate Ge'ez script usage. Respect formal/informal nuances (erswo/ante/anchi) and regional variations.
3. Tigrinya Guidance: Use authentic phrasing and respect Tigray/Eritrean dialectal differences where applicable.
4. Conversation: Your speech is being transcribed in real-time.
5. Control: If the user interrupts, stop speaking immediately.
6. Tool Usage: For informational queries that require current or specific, verifiable information, explicitly use the Google Search tool to ground your response with up-to-date sources. If search is used, you MUST provide explicit source references.`;

        // connectToLiveAPI returns a Promise<LiveSession>
        let voiceName = getVoiceForModeAndGender(
          activeAiMode,
          activeVoiceGender,
        );

        const foundProfile = TIGRINYA_VOICES.find(
          v => v.name.toLowerCase() === selectedSpeaker.toLowerCase() || v.id.toLowerCase() === selectedSpeaker.toLowerCase()
        );
        if (foundProfile) {
          voiceName = foundProfile.baseVoice;
        } else if (selectedSpeaker && selectedSpeaker !== 'Kore' && selectedSpeaker !== 'Puck') {
          voiceName = selectedSpeaker;
        }

        const session = await connectToLiveAPI(
          callbacks,
          instructions,
          voiceName,
        );
        liveSessionRef.current = session;
      } catch (err: any) {
        const errName = err.name || "";
        const errMsg = err.message || "";

        if (
          errName === "NotAllowedError" ||
          errName === "PermissionDeniedError" ||
          errMsg.toLowerCase().includes("permission denied")
        ) {
          console.warn(
            "Session Start Failed due to microphone permission:",
            err,
          );
          setShowMicPermissionModal(true);
        } else if (
          errName === "NotFoundError" ||
          errName === "DevicesNotFoundError" ||
          errMsg.toLowerCase().includes("requested device not found") ||
          errMsg.toLowerCase().includes("no microphone device")
        ) {
          console.error("Session Start Failed:", err);
          showToast(
            "No microphone found. Please connect one and ensure it's enabled.",
          );
        } else if (
          errName === "NotReadableError" ||
          errName === "TrackStartError" ||
          errMsg.includes("Could not start audio source")
        ) {
          console.error("Session Start Failed:", err);
          showToast("Microphone is in use by another application.");
        } else {
          console.error("Session Start Failed:", err);
          showToast(
            errMsg || "Failed to start Live Talk. Please check your settings.",
          );
        }
        stopLiveSession();
      }
    },
    [isLiveMode, stopLiveSession, chatTone, activeLanguage],
  );

  const toggleLiveMode = () => {
    if (isLiveMode) stopLiveSession();
    else startLiveSession();
  };

  const toggleLivePause = () => {
    const nextVal = !isLivePaused;
    setIsLivePaused(nextVal);
    isLivePausedRef.current = nextVal;
    if (nextVal) {
      setLiveTalkState("paused");
      liveStreamerRef.current?.stop();
    } else {
      setLiveTalkState("listening");
      playConfirmationTone(); // Play tone on resume
    }
  };

  const toggleMicMute = () => {
    const nextVal = !isMicMuted;
    setIsMicMuted(nextVal);
    isMicMutedRef.current = nextVal;
    showToast(nextVal ? "🎤 Microphone Muted" : "🎤 Microphone Active");
  };

  const handleContinueLiveResponse = () => {
    if (!liveSessionRef.current) return;
    setLastWasInterrupted(false);

    let continuePrompt = "Please continue what you were saying.";
    if (activeLanguage === "ti") {
      continuePrompt = "እባክኻ ዝነበርካዮ ቀጽሎ።";
    } else if (activeLanguage === "am") {
      continuePrompt = "እባክህ የቀጠለውን ቀጥል።";
    }

    try {
      if (typeof (liveSessionRef.current as any).sendText === "function") {
        (liveSessionRef.current as any).sendText(continuePrompt);
        showToast(
          activeLanguage === "ti"
            ? "መቀጸልታ ይሕተት ኣሎ..."
            : activeLanguage === "am"
              ? "መቀጠል እየተጠየቀ ነው..."
              : "Requesting to continue...",
        );
      }
    } catch (err) {
      console.error("Failed to send continue command:", err);
    }
  };

  const handleGenerateTTS = async (textToRead: string, index: number) => {
    setIsGeneratingTTS(true);
    setPlayingChatTtsIndex(index);
    try {
      const voiceName =
        selectedSpeaker ||
        getVoiceForModeAndGender(activeAiMode, activeVoiceGender);
      const data = await generateTTS(
        textToRead,
        voiceName,
        selectedSpeechModel,
      );
      if (data) {
        setAudioData(data);
        await playBase64Audio(data);
      } else {
        throw new Error("No audio returned");
      }
    } catch (e: any) {
      console.warn("TTS quota reached or failed, using web speech fallback:", e);
      if (e?.message === "QUOTA_EXCEEDED") {
        showToast("Voice quota reached. Playing with web speech fallback...");
      } else {
        showToast("Playing with web speech fallback...");
      }
      await speakWithWebSpeech(textToRead, 'ti');
    } finally {
      setIsGeneratingTTS(false);
      setPlayingChatTtsIndex(null);
    }
  };

  const handleDownloadMessageAudio = async (textToDownload: string) => {
    setIsGeneratingTTS(true);
    try {
      const voiceName =
        selectedSpeaker ||
        getVoiceForModeAndGender(activeAiMode, activeVoiceGender);
      const data = await generateTTS(
        textToDownload,
        voiceName,
        selectedSpeechModel,
      );
      if (data) {
        downloadWav(data, `chat_audio_${Date.now()}.wav`);
        showToast("Download started");
      }
    } catch (e) {
      console.error(e);
      showToast("Download failed");
    } finally {
      setIsGeneratingTTS(false);
    }
  };

  const handleGenerateScript = async () => {
    if (!chatInput.trim()) {
      return;
    }
    const topic = chatInput;
    const userMessage: ChatMessage = {
      role: "user",
      parts: `Generate video script for: ${topic}`,
    };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");

    try {
      const data = await callGeminiAPI(
        "gemini-3.1-pro-preview",
        `Create a detailed video blueprint for: ${topic}. 
      Include:
      1. 3 Video Title suggestions (optimized for SEO).
      2. Optimized Video Tags.
      3. An attention-grabbing hook (for the first 5-10 seconds).
      4. A scene-by-scene breakdown (Time, Visual Description, Voiceover Script, Pacing Cues).
      5. Voiceover tone and style suggestions.
      6. Thumbnail cover description.
      Provide the output in a clear, structured Markdown format.`,
        {
          aiModelMode: "thinking",
        },
      );
      const assistantMessage: ChatMessage = { role: "model", parts: data.text };
      setChatMessages((prev) => [...prev, assistantMessage]);
    } catch (e) {
      setChatMessages((prev) => [
        ...prev,
        { role: "model", parts: "Failed to generate content." },
      ]);
    }
  };

  const handleSendChatMessage = async () => {
    if ((!chatInput.trim() && attachedFiles.length === 0) || isAssistantTyping)
      return;
    setChatSuggestions([]);

    if (isLiveMode) {
      const textVal = chatInput.trim();
      const currentAttachments = [...attachedFiles];
      setChatInput("");
      setAttachedFiles([]);

      const userMessage: ChatMessage = {
        role: "user",
        parts: textVal,
        attachedFiles: currentAttachments,
      };
      setChatMessages((prev) => [...prev, userMessage]);

      if (liveSessionRef.current) {
        try {
          // 1. Process image attachments for multimodal Live API input
          const imgFile = currentAttachments.find(
            (f) => f.mimeType.startsWith("image/") && f.base64,
          );

          // 2. Process text/document attachments
          const docFiles = currentAttachments.filter(
            (f) =>
              f.textAlternative ||
              (!f.mimeType.startsWith("image/") && f.base64),
          );
          let docContext = "";
          docFiles.forEach((doc) => {
            docContext += `\n\n[Attached Document: ${doc.name}]\n${doc.textAlternative || ""}`;
          });

          // 3. Detect and scrape links on the fly in Live Mode
          const urlRegex = /(https?:\/\/[^\s]+)/gi;
          const urls = textVal.match(urlRegex);
          let linkContext = "";
          if (urls && urls.length > 0) {
            showToast(`Analyzing ${urls.length} link(s) for Live Assistant...`);
            try {
              const scrapeResults = await Promise.all(
                urls.map(async (url) => {
                  try {
                    const res = await fetch("/api/gemini/scrapeUrl", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ url }),
                    });
                    if (res.ok) {
                      const data = await res.json();
                      return `\n\n[Real-Time Link Analysis of: ${url}]\nTitle: ${data.title}\nContent excerpt:\n${data.content}`;
                    }
                  } catch (err) {
                    console.error("Live link scrape error:", err);
                  }
                  return "";
                }),
              );
              linkContext = scrapeResults.filter(Boolean).join("\n");
              if (linkContext) {
                showToast("Links ingested successfully!");
              }
            } catch (err) {
              console.error("Live link processing failure:", err);
            }
          }

          const finalMessageText = textVal + docContext + linkContext;

          if (imgFile) {
            if (typeof (liveSessionRef.current as any).sendRaw === "function") {
              (liveSessionRef.current as any).sendRaw({
                text: finalMessageText || "Please analyze this image.",
                image: {
                  base64: imgFile.base64,
                  mimeType: imgFile.mimeType,
                },
              });
              showToast("Sent image to Live Assistant");
            } else if (
              typeof (liveSessionRef.current as any).sendText === "function"
            ) {
              (liveSessionRef.current as any).sendText(
                finalMessageText +
                  `\n\n[An image was uploaded but server bridge only supports text over this channel]`,
              );
            }
          } else {
            if (
              typeof (liveSessionRef.current as any).sendText === "function"
            ) {
              (liveSessionRef.current as any).sendText(finalMessageText);
            }
          }
        } catch (wsError) {
          console.error(
            "Failed to send content to WebSocket live session:",
            wsError,
          );
        }
      }
    } else {
      sendToAI(chatInput, chatMessages);
    }
  };

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    // Check if the user is near the bottom (within 150px)
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      150;

    // Always auto-scroll during live talk to keep transcript visible, or if near bottom in text mode
    if (isNearBottom || isLiveMode) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
  }, [
    chatMessages,
    displayedStreamingResponse,
    liveSessionHistory,
    liveTranscript,
    liveResponseTranscript,
    isLiveMode,
  ]);

  const [activePhonetic, setActivePhonetic] = useState("");
  const [cursorIndex, setCursorIndex] = useState(0);
  const cursorIndexRef = useRef(0);
  useEffect(() => {
    cursorIndexRef.current = cursorIndex;
  }, [cursorIndex]);

  const [shortcuts, setShortcuts] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("keyboard_shortcuts");
      if (!saved || saved === "null" || saved === "undefined")
        return { adr: "Addis Ababa" };
      const parsed = JSON.parse(saved);
      return parsed && typeof parsed === "object"
        ? parsed
        : { adr: "Addis Ababa" };
    } catch {
      return { adr: "Addis Ababa" };
    }
  });
  const [newShortcutKey, setNewShortcutKey] = useState("");

  const [newShortcutValue, setNewShortcutValue] = useState("");

  useEffect(() => {
    localStorage.setItem("keyboard_shortcuts", JSON.stringify(shortcuts));
  }, [shortcuts]);

  useEffect(() => {
    if (keyboardTarget === "chat") {
      const el = document.getElementById(
        "chat-input-textarea",
      ) as HTMLTextAreaElement;
      if (el) {
        // Need to set selection asynchronously to avoid fighting with React's DOM update
        setTimeout(() => {
          el.setSelectionRange(chatCursorIndex, chatCursorIndex);
        }, 0);
      }
    }
  }, [chatInput, chatCursorIndex, keyboardTarget]);

  const [isCursorMode, setIsCursorMode] = useState(false);
  const swipeStartX = useRef<number | null>(null);
  const lastMoveRef = useRef<number>(0);

  useEffect(() => {
    if (text === "") setCursorIndex(0);
  }, [text]);

  const getExpandedInfo = useCallback(() => {
    const curText = getTargetText();
    const curIndex = getTargetIndex();
    const textBeforeCursor = curText.slice(0, curIndex);
    const lastWordMatch = textBeforeCursor.match(/(\S+)$/);

    if (lastWordMatch) {
      const lastWord = lastWordMatch[1];
      const expansion = shortcuts[lastWord.toLowerCase()];

      if (expansion) {
        const newText =
          curText.slice(0, curIndex - lastWord.length) +
          expansion +
          curText.slice(curIndex);
        const newCursorIndex = curIndex - lastWord.length + expansion.length;
        return { newText, newCursorIndex };
      }
    }
    return null;
  }, [
    text,
    cursorIndex,
    chatInput,
    chatCursorIndex,
    shortcuts,
    keyboardTarget,
  ]);

  const [clipboardItems, setClipboardItems] = useState<string[]>([]);
  const [pinnedItems, setPinnedItems] = useState<string[]>([]);

  const [isClipboardOpen, setIsClipboardOpen] = useState(false);

  const [clipboardActionMenu, setClipboardActionMenu] = useState<{
    item: string;
    isPinned: boolean;
    x: number;
    y: number;
  } | null>(null);

  const currentTheme =
    themeKey === "system"
      ? systemIsDark
        ? THEMES.dark
        : THEMES.light
      : isThemeScheduled
        ? isScheduledDark
          ? THEMES.dark
          : THEMES.light
        : THEMES[themeKey as keyof typeof THEMES] || THEMES.dark;

  // Long press state
  const [vowelMenu, setVowelMenu] = useState<{
    key: string;
    variations: string[];
    x: number;
    y: number;
  } | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const speechRetryCountRef = useRef<number>(0);
  const isSpeechRecognitionSupported = !!(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  );
  const [enhancedTigrinyaMode, setEnhancedTigrinyaMode] = useState(false);
  const enhancedMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const enhancedChunksRef = useRef<BlobPart[]>([]);
  const [isEnhancedRecording, setIsEnhancedRecording] = useState(false);

  // Initialize Speech Recognition
  useEffect(() => {
    listeningTargetRef.current = listeningTarget;
  }, [listeningTarget]);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      const currentLang = activeLanguage || "ti";
      const langMap: Record<string, string> = {
        ti: "ti-ER",
        am: "am-ET",
        en: "en-US",
        gez: "am-ET",
        om: "om-ET",
        sid: "sid-ET",
      };
      recognitionRef.current.lang = langMap[currentLang] || "en-US";

      recognitionRef.current.onresult = (event: any) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        setInterimTranscript(interim);

        if (final) {
          if (listeningTargetRef.current === "chat") {
            setChatInput((prev) => prev + final + " ");
          } else {
            setText((prev) => {
              const index = cursorIndexRef.current;
              // Ensure proper spacing when appending text via voice
              const insertText =
                (prev[index - 1] === " " || index === 0 ? "" : " ") +
                final +
                " ";
              const newText =
                prev.slice(0, index) + insertText + prev.slice(index);
              setCursorIndex(index + insertText.length);
              return newText;
            });
          }
        }
      };

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => {
        setIsListening(false);
        setInterimTranscript("");
      };
      recognitionRef.current.onerror = (event: any) => {
        console.error("Recognition error:", event.error);
        if (
          event.error === "not-allowed" ||
          event.error === "service-not-allowed"
        ) {
          setShowMicPermissionModal(true);
        } else if (event.error === "network" || event.error === "no-speech") {
          if (speechRetryCountRef.current < 2) {
            speechRetryCountRef.current += 1;
            try {
              recognitionRef.current.start();
              return; // Skip setting isListening to false
            } catch (e) {
              console.error("Retry failed", e);
            }
          }
          if (event.error === "network") {
            showToast("Network error. Check your connection.");
          }
        } else {
          showToast(`Voice input error: ${event.error}`);
        }
        setIsListening(false);
        setInterimTranscript("");
      };
    }
  }, [activeLanguage]);

  // Load layout and theme from local storage
  useEffect(() => {
    const savedLayout = localStorage.getItem("geez_keyboard_layout");

    if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout);

        // Auto-migration for mic and emoji keys
        const needsMigration = parsed.some((row: string[]) => {
          const isBottomRow =
            row.includes("123") || row.includes("ABC") || row.includes("space");
          if (isBottomRow) {
            return !row.includes("mic") || !row.includes("emoji");
          }
          return false;
        });

        if (needsMigration) {
          parsed.forEach((row: string[]) => {
            const globeIdx = row.indexOf("globe");
            if (globeIdx !== -1) {
              if (!row.includes("mic")) row.splice(globeIdx + 1, 0, "mic");
              const micIdx = row.indexOf("mic");
              if (!row.includes("emoji")) row.splice(micIdx + 1, 0, "emoji");
            }
          });
        }

        setLayout(parsed);
      } catch (e) {
        console.error("Failed to load layout", e);
      }
    }

    const savedTheme = localStorage.getItem("geez_keyboard_theme") as ThemeKey;
    if (savedTheme && THEMES[savedTheme]) {
      setThemeKey(savedTheme);
    }

    const onboardingComplete = localStorage.getItem("geez_onboarding_complete");
    if (!onboardingComplete) {
      setShowOnboarding(true);
    }
  }, []);

  // Auto-scroll to bottom of text area
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }

    // Update suggestions and auto-correct
    const targetText = keyboardTarget === "main" ? text : chatInput;
    const targetIndex =
      keyboardTarget === "main" ? cursorIndex : chatCursorIndex;
    const beforeCursor = targetText.slice(0, targetIndex);

    // Only show suggestions if we are actively typing a word
    if (
      !beforeCursor ||
      beforeCursor.endsWith(" ") ||
      beforeCursor.endsWith("\n")
    ) {
      setSuggestions([]);
      return;
    }

    const words = beforeCursor.trim().split(/\s+/);
    const lastWord = words[words.length - 1];

    if (!lastWord) {
      setSuggestions([]);
      return;
    }

    // Real-time dictionary lookup based on active language
    const dictionaryMatches = getSuggestions(
      lastWord,
      activeLanguage,
      userDictionary,
    );

    let foundSuggestions = [];

    // 1. Prioritize Auto-correct
    if (AUTOCORRECT_MAP[lastWord]) {
      foundSuggestions.push(AUTOCORRECT_MAP[lastWord]);
    }

    // 2. Add Dictionary matches
    if (dictionaryMatches.length > 0) {
      foundSuggestions = [
        ...foundSuggestions,
        ...dictionaryMatches.filter((m) => !foundSuggestions.includes(m)),
      ];
    }

    setSuggestions(foundSuggestions.slice(0, 5));
  }, [
    text,
    chatInput,
    cursorIndex,
    chatCursorIndex,
    keyboardTarget,
    activeLanguage,
    userDictionary,
    shortcuts,
    activePhonetic,
  ]);

  // Real-time Translation (Debounced)
  useEffect(() => {
    if (!activeMenus.translationBar) return;
    if (!translationInput.trim()) {
      setTranslationOutput("");
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsTranslatingRealtime(true);
      try {
        const source =
          WORLD_LANGUAGES.find((l) => l.code === sourceLang)?.name ||
          "Auto-Detect";
        const target =
          WORLD_LANGUAGES.find((l) => l.code === targetLang)?.name ||
          "Tigrinya";

        const response = await callGeminiAPI(
          "gemini-3.5-flash",
          `You are a translation expert. Translate the following text from ${source} to ${target}. Return only the translated text. Do not include any explanations or alternative versions.\n\nText: ${translationInput}`,
        );

        const translated = response.text;
        if (translated) {
          setTranslationOutput(translated.trim());
        }
      } catch (err) {
        console.error("Real-time translation failed:", err);
      } finally {
        setIsTranslatingRealtime(false);
      }
    }, 800); // 800ms debounce

    return () => clearTimeout(timeoutId);
  }, [translationInput, sourceLang, targetLang, activeMenus.translationBar]);

  const applyFormatting = (format: "bold" | "italic" | "underline") => {
    let startMarker = "";
    let endMarker = "";

    switch (format) {
      case "bold":
        startMarker = "**";
        endMarker = "**";
        break;
      case "italic":
        startMarker = "*";
        endMarker = "*";
        break;
      case "underline":
        startMarker = "<u>";
        endMarker = "</u>";
        break;
    }

    const newText =
      text.slice(0, cursorIndex) +
      startMarker +
      endMarker +
      text.slice(cursorIndex);
    setText(newText);
    setCursorIndex((prev) => prev + startMarker.length);
    toggleMenu("format");
  };

  const addTranslationToHistory = (
    sourceText: string,
    translatedText: string,
    sourceLang: string,
    targetLang: string,
  ) => {
    if (!sourceText.trim() || !translatedText.trim()) return;
    setTranslationHistory((prev) => {
      // Avoid duplicate consecutive entries
      if (
        prev.length > 0 &&
        prev[0].sourceText === sourceText &&
        prev[0].translatedText === translatedText
      ) {
        return prev;
      }
      const newItem = {
        id: Date.now().toString(),
        sourceText,
        translatedText,
        sourceLang,
        targetLang,
        timestamp: Date.now(),
      };
      return [newItem, ...prev].slice(0, 50); // Keep last 50
    });
  };

  const handleTranslate = async () => {
    // Determine which text to translate: prefer widget input if open and not empty
    const isWidget =
      activeMenus.translationBar && translationInput.trim().length > 0;
    const textToTranslate = isWidget ? translationInput : text;

    if (!textToTranslate || isTranslating) return;
    setIsTranslating(true);
    setIsProcessing(true);

    try {
      const source =
        WORLD_LANGUAGES.find((l) => l.code === sourceLang)?.name ||
        "Auto-Detect";
      const target =
        WORLD_LANGUAGES.find((l) => l.code === targetLang)?.name || "Tigrinya";

      const response = await callGeminiAPI(
        "gemini-3.5-flash",
        `You are a translation expert. Translate the following text from ${source} to ${target}. Return only the translated text. Do not include any explanations or alternative versions.\n\nText: ${textToTranslate}`,
      );

      const translation = response.text;
      if (translation) {
        if (isWidget) {
          setTranslationOutput(translation.trim());
        } else {
          setText(translation);
          setCursorIndex(translation.length);
        }
        addTranslationToHistory(
          textToTranslate,
          translation.trim(),
          sourceLang,
          targetLang,
        );
      }
    } catch (err) {
      console.error("Translation failed:", err);
      showErrorMessage("Translation failed. Check API key.");
    } finally {
      setIsTranslating(false);
      setIsProcessing(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim() || isGeneratingImage) return;
    setIsGeneratingImage(true);
    setGeneratedImage(null);
    try {
      const response = await callGeminiImageAPI(
        "imagen-4.0-generate-001",
        imagePrompt,
        {
          numberOfImages: 1,
          outputMimeType: "image/jpeg",
          aspectRatio: imageAspectRatio as any,
        },
      );
      const base64EncodeString =
        response.generatedImages?.[0]?.image?.imageBytes;
      if (base64EncodeString) {
        setGeneratedImage(`data:image/jpeg;base64,${base64EncodeString}`);
        showToast("Artwork generated successfully!");
      } else {
        showToast("No image data returned.");
      }
    } catch (err) {
      console.error("Image generation failed:", err);
      showToast("Generation failed. Check your API key.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleAIMagic = async () => {
    if (!text.trim()) return;
    toggleMenu("tone");
  };

  const processToneRewrite = async (tone: string) => {
    setActiveMenus((prev) => ({ ...prev, tone: false }));
    setIsToneAdjusting(true);
    setIsProcessing(true);
    try {
      const response = await callGeminiAPI(
        "gemini-3.5-flash",
        `Rewrite the following text to have a ${tone} tone: ${text}`,
      );

      const adjusted = response.text;
      if (adjusted) {
        setText(adjusted.trim());
        setCursorIndex(adjusted.trim().length);
      }
    } catch (err) {
      console.error("AI Magic failed:", err);
      // showErrorMessage("AI Magic failed.");
    } finally {
      setIsToneAdjusting(false);
      setIsProcessing(false);
    }
  };

  const handleApplyTone = async () => {
    if (!selectedTone || chatInput.length < 2) return;
    setIsToneAdjusting(true);
    try {
      const response = await callGeminiAPI(
        "gemini-3.5-flash",
        `Rewrite the following text to have a ${selectedTone} tone: ${chatInput}`,
      );

      const adjusted = response.text;
      if (adjusted) {
        setChatInput(adjusted.trim());
        toggleMenu("tone");
      }
    } catch (err) {
      console.error("Tone adjustment failed:", err);
      showToast("Tone adjustment failed.");
    } finally {
      setIsToneAdjusting(false);
    }
  };

  const exportText = (format: "txt" | "rtf") => {
    const blob = new Blob([text], {
      type: format === "txt" ? "text/plain" : "application/rtf",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `document.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    toggleMenu("export");
  };

  const handleReadTextAloud = async () => {
    if (!text.trim() || isGeneratingTTS) return;
    setIsGeneratingTTS(true);
    try {
      showToast("Generating audio...");
      const voiceName =
        selectedSpeaker ||
        getVoiceForModeAndGender(activeAiMode, activeVoiceGender);
      const audioBase64 = await generateTTS(
        text,
        voiceName,
        selectedSpeechModel,
      );
      if (audioBase64) {
        await playBase64Audio(audioBase64, 24000);
      } else {
        throw new Error("No audio data returned");
      }
    } catch (err) {
      console.error("TTS failed:", err);
      showToast("Reading with local speech engine...");
      await speakWithWebSpeech(text, 'ti');
    } finally {
      setIsGeneratingTTS(false);
    }
  };

  const handlePlayChatTts = async (messageParts: string, index: number) => {
    if (playingChatTtsIndex === index || isGeneratingTTS) return;
    setPlayingChatTtsIndex(index);
    try {
      const voiceName =
        selectedSpeaker ||
        getVoiceForModeAndGender(activeAiMode, activeVoiceGender);
      const audioBase64 = await generateTTS(
        messageParts,
        voiceName,
        selectedSpeechModel,
      );
      if (audioBase64) {
        await playBase64Audio(audioBase64, 24000);
      } else {
        throw new Error("No audio data returned");
      }
    } catch (err) {
      console.error("Chat TTS failed:", err);
      showToast("Reading with local speech engine...");
      await speakWithWebSpeech(messageParts, 'ti');
    } finally {
      if (playingChatTtsIndex === index) {
        // prevent overriding another play
        setPlayingChatTtsIndex(null);
      }
      setPlayingChatTtsIndex(null);
    }
  };

  const toggleListening = async (target: "main" | "chat" = "main") => {
    if (isListening || isEnhancedRecording) {
      if (isEnhancedRecording && enhancedMediaRecorderRef.current) {
        enhancedMediaRecorderRef.current.stop();
      } else if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      return;
    }

    setListeningTarget(target);
    speechRetryCountRef.current = 0; // Reset retry count

    if (enhancedTigrinyaMode) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const recorder = new MediaRecorder(stream);
        enhancedMediaRecorderRef.current = recorder;
        enhancedChunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) enhancedChunksRef.current.push(e.data);
        };

        recorder.onstart = () => {
          setIsEnhancedRecording(true);
          // Short audio recorder mode: auto-stop after 5 seconds
          setTimeout(() => {
            if (
              enhancedMediaRecorderRef.current &&
              enhancedMediaRecorderRef.current.state === "recording"
            ) {
              enhancedMediaRecorderRef.current.stop();
            }
          }, 5000);
        };

        recorder.onstop = async () => {
          setIsEnhancedRecording(false);
          stream.getTracks().forEach((track) => track.stop());
          const blob = new Blob(enhancedChunksRef.current, {
            type: recorder.mimeType || "audio/webm",
          });

          // Convert blob to base64
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = async () => {
            const base64data = reader.result as string;
            const base64Audio = base64data.split(",")[1];
            let mimeType =
              base64data.split(";")[0].split(":")[1] || "audio/webm";

            try {
              showToast("Transcribing...");
              const lang =
                target === "chat"
                  ? chatLanguage === "auto"
                    ? "ti"
                    : chatLanguage
                  : activeLanguage;
              const text = await geminiTranscribe(base64Audio, mimeType, lang);

              if (text) {
                if (target === "chat") {
                  setChatInput((prev) => prev + text + " ");
                } else {
                  setText((prev) => {
                    const index = cursorIndexRef.current;
                    const insertText =
                      (prev[index - 1] === " " || index === 0 ? "" : " ") +
                      text +
                      " ";
                    const newText =
                      prev.slice(0, index) + insertText + prev.slice(index);
                    setCursorIndex(index + insertText.length);
                    return newText;
                  });
                }
              }
            } catch (err) {
              console.error("Enhanced transcription failed", err);
              showToast("Transcription failed. Please try again.");
            }
          };
        };

        recorder.start();
      } catch (err: any) {
        console.error("Mic access denied for enhanced mode", err);
        showToast("Microphone access denied. Check your browser permissions.");
      }
      return;
    }

    if (recognitionRef.current) {
      if (target === "chat") {
        const langMap: Record<string, string> = {
          ti: "ti-ER",
          am: "am-ET",
          en: "en-US",
          auto: "ti-ER",
        };
        // @ts-ignore
        recognitionRef.current.lang = langMap[chatLanguage] || "ti-ER";
      } else {
        recognitionRef.current.lang =
          activeLanguage === "en"
            ? "en-US"
            : activeLanguage === "am"
              ? "am-ET"
              : "ti-ER";
      }

      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          // On mobile some browsers need us to explicitly request getUserMedia before SpeechRecognition
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              audio: true,
            });
            stream.getTracks().forEach((track) => track.stop());
          } catch (ignore) {}
        }
        recognitionRef.current.start();
      } catch (e: any) {
        console.error("Failed to start recognition", e);
        if (e.name === "NotAllowedError") {
          setShowMicPermissionModal(true);
        } else {
          showToast("Failed to start mic.");
        }
      }
    }
  };

  const handleSpaceSwipeStart = (e: any) => {
    const clientX = e.type.startsWith("touch")
      ? e.touches[0].clientX
      : e.clientX;
    swipeStartX.current = clientX;
    lastMoveRef.current = 0;
    setIsCursorMode(true);
  };

  const handleSpaceSwipeMove = (e: any) => {
    if (swipeStartX.current === null) return;
    const clientX = e.type.startsWith("touch")
      ? e.touches[0].clientX
      : e.clientX;
    const deltaX = clientX - swipeStartX.current;

    // Sensitivity: 15px per character
    const sensitivity = 15;
    const moveCount = Math.round(deltaX / sensitivity);

    if (moveCount !== lastMoveRef.current) {
      const diff = moveCount - lastMoveRef.current;
      setCursorIndex((prev) => {
        const next = Math.max(0, Math.min(text.length, prev + diff));
        if (next !== prev) {
          if (window.navigator?.vibrate) window.navigator.vibrate(10);
        }
        return next;
      });
      lastMoveRef.current = moveCount;
    }
  };

  const handleSpaceSwipeEnd = () => {
    if (swipeStartX.current !== null && lastMoveRef.current === 0) {
      handleKeyPress("space", 0, 0);
    }
    swipeStartX.current = null;
    setIsCursorMode(false);
    lastMoveRef.current = 0;
  };

  const handleLayoutEdit = useCallback(
    (rowIndex: number, colIndex: number) => {
      if (!selectedKey) setSelectedKey({ row: rowIndex, col: colIndex });
      else {
        const newLayout = [...layout.map((row) => [...row])];
        const temp = newLayout[selectedKey.row][selectedKey.col];
        newLayout[selectedKey.row][selectedKey.col] =
          newLayout[rowIndex][colIndex];
        newLayout[rowIndex][colIndex] = temp;
        setLayout(newLayout);
        setSelectedKey(null);
      }
    },
    [layout, selectedKey],
  );

  // --- TRANSLITERATION ENGINE (Ge'ez logic) ---
  const processGeezLogic = (
    key: string,
    currentText: string,
    currentIndex: number,
  ) => {
    // If it's not a latin letter (e.g., already a Ge'ez character chosen from the virtual layout),
    // insert it exactly as is!
    if (key.length === 1 && !/[a-zA-Z_]/.test(key)) {
      updateTargetText(
        (prev) => prev.slice(0, currentIndex) + key + prev.slice(currentIndex),
      );
      updateTargetIndex(currentIndex + 1);
      return false;
    }

    const lowerKey = key.toLowerCase();

    // 1. Check if we can modify the last character
    if (currentIndex > 0) {
      const lastChar = currentText[currentIndex - 1];

      // Retrieve the Geez family and its current index for the previous character
      let foundFamilyKey: string | null = null;
      let foundFamilyIdx = -1;
      let foundFamilyArray: string[] = [];

      for (const [fKey, forms] of Object.entries(GEEZ_MAP)) {
        const idx = forms.indexOf(lastChar);
        if (idx !== -1) {
          foundFamilyKey = fKey;
          foundFamilyIdx = idx;
          foundFamilyArray = forms;
          break;
        }
      }

      if (foundFamilyKey && foundFamilyIdx !== -1) {
        // --- MULTIGRAPH CONSONANT TRANSLATIONS ---
        // Typing a consonant after another consonant, e.g. sh, ss, ch, dd, kh, zh
        let nextFamilyKey: string | null = null;

        if (foundFamilyKey === "ሰ" && (lowerKey === "h" || lowerKey === "s"))
          nextFamilyKey = "ሸ";
        else if (
          foundFamilyKey === "ተ" &&
          (lowerKey === "t" || lowerKey === "c")
        )
          nextFamilyKey = "ቸ";
        else if (
          foundFamilyKey === "ከ" &&
          (lowerKey === "h" || lowerKey === "k" || lowerKey === "x")
        )
          nextFamilyKey = "ኸ";
        else if (
          foundFamilyKey === "ዘ" &&
          (lowerKey === "h" || lowerKey === "z")
        )
          nextFamilyKey = "ዠ";
        else if (foundFamilyKey === "ደ" && lowerKey === "d")
          nextFamilyKey = "ጀ";
        else if (foundFamilyKey === "ገ" && key === "_") nextFamilyKey = "ጘ";
        else if (foundFamilyKey === "ሐ" && key === "_") nextFamilyKey = "ኀ";
        else if (foundFamilyKey === "ቸ" && key === "_") nextFamilyKey = "ጨ";

        if (nextFamilyKey && GEEZ_MAP[nextFamilyKey]) {
          const targetForms = GEEZ_MAP[nextFamilyKey];
          // Replace last character with corresponding vowel form in the new family
          const newChar = targetForms[foundFamilyIdx] || targetForms[5];
          updateTargetText(
            (prev) =>
              prev.slice(0, currentIndex - 1) +
              newChar +
              prev.slice(currentIndex),
          );
          return true;
        }

        // --- VOWEL MODIFICATIONS ---
        // u -> index 1
        // i -> index 2
        // a -> index 3
        // e -> index 4 (or index 0 if it's the first order)
        // o -> index 6
        if (lowerKey === "u") {
          const newChar = foundFamilyArray[1] || lastChar;
          updateTargetText(
            (prev) =>
              prev.slice(0, currentIndex - 1) +
              newChar +
              prev.slice(currentIndex),
          );
          return true;
        }
        if (lowerKey === "i") {
          const newChar = foundFamilyArray[2] || lastChar;
          updateTargetText(
            (prev) =>
              prev.slice(0, currentIndex - 1) +
              newChar +
              prev.slice(currentIndex),
          );
          return true;
        }
        if (lowerKey === "a") {
          // If already index 3 (fourth order / 'a'), 'aa' -> index 7 (ʷa)
          if (foundFamilyIdx === 3 && foundFamilyArray[7]) {
            const newChar = foundFamilyArray[7];
            updateTargetText(
              (prev) =>
                prev.slice(0, currentIndex - 1) +
                newChar +
                prev.slice(currentIndex),
            );
            return true;
          } else {
            const newChar = foundFamilyArray[3] || lastChar;
            updateTargetText(
              (prev) =>
                prev.slice(0, currentIndex - 1) +
                newChar +
                prev.slice(currentIndex),
            );
            return true;
          }
        }
        if (lowerKey === "e" || key === "é") {
          // If already index 5 (sixth order, default) -> change to first order index 0 ('ä')
          // If already index 0 (first order, e.g. e button tapped again) -> change to fifth order index 4 ('ē')
          if (foundFamilyIdx === 5) {
            const newChar = foundFamilyArray[0];
            updateTargetText(
              (prev) =>
                prev.slice(0, currentIndex - 1) +
                newChar +
                prev.slice(currentIndex),
            );
            return true;
          } else if (foundFamilyIdx === 0 && foundFamilyArray[4]) {
            const newChar = foundFamilyArray[4];
            updateTargetText(
              (prev) =>
                prev.slice(0, currentIndex - 1) +
                newChar +
                prev.slice(currentIndex),
            );
            return true;
          } else {
            const newChar = foundFamilyArray[0] || lastChar;
            updateTargetText(
              (prev) =>
                prev.slice(0, currentIndex - 1) +
                newChar +
                prev.slice(currentIndex),
            );
            return true;
          }
        }
        if (lowerKey === "o") {
          const newChar = foundFamilyArray[6] || lastChar;
          updateTargetText(
            (prev) =>
              prev.slice(0, currentIndex - 1) +
              newChar +
              prev.slice(currentIndex),
          );
          return true;
        }
      }
    }

    // 2. Base consonant/vowel insertion
    // Lookup with priority to uppercase keys (for H, T, S, P, N)
    const exactLookup = PHONETIC_MAP[key] || PHONETIC_MAP[lowerKey];
    if (exactLookup) {
      let finalChar = exactLookup;
      // Default to sixth order (index 5) for consonants mapped in GEEZ_MAP (e.g. s -> ስ)
      if (GEEZ_MAP[exactLookup]) {
        // Lexilogos: consonants default to sixth order; vowels (like a, o) are their respective forms.
        if (lowerKey !== "a" && lowerKey !== "o") {
          finalChar = GEEZ_MAP[exactLookup][5] || GEEZ_MAP[exactLookup][0];
        } else {
          finalChar = GEEZ_MAP[exactLookup][0];
        }
      }
      updateTargetText(
        (prev) =>
          prev.slice(0, currentIndex) + finalChar + prev.slice(currentIndex),
      );
      updateTargetIndex(currentIndex + 1);
      return false;
    }

    // Fallback exactly to input character
    updateTargetText(
      (prev) => prev.slice(0, currentIndex) + key + prev.slice(currentIndex),
    );
    updateTargetIndex(currentIndex + 1);
    return false;
  };

  const handleKeyPress = useCallback(
    (key: string, rowIndex: number, colIndex: number) => {
      // Global Feedback
      playKeySound();
      if (window.navigator?.vibrate) window.navigator.vibrate(15);

      if (isEditing) {
        handleLayoutEdit(rowIndex, colIndex);
        return;
      }

      // Auto-focus the chat input text area if we are targeting chat input
      if (keyboardTarget === "chat") {
        const el = document.getElementById("chat-input-textarea");
        if (el && document.activeElement !== el) {
          (el as HTMLElement).focus();
        }
      }

      setActiveKey(key);
      setTimeout(() => setActiveKey(null), 100);

      const currentTargetText = getTargetText();
      const currentTargetIndex = getTargetIndex();

      // 1. NON-CHARACTER KEYS
      if (key === "backspace") {
        if (currentTargetIndex > 0) {
          updateTargetText(
            (prev) =>
              prev.slice(0, currentTargetIndex - 1) +
              prev.slice(currentTargetIndex),
          );
          updateTargetIndex((prev) => prev - 1);
        }
        return;
      }

      if (key === "space") {
        const expanded = getExpandedInfo();
        const txt = expanded ? expanded.newText : currentTargetText;
        const idx = expanded ? expanded.newCursorIndex : currentTargetIndex;
        updateTargetText(txt.slice(0, idx) + " " + txt.slice(idx));
        updateTargetIndex(idx + 1);
        setSuggestions([]);
        return;
      }

      if (key === "mic") {
        toggleListening(keyboardTarget === "chat" ? "chat" : "main");
        return;
      }
      if (key === "asr") {
        setEnhancedTigrinyaMode(!enhancedTigrinyaMode);
        return;
      }
      if (key === "emoji") {
        setIsEmojiMode(!isEmojiMode);
        setIsSymbols(false);
        return;
      }
      if (key === "enter") {
        if (keyboardTarget === "chat") {
          handleSendChatMessage();
          return;
        }
        const expanded = getExpandedInfo();
        const txt = expanded ? expanded.newText : currentTargetText;
        const idx = expanded ? expanded.newCursorIndex : currentTargetIndex;
        updateTargetText(txt.slice(0, idx) + "\n" + txt.slice(idx));
        updateTargetIndex(idx + 1);
        return;
      }
      if (key === "shift") {
        setIsShift(!isShift);
        return;
      }
      if (key === "globe") {
        cycleLanguage();
        return;
      }
      if (key === "123") {
        setIsSymbols(true);
        setIsEmojiMode(false);
        return;
      }
      if (key === "ABC") {
        setIsSymbols(false);
        setIsEmojiMode(false);
        if (activeLanguage === "en") setLayout(LATIN_ROWS);
        else if (activeLanguage === "ti") setLayout(TIGRINYA_ROWS);
        else if (activeLanguage === "am") setLayout(AMHARIC_ROWS);
        return;
      }

      // 2. THE GATEKEEPER LOGIC
      if (activeLanguage === "en" || isSymbols) {
        // --- BYPASS MODE ---
        const isUpper =
          isShift ||
          (key.length === 1 &&
            key === key.toUpperCase() &&
            /[a-zA-Z]/.test(key));
        const char = isUpper ? key.toUpperCase() : key;
        updateTargetText(
          (prev) =>
            prev.slice(0, currentTargetIndex) +
            char +
            prev.slice(currentTargetIndex),
        );
        updateTargetIndex((prev) => prev + 1);
      } else {
        // --- TRANSLITERATION MODE ---
        processGeezLogic(key, currentTargetText, currentTargetIndex);
      }

      if (isShift) setIsShift(false);
    },
    [
      isEditing,
      activeLanguage,
      isShift,
      layout,
      selectedKey,
      text,
      isListening,
      handleLayoutEdit,
      toggleListening,
      isSymbols,
      activeMenus,
      cursorIndex,
      getExpandedInfo,
      shortcuts,
      cycleLanguage,
      processGeezLogic,
    ],
  );

  // Global Keyboard listener for physical typing
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (!physicalKeyboardSync) return;
      // Ignore if using modifiers
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const activeEl = document.activeElement;
      const isInputFocused =
        activeEl &&
        (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA");
      const isChatFocused = activeEl?.id === "chat-input-textarea";

      // Auto-focus chat if typing outside
      if (!isInputFocused && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        document.getElementById("chat-input-textarea")?.focus();
      }

      if (activeLanguage !== "en") {
        const isTargetValid = !isInputFocused || isChatFocused;
        if (isTargetValid) {
          if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
            e.preventDefault();
            handleKeyPress(e.key, -1, -1);
          } else if (e.key === "." && !e.shiftKey) {
            e.preventDefault();
            handleKeyPress("።", -1, -1);
          } else if (e.key === "," && !e.shiftKey) {
            e.preventDefault();
            handleKeyPress("፣", -1, -1);
          } else if (e.key === ";" && !e.shiftKey) {
            e.preventDefault();
            handleKeyPress("፤", -1, -1);
          } else if (e.key === ":" && e.shiftKey) {
            e.preventDefault();
            handleKeyPress("፡", -1, -1);
          } else if (e.key === "Backspace") {
            if (!isInputFocused) {
              e.preventDefault();
              handleKeyPress("backspace", -1, -1);
            }
          } else if (e.key === "Enter") {
            if (!isInputFocused) {
              e.preventDefault();
              handleKeyPress("enter", -1, -1);
            }
          } else if (e.key === " " || e.key === "Spacebar") {
            e.preventDefault();
            handleKeyPress("space", -1, -1);
          }
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [activeLanguage, handleKeyPress, physicalKeyboardSync]);

  const startLongPress = (key: string, e: any) => {
    if (isEditing || activeLanguage === "en" || isSymbols) return;

    const baseKey = isShift ? key.toUpperCase() : key;
    const forms = GEEZ_MAP[baseKey];
    if (!forms || forms.length < 1) return;

    const target = e.currentTarget as HTMLElement;
    if (!target) return;

    longPressTimer.current = setTimeout(() => {
      const rect = target.getBoundingClientRect();
      // Ensure we have a meaningful set of variations, if only one, maybe don't show or just show that one?
      // For now, let's just make it show for all consonant keys.
      setVowelMenu({
        key: baseKey,
        variations: forms,
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
      playKeySound();
    }, 400); // Slightly faster
  };

  const selectVariation = (vowel: string) => {
    // Insert the vowel
    const curIdx = getTargetIndex();
    updateTargetText(
      (prev) => prev.slice(0, curIdx) + vowel + prev.slice(curIdx),
    );
    updateTargetIndex((p: number) => p + vowel.length);
    setVowelMenu(null);
    playKeySound();
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const saveLayout = () => {
    localStorage.setItem("geez_keyboard_layout", JSON.stringify(layout));
    setIsEditing(false);
    setSelectedKey(null);
  };

  const resetLayout = () => {
    let targetRows = TIGRINYA_ROWS;
    if (activeLanguage === "en") targetRows = LATIN_ROWS;
    else if (activeLanguage === "am") targetRows = AMHARIC_ROWS;

    setLayout(targetRows);
    localStorage.removeItem("geez_keyboard_layout");
    showToast(
      `Layout reset to ${activeLanguage === "en" ? "English" : activeLanguage === "am" ? "Amharic" : "Tigrinya"} Default`,
    );
  };

  const moveRow = (index: number, direction: "up" | "down") => {
    const newLayout = [...layout.map((row) => [...row])];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newLayout.length) return;
    [newLayout[index], newLayout[newIndex]] = [
      newLayout[newIndex],
      newLayout[index],
    ];
    setLayout(newLayout);
    showToast(`Row moved ${direction}`);
  };

  const moveKey = (direction: "left" | "right") => {
    if (!selectedKey) return;
    const { row, col } = selectedKey;
    const newLayout = [...layout.map((r) => [...r])];
    const newCol = direction === "left" ? col - 1 : col + 1;
    if (newCol < 0 || newCol >= newLayout[row].length) return;

    [newLayout[row][col], newLayout[row][newCol]] = [
      newLayout[row][newCol],
      newLayout[row][col],
    ];
    setLayout(newLayout);
    setSelectedKey({ row, col: newCol });
  };

  // Define lastWord for suggestion rendering
  const wordsForUI = text.trim().split(/\s+/);
  const lastWordForUI = wordsForUI[wordsForUI.length - 1];

  const changeTheme = (key: ThemeKey) => {
    setThemeKey(key);
    localStorage.setItem("geez_keyboard_theme", key);
    toggleMenu("theme");
  };

  const copyToClipboard = (content?: any) => {
    const textToCopy = typeof content === "string" ? content : text;
    navigator.clipboard.writeText(textToCopy);
    if (textToCopy.trim()) {
      addToClipboard(textToCopy);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaste = async () => {
    try {
      const pastedText = await navigator.clipboard.readText();
      if (!pastedText) return;

      // Calculate how many English letters are in the text
      const englishCharRatio =
        pastedText.length > 0
          ? pastedText.replace(/[^a-zA-Z]/g, "").length / pastedText.length
          : 0;

      const startIndex = cursorIndex;
      const endIndex = cursorIndex + pastedText.length;

      setText(
        (prev) =>
          prev.slice(0, cursorIndex) + pastedText + prev.slice(cursorIndex),
      );
      setCursorIndex(endIndex);

      setIsInputHighlighted(true);
      setTimeout(() => setIsInputHighlighted(false), 500);

      if (englishCharRatio > 0.3) {
        setShowPasteTranslationPrompt({
          text: pastedText,
          startIndex,
          endIndex,
        });
      }
    } catch (err) {
      console.error("Failed to paste:", err);
      showToast(
        "Clipboard access denied. Please paste manually using Ctrl+V or Cmd+V.",
      );
    }
  };

  const handlePasteTranslate = async () => {
    if (!showPasteTranslationPrompt || isTranslating) return;
    const {
      text: textToTranslate,
      startIndex,
      endIndex,
    } = showPasteTranslationPrompt;

    setShowPasteTranslationPrompt(null);
    setIsTranslating(true);
    setIsProcessing(true);

    try {
      const response = await callGeminiAPI(
        "gemini-3.5-flash",
        `You are a translation expert. Translate the following text into Tigrinya. Return only the translated Tigrinya text without quotes, explanations, or transliterations.\n\nText: ${textToTranslate}`,
      );

      const translation = (response.text || "").trim();

      if (translation) {
        setText((prev) => {
          const before = prev.slice(0, startIndex);
          const expectedPaste = prev.slice(startIndex, endIndex);
          const after = prev.slice(endIndex);

          if (expectedPaste === textToTranslate) {
            return before + translation + after;
          } else {
            // Fallback if text drifted
            const lastIdx = prev.lastIndexOf(textToTranslate);
            if (lastIdx !== -1) {
              return (
                prev.slice(0, lastIdx) +
                translation +
                prev.slice(lastIdx + textToTranslate.length)
              );
            }
            return prev;
          }
        });
        addTranslationToHistory(textToTranslate, translation, "auto", "ti");
      }
    } catch (err) {
      console.error("Paste translation failed:", err);
      showErrorMessage("Translation failed. Check API key.");
    } finally {
      setIsTranslating(false);
      setIsProcessing(false);
    }
  };

  const addToClipboard = (newText: string) => {
    if (!newText.trim()) return;
    setClipboardItems((prev) => {
      // Remove if already exists to avoid duplicates and move to top
      const filtered = prev.filter((item) => item !== newText);
      const updated = [newText, ...filtered].slice(0, 10);
      return updated;
    });
  };

  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      const copiedText = window.getSelection()?.toString();
      if (copiedText) {
        addToClipboard(copiedText);
      }
    };
    window.addEventListener("copy", handleCopy);
    return () => window.removeEventListener("copy", handleCopy);
  }, []);

  const togglePin = (item: string) => {
    if (pinnedItems.includes(item)) {
      setPinnedItems((prev) => prev.filter((p) => p !== item));
    } else {
      setPinnedItems((prev) => [item, ...prev]);
    }
  };

  const deleteClipboardItem = (item: string, isPinned: boolean) => {
    if (isPinned) {
      setPinnedItems((prev) => prev.filter((p) => p !== item));
    } else {
      setClipboardItems((prev) => prev.filter((p) => p !== item));
    }
    setClipboardActionMenu(null);
  };

  const clearClipboard = () => {
    setClipboardItems([]);
    setPinnedItems([]);
  };

  const handleClipboardLongPress = (
    item: string,
    isPinned: boolean,
    e: any,
  ) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setClipboardActionMenu({
      item,
      isPinned,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  };

  const clearText = () => {
    setText("");
    showToast("Text cleared");
  };

  const applySuggestion = (suggestion: string) => {
    const curIndex = getTargetIndex();
    updateTargetText((prev) => {
      const before = prev.slice(0, curIndex);
      const after = prev.slice(curIndex);

      // Better regex to preserve spaces/newlines before the active word
      const match = before.match(/(.*?)([^ \n]+)$/);
      let newBefore = "";

      if (match) {
        newBefore = match[1] + suggestion + " ";
      } else {
        newBefore = suggestion + " ";
      }

      // Only set it once safely using functional updater or wait
      updateTargetIndex(newBefore.length);
      return newBefore + after;
    });
    setSuggestions([]);
    setActivePhonetic("");
  };

  const dismissSuggestion = (suggestion: string) => {
    setSuggestions((prev) => prev.filter((s) => s !== suggestion));
  };

  return (
    <div
      className={`min-h-screen font-sans ${currentTheme.isDark ? "bg-slate-950 text-white" : "bg-white text-slate-900"} transition-colors duration-500`}
    >
      {activeAgentAction && (
        <div className="fixed top-4 right-4 z-[9999] bg-indigo-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium animate-fade-in">
          <Loader2 className="w-4 h-4 animate-spin" />
          {activeAgentAction}
        </div>
      )}
      <div
        className="w-full flex flex-col items-center justify-center overflow-hidden font-sans transition-colors duration-500 relative"
        style={{
          backgroundColor: currentTheme.bg,
          height: viewportHeight ? `${viewportHeight}px` : "100dvh",
        }}
      >
        {/* Clean Background Layer - Enhanced with Animated Depth */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none cosmic-mesh">
          <div className="absolute inset-0 noise-overlay opacity-10" />
          <div className="absolute inset-0 opacity-5" />

          {/* Deep Nebula Layer */}
          {/* Hidden Canvas Utility */}
          <canvas ref={canvasRef} className="hidden" />

          <div
            className="absolute inset-0 opacity-25 blur-[140px] transition-all duration-1000"
            style={{
              background: `radial-gradient(circle at 10% 20%, ${currentTheme.mesh[0]}, transparent 50%), 
                            radial-gradient(circle at 90% 80%, ${currentTheme.mesh[1]}, transparent 50%),
                            radial-gradient(circle at 50% 50%, ${currentTheme.mesh[2] || "transparent"}, transparent 60%),
                            radial-gradient(circle at 80% 10%, #7c3aed, transparent 40%)`,
            }}
          />

          {/* Dynamic Starfield Layer */}
          {currentTheme.isDark && (
            <div className="absolute inset-0 z-0">
              {[...Array(40)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: [0, Math.random() * 0.7 + 0.1, 0],
                    scale: [0.3, 1, 0.3],
                    y: [0, -20, 0],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 5,
                    repeat: Infinity,
                    delay: Math.random() * 10,
                    ease: "easeInOut",
                  }}
                  className="absolute bg-white rounded-full"
                  style={{
                    width: Math.random() * 2 + 1 + "px",
                    height: Math.random() * 2 + 1 + "px",
                    left: Math.random() * 100 + "%",
                    top: Math.random() * 100 + "%",
                    boxShadow: `0 0 ${Math.random() * 10 + 5}px rgba(255,255,255,0.6)`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Immersive Pulsing Nebula Blobs */}
          <motion.div
            animate={{
              x: [0, 120, -60, 0],
              y: [0, 150, 60, 0],
              rotate: [0, 90, 180, 360],
              scale: [1, 1.3, 0.8, 1],
              opacity: [0.15, 0.3, 0.15, 0.15],
            }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[15%] -left-[15%] w-[800px] h-[800px] rounded-full blur-[140px]"
            style={{ backgroundColor: currentTheme.mesh[0] }}
          />
          <motion.div
            animate={{
              x: [0, -100, 120, 0],
              y: [0, -120, 150, 0],
              rotate: [360, 180, 90, 0],
              scale: [1, 0.7, 1.4, 1],
              opacity: [0.1, 0.25, 0.1, 0.1],
            }}
            transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-[15%] -right-[15%] w-[900px] h-[900px] rounded-full blur-[150px]"
            style={{ backgroundColor: currentTheme.mesh[1] }}
          />

          {/* Subtle Overlay Grid */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-6 left-1/2 -translate-x-1/2 z-[3000] px-5 py-2.5 rounded-full bg-indigo-600/90  shadow-[0_10px_30px_-5px_rgba(79,70,229,0.4)] flex items-center gap-3 border border-indigo-400/30"
            >
              <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
              <span className="text-[9px] uppercase font-black tracking-[0.2em] text-white/90">
                {t("aiProcessing")}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className={`flex-1 w-full max-w-6xl flex flex-col min-h-0 relative z-10 px-2 sm:px-8 lg:px-12 pt-safe transition-all duration-300 pb-4`}
          style={{
            paddingBottom:
              !isLiveMode && showChatKeyboard
                ? `${keyboardHeight + 24}px`
                : "1rem",
          }}
        >
          {/* Executive Header - Refined for fluid response */}
          <header
            className={`flex items-center justify-between shrink-0 border-b ${currentTheme.isDark ? "border-white/5" : "border-slate-200"} transition-all duration-300 h-14 sm:h-18 mb-1 sm:mb-4`}
          >
            <div className="flex items-center gap-1.5 sm:gap-4 group shrink-0">
              <div className="relative shrink-0">
                <div
                  className="w-10 h-10 sm:w-14 sm:h-14 rounded-full overflow-hidden flex items-center justify-center relative transition-all duration-500 hover:scale-105"
                >
                  <img
                    src="/icon.png?v=5"
                    alt="Tigrina Logo"
                    className="w-full h-full object-cover relative z-10 transition-all duration-700 group-hover:scale-110"
                  />
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${currentTheme.isDark ? "border-slate-950" : "border-white"} transition-colors ${isListening || isEnhancedRecording ? "bg-emerald-500 animate-pulse" : "bg-slate-500"}`}
                />
              </div>
              {isAIAgentMode && (
                <div className={`transition-opacity duration-300 ${activeAgentAction ? "opacity-100" : "opacity-70"}`}>
                  <Bot className={`w-5 h-5 ${activeAgentAction ? "text-indigo-500 animate-pulse" : "text-slate-400"}`} />
                </div>
              )}
              <div>
                <h1
                  className={`text-sm sm:text-lg font-black tracking-tighter ${currentTheme.isDark ? "text-white" : "text-slate-900"} leading-none font-sans uppercase group-hover:text-indigo-500 transition-colors`}
                >
                  {t("title")}
                  <span className="text-indigo-500 ml-0.5">.</span>
                </h1>
                <div className="hidden sm:flex items-center gap-1.5 mt-1">
                  <span
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${isListening || isEnhancedRecording ? "bg-emerald-500 animate-pulse" : "bg-slate-500"}`}
                  />
                  <span
                    className={`text-[8px] sm:text-[9px] uppercase tracking-[0.2em] font-black ${currentTheme.isDark ? "text-white/30" : "text-slate-400"}`}
                  >
                    {isListening || isEnhancedRecording
                      ? t("listening")
                      : t("ready")}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-3 pointer-events-auto min-w-0 max-w-full">
              {/* "Track Talk" button removed */}

              <div className="flex items-center gap-0.5 sm:gap-1.5 shrink-0 font-sans">
                <button
                  onClick={cycleLanguage}
                  className={`p-1.5 sm:p-2 rounded-xl transition-all flex items-center gap-1 shrink-0 ${currentTheme.isDark ? "text-white/40 hover:bg-white/10 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-800"}`}
                  title={t("switchLanguage")}
                >
                  <Globe className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">
                    {activeLanguage === "en"
                      ? "EN"
                      : activeLanguage === "am"
                        ? "AM"
                        : "TI"}
                  </span>
                </button>

                {/* Desktop Workspace Tools */}
                <div className="hidden md:flex items-center gap-1">
                  <button
                    onClick={() => setIsMemoryDrawerOpen((prev) => !prev)}
                    className={`p-2 rounded-xl transition-all relative shrink-0 ${isMemoryDrawerOpen ? "bg-indigo-500/20 text-indigo-500" : currentTheme.isDark ? "text-white/40 hover:bg-white/10 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-800"}`}
                    title={t("memories")}
                  >
                    <BrainCircuit className="w-5 h-5" />
                    {memories.length > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-slate-900" />
                    )}
                  </button>
                  <button
                    onClick={() => setIsTtsStudioOpen(true)}
                    className={`p-2 rounded-xl transition-all relative shrink-0 ${isTtsStudioOpen ? "bg-indigo-500/20 text-indigo-500" : currentTheme.isDark ? "text-white/40 hover:bg-white/10 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-800"}`}
                    title="TTS Studio (Text to Speech)"
                  >
                    <AudioLines className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile Workspace Tools Dropdown */}
                <div className="relative md:hidden z-50">
                  <button
                    onClick={() => setIsToolsDropdownOpen(!isToolsDropdownOpen)}
                    className={`p-2 rounded-xl transition-all relative shrink-0 ${
                      isToolsDropdownOpen ||
                      isMemoryDrawerOpen
                        ? "bg-indigo-500/20 text-indigo-500"
                        : currentTheme.isDark
                          ? "text-white/40 hover:bg-white/10 hover:text-white"
                          : "text-slate-400 hover:bg-slate-100 hover:text-slate-800"
                    }`}
                    title="Workspace Tools"
                  >
                    <LayoutGrid className="w-5 h-5" />
                    {memories.length > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-slate-900" />
                    )}
                  </button>
                  <AnimatePresence>
                    {isToolsDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsToolsDropdownOpen(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 10 }}
                          className={`absolute right-0 mt-2 w-52 rounded-2xl shadow-xl z-50 p-2 border ${
                            currentTheme.isDark
                              ? "bg-slate-900 border-white/10 text-white"
                              : "bg-white border-slate-200 text-slate-800"
                          }`}
                        >
                          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider opacity-40">
                            Workspace Tools
                          </div>

                          <button
                            onClick={() => {
                              setIsMemoryDrawerOpen(true);
                              setIsToolsDropdownOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all ${
                              currentTheme.isDark
                                ? "hover:bg-white/5 text-white/80"
                                : "hover:bg-slate-100 text-slate-700"
                            }`}
                          >
                            <BrainCircuit className="w-4 h-4 text-indigo-500" />
                            <span>Memory Bank</span>
                          </button>

                          <button
                            onClick={() => {
                              setShowSpeechBooth(true);
                              setIsToolsDropdownOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all ${
                              currentTheme.isDark
                                ? "hover:bg-white/5 text-white/80"
                                : "hover:bg-slate-100 text-slate-700"
                            }`}
                          >
                            <Mic className="w-4 h-4 text-indigo-500" />
                            <span>Speech Booth</span>
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  onClick={() => toggleMenu("history")}
                  className={`p-1.5 sm:p-2 rounded-xl transition-all shrink-0 ${activeMenus.history ? "bg-indigo-500/20 text-indigo-500" : currentTheme.isDark ? "text-white/40 hover:bg-white/10 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-800"}`}
                  title={t("history")}
                >
                  <History className="w-5 h-5" />
                </button>
                <button
                  onClick={() => toggleMenu("settings")}
                  className={`p-1.5 sm:p-2 rounded-xl transition-all shrink-0 ${activeMenus.settings ? "bg-indigo-500/20 text-indigo-500" : currentTheme.isDark ? "text-white/40 hover:bg-white/10 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-800"}`}
                  title={t("settings")}
                >
                  <Settings2 className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setIsAIAgentMode(!isAIAgentMode)}
                  className={`p-1.5 sm:p-2 rounded-xl transition-all shrink-0 hover:scale-105 active:scale-95 ${isAIAgentMode ? "bg-emerald-500/25 text-emerald-500 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.15)]" : currentTheme.isDark ? "text-white/40 hover:bg-white/10 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-800"}`}
                  title="Toggle Autonomous AI Agent"
                >
                  <Bot className="w-5 h-5" />
                </button>


              </div>
            </div>
          </header>

          {/* Main Viewport */}
          <main className="flex-1 flex flex-col w-full min-h-0 overflow-hidden relative z-10">
            {/* Chat Area - Main Content */}
            <section className="flex-1 flex flex-col min-w-0 min-h-0 bg-transparent overflow-hidden">


              {activeSessionId.startsWith("live-") && (
                <div
                  className={`p-4 mx-4 mt-4 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden shrink-0 ${
                    currentTheme.isDark
                      ? "bg-indigo-500/5 border-indigo-500/10 text-indigo-300"
                      : "bg-indigo-50 border-indigo-200/50 text-indigo-900"
                  }`}
                >
                  <div className="absolute right-4 top-4 opacity-5 pointer-events-none">
                    <ClipboardList className="w-16 h-16" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                      <Mic className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                      <h3
                        className={`font-black uppercase tracking-wider text-[10px] ${currentTheme.isDark ? "text-indigo-400" : "text-indigo-750"}`}
                      >
                        🎙️ Voice Session Log
                      </h3>
                      <p
                        className={`text-[9px] mt-0.5 font-bold ${currentTheme.isDark ? "text-white/40" : "text-slate-500"}`}
                      >
                        Completed Speech Talk:{" "}
                        {activeSessionLive?.timestamp || activeSession.title}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 z-10">
                    {/* Speech Analyzer button removed */}

                    <button
                      onClick={async () => {
                        const textToCopy = displayMessages
                          .map(
                            (m) =>
                              `[${m.role === "user" ? "You" : "Gemini"}]: ${m.parts}`,
                          )
                          .join("\n\n");
                        await navigator.clipboard.writeText(textToCopy);
                        showToast("✓ Transcript copied!");
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                        currentTheme.isDark
                          ? "bg-white/5 hover:bg-white/10 text-white/70 border-white/5"
                          : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Log</span>
                    </button>
                  </div>
                </div>
              )}
              <motion.div
                key="chat-layout"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col min-h-0 overflow-hidden"
              >
                <div
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pt-4 px-1 pb-48"
                >
                  {displayMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center select-none">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 1.2, ease: "circOut" }}
                        className="w-44 h-44 sm:w-64 sm:h-64 rounded-full overflow-hidden flex items-center justify-center mb-8 relative group"
                      >
                        <img
                          src="/icon.png?v=5"
                          alt="Tigrina Logo"
                          className="w-full h-full object-cover relative z-10 transition-all duration-700 group-hover:scale-105"
                        />
                      </motion.div>
                      <h2 className="text-xl font-black uppercase tracking-[0.2em] text-center text-amber-50 drop-shadow-lg transition-opacity">
                        {getTimeBasedGreetingAndStatus(activeLanguage, t("ready"))}
                      </h2>
                      <motion.p
                        animate={{ opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="text-[10px] mt-3 font-bold uppercase tracking-[0.5em] text-center text-indigo-300"
                      >
                        {t("neuralActive")}
                      </motion.p>
                    </div>
                  ) : (
                    displayMessages.map((msg, i) => (
                      <motion.div
                        key={`${activeSessionId}-msg-${i}-${msg.role}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group flex items-start gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl transition-all bg-transparent hover:bg-black/[0.015] dark:hover:bg-white/[0.01]"
                      >
                        <div className="shrink-0 mt-1">
                          {msg.role === "user" ? (
                            <div
                              className={`w-8 h-8 sm:w-9.5 sm:h-9.5 rounded-full flex items-center justify-center border ${
                                currentTheme.isDark
                                  ? "bg-white/5 border-white/10 text-white/75"
                                  : "bg-slate-100 border-slate-200 text-slate-600"
                              } shadow-sm`}
                            >
                              <User className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 sm:w-9.5 sm:h-9.5 rounded-full flex items-center justify-center bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/10 animate-pulse-slow">
                              <Sparkles className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                          <span
                            className={`text-xs font-bold uppercase tracking-widest ${
                              currentTheme.isDark
                                ? "text-white/40"
                                : "text-slate-400"
                            }`}
                          >
                            {msg.role === "user" ? t("you") : t("assistant")}
                          </span>

                          <div
                            className={`markdown-body prose ${currentTheme.isDark ? "prose-invert text-white/90" : "text-slate-800"} max-w-none text-base sm:text-lg font-ethiopic leading-relaxed`}
                          >
                            {editingMessageIndex === i ? (
                              <div className="flex flex-col gap-3 my-2">
                                <textarea
                                  value={editMessageInput}
                                  onChange={(e) =>
                                    setEditMessageInput(e.target.value)
                                  }
                                  className={`w-full p-4 rounded-2xl border font-ethiopic text-base sm:text-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${
                                    currentTheme.isDark
                                      ? "bg-white/5 border-white/10 text-white"
                                      : "bg-white border-slate-200 text-slate-800 shadow-inner"
                                  }`}
                                  rows={Math.max(
                                    3,
                                    editMessageInput.split("\n").length,
                                  )}
                                  autoFocus
                                />
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() =>
                                      handleEditSave(i, editMessageInput)
                                    }
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-black transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/20"
                                  >
                                    <Check className="w-4 h-4" />
                                    {activeLanguage === "ti"
                                      ? "ኣቐምጥን ደግምን"
                                      : activeLanguage === "am"
                                        ? "አስቀምጥና ድገም"
                                        : "Save & Regenerate"}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingMessageIndex(null);
                                      setEditMessageInput("");
                                    }}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all hover:scale-105 active:scale-95 ${
                                      currentTheme.isDark
                                        ? "bg-white/10 hover:bg-white/20 text-white"
                                        : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                                    }`}
                                  >
                                    <X className="w-4 h-4" />
                                    {activeLanguage === "ti"
                                      ? "ሰርዝ"
                                      : activeLanguage === "am"
                                        ? "ሰርዝ"
                                        : "Cancel"}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                {msg.thought && (
                                <div
                                  className={`mb-4 rounded-xl p-3 border text-xs leading-relaxed font-sans ${
                                    currentTheme.isDark
                                      ? "bg-amber-500/5 border-amber-500/10 text-amber-200/80"
                                      : "bg-amber-500/[0.02] border-amber-500/15 text-amber-800"
                                  }`}
                                >
                                  <details
                                    className="outline-none select-none cursor-pointer"
                                    open={false}
                                  >
                                    <summary className="flex items-center justify-between font-bold uppercase tracking-widest text-[9px] outline-none">
                                      <span className="flex items-center gap-1.5 cursor-pointer">
                                        <BrainCircuit className="w-3.5 h-3.5 text-amber-500/85 animate-pulse" />
                                        <span>
                                          Gemini Deep Thinking Detail (
                                          {msg.thought.length} chars)
                                        </span>
                                      </span>
                                    </summary>
                                    <div className="whitespace-pre-wrap italic mt-2 border-t pt-2 border-amber-500/10 font-ethiopic">
                                      {msg.thought}
                                    </div>
                                  </details>
                                </div>
                              )}
                              {msg.attachedFiles &&
                                msg.attachedFiles.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-1 mb-2">
                                    {msg.attachedFiles.map((file: any) => (
                                      <div
                                        key={file.id}
                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border ${
                                          currentTheme.isDark
                                            ? "bg-white/[0.04] border-white/5 text-white/70"
                                            : "bg-slate-100 border-zinc-200 text-zinc-650"
                                        }`}
                                      >
                                        {file.mimeType.startsWith("image/") &&
                                        file.dataUrl ? (
                                          <img
                                            src={file.dataUrl}
                                            alt={file.name}
                                            className="w-4 h-4 rounded object-cover border border-white/10"
                                            referrerPolicy="no-referrer"
                                          />
                                        ) : (
                                          <FileIcon className="w-3.5 h-3.5 text-zinc-400" />
                                        )}
                                        <span className="truncate max-w-[150px]">
                                          {file.name}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              {isLiveMode &&
                              i === displayMessages.length - 1 &&
                              msg.role === "model" &&
                              liveResponseTranscript.trim() !== "" ? (
                                <LiveSpokenText
                                  text={msg.parts
                                    .replace(
                                      /\[OPTION:\s*[^|\]]+?\s*\|\s*[^\]]+?\s*\]/g,
                                      "",
                                    )
                                    .replace(/\[SAVE_PROJECT_CARD\]/g, "")
                                    .trim()}
                                  streamerRef={liveStreamerRef}
                                  isDark={currentTheme.isDark}
                                />
                              ) : (
                                <ReactMarkdown
                                  components={{
                                    a: ({ href, children }) => (
                                      <a
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 transition-all font-semibold border border-indigo-500/10 decoration-transparent align-baseline text-sm sm:text-base my-0.5"
                                        title={href}
                                      >
                                        <span>{children}</span>
                                        <ArrowUpRight className="w-3.5 h-3.5 shrink-0 text-indigo-500/80 dark:text-indigo-300/80" />
                                      </a>
                                    ),
                                  }}
                                >
                                  {msg.parts
                                    .replace(
                                      /\[OPTION:\s*[^|\]]+?\s*\|\s*[^\]]+?\s*\]/g,
                                      "",
                                    )
                                    .replace(/\[SAVE_PROJECT_CARD\]/g, "")
                                    .trim() ||
                                    (activeLanguage === "ti"
                                      ? "በጃኻ ካብዞም ዝስዕቡ ሓደ ምረጽ፡"
                                      : activeLanguage === "am"
                                        ? "እባክዎን ከሚከተሉት አንዱን ይምረጡ፦"
                                        : "Please select an option below:")}
                                </ReactMarkdown>
                              )}

                              {/* Interactive Wizard Option Pills */}
                              {(() => {
                                const options: {
                                  label: string;
                                  value: string;
                                }[] = [];
                                const optionRegex =
                                  /\[OPTION:\s*([^|\]]+?)\s*\|\s*([^\]]+?)\s*\]/g;
                                let match;
                                while (
                                  (match = optionRegex.exec(msg.parts)) !== null
                                ) {
                                  options.push({
                                    label: match[1].trim(),
                                    value: match[2].trim(),
                                  });
                                }
                                if (options.length === 0) return null;
                                return (
                                  <div className="flex flex-wrap gap-2 mt-4">
                                    {options.map((opt, optIdx) => (
                                      <button
                                        key={`opt-${i}-${optIdx}`}
                                        onClick={() => {
                                          sendToAI(
                                            opt.value,
                                            displayMessages.slice(0, i + 1),
                                          );
                                        }}
                                        className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border hover:scale-105 active:scale-[0.97] transition-all cursor-pointer ${
                                          currentTheme.isDark
                                            ? "bg-red-500/5 border-red-500/15 text-red-200 hover:bg-red-500/15 hover:border-red-500/30 hover:text-white shadow-md shadow-red-500/5"
                                            : "bg-red-50 border-red-100 text-red-750 hover:bg-red-100/70 hover:border-red-200 hover:text-red-800 shadow-sm"
                                        }`}
                                      >
                                        {opt.label}
                                      </button>
                                    ))}
                                  </div>
                                );
                              })()}


                              <MessageLinksAndSources
                                msg={msg}
                                isDark={currentTheme.isDark}
                              />
                            </>
                          )}
                        </div>

                          <div
                            className={`flex gap-3 pt-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity ${
                              currentTheme.isDark
                                ? "text-white/30"
                                : "text-slate-400"
                            }`}
                          >
                            <button
                              onClick={() => copyToClipboard(msg.parts)}
                              className={`hover:text-indigo-500 transition-colors ${currentTheme.isDark ? "hover:text-indigo-400" : ""}`}
                              title="Copy"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                const utterance = new SpeechSynthesisUtterance(msg.parts);
                                window.speechSynthesis.speak(utterance);
                              }}
                              className={`hover:text-indigo-500 transition-colors ${currentTheme.isDark ? "hover:text-indigo-400" : ""}`}
                              title="Read Aloud"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                            {msg.role === "user" &&
                              editingMessageIndex === null && (
                                <button
                                  onClick={() => {
                                    setEditingMessageIndex(i);
                                    setEditMessageInput(msg.parts);
                                  }}
                                  className={`hover:text-amber-500 transition-colors ${currentTheme.isDark ? "hover:text-amber-400" : ""}`}
                                  title="Edit Message"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                              )}

                            {msg.role === "model" && (
                              <>
                                <button
                                  onClick={() =>
                                    handleGenerateTTS(msg.parts, i)
                                  }
                                  className={`hover:text-indigo-500 transition-colors ${playingChatTtsIndex === i ? "text-indigo-500" : currentTheme.isDark ? "hover:text-indigo-400" : ""}`}
                                  title="Read Aloud"
                                >
                                  <Volume2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDownloadMessageAudio(msg.parts)
                                  }
                                  className={`hover:text-indigo-500 transition-colors ${currentTheme.isDark ? "hover:text-indigo-400" : ""}`}
                                  title="Download Audio"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}



                  {isAssistantTyping && (
                    <motion.div
                      animate={{
                        boxShadow: currentTheme.isDark
                          ? [
                              "0 0 0px rgba(168,85,247,0)",
                              "0 0 20px rgba(168,85,247,0.12), inset 0 0 10px rgba(34,211,238,0.05)",
                              "0 0 0px rgba(168,85,247,0)",
                            ]
                          : [
                              "0 0 0px rgba(99,102,241,0)",
                              "0 0 15px rgba(99,102,241,0.08)",
                              "0 0 0px rgba(99,102,241,0)",
                            ],
                        borderColor: currentTheme.isDark
                          ? [
                              "rgba(255,255,255,0.03)",
                              "rgba(168,85,247,0.25)",
                              "rgba(255,255,255,0.03)",
                            ]
                          : [
                              "rgba(0,0,0,0.02)",
                              "rgba(99,102,241,0.15)",
                              "rgba(0,0,0,0.02)",
                            ],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl transition-all bg-transparent hover:bg-black/[0.015] dark:hover:bg-white/[0.01]"
                    >
                      <div className="shrink-0 mt-1">
                        <div className="w-8 h-8 sm:w-9.5 sm:h-9.5 rounded-full flex items-center justify-center bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/10 animate-pulse-slow">
                          <Sparkles className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <span
                          className={`text-xs font-bold uppercase tracking-widest ${
                            currentTheme.isDark
                              ? "text-white/40"
                              : "text-slate-400"
                          }`}
                        >
                          Assistant (Streaming)
                        </span>

                        {/* Thinking Accordion for currently streaming message */}
                        {streamingThought && (
                          <div
                            className={`mb-4 rounded-xl p-3 border text-xs leading-relaxed font-sans ${
                              currentTheme.isDark
                                ? "bg-amber-500/10 border-amber-500/20 text-amber-200/80"
                                : "bg-amber-500/[0.03] border-amber-500/15 text-amber-800"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 font-bold mb-1 border-b pb-1 border-amber-500/10 uppercase tracking-widest text-[9px]">
                              <BrainCircuit className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                              <span>Thinking Process</span>
                            </div>
                            <div className="whitespace-pre-wrap italic font-ethiopic">
                              {streamingThought}
                            </div>
                          </div>
                        )}

                        {displayedStreamingResponse ? (
                          <div
                            className={`markdown-body prose ${currentTheme.isDark ? "prose-invert text-white/90" : "text-slate-800"} max-w-none text-base sm:text-lg font-ethiopic leading-relaxed gemini-streaming-active`}
                          >
                            <ReactMarkdown
                              components={{
                                a: ({ href, children }) => (
                                  <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 transition-all font-semibold border border-indigo-500/10 decoration-transparent align-baseline text-sm sm:text-base my-0.5"
                                    title={href}
                                  >
                                    <span>{children}</span>
                                    <ArrowUpRight className="w-3.5 h-3.5 shrink-0 text-indigo-500/80 dark:text-indigo-300/80" />
                                  </a>
                                ),
                              }}
                            >
                              {displayedStreamingResponse}
                            </ReactMarkdown>
                          </div>
                        ) : null}
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </section>

            <div className="w-full shrink-0 flex flex-col items-center relative z-20 max-w-3xl mx-auto px-4 sm:px-0 pb-1.5">
              {renderLiveTalkUI()}

              <div className="w-full shrink-0 flex flex-col items-center relative z-20">
                {isListening && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute -top-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-xs font-bold font-sans shadow-sm"
                  >
                    <div className="w-2 h-2 shrink-0 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="truncate">
                      {interimTranscript || t("listening")}...
                    </span>
                  </motion.div>
                )}

                {/* Chat Suggestions / Starters */}
                <AnimatePresence>
                  {((chatSuggestions && chatSuggestions.length > 0) ||
                    (displayMessages.length === 0 &&
                      chatInput.trim().length === 0)) &&
                    !isLiveMode && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="w-full overflow-hidden"
                      >
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full pb-4 px-1 scroll-smooth">
                          {(chatSuggestions && chatSuggestions.length > 0
                            ? chatSuggestions
                            : getRotatingSuggestions(activeLanguage, new Date().getHours())
                          ).map((suggestion, index) => (
                            <button
                              key={`chat-sug-${index}`}
                              onClick={() => {
                                setChatInput(suggestion);
                                setChatCursorIndex(suggestion.length);
                              }}
                              className={`px-3.5 py-2 rounded-full text-xs font-semibold font-ethiopic border transition-all duration-200 cursor-pointer flex-shrink-0 hover:scale-[1.03] active:scale-[0.98] ${
                                currentTheme.isDark
                                  ? "bg-white/[0.03] border-white/10 text-white/75 hover:text-white hover:bg-white/10 hover:border-white/20 shadow-sm"
                                  : "bg-slate-50 border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-300 shadow-sm"
                              }`}
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                </AnimatePresence>

                <div
                  className={`w-full relative flex flex-col p-2 sm:p-2.5 rounded-[24px] border transition-all duration-300 focus-within:border-indigo-500/50 ${
                    currentTheme.isDark
                      ? "bg-[#0a0c10] border-white/5 shadow-2xl "
                      : "bg-white/90 border-slate-200 shadow-lg "
                  }`}
                >
                  <textarea
                    id="chat-input-textarea"
                    ref={chatInputRef}
                    value={chatInput}
                    onChange={(e) => {
                      setChatInput(e.target.value);
                      setChatCursorIndex(e.target.selectionStart || 0);
                    }}
                    onFocus={() => {
                      setKeyboardTarget("chat");
                    }}
                    onSelect={(e) => {
                      setChatCursorIndex(e.currentTarget.selectionStart || 0);
                    }}
                    onClick={(e) => {
                      setChatCursorIndex(e.currentTarget.selectionStart || 0);
                    }}
                    onKeyUp={(e) => {
                      setChatCursorIndex(e.currentTarget.selectionStart || 0);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendChatMessage();
                      }
                    }}
                    placeholder={t("chatPlaceholder")}
                    className={`w-full max-h-[40vh] min-h-[28px] bg-transparent resize-none border-none focus:ring-0 focus:outline-none text-sm font-ethiopic leading-normal px-2 py-0 mb-0.5 ${
                      currentTheme.isDark
                        ? "text-white placeholder:text-white/30"
                        : "text-slate-900 placeholder:text-slate-400"
                    }`}
                  />

                  <div
                    className={`w-full h-[1px] my-1 ${currentTheme.isDark ? "bg-white/5" : "bg-slate-200/50"}`}
                  />

                  <div className="flex items-center justify-between w-full px-1">
                    <div className="flex items-center gap-1">
                      <FileAttachmentModule
                        attachedFiles={attachedFiles}
                        onAddAttachment={(file) =>
                          setAttachedFiles((prev) => [...prev, file])
                        }
                        onRemoveAttachment={(id) =>
                          setAttachedFiles((prev) =>
                            prev.filter((f) => f.id !== id),
                          )
                        }
                        currentTheme={currentTheme}
                        mode="trigger"
                        aiModelMode={aiModelMode}
                        setAiModelMode={setAiModelMode}
                      />
                      <button
                        onClick={() => {
                          if (!showChatKeyboard) {
                            document
                              .getElementById("chat-input-textarea")
                              ?.blur();
                          }
                          setShowChatKeyboard(!showChatKeyboard);
                        }}
                        className={`p-1.5 rounded-full transition-all duration-200 flex items-center justify-center border ${
                          showChatKeyboard
                            ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                            : currentTheme.isDark
                              ? "text-white/50 hover:text-white hover:bg-white/10 border-transparent hover:border-white/10"
                              : "text-slate-400 hover:text-slate-800 hover:bg-slate-100 border-transparent hover:border-slate-200"
                        }`}
                        title="Keyboard"
                      >
                        <Keyboard className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Voice Recording Enhancer Mode Toggle */}
                      <button
                        onClick={() =>
                          setEnhancedTigrinyaMode(!enhancedTigrinyaMode)
                        }
                        className={`p-1.5 rounded-full transition-all duration-200 flex items-center justify-center border ${
                          enhancedTigrinyaMode
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-sm shadow-amber-500/10"
                            : currentTheme.isDark
                              ? "text-white/40 hover:text-white/70 hover:bg-white/10 border-transparent"
                              : "text-slate-400 hover:text-slate-600 hover:bg-slate-100 border-transparent"
                        }`}
                        title={
                          enhancedTigrinyaMode
                            ? "Disable Voice Recording Enhancer"
                            : "Enable Voice Recording Enhancer"
                        }
                      >
                        <Zap
                          className={`w-4 h-4 ${enhancedTigrinyaMode ? "animate-pulse" : ""}`}
                        />
                      </button>
                      {(isSpeechRecognitionSupported ||
                        enhancedTigrinyaMode) && (
                        <button
                          onClick={() => toggleListening("chat")}
                          className={`p-1.5 rounded-full transition-all duration-200 flex items-center justify-center border ${
                            isListening || isEnhancedRecording
                              ? isEnhancedRecording
                                ? "bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse shadow-sm shadow-amber-500/15"
                                : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                              : enhancedTigrinyaMode
                                ? "bg-amber-500/5 text-amber-500/60 border-amber-500/10 hover:bg-amber-500/10 hover:text-amber-500"
                                : currentTheme.isDark
                                  ? "text-white/40 hover:text-white hover:bg-white/10 border-transparent hover:border-white/10"
                                  : "text-slate-400 hover:text-slate-800 hover:bg-slate-100 border-transparent hover:border-slate-200"
                          }`}
                          title={
                            isEnhancedRecording
                              ? "Voice Recording Enhancer active - recording..."
                              : isListening
                                ? "Listening..."
                                : "Voice Input"
                          }
                        >
                          <Mic
                            className={`w-4 h-4 ${isListening || isEnhancedRecording ? "animate-bounce" : ""}`}
                          />
                        </button>
                      )}

                      <button
                        onClick={toggleLiveMode}
                        className={`p-1.5 rounded-full transition-all duration-200 flex items-center justify-center border ${isLiveMode ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : currentTheme.isDark ? "text-white/40 hover:text-white hover:bg-white/10 border-transparent hover:border-white/10" : "text-slate-400 hover:text-slate-800 hover:bg-slate-100 border-transparent hover:border-slate-200"}`}
                        title="Live Conversation"
                      >
                        <Radio className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleSendChatMessage}
                        className={`w-9 h-9 ml-1.5 flex items-center justify-center rounded-full transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                          currentTheme.accent === "indigo-600"
                            ? "bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                            : currentTheme.accent === "slate-400"
                              ? "bg-slate-700 hover:bg-slate-600 text-white shadow-[0_0_15px_rgba(51,65,85,0.4)]"
                              : "bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                        }`}
                        title="Send"
                      >
                        <Send className="w-4 h-4 ml-[-2px] mt-[1px]" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>

          <AnimatePresence>
            {showChatKeyboard && renderKeyboardUI()}
          </AnimatePresence>
          {/* Global Overlays (Modals/Drawers) */}
          <AnimatePresence>
            {showSpeechBooth && (
              <SpeechBooth
                currentTheme={currentTheme}
                onClose={() => setShowSpeechBooth(false)}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {activeMenus.theme && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className={`fixed inset-x-0 bottom-0 z-[1000] ${currentTheme.isDark ? "bg-slate-900 border-white/10" : "bg-white border-slate-200"} border-t rounded-t-[3rem] p-8 pb-[env(safe-area-inset-bottom)] shadow-2xl`}
              >
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                    <Palette className="w-5 h-5 text-indigo-500" />
                    <h3
                      className={`text-xl font-bold ${currentTheme.isDark ? "text-white" : "text-slate-900"}`}
                    >
                      Appearance
                    </h3>
                  </div>
                  <button
                    onClick={() => toggleMenu("theme")}
                    className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <X
                      className={`w-6 h-6 ${currentTheme.isDark ? "text-white/40 hover:text-white" : "text-slate-400 hover:text-slate-800"}`}
                    />
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Object.entries(THEMES).map(([id, t]) => (
                    <button
                      key={id}
                      onClick={() => setThemeKey(id as ThemeKey)}
                      className={`p-6 rounded-[2rem] border transition-all text-left ${themeKey === id ? "border-indigo-500 bg-indigo-500/5" : currentTheme.isDark ? "border-white/5 bg-white/5" : "border-slate-200 bg-slate-50"} hover:scale-[1.02] active:scale-[0.98]`}
                    >
                      {id === "system" ? (
                        <div className="w-8 h-8 rounded-full mb-3 flex overflow-hidden border border-slate-300 dark:border-white/10">
                          <div className="w-1/2 h-full bg-slate-100" />
                          <div className="w-1/2 h-full bg-slate-900" />
                        </div>
                      ) : (
                        <div
                          className="w-8 h-8 rounded-full mb-3 border border-slate-300 dark:border-white/10"
                          style={{ backgroundColor: t.bg }}
                        />
                      )}
                      <span
                        className={`font-bold text-sm ${currentTheme.isDark ? "text-white" : "text-slate-800"} capitalize`}
                      >
                        {t.name}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Universal Left Sidebar History Standard */}
          <SettingsDrawer
            isOpen={isSettingsDrawerOpen}
            onClose={() => {
              setIsSettingsDrawerOpen(false);
              setActiveMenus((prev) => ({ ...prev, settings: false }));
            }}
            currentTheme={currentTheme}
            factoryReset={factoryReset}
            physicalKeyboardSync={physicalKeyboardSync}
            setPhysicalKeyboardSync={setPhysicalKeyboardSync}
            isThemeScheduled={isThemeScheduled}
            setIsThemeScheduled={setIsThemeScheduled}
            themeKey={themeKey}
            setThemeKey={setThemeKey}
            THEMES={THEMES}
            activeAiMode={activeAiMode}
            onSelectMode={handleSelectMode}
            activeVoiceGender={activeVoiceGender}
            onSelectGender={(gender) => {
              setActiveVoiceGender(gender);
              try {
                localStorage.setItem("active_voice_gender", gender);
              } catch {}
            }}
            onSpeedChange={(s) => {
              setSpeed(s);
              setSpeechRate(s);
            }}
            speed={speed}
            onMicSelect={setSelectedMic}
            selectedMic={selectedMic}
            availableMicrophones={availableMicrophones}
            onPreviewVoice={handlePreviewVoice}
            isPreviewing={isPreviewingVoice}
            previewingModeId={previewingModeId}
            previewingGender={previewingGender}
            t={t}
            activeLanguage={activeLanguage}
            proactiveSuggestions={proactiveSuggestionsEnabled}
            setProactiveSuggestions={setProactiveSuggestionsEnabled}
            habitTracking={habitTrackingEnabled}
            setHabitTracking={setHabitTrackingEnabled}
            isMemoryEnabled={isMemoryEnabled}
            onToggleMemoryEnabled={handleToggleMemoryEnabled}
            currentUser={currentUser}
            onSignIn={handleSignIn}
            onSignOut={handleSignOut}
            customSystemInstructions={customSystemInstructions}
            onSaveCustomSystemInstructions={handleSaveCustomSystemInstructions}
            isEditingKeyboard={isEditing}
            setIsEditingKeyboard={setIsEditing}
            selectedSpeaker={selectedSpeaker}
            onSelectSpeaker={(speaker) => {
              setSelectedSpeaker(speaker);
              try {
                localStorage.setItem("selected_speaker", speaker);
              } catch {}
            }}
            selectedSpeechModel={selectedSpeechModel}
            onSelectSpeechModel={(model) => {
              setSelectedSpeechModel(model);
              try {
                localStorage.setItem("selected_speech_model", model);
              } catch {}
            }}
          />

          {/* Live Voice Selection Side Drawer */}
          <LiveVoiceSelectionDrawer
            isOpen={isLiveVoiceDrawerOpen}
            onClose={() => setIsLiveVoiceDrawerOpen(false)}
            selectedSpeaker={selectedSpeaker}
            onSelectSpeaker={(speaker) => {
              setSelectedSpeaker(speaker);
              try {
                localStorage.setItem("selected_speaker", speaker);
              } catch {}
            }}
            onConnectLiveSession={(speakerName) => {
              setSelectedSpeaker(speakerName);
              try {
                localStorage.setItem("selected_speaker", speakerName);
              } catch {}
              setIsLiveVoiceDrawerOpen(false);
              if (!isLiveMode) {
                startLiveSession();
              }
            }}
            onPreviewVoice={(voiceName, sampleText, gender) => {
              handlePreviewVoice(
                activeAiMode || 'default',
                gender,
                sampleText,
                voiceName,
                false,
                1.0
              );
            }}
            isDark={currentTheme.isDark}
          />

          <TtsStudioModal
            isOpen={isTtsStudioOpen}
            onClose={() => setIsTtsStudioOpen(false)}
            currentTheme={currentTheme}
            defaultSpeaker={selectedSpeaker}
            defaultModel={selectedSpeechModel}
            showToast={showToast}
            activeLanguage={activeLanguage}
            initialBlocks={ttsInitialBlocks}
            initialScene={ttsInitialScene}
            initialContext={ttsInitialContext}
          />

          <AnimatePresence>
            {activeMenus.history && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => toggleMenu("history")}
                  className="fixed inset-0 z-[1200] bg-black/60  sm:hidden"
                />
                <motion.div
                  initial={{ x: "-100%", opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: "-100%", opacity: 0 }}
                  transition={{
                    type: "spring",
                    damping: 30,
                    stiffness: 300,
                    mass: 0.8,
                  }}
                  className={`fixed inset-y-0 left-0 z-[1201] w-[85vw] sm:w-80 ${currentTheme.isDark ? "bg-slate-900 border-r border-white/10" : "bg-slate-50 border-r border-slate-200"} shadow-2xl flex flex-col`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center p-6 border-b border-white/5 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-[1rem] bg-indigo-500/10 flex items-center justify-center">
                        <History className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div>
                        <h3
                          className={`text-base font-black tracking-tight ${currentTheme.isDark ? "text-white" : "text-slate-950"}`}
                        >
                          {t("conversations")}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleMenu("history")}
                        className={`p-2 ${currentTheme.isDark ? "hover:bg-white/5 text-white/40" : "hover:bg-slate-200 text-slate-500"} rounded-xl transition-all sm:hidden`}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 shrink-0 flex gap-2">
                    <button
                      onClick={() => {
                        startNewChatSession();
                        toggleMenu("history");
                      }}
                      className={`flex-1 p-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all ${currentTheme.isDark ? "bg-indigo-600 hover:bg-indigo-500 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"} shadow-lg shadow-indigo-600/20`}
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-xs font-bold tracking-wide">
                        {t("newChat")}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setExportSessionTarget("active");
                        setShowExportModal(true);
                      }}
                      className={`px-3.5 py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        currentTheme.isDark
                          ? "bg-white/10 hover:bg-white/15 text-white"
                          : "bg-slate-200 hover:bg-slate-300 text-slate-800"
                      }`}
                      title="Export Session Transcript as Markdown or PDF"
                    >
                      <Download className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-bold">Export</span>
                    </button>
                  </div>

                  {/* Advanced Tracking History Filters */}
                  <div className="px-4 pb-3 shrink-0 space-y-2 border-b border-white/5">
                    {/* Search Box */}
                    <div className="relative">
                      <Search
                        className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${currentTheme.isDark ? "text-white/30" : "text-slate-400"}`}
                      />
                      <input
                        type="text"
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                        placeholder={t("searchHistory")}
                        className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all ${
                          currentTheme.isDark
                            ? "bg-white/5 border border-white/10 text-white placeholder-white/30"
                            : "bg-slate-100 border border-slate-200 text-slate-900 placeholder-slate-400"
                        }`}
                      />
                      {historySearch && (
                        <button
                          onClick={() => setHistorySearch("")}
                          className={`absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md ${currentTheme.isDark ? "hover:bg-white/10 text-white/40" : "hover:bg-slate-200 text-slate-500"}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex flex-col gap-2">
                      <div
                        className={`p-1 flex rounded-xl ${currentTheme.isDark ? "bg-white/5" : "bg-slate-100"}`}
                      >
                        <button
                          onClick={() => setHistoryFilter("all")}
                          className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
                            historyFilter === "all"
                              ? currentTheme.isDark
                                ? "bg-white/10 text-white"
                                : "bg-white text-slate-900 shadow-sm"
                              : "text-slate-400 hover:text-slate-300"
                          }`}
                        >
                          All
                        </button>
                        <button
                          onClick={() => setHistoryFilter("chat")}
                          className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
                            historyFilter === "chat"
                              ? currentTheme.isDark
                                ? "bg-white/10 text-white"
                                : "bg-white text-slate-900 shadow-sm"
                              : "text-slate-400 hover:text-slate-300"
                          }`}
                        >
                          Chats
                        </button>
                        <button
                          onClick={() => setHistoryFilter("live")}
                          className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1 ${
                            historyFilter === "live"
                              ? currentTheme.isDark
                                ? "bg-white/10 text-white animate-pulse"
                                : "bg-white text-slate-900 shadow-sm"
                              : "text-slate-400 hover:text-slate-300"
                          }`}
                          title="Voice Session Tracker History"
                        >
                          🎙️ Voice
                        </button>

                      </div>

                      {/* Quick Dates */}
                      <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 dark:text-slate-500 px-1">
                        <span className="flex items-center gap-1 uppercase tracking-wider">
                          <Clock className="w-3 h-3 text-indigo-505" /> Date:
                        </span>
                        <div className="flex gap-1.55">
                          {(["all", "today", "week", "month"] as const).map(
                            (dr) => (
                              <button
                                key={dr}
                                onClick={() => setHistoryDateRange(dr)}
                                className={`px-1.5 py-0.5 rounded-md uppercase text-[9px] font-black transition-all ${
                                  historyDateRange === dr
                                    ? currentTheme.isDark
                                      ? "bg-indigo-500/20 text-indigo-400"
                                      : "bg-indigo-50 text-indigo-850"
                                    : "hover:opacity-80"
                                }`}
                              >
                                {dr}
                              </button>
                            ),
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-4 pb-4 mt-2 custom-scrollbar space-y-2">
                    {combinedHistory.length === 0 ? (
                      <div className="text-center py-8 text-xs opacity-50 font-bold uppercase tracking-widest">
                        No matching history records.
                      </div>
                    ) : (
                      combinedHistory
                        .sort(
                          (a, b) =>
                            getSessionTimestamp(b) - getSessionTimestamp(a),
                        )
                        .map((s) => (
                          <div key={s.id} className="relative group">
                            <button
                              onClick={() => {
                                if (editingSessionId === s.id) return; // Prevent selection click while renaming
                                setActiveSessionId(s.id);
                                toggleMenu("history");
                              }}
                              className={`w-full p-3 rounded-2xl text-left transition-all relative overflow-hidden flex flex-col gap-1 group/item ${
                                activeSessionId === s.id
                                  ? currentTheme.isDark
                                    ? "bg-white/10 text-white"
                                    : "bg-slate-200 text-slate-900"
                                  : currentTheme.isDark
                                    ? "hover:bg-white/5 text-white/70"
                                    : "hover:bg-slate-100 text-slate-600"
                              } `}
                            >
                              <div className="flex justify-between items-center w-full">
                                <div className="flex items-center gap-3 w-full pr-16">
                                  {s.type === "chat" ? (
                                    <MessageSquare className="w-4 h-4 shrink-0 opacity-50" />
                                  ) : (
                                    <Mic className="w-4 h-4 shrink-0 opacity-50" />
                                  )}
                                  {editingSessionId === s.id ? (
                                    <div
                                      className="flex items-center gap-1 w-full"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <input
                                        type="text"
                                        value={editingSessionTitle}
                                        onChange={(e) =>
                                          setEditingSessionTitle(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            saveSessionRename(s.id, s.type);
                                          } else if (e.key === "Escape") {
                                            setEditingSessionId(null);
                                          }
                                        }}
                                        className={`text-xs px-2 py-1 rounded border font-semibold w-full focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                                          currentTheme.isDark
                                            ? "bg-slate-800 border-white/20 text-white"
                                            : "bg-white border-slate-300 text-slate-800"
                                        }`}
                                        autoFocus
                                        id={`rename-input-${s.id}`}
                                      />
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          saveSessionRename(s.id, s.type);
                                        }}
                                        className={`p-1 rounded hover:bg-emerald-500/10 text-emerald-500 transition-all cursor-pointer`}
                                        title="Save Name"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingSessionId(null);
                                        }}
                                        className={`p-1 rounded hover:bg-rose-500/10 text-rose-500 transition-all cursor-pointer`}
                                        title="Cancel"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="font-semibold text-sm truncate font-ethiopic">
                                      {s.title}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>

                            {editingSessionId !== s.id && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExportSessionTarget(s.id);
                                  setShowExportModal(true);
                                }}
                                className={`absolute top-1/2 -translate-y-1/2 right-18 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10 cursor-pointer ${
                                  currentTheme.isDark
                                    ? "hover:bg-white/10 text-white/50 hover:text-emerald-400"
                                    : "hover:bg-white text-slate-400 hover:text-emerald-600"
                                  }`}
                                  title="Export Session Transcript"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              )}

                            {editingSessionId !== s.id && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingSessionId(s.id);
                                  if (s.type === "chat") {
                                    const original = chatSessions.find(
                                      (cs) => cs.id === s.id,
                                    );
                                    setEditingSessionTitle(
                                      original?.title || "",
                                    );
                                  } else if (s.type === "live") {
                                    const rawId = s.id.replace("live-", "");
                                    const original = pastLiveSessions.find(
                                      (ls) => ls.id === rawId,
                                    );
                                    setEditingSessionTitle(
                                      original?.title ||
                                        original?.summary ||
                                        "",
                                    );
                                  }
                                }}
                                className={`absolute top-1/2 -translate-y-1/2 right-10 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10 cursor-pointer ${currentTheme.isDark ? "hover:bg-white/10 text-white/50 hover:text-indigo-400" : "hover:bg-white text-slate-400 hover:text-indigo-600"}`}
                                title="Rename Option"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (s.type === "chat") {
                                  if (chatSessions.length <= 1) {
                                    setChatSessions([
                                      {
                                        id: "default",
                                        title: "New Chat",
                                        messages: [],
                                      },
                                    ]);
                                    setActiveSessionId("default");
                                    showToast("Reset to Default");
                                  } else {
                                    setChatSessions((prev) =>
                                      prev.filter((sess) => sess.id !== s.id),
                                    );
                                    if (activeSessionId === s.id) {
                                      const remaining = chatSessions.filter(
                                        (sess) => sess.id !== s.id,
                                      );
                                      setActiveSessionId(
                                        remaining.length > 0
                                          ? remaining[0].id
                                          : "default",
                                      );
                                    }
                                    showToast("Deleted");
                                  }
                                } else if (s.type === "live") {
                                  setPastLiveSessions((prev) =>
                                    prev.filter(
                                      (sess) =>
                                        sess.id !== s.id.replace("live-", ""),
                                    ),
                                  );
                                  if (activeSessionId === s.id) {
                                    setActiveSessionId(
                                      chatSessions[0]?.id || "default",
                                    );
                                  }
                                  showToast("Voice Session Removed");
                                }
                              }}
                              className={`absolute top-1/2 -translate-y-1/2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10 cursor-pointer ${currentTheme.isDark ? "hover:bg-white/10 text-white/50 hover:text-red-400" : "hover:bg-white text-slate-400 hover:text-red-500"}`}
                              title="Delete Option"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                    )}
                  </div>

                  <div className="p-4 border-t border-white/5 shrink-0 flex flex-col gap-2">
                    <button
                      onClick={() => {
                        setChatSessions([
                          { id: "default", title: "New Chat", messages: [] },
                        ]);
                        setPastLiveSessions([]);
                        setTranslationHistory([]);
                        setActiveSessionId("default");
                        showToast("All History Cleared");
                      }}
                      className={`w-full p-3 rounded-xl flex justify-center items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all ${currentTheme.isDark ? "text-red-400/80 hover:bg-red-500/10 hover:text-red-400" : "text-red-500/80 hover:bg-red-50 hover:text-red-600"}`}
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear All History
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showMicPermissionModal && (
              <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/80 ">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className={`w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border ${currentTheme.isDark ? "bg-slate-900 border-white/10" : "bg-white border-slate-200"}`}
                >
                  <div className="p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-red-500/20 mx-auto flex items-center justify-center mb-4">
                      <Mic className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-lg font-black tracking-tight mb-2">
                      Microphone Access Blocked
                    </h2>
                    <p
                      className={`text-sm mb-6 ${currentTheme.isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      We couldn't access your microphone. Please allow
                      microphone access via your mobile browser's address bar
                      settings (e.g., tap the Lock icon in Chrome or the "aA"
                      icon in Safari), or try opening the app in a new tab.
                    </p>
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => {
                          window.open(window.location.href, "_blank");
                          setShowMicPermissionModal(false);
                        }}
                        className="w-full py-3 rounded-xl bg-indigo-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition-colors"
                      >
                        Open in New Tab
                      </button>
                      <button
                        onClick={() => setShowMicPermissionModal(false)}
                        className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors ${currentTheme.isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Reminders Module */}
          <DailyTip isDark={currentTheme.isDark} />
          <AnimatePresence>
            {showOnboarding && (
              <OnboardingGuide
                onComplete={() => {
                  setShowOnboarding(false);
                  localStorage.setItem("geez_onboarding_complete", "true");
                }}
                isDark={currentTheme.isDark}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isMemoryDrawerOpen && (
              <MemoryBankDrawer
                isOpen={isMemoryDrawerOpen}
                onClose={() => setIsMemoryDrawerOpen(false)}
                memories={memories}
                onAddMemory={handleAddMemory}
                onEditMemory={handleEditMemory}
                onDeleteMemory={handleDeleteMemory}
                onClearAllMemories={handleClearAllMemories}
                currentTheme={currentTheme}
                isMemoryEnabled={isMemoryEnabled}
                onToggleMemoryEnabled={handleToggleMemoryEnabled}
                customSystemInstructions={customSystemInstructions}
                onSaveCustomSystemInstructions={
                  handleSaveCustomSystemInstructions
                }
                t={t}
                activeLanguage={activeLanguage}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showExportModal && (
              <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-black/75 ">
                <motion.div
                  initial={{ scale: 0.92, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.92, opacity: 0 }}
                  className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl flex flex-col gap-5 ${
                    currentTheme.isDark
                      ? "bg-slate-900 border border-white/10 text-white"
                      : "bg-white border border-slate-200 text-slate-900"
                  }`}
                >
                  <div className="flex justify-between items-center pb-3 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                        <Download className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black tracking-tight">Export Transcript</h3>
                        <p className="text-xs opacity-60 font-medium">
                          Download session history as Markdown (.md) or PDF
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowExportModal(false)}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${
                        currentTheme.isDark ? "hover:bg-white/10 text-white/60" : "hover:bg-slate-100 text-slate-500"
                      }`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Target Session Picker */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-70">
                      Select Session Scope
                    </label>
                    <select
                      value={exportSessionTarget}
                      onChange={(e) => setExportSessionTarget(e.target.value)}
                      className={`w-full p-3.5 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                        currentTheme.isDark
                          ? "bg-slate-800 border border-white/10 text-white"
                          : "bg-slate-100 border border-slate-200 text-slate-900"
                      }`}
                    >
                      <option value="active">
                        Current Active Chat Session ({activeSessionChat?.title || "Active"})
                      </option>
                      <option value="all">
                        Full History Archive (All Chats & Voice Transcripts)
                      </option>
                      {combinedHistory
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.type === "live" ? "🎙️ Voice: " : "💬 Chat: "} {item.title}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Format Selection Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <button
                      onClick={() => handleExportTranscript(exportSessionTarget, "markdown")}
                      className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 group cursor-pointer ${
                        currentTheme.isDark
                          ? "bg-white/5 border-white/10 hover:bg-indigo-500/10 hover:border-indigo-500/40"
                          : "bg-slate-50 border-slate-200 hover:bg-indigo-50 hover:border-indigo-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                          <FileCode className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-extrabold text-sm block">Markdown (.md)</span>
                          <span className="text-[10px] opacity-60 font-semibold block">Formatted text file</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-500 group-hover:translate-x-1 transition-transform">
                        <span>Download .md</span>
                        <Download className="w-4 h-4" />
                      </div>
                    </button>

                    <button
                      onClick={() => handleExportTranscript(exportSessionTarget, "pdf")}
                      className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 group cursor-pointer ${
                        currentTheme.isDark
                          ? "bg-white/5 border-white/10 hover:bg-indigo-500/10 hover:border-indigo-500/40"
                          : "bg-slate-50 border-slate-200 hover:bg-indigo-50 hover:border-indigo-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
                          <Printer className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-extrabold text-sm block">PDF / Print (.pdf)</span>
                          <span className="text-[10px] opacity-60 font-semibold block">Printable layout</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs font-bold text-indigo-500 group-hover:translate-x-1 transition-transform">
                        <span>Print / Save PDF</span>
                        <Printer className="w-4 h-4" />
                      </div>
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {toastMessage && (
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[2000] px-6 py-3 rounded-full bg-slate-800 text-white text-xs font-bold uppercase tracking-widest shadow-2xl border border-white/10"
              >
                {toastMessage}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
