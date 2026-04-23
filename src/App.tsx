/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { MessageSquare, MessageSquarePlus, Send, Bot, User, Delete, ChevronUp, Space, CornerDownLeft, Globe, Copy, ClipboardPaste, Trash2, Check, Settings2, RotateCcw, X, Save, Languages, Mic, MicOff, Palette, Smile, Rows, Wand2, Sparkles, Loader2, ArrowLeftRight, Type, ClipboardList, Pin, PinOff, Search, Bold, Italic, Underline, Zap, Plus, Trash, CheckCircle2, Maximize2, CornerDownRight, BrainCircuit, History, Pencil, Volume2, Download, Highlighter } from 'lucide-react';
import { GEEZ_MAP, VOWEL_MAP, PHONETIC_MAP } from './geezUtils';
import { startAIChat, sendMessageToAI, sendMessageStreamToAI, generateTTS, generateSuggestions, ChatMessage } from './services/geminiService';
import { GoogleGenAI } from "@google/genai";
import { LiveAssistant } from './services/liveAssistant';
import { getAudioContext, playBase64Audio } from './services/audioService';
import { downloadWav } from './lib/wavUtils';
import { Headphones, Radio, Mic2, Eye, EyeOff, Camera, Video } from 'lucide-react';

// Predefined Emoji List
const EMOJIS = ['😀', '😂', '😍', '🥰', '😊', '🤔', '🙌', '👏', '🔥', '✨', '❤️', '🇪🇷', '🇪🇹', '👍', '🙏', '🎉', '🌟', '😎', '😜', '😢', '📍', '✅', '❌', '💯'];

// ... (at the top with WORLD_LANGUAGES, add this)
const getFlagEmoji = (code: string) => {
  const flags: Record<string, string> = {
    'en': '🇺🇸', 'es': '🇪🇸', 'fr': '🇫🇷', 'zh': '🇨🇳', 'tr': '🇹🇷',
    'de': '🇩🇪', 'it': '🇮🇹', 'ru': '🇷🇺', 'ja': '🇯🇵', 'ko': '🇰🇷',
    'ar': '🇸🇦', 'ti': '🇪🇷', 'am': '🇪🇹', 'hi': '🇮🇳', 'pt': '🇵🇹'
  };
  return flags[code] || '🌐';
};

const WORLD_LANGUAGES = [
  { code: 'auto', name: 'Auto-Detect' },
  { code: 'ti', name: 'Tigrinya' },
  { code: 'en', name: 'English' },
  { code: 'am', name: 'Amharic' },
  { code: 'ar', name: 'Arabic' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'zh', name: 'Chinese' },
  { code: 'tr', name: 'Turkish' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'af', name: 'Afrikaans' },
  { code: 'sq', name: 'Albanian' },
  { code: 'hy', name: 'Armenian' },
  { code: 'az', name: 'Azerbaijani' },
  { code: 'eu', name: 'Basque' },
  { code: 'be', name: 'Belarusian' },
  { code: 'bn', name: 'Bengali' },
  { code: 'bs', name: 'Bosnian' },
  { code: 'bg', name: 'Bulgarian' },
  { code: 'ca', name: 'Catalan' },
  { code: 'ceb', name: 'Cebuano' },
  { code: 'ny', name: 'Chichewa' },
  { code: 'co', name: 'Corsican' },
  { code: 'hr', name: 'Croatian' },
  { code: 'cs', name: 'Czech' },
  { code: 'da', name: 'Danish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'eo', name: 'Esperanto' },
  { code: 'et', name: 'Estonian' },
  { code: 'tl', name: 'Filipino' },
  { code: 'fi', name: 'Finnish' },
  { code: 'fy', name: 'Frisian' },
  { code: 'gl', name: 'Galician' },
  { code: 'ka', name: 'Georgian' },
  { code: 'el', name: 'Greek' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'ht', name: 'Haitian Creole' },
  { code: 'ha', name: 'Hausa' },
  { code: 'haw', name: 'Hawaiian' },
  { code: 'iw', name: 'Hebrew' },
  { code: 'hi', name: 'Hindi' },
  { code: 'hmn', name: 'Hmong' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'is', name: 'Icelandic' },
  { code: 'ig', name: 'Igbo' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ga', name: 'Irish' },
  { code: 'jw', name: 'Javanese' },
  { code: 'kn', name: 'Kannada' },
  { code: 'kk', name: 'Kazakh' },
  { code: 'km', name: 'Khmer' },
  { code: 'ku', name: 'Kurdish' },
  { code: 'ky', name: 'Kyrgyz' },
  { code: 'lo', name: 'Lao' },
  { code: 'la', name: 'Latin' },
  { code: 'lv', name: 'Latvian' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'lb', name: 'Luxembourgish' },
  { code: 'mk', name: 'Macedonian' },
  { code: 'mg', name: 'Malagasy' },
  { code: 'ms', name: 'Malay' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'mt', name: 'Maltese' },
  { code: 'mi', name: 'Maori' },
  { code: 'mr', name: 'Marathi' },
  { code: 'mn', name: 'Mongolian' },
  { code: 'my', name: 'Myanmar (Burmese)' },
  { code: 'ne', name: 'Nepali' },
  { code: 'no', name: 'Norwegian' },
  { code: 'ps', name: 'Pashto' },
  { code: 'fa', name: 'Persian' },
  { code: 'pl', name: 'Polish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'ro', name: 'Romanian' },
  { code: 'sm', name: 'Samoan' },
  { code: 'gd', name: 'Scots Gaelic' },
  { code: 'sr', name: 'Serbian' },
  { code: 'st', name: 'Sesotho' },
  { code: 'sn', name: 'Shona' },
  { code: 'sd', name: 'Sindhi' },
  { code: 'si', name: 'Sinhala' },
  { code: 'sk', name: 'Slovak' },
  { code: 'sl', name: 'Slovenian' },
  { code: 'so', name: 'Somali' },
  { code: 'su', name: 'Sundanese' },
  { code: 'sw', name: 'Swahili' },
  { code: 'sv', name: 'Swedish' },
  { code: 'tg', name: 'Tajik' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'th', name: 'Thai' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'ur', name: 'Urdu' },
  { code: 'uz', name: 'Uzbek' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'cy', name: 'Welsh' },
  { code: 'xh', name: 'Xhosa' },
  { code: 'yi', name: 'Yiddish' },
  { code: 'yo', name: 'Yoruba' },
  { code: 'zu', name: 'Zulu' },
];

// Theme Definitions

// Audio Tick Utility for Keyboard Feedback
const playKeySound = () => {
  try {
    const audioCtx = getAudioContext();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    // Slightly higher frequency for a crisp "tick"
    oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.05);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.05);
  } catch (e) {
    // Fail silently if AudioContext is blocked or not supported
  }
};

// Word Dictionary for Prediction & Autocorrect
const TIGRINYA_DICTIONARY: Record<string, string[]> = {
  'selam': ['ሰላም', 'ሰላምታ', 'ሰላማዊ', 'ሰላምታው'],
  'kemey': ['ከመይ', 'ከመይከ', 'ከመይነት', 'ከመይኩም'],
  'hagere': ['ሃገረ', 'ሃገራዊ', 'ሃገር', 'ሃገራ'],
  'eritrea': ['ኤርትራ', 'ኤርትራዊ', 'ኤርትራውያን', 'ኤርትራዊት'],
  'dehan': ['ደሓን', 'ደሓንኩም', 'ደሓንዶ', 'ደሓንኪ'],
  'kulu': ['ኩሉ', 'ኩሎም', 'ኩለን', 'ኩሉኹም'],
  'nishi': ['ንእሽተይ', 'ንእስነት', 'ንእሳታ'],
  'abey': ['አበይ', 'አበይቲ', 'አበይቲ ፍረታት', 'አበይቲ ዓድታት'],
  'tezeker': ['ተዘከር', 'ተዘከረ', 'ተዘክሮ'],
  'yekenye': ['የቐንየለይ', 'የቐንየልካ', 'የቐንየልኪ'],
};

// Common misspellings for auto-correction testing
const AUTOCORRECT_MAP: Record<string, string> = {
  'ሰላምቱ': 'ሰላምታ',
  'ኤርትር': 'ኤርትራ',
  'ሃገሬ': 'ሃገረ',
  'ሰላምዉ': 'ሰላማዊ'
};

const THEMES = {
  black: {
    name: 'Deep Black',
    bg: '#000000',
    mesh: [
      'radial-gradient(at 0% 0%, #111111 0, transparent 40%)',
      'radial-gradient(at 100% 100%, #0a0a0a 0, transparent 40%)',
      'radial-gradient(at 50% 50%, #050505 0, transparent 60%)'
    ],
    accent: 'slate-300',
    accentBg: 'bg-white/10',
    accentText: 'text-white/90',
    accentBorder: 'border-white/20',
    isDark: true
  },
  light: {
    name: 'Light Gray',
    bg: '#e2e8f0',
    mesh: [
      'radial-gradient(at 0% 0%, #f8fafc 0, transparent 50%)',
      'radial-gradient(at 100% 100%, #cbd5e1 0, transparent 50%)',
      'radial-gradient(at 50% 50%, #f1f5f9 0, transparent 60%)'
    ],
    accent: 'slate-600',
    accentBg: 'bg-black/5',
    accentText: 'text-slate-900',
    accentBorder: 'border-black/10',
    isDark: false
  },
  eritrean: {
    name: 'Eritrean Spirit',
    bg: '#064e3b',
    mesh: [
      'radial-gradient(at 0% 0%, #2563eb 0, transparent 60%)', // Blue
      'radial-gradient(at 100% 100%, #059669 0, transparent 60%)', // Green
      'radial-gradient(at 50% 50%, #dc2626 0, transparent 50%)'  // Red (central)
    ],
    accent: 'blue-400',
    accentBg: 'bg-blue-500/20',
    accentText: 'text-blue-100',
    accentBorder: 'border-blue-500/30',
    isDark: true
  }
};

type ThemeKey = keyof typeof THEMES;

// Default Keyboard Layout
const EN_LABELS: Record<string, string> = {
  'ቀ': 'q', 'ወ': 'w', 'ዐ': 'e', 'ረ': 'r', 'ተ': 't', 'የ': 'y', 'ጠ': 't`', 'ጰ': 'p`', 'ፐ': 'p', 'ጸ': 'ts', 'ፀ': 'tz',
  'አ': 'a', 'ሰ': 's', 'ደ': 'd', 'ፈ': 'f', 'ገ': 'g', 'ሀ': 'h', 'ጀ': 'j', 'ከ': 'k', 'ለ': 'l', 'ሸ': 'sh', 'ቸ': 'ch', 'ሐ': 'hh',
  'ዘ': 'z', 'ኸ': 'x', 'ጨ': 'ch`', 'ቨ': 'v', 'በ': 'b', 'ነ': 'n', 'መ': 'm', 'ኘ': 'ny', 'ዠ': 'zh'
};

const TIGRINYA_ROWS = [
  ['ቀ', 'ወ', 'ዐ', 'ረ', 'ተ', 'የ', 'ጠ', 'ጸ', 'ፀ'],
  ['አ', 'ሰ', 'ደ', 'ፈ', 'ገ', 'ሀ', 'ጀ', 'ከ', 'ለ', 'ሸ', 'ቸ', 'ሐ'],
  ['shift', 'ዘ', 'ኸ', 'ጨ', 'በ', 'ነ', 'መ', 'ኘ', 'ዠ', 'backspace'],
  ['123', 'globe', 'emoji', 'mic', 'space', 'enter'],
];

const AMHARIC_ROWS = [
  ['ቀ', 'ወ', 'ዐ', 'ረ', 'ተ', 'የ', 'ጠ', 'ጰ', 'ፐ', 'ጸ', 'ፀ'],
  ['አ', 'ሰ', 'ደ', 'ፈ', 'ገ', 'ሀ', 'ጀ', 'ከ', 'ለ', 'ሸ', 'ቸ', 'ሐ'],
  ['shift', 'ዘ', 'ኸ', 'ጨ', 'ቨ', 'በ', 'ነ', 'መ', 'ኘ', 'ዠ', 'backspace'],
  ['123', 'globe', 'emoji', 'mic', 'space', 'enter'],
];

const LATIN_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace'],
  ['123', 'globe', 'emoji', 'mic', 'space', 'enter'],
];

const DEFAULT_ROWS = TIGRINYA_ROWS;

const SYMBOL_ROWS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['-', '/', '(', ')', '$', '&', '@', '"', '.', ','],
  ['shift', '፣', '፤', '።', '፥', 'backspace'],
  ['ABC', 'globe', 'emoji', 'mic', 'space', 'enter'],
];

export default function App() {
  const [text, setText] = useState('');
  const [isShift, setIsShift] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState<'english' | 'tigrinya' | 'amharic'>('tigrinya');
  const [isSymbols, setIsSymbols] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingPage, setOnboardingPage] = useState(0);
  const [onboardingSteps, setOnboardingSteps] = useState({
    enabled: false,
    selected: false,
    typed: false
  });
  const [themeKey, setThemeKey] = useState<ThemeKey>('eritrean');
  const [listeningTarget, setListeningTarget] = useState<'main' | 'chat'>('main');
  const listeningTargetRef = useRef<'main' | 'chat'>('main');
  const [chatSessions, setChatSessions] = useState<{id: string, title: string, messages: ChatMessage[]}[]>(() => {
    try {
      const saved = localStorage.getItem('chat_sessions');
      return saved ? JSON.parse(saved) : [{id: 'default', title: 'New Chat', messages: []}];
    } catch(e) { return [{id: 'default', title: 'New Chat', messages: []}]; }
  });
  const [activeSessionId, setActiveSessionId] = useState<string>('default');
  
  useEffect(() => {
    localStorage.setItem('chat_sessions', JSON.stringify(chatSessions));
  }, [chatSessions]);

  const activeSession = chatSessions.find(s => s.id === activeSessionId) || chatSessions[0];
  const chatMessages = activeSession.messages;

  const setChatMessages = (updater: (prev: ChatMessage[]) => ChatMessage[]) => {
    setChatSessions(prev => prev.map(s => s.id === activeSessionId ? {...s, messages: updater(s.messages)} : s));
  };

  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [showChatSearch, setShowChatSearch] = useState(false);
  
  const [chatInput, setChatInput] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState('');
  const [displayedStreamingResponse, setDisplayedStreamingResponse] = useState('');

  // Typewriter effect layer
  useEffect(() => {
    if (!streamingResponse) {
      setDisplayedStreamingResponse('');
      return;
    }

    const diff = streamingResponse.length - displayedStreamingResponse.length;
    if (diff > 0) {
      // If we are lagging far behind (e.g., large chunk arrived), type faster by taking larger chunks
      const charsToAdd = Math.max(1, Math.ceil(diff / 8)); 
      
      const timeoutId = setTimeout(() => {
        setDisplayedStreamingResponse(
          streamingResponse.slice(0, displayedStreamingResponse.length + charsToAdd)
        );
      }, 15); // Real-time typewriter speed
      
      return () => clearTimeout(timeoutId);
    }
  }, [streamingResponse, displayedStreamingResponse]);
  const [streamingThought, setStreamingThought] = useState('');
  const [streamingSources, setStreamingSources] = useState<{title: string, uri: string}[]>([]);
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
  const [playingChatTtsIndex, setPlayingChatTtsIndex] = useState<number | null>(null);
  const [editMessageInput, setEditMessageInput] = useState('');
  const [isGeneratingTTS, setIsGeneratingTTS] = useState(false);
  const [audioData, setAudioData] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showChatSettingsMenu, setShowChatSettingsMenu] = useState(false);
  const [chatLanguage, setChatLanguage] = useState(() => localStorage.getItem('chat_language') || 'auto');
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isVisionMode, setIsVisionMode] = useState(false);
  const [showLiveSettings, setShowLiveSettings] = useState(false);
  const [liveVoice, setLiveVoice] = useState(() => localStorage.getItem('live_voice') || 'Zephyr');
  const [liveLanguage, setLiveLanguage] = useState(() => localStorage.getItem('live_language') || 'auto');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [chatSuggestions, setChatSuggestions] = useState<string[]>([]);
  const [showGroundingPanel, setShowGroundingPanel] = useState(false);
  const [panelSources, setPanelSources] = useState<{ title: string; uri: string }[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<any>(null);
  const liveAssistantRef = useRef<LiveAssistant | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isVisionMode && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            liveAssistantRef.current?.startVision(videoRef.current);
          }
        })
        .catch(err => {
          console.error("Camera access denied:", err);
          setIsVisionMode(false);
          showToast("Camera access failed.");
        });
    } else {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(t => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      liveAssistantRef.current?.stopVision();
    }
  }, [isVisionMode]);

  useEffect(() => {
    localStorage.setItem('live_voice', liveVoice);
  }, [liveVoice]);

  useEffect(() => {
    localStorage.setItem('live_language', liveLanguage);
  }, [liveLanguage]);

  useEffect(() => {
    if (isLiveMode) {
      if (!liveAssistantRef.current) {
        liveAssistantRef.current = new LiveAssistant();
      }

      const instructions: Record<string, string> = {
        ti: "You are a helpful Tigrinya assistant. You must speak only in Tigrinya.",
        am: "You are a helpful Amharic assistant. You must speak only in Amharic.",
        en: "You are a helpful English assistant. You must speak only in English.",
        auto: "You are a helpful Tigrinya, Amharic and English assistant. Respond in the language the user speaks to you."
      };

      liveAssistantRef.current.connect(
        (text) => {
          setChatMessages(prev => [...prev, { role: 'model', parts: text }]);
          setLiveTranscript(text);
        },
        () => {
          console.log("Interrupted");
        },
        (err) => {
          console.error("Live Assistant Error:", err);
          setIsLiveMode(false);
          showToast("Microphone access or connection failed.");
        },
        { 
          voiceName: liveVoice,
          systemInstruction: instructions[liveLanguage] || instructions.auto
        }
      );
    } else {
      liveAssistantRef.current?.disconnect();
    }
    return () => liveAssistantRef.current?.disconnect();
  }, [isLiveMode, liveVoice, liveLanguage]);

  const [masterScale, setMasterScale] = useState<number>(() => {
    const saved = localStorage.getItem('master_scale');
    return saved ? parseFloat(saved) : 1.0;
  });
  const [lastSnap, setLastSnap] = useState<number>(1.0);
  const [themeTransparency, setThemeTransparency] = useState<number>(() => {
    const saved = localStorage.getItem('theme_transparency');
    return saved ? parseInt(saved) : 80;
  });
  const [toolbarOrder, setToolbarOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('toolbar_order');
    // Removed 'mic' from default to avoid redundancy with the bottom row
    return saved ? JSON.parse(saved) : ['ai', 'chat', 'paste', 'toggle_translation', 'read_aloud', 'download_audio', 'highlight', 'generator', 'globe', 'translate', 'clipboard', 'settings'];
  });
  const [hiddenTools, setHiddenTools] = useState<string[]>(() => {
    const saved = localStorage.getItem('hidden_tools');
    return saved ? JSON.parse(saved) : [];
  });
  const [keyboardSize, setKeyboardSize] = useState<number>(() => {
    const saved = localStorage.getItem('keyboard_size');
    return saved ? parseInt(saved) : 40; // Default 40vh
  });
  const [keyScale, setKeyScale] = useState<number>(() => {
    const saved = localStorage.getItem('key_scale');
    return saved ? parseInt(saved) : 100; // Default 100%
  });
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPasteTranslationPrompt, setShowPasteTranslationPrompt] = useState<{ text: string, startIndex: number, endIndex: number } | null>(null);
  const [isInputHighlighted, setIsInputHighlighted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [layout, setLayout] = useState<string[][]>(DEFAULT_ROWS);
  const [selectedKey, setSelectedKey] = useState<{ row: number; col: number } | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isToneAdjusting, setIsToneAdjusting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isHighlightMode, setIsHighlightMode] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const cycleLanguage = useCallback(() => {
    let nextLanguage: 'english' | 'tigrinya' | 'amharic';
    if (activeLanguage === 'english') nextLanguage = 'tigrinya';
    else if (activeLanguage === 'tigrinya') nextLanguage = 'amharic';
    else nextLanguage = 'english';
    
    console.log('Switched to:', nextLanguage);
    setActiveLanguage(nextLanguage);
    
    if (!isSymbols) {
      if (nextLanguage === 'english') setLayout(LATIN_ROWS);
      else if (nextLanguage === 'tigrinya') setLayout(TIGRINYA_ROWS);
      else if (nextLanguage === 'amharic') setLayout(AMHARIC_ROWS);
    }
    
    showToast(`Mode: ${nextLanguage.charAt(0).toUpperCase() + nextLanguage.slice(1)}`);
  }, [activeLanguage, isSymbols]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 2000);
  };
  const [activeMenus, setActiveMenus] = useState({
    theme: false,
    emoji: false,
    tone: false, // This now replaces showToneMenu
    translationBar: false,
    format: false,
    shortcuts: false,
    gif: false,
    clipboard: false,
    export: false,
    region: false,
    settings: false,
  });
  const [selectedTone, setSelectedTone] = useState<string | null>(null);

  const toggleMenu = (menuKey: keyof typeof activeMenus) => {
    setActiveMenus(prev => ({
      ...Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {} as typeof activeMenus),
      [menuKey]: !prev[menuKey]
    }));
  };

  const showErrorMessage = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 3000);
  };
  const [translationInput, setTranslationInput] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('ti');
  const [isTranslatingRealtime, setIsTranslatingRealtime] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState<{ type: 'source' | 'target', open: boolean }>({ type: 'target', open: false });
  const [langSearch, setLangSearch] = useState('');
  const toggleToolVisibility = (toolId: string) => {
    setHiddenTools(prev => {
      const isHidden = prev.includes(toolId);
      const updated = isHidden ? prev.filter(t => t !== toolId) : [...prev, toolId];
      localStorage.setItem('hidden_tools', JSON.stringify(updated));
      return updated;
    });
  };

  const moveTool = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...toolbarOrder];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newOrder.length) return;
    
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
    setToolbarOrder(newOrder);
    localStorage.setItem('toolbar_order', JSON.stringify(newOrder));
  };

  const resetToolbar = () => {
    const defaultOrder = ['ai', 'globe', 'translate', 'clipboard', 'settings', 'mic'];
    setToolbarOrder(defaultOrder);
    setHiddenTools([]);
    localStorage.setItem('toolbar_order', JSON.stringify(defaultOrder));
    localStorage.setItem('hidden_tools', JSON.stringify([]));
  };

  const renderTool = (toolId: string) => {
    if (hiddenTools.includes(toolId)) return null;

    const toolContent = (() => {
      switch (toolId) {
        case 'ai': 
          return <Sparkles className="w-5 h-5"/>;
        case 'chat':
          return <MessageSquare className="w-5 h-5"/>;
        case 'globe':
          return <Globe className="w-5 h-5"/>;
        case 'translate':
          return <ArrowLeftRight className="w-5 h-5"/>;
        case 'clipboard':
          return <ClipboardList className="w-5 h-5"/>;
        case 'settings':
          return <Settings2 className="w-5 h-5"/>;
        case 'mic':
          return <Mic className={`w-5 h-5 ${isListening ? 'text-rose-400' : ''}`}/>;
        case 'paste':
          return <ClipboardPaste className="w-5 h-5"/>;
        case 'toggle_translation':
          return <Wand2 className="w-5 h-5"/>;
        case 'read_aloud':
          return <Volume2 className="w-5 h-5"/>;
        case 'download_audio':
          return <Download className="w-5 h-5"/>;
        case 'highlight':
          return <Highlighter className="w-5 h-5"/>;
        case 'generator':
          return <Palette className="w-5 h-5"/>;
        default:
          return null;
      }
    })();

    const handleReadAloud = async () => {
        if (!text.trim()) return;
        setIsGeneratingTTS(true);
        try {
            const audioData = await generateTTS(text);
            if (audioData) {
                setAudioData(audioData);
                await playBase64Audio(audioData);
            }
        } catch (e) {
            console.error(e);
            showToast("Failed to generate audio.");
        } finally {
            setIsGeneratingTTS(false);
        }
    };

    const handleDownloadAudio = () => {
        if (!audioData) {
            showToast("Generate audio first.");
            return;
        }
        downloadWav(audioData, "audio_export.wav");
    };

    return (
      <button 
        key={toolId} 
        onClick={() => {
          if (toolId === 'ai') handleAIMagic();
          else if (toolId === 'chat') setShowChat(true);
          else if (toolId === 'globe') cycleLanguage();
          else if (toolId === 'translate') toggleMenu('region');
          else if (toolId === 'clipboard') toggleMenu('clipboard');
          else if (toolId === 'settings') toggleMenu('settings');
          else if (toolId === 'mic') toggleListening();
          else if (toolId === 'paste') handlePaste();
          else if (toolId === 'toggle_translation') toggleMenu('translationBar');
          else if (toolId === 'read_aloud') handleReadAloud();
          else if (toolId === 'download_audio') handleDownloadAudio();
          else if (toolId === 'highlight') setIsHighlightMode(!isHighlightMode);
          else if (toolId === 'generator') setShowGenerator(true);
        }} 
        // Proportional Touch Target Width (approx 8.5% of toolbar)
        className={`w-[8.5%] h-full flex items-center justify-center text-white/90 hover:bg-white/10 rounded-[1vh] transition-all shrink-0 ${
          (toolId === 'toggle_translation' && activeMenus.translationBar) ? 'bg-blue-500/20 text-blue-400': ''
        } ${((toolId === 'read_aloud' || toolId === 'download_audio') && isGeneratingTTS) ? 'animate-pulse opacity-50': ''} ${
          (toolId === 'highlight' && isHighlightMode) ? 'bg-yellow-500/20 text-yellow-500': ''
        }`}
      >
        <div style={{ width: 'min(5vw, 24px)', height: 'min(5vw, 24px)' }}>
          {toolContent}
        </div>
      </button>
    );
  };

  const factoryReset = () => {
    if (confirm("Factory Reset: This will wipe ALL your custom themes, sizes, and toolbar layouts. Proceed?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  useEffect(() => {
    localStorage.setItem('chat_language', chatLanguage);
    // Restart session when language changes to apply new system instruction
    chatSessionRef.current = null;
  }, [chatLanguage]);

  const sendToAI = async (textToSend: string, historyContext: ChatMessage[]) => {
    const userMessage: ChatMessage = { role: 'user', parts: textToSend };
    setChatMessages((prev) => [...historyContext, userMessage]);
    setChatInput('');
    setIsAssistantTyping(true);
    setStreamingResponse('');
    setStreamingThought('');
    setStreamingSources([]);
    setIsSearching(false);

    try {
      const baseRules = "Role: Act as the Google Gemini Assistant. Provide structured, professional, and clean responses.\n\nVisual Style Rules:\n- Formatting: Use Markdown for all text.\n- Use ### for all section headers.\n- Use **Bold** for key terms.\n- Use * for bulleted lists.\n\nStructure:\n- Begin with a one-sentence Summary.\n- Group related information into distinct sections.\n- Use double line breaks between sections for White Space.\n\nConciseness:\n- Be direct. Do not use conversational filler. Deliver the information organized by headers.\n\nSTRICT Language Matching Rules:\n1. DETECT the exact language the user is speaking (e.g. English, Tigrinya, Amharic).\n2. RESPOND 100% in that SAME language.\n3. NEVER mix languages (No English definitions, no translations, no summaries in a different language) unless explicitly asked to translate.\n\nSource Links:\n- Format links as [Source Name](URL).";
      
      const instructions: Record<string, string> = {
        ti: `${baseRules}\n\nLanguage Directive: The user is using Tigrinya. Always respond 100% in Tigrinya.`,
        am: `${baseRules}\n\nLanguage Directive: The user is using Amharic. Always respond 100% in Amharic.`,
        en: `${baseRules}\n\nLanguage Directive: The user is using English. Always respond 100% in English.`,
        auto: `${baseRules}\n\nLanguage Directive: Detect the language the user speaks and respond 100% in that exact language.`
      };

      // Always restart the session with the exact history context provided to allow temporal branching (editing)
      chatSessionRef.current = startAIChat(historyContext, instructions[chatLanguage] || instructions.auto);
      
      const stream = await sendMessageStreamToAI(chatSessionRef.current, userMessage.parts);
      let fullResponse = '';
      let fullThought = '';
      let sources: { title: string, uri: string }[] = [];

      for await (const chunk of stream) {
        const candidate = chunk.candidates?.[0];
        
        // Detect if a search was triggered
        if (candidate?.groundingMetadata?.webSearchQueries || candidate?.groundingMetadata?.searchEntryPoint || candidate?.groundingMetadata?.groundingChunks) {
          setIsSearching(true);
        }

        if (candidate?.content?.parts) {
          for (const part of candidate.content.parts) {
            // Also check for explicit tool calls
            if (part.executableCode || (part as any).functionCall || (part as any).call?.googleSearch) {
              setIsSearching(true);
            }
            if (part.thought) {
              fullThought += part.thought;
              setStreamingThought(fullThought);
            }
            if (part.text) {
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
            if (!sources.find(s => s.uri === src.uri)) {
              sources.push(src);
            }
          });
          setStreamingSources([...sources]);
        }
      }

      const assistantMessage: ChatMessage = { role: 'model', parts: fullResponse, groundingSources: sources };
      if (sources.length > 0) {
        setPanelSources(sources);
      }
      setChatMessages(prev => {
        // Because of the async await delay, carefully append only to the newly generated branch
        const newHistory = [...historyContext, userMessage, assistantMessage];
        // Generate new suggestions after assistant finishes
        generateSuggestions(newHistory, chatLanguage).then(s => setChatSuggestions(s));
        return newHistory;
      });
      setStreamingResponse('');
      setStreamingThought('');
      setStreamingSources([]);
      setIsSearching(false);
    } catch (err) {
      console.error("Chat failed:", err);
      showToast("Assistant is busy. Try again.");
    } finally {
      setIsAssistantTyping(false);
      setIsSearching(false);
    }
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || isAssistantTyping) return;
    setChatSuggestions([]);
    sendToAI(chatInput, chatMessages);
  };

  const submitEditedMessage = (index: number) => {
    if (!editMessageInput.trim() || isAssistantTyping) return;
    setEditingMessageIndex(null);
    sendToAI(editMessageInput, chatMessages.slice(0, index));
  };

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;                

    // Check if the user is near the bottom (within 150px)
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
    
    if (isNearBottom) {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, displayedStreamingResponse]);

  const [activePhonetic, setActivePhonetic] = useState('');
  const [cursorIndex, setCursorIndex] = useState(0);
  const cursorIndexRef = useRef(0);
  useEffect(() => {
    cursorIndexRef.current = cursorIndex;
  }, [cursorIndex]);

  const [shortcuts, setShortcuts] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('keyboard_shortcuts');
    return saved ? JSON.parse(saved) : { 'adr': 'Addis Ababa, Eritrea' };
  });
  const [newShortcutKey, setNewShortcutKey] = useState('');

  const [newShortcutValue, setNewShortcutValue] = useState('');

  useEffect(() => {
    localStorage.setItem('keyboard_shortcuts', JSON.stringify(shortcuts));
  }, [shortcuts]);

  const [isCursorMode, setIsCursorMode] = useState(false);
  const swipeStartX = useRef<number | null>(null);
  const lastMoveRef = useRef<number>(0);

  useEffect(() => {
    if (text === '') setCursorIndex(0);
  }, [text]);

  const getExpandedInfo = useCallback(() => {
    const textBeforeCursor = text.slice(0, cursorIndex);
    const lastWordMatch = textBeforeCursor.match(/(\S+)$/);
    
    if (lastWordMatch) {
      const lastWord = lastWordMatch[1];
      const expansion = shortcuts[lastWord.toLowerCase()];
      
      if (expansion) {
        const newText = text.slice(0, cursorIndex - lastWord.length) + expansion + text.slice(cursorIndex);
        const newCursorIndex = cursorIndex - lastWord.length + expansion.length;
        return { newText, newCursorIndex };
      }
    }
    return null;
  }, [text, cursorIndex, shortcuts]);

  const [clipboardItems, setClipboardItems] = useState<string[]>([]);
  const [pinnedItems, setPinnedItems] = useState<string[]>([]);
  
  const [isAiSuggestionsLoading, setIsAiSuggestionsLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isClipboardOpen, setIsClipboardOpen] = useState(false);

  // AI-Powered Next Word Prediction Logic
  const fetchAiPredictions = useCallback(async (currentText: string) => {
    if (!currentText.trim() || activeLanguage === 'english') {
      setAiSuggestions([]);
      return;
    }

    setIsAiSuggestionsLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `You are an Ethiopic keyboard assistant. Based on the following Tigrinya/Amharic text, predict the 3 most likely NEXT words the user will type. 
      Return only the words separated by commas, in Ge'ez script. No explanations or quotes.
      
      Text: "${currentText}"`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      
      const responseText = response.text || "";
      const predictions = responseText.split(',').map(s => s.trim()).filter(s => s.length > 0 && s.length < 15);
      
      setAiSuggestions(predictions.slice(0, 3));
    } catch (err) {
      console.error("AI Prediction failed:", err);
    } finally {
      setIsAiSuggestionsLoading(false);
    }
  }, [activeLanguage]);

  // Debounced AI Prediction Trigger
  useEffect(() => {
    const lastChar = text.slice(-1);
    // Only predict on space or end of word (punctuation)
    if (text && ([' ', '።', '፣', '!', '?'].includes(lastChar))) {
      const timer = setTimeout(() => {
        fetchAiPredictions(text);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [text, fetchAiPredictions]);
  const [clipboardActionMenu, setClipboardActionMenu] = useState<{ item: string; isPinned: boolean; x: number; y: number } | null>(null);
  
  const currentTheme = THEMES[themeKey] || THEMES.black;

  // Long press state
  const [vowelMenu, setVowelMenu] = useState<{ key: string; variations: string[]; x: number; y: number } | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    listeningTargetRef.current = listeningTarget;
  }, [listeningTarget]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'ti-ER'; // Tigrinya

      recognitionRef.current.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        
        setInterimTranscript(interim);
        
        if (final) {
          if (listeningTargetRef.current === 'chat') {
            setChatInput(prev => prev + final + ' ');
          } else {
            setText(prev => {
              const index = cursorIndexRef.current;
              // Ensure proper spacing when appending text via voice
              const insertText = (prev[index - 1] === ' ' || index === 0 ? '' : ' ') + final + ' ';
              const newText = prev.slice(0, index) + insertText + prev.slice(index);
              setCursorIndex(index + insertText.length);
              return newText;
            });
          }
        }
      };

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };
      recognitionRef.current.onerror = (event: any) => {
        console.error('Recognition error:', event.error);
        setIsListening(false);
        setInterimTranscript('');
      };
    }
  }, []);

  // Load layout and theme from local storage
  useEffect(() => {
    const savedLayout = localStorage.getItem('geez_keyboard_layout');
    
    if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout);
        
        // Auto-migration for mic and emoji keys
        const needsMigration = parsed.some((row: string[]) => {
          const isBottomRow = row.includes('123') || row.includes('ABC') || row.includes('space');
          if (isBottomRow) {
            return !row.includes('mic') || !row.includes('emoji');
          }
          return false;
        });

        if (needsMigration) {
          parsed.forEach((row: string[]) => {
            const globeIdx = row.indexOf('globe');
            if (globeIdx !== -1) {
              if (!row.includes('mic')) row.splice(globeIdx + 1, 0, 'mic');
              const micIdx = row.indexOf('mic');
              if (!row.includes('emoji')) row.splice(micIdx + 1, 0, 'emoji');
            }
          });
        }

        setLayout(parsed);
      } catch (e) {
        console.error('Failed to load layout', e);
      }
    }

    const savedTheme = localStorage.getItem('geez_keyboard_theme') as ThemeKey;
    if (savedTheme && THEMES[savedTheme]) {
      setThemeKey(savedTheme);
    }

    const onboardingComplete = localStorage.getItem('geez_onboarding_complete');
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
    const cleanedText = text.trim();
    if (!cleanedText && !activePhonetic) {
      setSuggestions([]);
      return;
    }

    const words = cleanedText.split(/\s+/);
    const lastWord = words[words.length - 1];

    if (!lastWord) {
      setSuggestions([]);
      return;
    }

    // Real-time dictionary lookup in Tigrinya
    const allWords = Object.values(TIGRINYA_DICTIONARY).flat();
    const matches = Array.from(new Set(allWords.filter(w => w.startsWith(lastWord) && w !== lastWord)));

    let foundSuggestions = [];
    
    // 1. Prioritize Auto-correct
    if (AUTOCORRECT_MAP[lastWord]) {
      foundSuggestions.push(AUTOCORRECT_MAP[lastWord]);
    }
    
    // 2. Add Dictionary matches
    if (matches.length > 0) {
      foundSuggestions = [...foundSuggestions, ...matches.filter(m => !foundSuggestions.includes(m))];
    }
    
    setSuggestions(foundSuggestions.slice(0, 5));
  }, [text]);

  // Real-time Translation (Debounced)
  useEffect(() => {
    if (!activeMenus.translationBar || !translationInput.trim()) return;

    const timeoutId = setTimeout(async () => {
      setIsTranslatingRealtime(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const source = WORLD_LANGUAGES.find(l => l.code === sourceLang)?.name || 'Auto-Detect';
        const target = WORLD_LANGUAGES.find(l => l.code === targetLang)?.name || 'Tigrinya';
        
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `You are a translation expert. Translate the following text from ${source} to ${target}. Return only the translated text. Do not include any explanations or alternative versions.\n\nText: ${translationInput}`,
        });
        
        const translated = response.text;
        if (translated) {
          setText(translated.trim());
          setCursorIndex(translated.trim().length);
        }
      } catch (err) {
        console.error("Real-time translation failed:", err);
      } finally {
        setIsTranslatingRealtime(false);
      }
    }, 800); // 800ms debounce

    return () => clearTimeout(timeoutId);
  }, [translationInput, sourceLang, targetLang, activeMenus.translationBar]);

  const applyFormatting = (format: 'bold' | 'italic' | 'underline') => {
    let startMarker = '';
    let endMarker = '';
    
    switch (format) {
      case 'bold': startMarker = '**'; endMarker = '**'; break;
      case 'italic': startMarker = '*'; endMarker = '*'; break;
      case 'underline': startMarker = '<u>'; endMarker = '</u>'; break;
    }

    const newText = text.slice(0, cursorIndex) + startMarker + endMarker + text.slice(cursorIndex);
    setText(newText);
    setCursorIndex(prev => prev + startMarker.length);
    toggleMenu('format');
  };

  const handleTranslate = async () => {
    if (!text || isTranslating) return;
    setIsTranslating(true);
    setIsProcessing(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const source = WORLD_LANGUAGES.find(l => l.code === sourceLang)?.name || 'Auto-Detect';
      const target = WORLD_LANGUAGES.find(l => l.code === targetLang)?.name || 'Tigrinya';

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are a translation expert. Translate the following text from ${source} to ${target}. Return only the translated text. Do not include any explanations or alternative versions.\n\nText: ${text}`,
      });
      
      const translation = response.text;
      if (translation) {
        setText(translation);
        setCursorIndex(translation.length);
      }
    } catch (err) {
      console.error("Translation failed:", err);
      showErrorMessage("Translation failed. Check API key.");
    } finally {
      setIsTranslating(false);
      setIsProcessing(false);
    }
  };

  const handleAIMagic = async () => {
    console.log('AI Button Clicked');
    if (!text.trim()) return;
    toggleMenu('tone');
  };

  const processToneRewrite = async (tone: string) => {
    setActiveMenus(prev => ({ ...prev, tone: false }));
    setIsToneAdjusting(true);
    setIsProcessing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Rewrite the following text to have a ${tone} tone: ${text}`,
      });
      
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

  const exportText = (format: 'txt' | 'rtf') => {
    const blob = new Blob([text], { type: format === 'txt' ? 'text/plain' : 'application/rtf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    toggleMenu('export');
  };

  const handleReadTextAloud = async () => {
    if (!text.trim() || isGeneratingTTS) return;
    setIsGeneratingTTS(true);
    try {
      showToast("Generating audio...");
      const audioBase64 = await generateTTS(text, 'Kore');
      if (audioBase64) {
        await playBase64Audio(audioBase64, 24000);
      } else {
        throw new Error("No audio data returned");
      }
    } catch (err) {
      console.error("TTS failed:", err);
      showToast("Failed to generate speech.");
    } finally {
      setIsGeneratingTTS(false);
    }
  };

  const handlePlayChatTts = async (messageParts: string, index: number) => {
    if (playingChatTtsIndex === index || isGeneratingTTS) return;
    setPlayingChatTtsIndex(index);
    try {
      const audioBase64 = await generateTTS(messageParts, 'Kore');
      if (audioBase64) {
        await playBase64Audio(audioBase64, 24000);
      } else {
        throw new Error("No audio data returned");
      }
    } catch (err) {
      console.error("Chat TTS failed:", err);
      showToast("Failed to generate speech.");
    } finally {
      if (playingChatTtsIndex === index) { // prevent overriding another play
        setPlayingChatTtsIndex(null); 
      }
      setPlayingChatTtsIndex(null);
    }
  };

  const toggleListening = (target: 'main' | 'chat' = 'main') => {
    // If clicking a DIFFERENT mic button while recording, just switch target
    if (isListening && target !== listeningTarget) {
      setListeningTarget(target);
      // Wait for language update to propagate or just update it immediately here
      if (recognitionRef.current) {
        if (target === 'chat') {
          const langMap: Record<string, string> = { ti: 'ti-ER', am: 'am-ET', en: 'en-US', auto: 'ti-ER' };
          // @ts-ignore
          recognitionRef.current.lang = langMap[chatLanguage] || 'ti-ER';
        } else {
          recognitionRef.current.lang = activeLanguage === 'english' ? 'en-US' : (activeLanguage === 'amharic' ? 'am-ET' : 'ti-ER');
        }
        // Browsers usually require stop/start to change language mid-stream, 
        // but for target change only we don't necessarily need to restart.
      }
      return;
    }

    if (isListening) recognitionRef.current?.stop();
    else {
      setListeningTarget(target);
      if (recognitionRef.current) {
        if (target === 'chat') {
          const langMap: Record<string, string> = { ti: 'ti-ER', am: 'am-ET', en: 'en-US', auto: 'ti-ER' };
          // @ts-ignore
          recognitionRef.current.lang = langMap[chatLanguage] || 'ti-ER';
        } else {
          recognitionRef.current.lang = activeLanguage === 'english' ? 'en-US' : (activeLanguage === 'amharic' ? 'am-ET' : 'ti-ER');
        }
      }
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.error('Failed to start recognition', e);
      }
    }
  };

  const handleSpaceSwipeStart = (e: any) => {
    const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
    swipeStartX.current = clientX;
    lastMoveRef.current = 0;
    setIsCursorMode(true);
  };

  const handleSpaceSwipeMove = (e: any) => {
    if (swipeStartX.current === null) return;
    const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
    const deltaX = clientX - swipeStartX.current;
    
    // Sensitivity: 15px per character
    const sensitivity = 15;
    const moveCount = Math.round(deltaX / sensitivity);

    if (moveCount !== lastMoveRef.current) {
      const diff = moveCount - lastMoveRef.current;
      setCursorIndex(prev => {
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
      handleKeyPress('space', 0, 0);
    }
    swipeStartX.current = null;
    setIsCursorMode(false);
    lastMoveRef.current = 0;
  };

  const handleLayoutEdit = useCallback((rowIndex: number, colIndex: number) => {
    if (!selectedKey) setSelectedKey({ row: rowIndex, col: colIndex });
    else {
      const newLayout = [...layout.map(row => [...row])];
      const temp = newLayout[selectedKey.row][selectedKey.col];
      newLayout[selectedKey.row][selectedKey.col] = newLayout[rowIndex][colIndex];
      newLayout[rowIndex][colIndex] = temp;
      setLayout(newLayout);
      setSelectedKey(null);
    }
  }, [layout, selectedKey]);

  // --- TRANSLITERATION ENGINE (Ge'ez logic) ---
  const processGeezLogic = (key: string, currentText: string, currentIndex: number) => {
    const lowerKey = key.toLowerCase();
    const vowelIdx = VOWEL_MAP[lowerKey];
    const phoneticBase = PHONETIC_MAP[lowerKey];

    // Check for Vowel Modification (Last character change)
    if (vowelIdx !== undefined && currentIndex > 0) {
      const lastChar = currentText[currentIndex - 1];
      for (const forms of Object.values(GEEZ_MAP)) {
        if (forms[0] === lastChar || forms[5] === lastChar) {
          const newChar = forms[vowelIdx];
          setText((prev) => prev.slice(0, currentIndex - 1) + newChar + prev.slice(currentIndex));
          return true; // Successfully modified previous char
        }
      }
    }

    // Base character insertion
    const charToInsert = isShift ? key.toUpperCase() : key;
    const geezForms = GEEZ_MAP[charToInsert];
    let finalChar = charToInsert;

    if (geezForms) {
      finalChar = geezForms[0];
    } else if (phoneticBase) {
      finalChar = phoneticBase;
    }

    setText((prev) => prev.slice(0, currentIndex) + finalChar + prev.slice(currentIndex));
    setCursorIndex(currentIndex + 1);
    return false;
  };

  const handleKeyPress = useCallback((key: string, rowIndex: number, colIndex: number) => {
    // Global Feedback
    playKeySound();
    if (window.navigator?.vibrate) window.navigator.vibrate(15);

    if (isEditing) {
      handleLayoutEdit(rowIndex, colIndex);
      return;
    }

    setActiveKey(key);
    setTimeout(() => setActiveKey(null), 100);

    // 1. NON-CHARACTER KEYS
    if (key === 'backspace') {
      if (cursorIndex > 0) {
        setText((prev) => prev.slice(0, cursorIndex - 1) + prev.slice(cursorIndex));
        setCursorIndex(prev => prev - 1);
      }
      return;
    }

    if (key === 'space') {
      const expanded = getExpandedInfo();
      const txt = expanded ? expanded.newText : text;
      const idx = expanded ? expanded.newCursorIndex : cursorIndex;
      setText(txt.slice(0, idx) + ' ' + txt.slice(idx));
      setCursorIndex(idx + 1);
      setSuggestions([]);
      return;
    }

    if (key === 'mic') { toggleListening(); return; }
    if (key === 'emoji') { toggleMenu('emoji'); return; }
    if (key === 'enter') {
      const expanded = getExpandedInfo();
      const txt = expanded ? expanded.newText : text;
      const idx = expanded ? expanded.newCursorIndex : cursorIndex;
      setText(txt.slice(0, idx) + '\n' + txt.slice(idx));
      setCursorIndex(idx + 1);
      return;
    }
    if (key === 'shift') { setIsShift(!isShift); return; }
    if (key === 'globe') { cycleLanguage(); return; }
    if (key === '123') { setIsSymbols(true); return; }
    if (key === 'ABC') { 
      setIsSymbols(false); 
      if (activeLanguage === 'english') setLayout(LATIN_ROWS);
      else if (activeLanguage === 'tigrinya') setLayout(TIGRINYA_ROWS);
      else if (activeLanguage === 'amharic') setLayout(AMHARIC_ROWS);
      return; 
    }

    // 2. THE GATEKEEPER LOGIC
    if (activeLanguage === 'english' || isSymbols) {
      // --- BYPASS MODE ---
      const char = isShift ? key.toUpperCase() : key;
      setText(prev => prev.slice(0, cursorIndex) + char + prev.slice(cursorIndex));
      setCursorIndex(prev => prev + 1);
    } else {
      // --- TRANSLITERATION MODE ---
      processGeezLogic(key, text, cursorIndex);
    }

    if (isShift) setIsShift(false);
  }, [isEditing, activeLanguage, isShift, layout, selectedKey, text, isListening, handleLayoutEdit, toggleListening, isSymbols, activeMenus, cursorIndex, getExpandedInfo, shortcuts, cycleLanguage, processGeezLogic]);

  const startLongPress = (key: string, e: any) => {
    if (isEditing || activeLanguage === 'english' || isSymbols) return;
    const forms = GEEZ_MAP[isShift ? key.toUpperCase() : key];
    if (!forms || forms.length < 2) return;

    const target = e.currentTarget as HTMLElement;
    if (!target) return;

    longPressTimer.current = setTimeout(() => {
      const rect = target.getBoundingClientRect();
      setVowelMenu({
        key,
        variations: forms,
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
    }, 500);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const selectVariation = (variation: string) => {
    setText((prev) => prev.slice(0, cursorIndex) + variation + prev.slice(cursorIndex));
    setCursorIndex(prev => prev + variation.length);
    setVowelMenu(null);
  };

  const saveLayout = () => {
    localStorage.setItem('geez_keyboard_layout', JSON.stringify(layout));
    setIsEditing(false);
    setSelectedKey(null);
  };

  const resetLayout = () => {
    if (confirm('Reset to default layout?')) {
      setLayout(DEFAULT_ROWS);
      localStorage.removeItem('geez_keyboard_layout');
    }
  };

  // Define lastWord for suggestion rendering
  const wordsForUI = text.trim().split(/\s+/);
  const lastWordForUI = wordsForUI[wordsForUI.length - 1];

  const changeTheme = (key: ThemeKey) => {
    setThemeKey(key);
    localStorage.setItem('geez_keyboard_theme', key);
    toggleMenu('theme');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    if (text.trim()) {
      addToClipboard(text);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaste = async () => {
    try {
      const pastedText = await navigator.clipboard.readText();
      if (!pastedText) return;

      // Calculate how many English letters are in the text
      const englishCharRatio = pastedText.length > 0 
        ? pastedText.replace(/[^a-zA-Z]/g, '').length / pastedText.length 
        : 0;

      const startIndex = cursorIndex;
      const endIndex = cursorIndex + pastedText.length;

      setText(prev => prev.slice(0, cursorIndex) + pastedText + prev.slice(cursorIndex));
      setCursorIndex(endIndex);

      setIsInputHighlighted(true);
      setTimeout(() => setIsInputHighlighted(false), 500);

      if (englishCharRatio > 0.3) {
        setShowPasteTranslationPrompt({ text: pastedText, startIndex, endIndex });
      }
    } catch (err) {
      console.error("Failed to paste:", err);
      showToast("Clipboard access denied. Please paste manually using Ctrl+V or Cmd+V.");
    }
  };

  const handlePasteTranslate = async () => {
    if (!showPasteTranslationPrompt || isTranslating) return;
    const { text: textToTranslate, startIndex, endIndex } = showPasteTranslationPrompt;
    
    setShowPasteTranslationPrompt(null);
    setIsTranslating(true);
    setIsProcessing(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are a translation expert. Translate the following text into Tigrinya. Return only the translated Tigrinya text without quotes, explanations, or transliterations.\n\nText: ${textToTranslate}`,
      });
      
      const translation = (response.text || "").trim();
      
      if (translation) {
        setText(prev => {
          const before = prev.slice(0, startIndex);
          const expectedPaste = prev.slice(startIndex, endIndex);
          const after = prev.slice(endIndex);
          
          if (expectedPaste === textToTranslate) {
            return before + translation + after;
          } else {
            // Fallback if text drifted
            const lastIdx = prev.lastIndexOf(textToTranslate);
            if (lastIdx !== -1) {
              return prev.slice(0, lastIdx) + translation + prev.slice(lastIdx + textToTranslate.length);
            }
            return prev;
          }
        });
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
      const filtered = prev.filter(item => item !== newText);
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
    window.addEventListener('copy', handleCopy);
    return () => window.removeEventListener('copy', handleCopy);
  }, []);

  const togglePin = (item: string) => {
    if (pinnedItems.includes(item)) {
      setPinnedItems(prev => prev.filter(p => p !== item));
    } else {
      setPinnedItems(prev => [item, ...prev]);
    }
  };

  const deleteClipboardItem = (item: string, isPinned: boolean) => {
    if (isPinned) {
      setPinnedItems(prev => prev.filter(p => p !== item));
    } else {
      setClipboardItems(prev => prev.filter(p => p !== item));
    }
    setClipboardActionMenu(null);
  };

  const clearClipboard = () => {
    setClipboardItems([]);
    setPinnedItems([]);
  };

  const handleClipboardLongPress = (item: string, isPinned: boolean, e: any) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setClipboardActionMenu({
      item,
      isPinned,
      x: rect.left + rect.width / 2,
      y: rect.top
    });
  };

  const clearText = () => {
    if (confirm('Clear all text?')) setText('');
  };

  const applySuggestion = (suggestion: string) => {
    setText(prev => {
      const before = prev.slice(0, cursorIndex);
      const after = prev.slice(cursorIndex);
      const wordsBefore = before.trim().split(/\s+/);
      wordsBefore[wordsBefore.length - 1] = suggestion;
      const newBefore = wordsBefore.join(' ') + ' ';
      setCursorIndex(newBefore.length);
      return newBefore + after;
    });
    setSuggestions([]);
    setActivePhonetic('');
  };

  return (
    <div className="h-screen w-full flex items-center justify-center p-4 overflow-hidden select-none font-sans transition-colors duration-700"
         style={{ backgroundColor: currentTheme.bg }}>
      
      {/* Mesh Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-50 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full blur-[100px] transition-all duration-1000"
             style={{
               background: currentTheme.mesh.join(', ')
             }}
        />
      </div>

      {/* Onboarding Overlay */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-6 sm:p-12 text-white overflow-y-auto"
          >
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="max-w-md w-full space-y-4 py-8"
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Setup Guide</h1>
                <p className="text-white/40 text-sm">Follow these 3 steps to activate your keyboard</p>
              </div>

              {/* Step 1: Enable */}
              <div className={`bg-white/5 border ${onboardingSteps.enabled ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/10'} rounded-3xl p-6 space-y-4 transition-all hover:bg-white/10 relative overflow-hidden`}>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-blue-400">1. Enable</h2>
                      {onboardingSteps.enabled && <CheckCircle2 className="w-5 h-5 text-blue-400" />}
                    </div>
                    <p className="text-sm text-white/60">Turn on the keyboard in settings</p>
                  </div>
                  <div className="p-2 bg-blue-500/20 rounded-xl">
                    <Settings2 className="w-5 h-5 text-blue-400" />
                  </div>
                </div>
                {!onboardingSteps.enabled ? (
                  <button
                    onClick={() => {
                      showToast("Opening System Settings...");
                      setTimeout(() => setOnboardingSteps(prev => ({ ...prev, enabled: true })), 2000);
                    }}
                    className="w-full py-3 bg-blue-500 hover:bg-blue-600 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                  >
                    Open Settings
                  </button>
                ) : (
                  <div className="py-2 text-center text-blue-400 font-bold text-sm flex items-center justify-center gap-2">
                    Keyboard Enabled
                  </div>
                )}
              </div>

              {/* Step 2: Switch */}
              <div className={`bg-white/5 border ${onboardingSteps.selected ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10'} rounded-3xl p-6 space-y-4 transition-all hover:bg-white/10`}>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-emerald-400">2. Switch</h2>
                      {onboardingSteps.selected && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                    </div>
                    <p className="text-sm text-white/60">Choose our keyboard as default</p>
                  </div>
                  <div className="p-2 bg-emerald-500/20 rounded-xl">
                    <ArrowLeftRight className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>
                {!onboardingSteps.selected ? (
                  <button
                    disabled={!onboardingSteps.enabled}
                    onClick={() => {
                      showToast("Switching Keyboard Method...");
                      setTimeout(() => setOnboardingSteps(prev => ({ ...prev, selected: true })), 2000);
                    }}
                    className={`w-full py-3 ${onboardingSteps.enabled ? 'bg-white/10 hover:bg-white/20' : 'opacity-20 cursor-not-allowed'} rounded-xl font-bold text-sm transition-all border border-white/10 active:scale-95`}
                  >
                    Switch Keyboard
                  </button>
                ) : (
                  <div className="py-2 text-center text-emerald-400 font-bold text-sm flex items-center justify-center gap-2">
                    Keyboard Selected
                  </div>
                )}
              </div>

              {/* Step 3: Try it */}
              <div className={`bg-white/5 border ${onboardingSteps.typed ? 'border-orange-500/50 bg-orange-500/5' : 'border-white/10'} rounded-3xl p-6 space-y-4 transition-all hover:bg-white/10`}>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-orange-400">3. Try it</h2>
                      {onboardingSteps.typed && <CheckCircle2 className="w-5 h-5 text-orange-400" />}
                    </div>
                    <p className="text-sm text-white/60">Test your new Amharic and English keys below</p>
                  </div>
                  <div className="p-2 bg-orange-500/20 rounded-xl">
                    <Type className="w-5 h-5 text-orange-400" />
                  </div>
                </div>
                <div className={`relative group ${!onboardingSteps.selected && 'opacity-20 pointer-events-none'}`}>
                  <input 
                    type="text" 
                    placeholder="Type something here..."
                    onChange={(e) => {
                      if (e.target.value.length > 5) {
                        setOnboardingSteps(prev => ({ ...prev, typed: true }));
                      }
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500/50 transition-all font-geez"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:opacity-100 transition-opacity">
                    <Sparkles className="w-4 h-4 text-orange-400" />
                  </div>
                </div>
              </div>

              <button
                disabled={!onboardingSteps.typed}
                onClick={() => {
                  localStorage.setItem('geez_onboarding_complete', 'true');
                  setShowOnboarding(false);
                  showToast("Welcome to ትግርኛ AI Pro!");
                }}
                className={`w-full py-4 mt-4 ${onboardingSteps.typed ? 'bg-white text-black hover:bg-slate-200' : 'bg-white/5 text-white/20'} rounded-2xl font-bold text-lg transition-all shadow-xl active:scale-98`}
              >
                Finish Setup
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Responsive Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: masterScale }}
        style={{ transformOrigin: 'center center' }}
        className={`relative z-10 w-full h-[100dvh] md:h-[95vh] lg:max-w-[1200px] xl:max-w-[1400px] flex flex-col md:rounded-[2.5rem] overflow-hidden transition-all duration-500 shadow-2xl ${currentTheme.isDark ? 'text-white' : 'text-slate-900'}`}
      >
        {/* Transition Progress Bar (Global AI Indicator) */}
        <div className="absolute top-0 left-0 right-0 h-1 z-[200] overflow-hidden">
          <AnimatePresence>
            {(isProcessing || isTranslatingRealtime) && (
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 1.5, 
                  ease: "linear" 
                }}
                className="w-full h-full bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_10px_rgba(96,165,250,0.8)]"
              />
            )}
          </AnimatePresence>
        </div>

        {/* Top Status Bar Mockup */}
        <div className={`flex justify-between items-center mb-4 px-4 ${currentTheme.isDark ? 'text-white/50' : 'text-black/50'} text-[10px] sm:text-xs font-medium shrink-0`}>
          <div>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          <div className="flex space-x-3 items-center">
            <div className="flex gap-0.5">
              <div className={`w-1 h-3 ${currentTheme.isDark ? 'bg-white/60' : 'bg-black/40'} rounded-full`} />
              <div className={`w-1 h-3 ${currentTheme.isDark ? 'bg-white/60' : 'bg-black/40'} rounded-full`} />
              <div className={`w-1 h-3 ${currentTheme.isDark ? 'bg-white/60' : 'bg-black/40'} rounded-full`} />
              <div className={`w-1 h-3 ${currentTheme.isDark ? 'bg-white/20' : 'bg-black/10'} rounded-full`} />
            </div>
            <span>LTE</span>
            <div className={`flex items-center gap-1 border ${currentTheme.isDark ? 'border-white/20' : 'border-black/20'} rounded-sm px-1 py-0.5`}>
              <div className={`w-4 h-2 ${currentTheme.isDark ? 'bg-white/80' : 'bg-black/60'} rounded-sm`} />
            </div>
          </div>
        </div>

        {/* Error Toast */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2"
            >
              <X className="w-3 h-3" />
              {errorMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info Toast */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-16 left-1/2 -translate-x-1/2 z-[150] px-4 py-2 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 backdrop-blur-md border ${
                currentTheme.isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-black/10 border-black/20 text-slate-800'
              }`}
            >
              <Globe className="w-3 h-3 opacity-70" />
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header - Updated */}
        <header className="flex items-center justify-between mb-4 px-4 py-2 shrink-0">
          <h1 className="text-xl font-bold tracking-tight text-white">
            ትግርኛ AI Pro
          </h1>
        </header>

        {/* Display Area */}
        <section 
          className={`flex-1 min-h-0 rounded-2xl sm:rounded-3xl p-3 sm:p-5 border mb-3 relative group overflow-hidden transition-all duration-300 ${
            isEditing 
                ? 'bg-white/[0.02] border-white/5 grayscale' 
                : isInputHighlighted 
                    ? 'bg-blue-900/40 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
                    : 'bg-black/60 border-white/5 shadow-inner'
          }`}
          onMouseUp={() => {
            if (isHighlightMode) {
              const selection = window.getSelection();
              if (selection && selection.toString().length > 0) {
                const range = selection.getRangeAt(0);
                const span = document.createElement("span");
                span.className = "bg-yellow-200 text-black px-0.5 rounded";
                try {
                  range.surroundContents(span);
                } catch (e) {
                  console.error("Highlighting failed, text spans across nodes");
                }
                selection.removeAllRanges();
              }
            }
          }}
        >
          <div className="flex justify-between items-center mb-2">
            <div className={`text-white/60 text-[9px] sm:text-[10px] uppercase tracking-widest font-mono transition-colors ${isListening ? currentTheme.accentText : ''}`}>
              {isListening ? (
                <span className="flex items-center gap-2 animate-pulse">
                  <div className={`w-1.5 h-1.5 rounded-full`} style={{ backgroundColor: 'currentColor' }} />
                  Listening...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                   AI Status: Ready
                </span>
              )}
            </div>
            {!isEditing && text && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                <button 
                  onClick={handleReadTextAloud}
                  disabled={isGeneratingTTS}
                  className={`bg-white/10 hover:bg-white/20 p-2 rounded-lg flex items-center gap-2 text-[10px] uppercase tracking-wider ${currentTheme.accentText} disabled:opacity-50`}
                >
                  {isGeneratingTTS ? <Loader2 className="w-3 h-3 animate-spin" /> : <Volume2 className="w-3 h-3" />}
                  {isGeneratingTTS ? "Playing..." : "Read"}
                </button>
                <button 
                  onClick={copyToClipboard}
                  className={`bg-white/10 hover:bg-white/20 p-2 rounded-lg flex items-center gap-2 text-[10px] uppercase tracking-wider ${currentTheme.accentText}`}
                >
                  {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Success' : 'Copy'}
                </button>
              </div>
            )}
          </div>
          <div 
            ref={scrollRef}
            className={`h-[calc(100%-20px)] sm:h-[calc(100%-24px)] overflow-y-auto text-2xl sm:text-4xl leading-relaxed whitespace-pre-wrap break-all custom-scrollbar flex flex-col font-ethiopic text-white`}
          >
            {text ? (
              <div className="min-h-full">
                <ReactMarkdown 
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    p: ({ children }) => <span className="inline">{children}</span>,
                    strong: ({ children }) => <strong className="font-bold text-blue-400 drop-shadow-sm">{children}</strong>,
                    em: ({ children }) => <em className="italic text-orange-200 opacity-90">{children}</em>,
                    u: ({ children }) => <u className="underline decoration-blue-500/40 underline-offset-4">{children}</u>,
                    img: ({ src, alt }) => (
                      <img 
                        src={src} 
                        alt={alt} 
                        className="inline-block rounded-2xl my-2 max-h-[150px] sm:max-h-[250px] shadow-2xl border border-white/10" 
                        referrerPolicy="no-referrer"
                      />
                    ),
                    // Handle the cursor marker
                    //@ts-ignore
                    'cursor-marker': () => (
                      <motion.span
                        animate={{ opacity: !isEditing ? [1, 0, 1] : 0 }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className={`inline-block w-[3px] h-[1em] align-middle rounded-full mx-[1px] ${isCursorMode ? 'bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.8)]' : 'bg-white'}`}
                      />
                    )
                  }}
                >
                  {text.slice(0, cursorIndex) + '<cursor-marker></cursor-marker>' + (listeningTarget === 'main' && interimTranscript ? ` ___${interimTranscript}___ ` : '') + text.slice(cursorIndex)}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <span className="opacity-20 italic text-xl text-center px-10">ትጽቢት ይጀምሩ...</span>
              </div>
            )}
          </div>
        </section>

        {/* Suggestion Bar */}
        <AnimatePresence>
          {activeMenus.translationBar && (
            <motion.div
              initial={{ height: 0, opacity: 0, y: -20 }}
              animate={{ height: 'auto', opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              className="px-2 sm:px-4 mb-2 sm:mb-4 overflow-hidden"
            >
              <div className={`p-2 sm:p-3 rounded-2xl border transition-all ${currentTheme.isDark ? 'bg-blue-950/30 border-blue-500/20' : 'bg-blue-50/50 border-blue-500/20'} backdrop-blur-xl`}>
                <div className="flex items-center gap-3 mb-2 overflow-x-auto no-scrollbar pb-1">
                  <div className="flex items-center gap-1 sm:gap-2 bg-white/5 px-2 py-1 rounded-lg border border-white/5 flex-shrink-0">
                    <button 
                      onClick={() => { setShowLanguagePicker({ type: 'source', open: true }); setLangSearch(''); }}
                      className={`text-[9px] sm:text-[10px] uppercase tracking-wider font-bold h-full px-2 py-1 hover:bg-white/10 rounded transition-colors flex items-center gap-1.5 ${currentTheme.isDark ? 'text-white' : 'text-slate-800'}`}
                    >
                      <span className="opacity-40">From:</span>
                      {WORLD_LANGUAGES.find(l => l.code === sourceLang)?.name || 'Source'}
                    </button>
                    <ArrowLeftRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-400 shrink-0 opacity-40" />
                    <button 
                      onClick={() => { setShowLanguagePicker({ type: 'target', open: true }); setLangSearch(''); }}
                      className={`text-[9px] sm:text-[10px] uppercase tracking-wider font-bold h-full px-2 py-1 hover:bg-white/10 rounded transition-colors flex items-center gap-1.5 ${currentTheme.isDark ? 'text-white' : 'text-slate-800'}`}
                    >
                      <span className="opacity-40">To:</span>
                      {WORLD_LANGUAGES.find(l => l.code === targetLang)?.name || 'Target'}
                    </button>
                  </div>
                  <div className="flex-1" />
                  <button 
                    onClick={() => toggleMenu('translationBar')}
                    aria-label="Close Translation Bar"
                    className="p-1.5 hover:bg-red-500/10 rounded-md transition-colors"
                  >
                    <X className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />
                  </button>
                </div>
                <div className="relative flex items-center gap-2">
                  <div className="relative flex-1 flex items-center">
                    <input
                      type="text"
                      value={translationInput}
                      onChange={(e) => setTranslationInput(e.target.value)}
                      placeholder={sourceLang === 'auto' ? "Start typing to translate..." : `Type in ${WORLD_LANGUAGES.find(l => l.code === sourceLang)?.name}...`}
                      className={`w-full bg-transparent border-none focus:ring-0 text-sm sm:text-base font-ethiopic ${currentTheme.isDark ? 'text-white' : 'text-slate-900'} placeholder:opacity-30`}
                      autoFocus
                    />
                    {isTranslatingRealtime && (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-400 absolute right-1" />
                    )}
                  </div>
                  <button 
                    onClick={handleTranslate}
                    disabled={isTranslating || (!translationInput.trim() && !text.trim())}
                    className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest font-bold transition-all flex items-center gap-2 ${
                      isTranslating ? 'animate-pulse opacity-50' : 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20'
                    }`}
                  >
                    {isTranslating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    Translate
                  </button>
                </div>
              </div>
            </motion.div>
          )}
          

        </AnimatePresence>

        {/* Smart Toolbar */}
        <div 
          style={{ 
            backgroundColor: `rgba(0,0,0,${(100 - themeTransparency) / 100 * 0.4})`,
            height: 'clamp(50px, 8svh, 80px)', // Proportional height with safe clamps
            paddingLeft: 'max(2%, env(safe-area-inset-left))',
            paddingRight: 'max(2%, env(safe-area-inset-right))'
          }}
          className="flex justify-between items-center gap-[2%] mb-[1vh] backdrop-blur-lg rounded-[2vh] border border-white/5 mx-[2%] overflow-x-auto no-scrollbar shrink-0"
        >
           {toolbarOrder.map(toolId => renderTool(toolId))}
        </div>
        {/* Suggestion Bar */}
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4 px-2 sm:px-4 overflow-x-auto no-scrollbar py-2 rounded-2xl backdrop-blur-xl border transition-all ${currentTheme.isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/5 shadow-sm'}`}
        >
            {/* Word Suggestions */}
            {isAiSuggestionsLoading && (
              <div className="flex items-center gap-2 px-3">
                <Loader2 className="w-3 h-3 animate-spin opacity-40" />
                <span className="text-[10px] opacity-40 animate-pulse">AI Predicting...</span>
              </div>
            )}

            {(suggestions.length > 0 || aiSuggestions.length > 0) ? (
              <div className="flex gap-2 items-center">
                {/* Dictionary Suggestions */}
                {suggestions.map((suggestion, idx) => {
                  const isAutoCorrect = lastWordForUI && AUTOCORRECT_MAP[lastWordForUI] === suggestion;
                  return (
                    <motion.button
                      key={`suggest-${idx}`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => applySuggestion(suggestion)}
                      className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-md font-ethiopic transition-all flex items-center gap-2 whitespace-nowrap
                        ${isAutoCorrect 
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold' 
                          : `${currentTheme.isDark ? 'bg-white/10 text-white/90 border-white/5' : 'bg-black/5 text-slate-700 border-black/5'} border`
                        }
                      `}
                    >
                      {suggestion}
                    </motion.button>
                  );
                })}

                {/* AI Next-Word Suggestions */}
                {aiSuggestions.map((suggestion, idx) => (
                  <motion.button
                    key={`ai-suggest-${idx}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setText(prev => prev + suggestion + ' ');
                      setCursorIndex(prev => prev + suggestion.length + 1);
                      setAiSuggestions([]);
                    }}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-md font-ethiopic transition-all flex items-center gap-2 whitespace-nowrap border border-blue-500/30 bg-blue-500/10 text-blue-200 shadow-sm shadow-blue-500/10`}
                  >
                    <Sparkles className="w-3 h-3 text-blue-400" />
                    {suggestion}
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="px-4 text-[10px] opacity-20 italic">መጻሕፍቲ ይጀምሩ...</div>
            )}
          </motion.div>
        <AnimatePresence>
          {activeMenus.tone && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-24 left-4 z-[200] bg-black/90 backdrop-blur-xl border border-white/10 p-2 rounded-2xl flex flex-col gap-1 shadow-2xl"
            >
              {['Professional', 'Casual', 'Friendly', 'Poetic', 'Urgent', 'Formal'].map(tone => (
                <button
                  key={tone}
                  onClick={() => {
                    setSelectedTone(tone);
                    processToneRewrite(tone);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all text-left flex items-center justify-between ${
                    selectedTone === tone 
                      ? 'bg-blue-500 text-white' 
                      : 'text-white/90 hover:bg-white/10'
                  }`}
                >
                  {tone}
                  {selectedTone === tone && <span className="text-[10px] bg-white/20 px-1.5 rounded-full ml-2">Active</span>}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Export Menu */}
        <AnimatePresence>
          {activeMenus.export && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute bottom-24 right-4 z-[200] bg-black/90 backdrop-blur-xl border border-white/10 p-2 rounded-2xl flex flex-col gap-1 shadow-2xl"
            >
              <div className="px-4 py-2 text-white/40 text-[10px] uppercase tracking-widest font-bold">Export As</div>
              <button onClick={() => exportText('txt')} className="px-4 py-2 text-white/90 hover:bg-white/10 rounded-xl text-xs sm:text-sm font-semibold transition-colors text-left">Plain Text (.txt)</button>
              <button onClick={() => exportText('rtf')} className="px-4 py-2 text-white/90 hover:bg-white/10 rounded-xl text-xs sm:text-sm font-semibold transition-colors text-left">Rich Text (.rtf)</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Keyboard Responsive Layout Engine */}
        <div 
          className={`mx-auto w-full max-w-[600px] flex flex-col gap-[1%] transition-all relative shrink-0 p-1.5 sm:p-2 pb-[env(safe-area-inset-bottom)] ${isEditing ? 'scale-[1.01]' : ''}`}
          style={{ height: `${keyboardSize}vh`, maxHeight: '45vh' }}
        >
          {/* Clipboard Overlay */}
          <AnimatePresence>
            {activeMenus.clipboard && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`absolute inset-0 z-[120] rounded-3xl p-4 flex flex-col gap-4 overflow-hidden backdrop-blur-3xl border border-white/20 ${currentTheme.isDark ? 'bg-black/80' : 'bg-white/80'}`}
              >
                <div className="flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2">
                    <ClipboardList className={`w-4 h-4 ${currentTheme.isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                    <span className={`text-[10px] uppercase tracking-widest font-bold ${currentTheme.isDark ? 'text-white/60' : 'text-black/60'}`}>Smart Clipboard</span>
                  </div>
                  <button onClick={clearClipboard} className={`text-[10px] px-2 py-1 rounded-lg ${currentTheme.isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'}`}>Clear All</button>
                  <button onClick={() => toggleMenu('clipboard')} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
                    <X className="w-4 h-4 opacity-50" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6 pr-1">
                  {/* Pinned Section */}
                  {(pinnedItems.length > 0 || isEditing) && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 opacity-40 px-1">
                        <Pin className="w-3 h-3" />
                        <span className="text-[9px] uppercase tracking-wider font-mono">Pinned Items</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {pinnedItems.map((item, i) => (
                          <motion.button
                            key={`pinned-${i}`}
                            onClick={() => { 
                              setText(prev => prev.slice(0, cursorIndex) + item + prev.slice(cursorIndex)); 
                              setCursorIndex(prev => prev + item.length);
                              setIsClipboardOpen(false); 
                            }}
                            onContextMenu={(e) => handleClipboardLongPress(item, true, e)}
                            className={`px-3 py-2 rounded-xl text-xs flex items-center gap-2 border transition-all active:scale-95 ${currentTheme.isDark ? 'bg-orange-500/10 border-orange-500/20 text-orange-100 hover:bg-orange-500/20' : 'bg-orange-50/50 border-orange-200 text-orange-900 hover:bg-orange-100'}`}
                          >
                            <span className="truncate max-w-[120px] font-ethiopic">{item}</span>
                          </motion.button>
                        ))}
                        {pinnedItems.length === 0 && <span className="p-4 text-[10px] opacity-20 italic">No pinned items yet...</span>}
                      </div>
                    </div>
                  )}

                  {/* Recents Section */}
                  <div className="flex flex-col gap-2 pb-4">
                    <div className="flex items-center gap-2 opacity-40 px-1">
                      <RotateCcw className="w-3 h-3" />
                      <span className="text-[9px] uppercase tracking-wider font-mono">Recent History</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {clipboardItems.map((item, i) => (
                        <motion.button
                          key={`recent-${i}`}
                          onClick={() => { 
                            setText(prev => prev.slice(0, cursorIndex) + item + prev.slice(cursorIndex)); 
                            setCursorIndex(prev => prev + item.length);
                            setIsClipboardOpen(false); 
                          }}
                          onContextMenu={(e) => handleClipboardLongPress(item, false, e)}
                          className={`px-3 py-2 rounded-xl text-xs flex items-center gap-2 border transition-all active:scale-95 ${currentTheme.isDark ? 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10' : 'bg-black/5 border-black/10 text-black/80 hover:bg-black/10'}`}
                        >
                          <span className="truncate max-w-[120px] font-ethiopic">{item}</span>
                        </motion.button>
                      ))}
                      {clipboardItems.length === 0 && <span className="p-4 text-[10px] opacity-20 italic">History is empty...</span>}
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
                      className="absolute z-[130] bg-white/10 backdrop-blur-3xl border border-white/20 p-1.5 rounded-2xl shadow-2xl flex gap-1"
                      style={{ left: Math.min(window.innerWidth - 150, clipboardActionMenu.x - 70), top: clipboardActionMenu.y - 60 }}
                    >
                      <button 
                        onClick={() => { togglePin(clipboardActionMenu.item); setClipboardActionMenu(null); }}
                        className="p-2 hover:bg-white/10 rounded-xl transition-all"
                        title={clipboardActionMenu.isPinned ? "Unpin" : "Pin"}
                      >
                        {clipboardActionMenu.isPinned ? <PinOff className="w-4 h-4 text-orange-400" /> : <Pin className="w-4 h-4 text-white/60" />}
                      </button>
                      <button 
                        onClick={() => deleteClipboardItem(clipboardActionMenu.item, clipboardActionMenu.isPinned)}
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

          {/* Vowel Menu Popup */}
          <AnimatePresence>
            {vowelMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: -8 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute left-0 bottom-full w-full z-[110] bg-white/10 backdrop-blur-3xl border-t border-white/10 p-2 flex justify-center gap-3 shadow-[0_-10px_30px_rgba(0,0,0,0.3)]"
              >
                {vowelMenu.variations.map((v, i) => (
                  <button
                    key={i}
                    onClick={() => selectVariation(v)}
                    className="w-12 h-16 sm:w-14 sm:h-18 bg-white/10 hover:bg-white/30 rounded-xl flex items-center justify-center text-2xl sm:text-3xl ethiopic-font border border-white/20 transition-all hover:scale-110 active:scale-90 shrink-0 shadow-lg text-white"
                  >
                    {v}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {activeMenus.emoji && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: -20 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="absolute left-1/2 -translate-x-1/2 z-[100] w-full max-w-[400px] bg-white/10 backdrop-blur-3xl border border-white/20 p-4 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
                style={{ top: -160 }}
              >
                <div className="flex justify-between items-center mb-3 px-1">
                  <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Frequently Used</span>
                  <button onClick={() => toggleMenu('emoji')} aria-label="Close Emoji Menu" className="p-1 hover:bg-white/10 rounded-full transition-colors">
                    <X className="w-3 h-3 text-white/60" />
                  </button>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {EMOJIS.map((emoji, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setText(prev => prev.slice(0, cursorIndex) + emoji + prev.slice(cursorIndex));
                        setCursorIndex(prev => prev + emoji.length);
                        toggleMenu('emoji');
                      }}
                      aria-label={`Insert Emoji: ${emoji}`}
                      className="w-full aspect-square flex items-center justify-center text-2xl hover:bg-white/10 rounded-xl transition-all hover:scale-110 active:scale-95"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {(isSymbols ? SYMBOL_ROWS : layout).map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center gap-1 flex-1 items-stretch w-full">
              {row.map((key, colIndex) => {
                const isSpecial = ['shift', 'backspace', 'globe', 'space', 'enter', '123', 'mic', 'emoji', 'ABC'].includes(key);
                const isPressed = activeKey === key;
                const isSelected = selectedKey?.row === rowIndex && selectedKey?.col === colIndex;
                const currentLabel = isShift ? key.toUpperCase() : key.toLowerCase();
                const displayChar = (activeLanguage === 'english' || isSymbols) ? currentLabel : (GEEZ_MAP[key.toUpperCase()]?.[0] || key);

                return (
                  <motion.button
                    key={`${rowIndex}-${colIndex}-${key}`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95, backgroundColor: 'rgba(255,255,255,0.2)' }}
                    onMouseDown={(e) => { 
                      if (key === 'space') handleSpaceSwipeStart(e);
                      else handleKeyPress(key, rowIndex, colIndex);
                      if (!isSpecial) startLongPress(key, e);
                    }}
                    onMouseMove={(e) => {
                      if (key === 'space') handleSpaceSwipeMove(e);
                    }}
                    onMouseUp={(e) => {
                      if (key === 'space') handleSpaceSwipeEnd();
                      cancelLongPress();
                    }}
                    onMouseLeave={(e) => {
                      if (key === 'space') handleSpaceSwipeEnd();
                      cancelLongPress();
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      if (key === 'space') handleSpaceSwipeStart(e);
                      else handleKeyPress(key, rowIndex, colIndex);
                      if (!isSpecial) startLongPress(key, e);
                    }}
                    onTouchMove={(e) => {
                      if (key === 'space') handleSpaceSwipeMove(e);
                    }}
                    onTouchEnd={(e) => {
                      if (key === 'space') handleSpaceSwipeEnd();
                      cancelLongPress();
                    }}
                    aria-label={`Keyboard key ${key}`}
                    className={`
                      relative rounded-lg sm:rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer font-ethiopic
                      ${isPressed ? 'z-50 ring-2 ring-blue-400 scale-[1.05]' : 'z-10'}
                      ${isSpecial ? (currentTheme.isDark ? 'bg-white/[0.03] text-white/70' : 'bg-black/[0.03] text-black/60') : (currentTheme.isDark ? 'bg-white/[0.12] border-white/[0.15] text-white' : 'bg-white border-black/[0.05] text-slate-800 shadow-sm')}
                      backdrop-blur-[12px] border px-1 text-[clamp(14px,4vw,24px)]
                      ${isSpecial ? 'text-[clamp(0.6rem,2vw,0.8rem)] uppercase tracking-tight' : ''}
                      ${key === 'space' ? (isCursorMode ? '!bg-blue-400 !text-white' : activeLanguage === 'tigrinya' ? '!bg-[#059669] !text-white border-green-700/50' : activeLanguage === 'amharic' ? '!bg-[#059669] !text-white border-green-700/50' : (currentTheme.isDark ? '!bg-white !text-black' : '!bg-slate-800 !text-white')) + ' flex-[4] tracking-widest min-w-0 transition-colors' : (['enter', 'shift', 'backspace', '123', 'ABC'].includes(key) ? 'flex-[1.5]' : 'flex-1')}
                      ${key === 'globe' ? (activeLanguage === 'tigrinya' ? 'text-green-400' : activeLanguage === 'amharic' ? 'text-amber-400' : currentTheme.accentText) : ''}
                      ${key === 'mic' && isListening ? 'text-rose-400 bg-rose-500/20 animate-pulse border-rose-500/30' : ''}
                      ${key === 'enter' ? `${currentTheme.accentBg} ${currentTheme.accentText} font-bold border ${currentTheme.accentBorder}` : ''}
                      ${key === 'shift' && isShift ? `${currentTheme.accentBg} ${currentTheme.accentText} border ${currentTheme.accentBorder}` : ''}
                      ${isEditing ? (currentTheme.isDark ? 'border-dashed border-white/20' : 'border-dashed border-black/20') : (currentTheme.isDark ? 'hover:bg-white/[0.12]' : 'hover:bg-black/[0.05]')}
                      ${isSelected ? `${currentTheme.accentBg} border-solid scale-105 z-20 shadow-lg` : ''}
                    `}
                  >
                    <AnimatePresence>
                      {isPressed && !isSpecial && !isEditing && (
                        <motion.div
                          initial={{ opacity: 0, y: 0, scale: 0.5 }}
                          animate={{ opacity: 1, y: -60, scale: 1.5 }}
                          exit={{ opacity: 0, y: -80, scale: 1.2 }}
                          className="absolute z-50 bg-white/20 backdrop-blur-3xl text-white p-4 rounded-2xl font-bold text-3xl border border-white/30 shadow-2xl pointer-events-none"
                        >
                          {displayChar}
                        </motion.div>
                      )}
                    </AnimatePresence>

                  {/* Key Content */}
                    <span className="relative z-10 flex flex-col items-center justify-center w-full h-full">
                      {key === 'shift' && <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6 opacity-90" />}
                      {key === 'backspace' && <Delete className="w-5 h-5 sm:w-6 sm:h-6 opacity-90" />}
                      {key === 'mic' && (isListening ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6 opacity-90" />)}
                      {key === 'emoji' && <Smile className="w-5 h-5 sm:w-6 sm:h-6 opacity-90" />}
                      {key === 'globe' && (
                        activeLanguage === 'english' ? <Languages className="w-5 h-5 sm:w-6 sm:h-6 opacity-70 text-blue-400" /> : 
                        activeLanguage === 'amharic' ? <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" /> : 
                        <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
                      )}
                      {key === 'space' && <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest ${
                        activeLanguage === 'english' ? 'text-blue-200' : 
                        activeLanguage === 'amharic' ? 'text-amber-200' : 'text-emerald-200'
                      }`}>
                        {isCursorMode ? 'CURSOR' : (activeLanguage === 'english' ? 'English' : activeLanguage === 'amharic' ? 'Amharic' : 'Tigrinya')}
                      </span>}
                      {key === 'enter' && <CornerDownLeft className="w-5 h-5 sm:w-6 sm:h-6" />}
                      {key === '123' && <span className="font-bold text-xs sm:text-sm">123</span>}
                      {key === 'ABC' && <span className="font-bold text-xs sm:text-sm">ABC</span>}
                      
                      {!isSpecial && (
                        <>
                          {GEEZ_MAP[key.toUpperCase()] && activeLanguage !== 'english' && !isSymbols && (
                            <span 
                              className="absolute top-1 right-1.5 text-[8px] sm:text-[10px] text-white/20 font-ethiopic"
                              style={{ fontSize: `${8 * (keyScale/100)}px` }}
                            >
                              {key.toLowerCase()}
                            </span>
                          )}
                          {EN_LABELS[key.toUpperCase()] && activeLanguage !== 'english' && !isSymbols && (
                            <span 
                              className="absolute top-1 left-1.5 text-[7px] sm:text-[9px] text-white/40 font-sans font-bold"
                              style={{ fontSize: `${7 * (keyScale/100)}px` }}
                            >
                              {EN_LABELS[key.toUpperCase()].toLowerCase()}
                            </span>
                          )}
                          <span 
                            className={`text-center leading-none px-[2%] break-words overflow-hidden flex items-center justify-center h-full w-full ${
                              activeLanguage === 'english' ? 'text-blue-100' : 
                              activeLanguage === 'amharic' ? 'text-amber-100' : 'text-emerald-100'
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
          ))}
        </div>

        {/* iOS Indicator Bar */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/20 rounded-full"></div>

        {/* Copy Toast Notification */}
        <AnimatePresence>
          {copied && (
            <motion.div
              initial={{ opacity: 0, y: 20, x: '-50%' }}
              animate={{ opacity: 1, y: -20, x: '-50%' }}
              exit={{ opacity: 0, y: 20, x: '-50%' }}
              className={`fixed bottom-10 left-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl backdrop-blur-2xl border flex items-center gap-3 ${currentTheme.accentBg} ${currentTheme.accentBorder} border-white/20`}
            >
              <div className="bg-green-500 rounded-full p-1">
                <Check className="w-3 h-3 text-white" />
              </div>
              <span className="text-white font-medium text-sm tracking-tight">ቅዳሕ ተገይሩ! (Text Copied!)</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Generator Prompt Overlay */}
      <AnimatePresence>
        {showGenerator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 backdrop-blur-md bg-black/40"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 ${currentTheme.isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-black/5'}`}
            >
              <h3 className={`text-xl font-bold mb-4 ${currentTheme.isDark ? 'text-white' : 'text-slate-900'}`}>
                Generate Image
              </h3>
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="What image should I generate for you?"
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white mb-4 focus:outline-none"
                rows={3}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowGenerator(false)}
                  className={`flex-1 py-3 rounded-xl font-medium transition-colors ${currentTheme.isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-black/5 hover:bg-black/10 text-slate-800'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!chatInput) return;
                    setIsGeneratingImage(true);
                    // This is the trigger for the agent to know it should call generate_image
                    showToast("Please ask me in the chat, for example: 'Generate an image of a Tigrinya landscape'.");
                    setShowGenerator(false);
                    setIsGeneratingImage(false);
                  }}
                  className="flex-1 py-3 rounded-xl font-medium bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg transition-all"
                >
                  {isGeneratingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : "Use Prompt"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 10px;
        }
      `}</style>
      {/* Paste Translation Prompt Overlay */}
      <AnimatePresence>
        {showPasteTranslationPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 backdrop-blur-md bg-black/40"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`w-full max-w-sm rounded-3xl border shadow-2xl overflow-hidden p-6 text-center ${currentTheme.isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-black/5'}`}
            >
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <Languages className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${currentTheme.isDark ? 'text-white' : 'text-slate-900'}`}>
                Translate to Tigrinya?
              </h3>
              <p className={`text-sm mb-6 ${currentTheme.isDark ? 'text-white/60' : 'text-slate-600'}`}>
                We noticed you pasted English text. Would you like to translate it to Tigrinya (Ge'ez)?
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPasteTranslationPrompt(null)}
                  className={`flex-1 py-3 rounded-xl font-medium transition-colors ${currentTheme.isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-black/5 hover:bg-black/10 text-slate-800'}`}
                >
                  No, Keep it
                </button>
                <button
                  onClick={() => handlePasteTranslate()}
                  disabled={isTranslating}
                  className="flex-1 py-3 rounded-xl font-medium bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center min-w-[120px]"
                >
                  {isTranslating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Yes, Translate"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Language Picker Overlay */}
      <AnimatePresence>
        {showLanguagePicker.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col bg-slate-950"
          >
            <div className="p-4 border-b border-white/10 flex items-center gap-4">
              <button 
                onClick={() => setShowLanguagePicker({ ...showLanguagePicker, open: false })}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
              <h3 className="text-lg font-bold text-white flex-1">
                Select {showLanguagePicker.type === 'source' ? 'Source' : 'Target'} Language
              </h3>
            </div>
            
            <div className="p-4 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40 text-white" />
                <input
                  type="text"
                  value={langSearch}
                  onChange={(e) => setLangSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
              <div className="grid grid-cols-1 gap-1">
                {WORLD_LANGUAGES
                  .filter(lang => 
                    (showLanguagePicker.type === 'target' ? lang.code !== 'auto' : true) &&
                    lang.name.toLowerCase().includes(langSearch.toLowerCase())
                  )
                  .map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        if (showLanguagePicker.type === 'source') setSourceLang(lang.code);
                        else setTargetLang(lang.code);
                        setShowLanguagePicker({ ...showLanguagePicker, open: false });
                      }}
                      className="w-full text-left px-4 py-4 rounded-xl transition-all flex items-center justify-between hover:bg-white/5 group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{getFlagEmoji(lang.code)}</span>
                        <span className="font-medium text-white text-base">{lang.name}</span>
                      </div>
                      {(showLanguagePicker.type === 'source' ? sourceLang : targetLang) === lang.code && (
                        <Check className="w-5 h-5 text-blue-400" />
                      )}
                    </button>
                  ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Region Drawer */}
      <AnimatePresence>
        {activeMenus.region && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[150] bg-slate-900/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl max-h-[60vh] overflow-hidden flex flex-col"
          >
            <div className="flex justify-between items-center p-4 border-b border-white/10">
              <h2 className="font-bold text-white text-lg">Select Region/Language</h2>
              <button onClick={() => toggleMenu('region')}><X className="text-white/60"/></button>
            </div>
            <div className="overflow-y-auto p-2">
              {WORLD_LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setSourceLang(lang.code);
                    toggleMenu('region');
                    showToast(`Region set to: ${lang.name}`);
                  }}
                  className="w-full text-left p-3 rounded-xl text-white/90 hover:bg-white/10 transition-colors flex items-center justify-between"
                >
                  <span>{lang.name}</span>
                  {sourceLang === lang.code && <Check className="w-4 h-4 text-orange-400" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Settings Drawer */}
      <AnimatePresence>
        {activeMenus.settings && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed inset-y-0 right-0 z-[150] w-full sm:max-w-md backdrop-blur-3xl border-l shadow-2xl flex flex-col overflow-hidden ${currentTheme.isDark ? 'bg-slate-950/95 border-white/10 text-white' : 'bg-white/95 border-black/10 text-slate-900'}`}
          >
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Settings2 className="w-6 h-6 text-blue-500" />
                <h2 className="font-bold text-xl tracking-tight">Universal Settings</h2>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={factoryReset}
                  className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/20"
                  title="Factory Reset"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => toggleMenu('settings')}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  aria-label="Close Settings"
                >
                  <X className="w-6 h-6 opacity-60" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              {/* Size Customization Section */}
              <section className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] mb-6 opacity-40 text-blue-400">Universal Scaling</h3>
                
                <div className="space-y-8">
                  {/* Master Scale Slider with Magnetic Snap */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-orange-400" />
                        <span className="text-sm font-medium">Master UI Scale</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {[0.8, 1.0, 1.2].includes(masterScale) && (
                          <span className="text-[10px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded uppercase font-bold animate-pulse">Snapped</span>
                        )}
                        <span className="text-xs font-mono text-orange-400">{(masterScale * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="relative pt-2">
                      <input 
                        type="range" 
                        min="0.8" 
                        max="1.4" 
                        step="0.01"
                        value={masterScale}
                        onChange={(e) => {
                          let val = parseFloat(e.target.value);
                          // Hard Boundary: 0.8 to 1.4
                          val = Math.max(0.8, Math.min(1.4, val));
                          
                          const SNAP_POINTS = [0.8, 1.0, 1.2];
                          let snappedValue = val;
                          
                          for (const point of SNAP_POINTS) {
                            if (Math.abs(val - point) < 0.035) {
                              snappedValue = point;
                              break;
                            }
                          }

                          setMasterScale(snappedValue);
                          localStorage.setItem('master_scale', snappedValue.toString());
                          
                          if (snappedValue !== val && snappedValue !== lastSnap) {
                            setLastSnap(snappedValue);
                            if ("vibrate" in navigator) navigator.vibrate(5);
                          }
                        }}
                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500 relative z-10"
                      />
                      {/* Snap Point Indicators */}
                      <div className="absolute top-2.5 left-0 w-full flex justify-between px-[1%] pointer-events-none opacity-20">
                         <div className="w-0.5 h-1.5 bg-white translate-x-[6.25%]" title="Small (0.8)" />
                         <div className="w-0.5 h-1.5 bg-white translate-x-[31.25%]" title="Default (1.0)" />
                         <div className="w-0.5 h-1.5 bg-white translate-x-[56.25%]" title="Large (1.2)" />
                      </div>
                    </div>
                    <div className="flex justify-between px-1 text-[9px] text-white/30 font-mono tracking-tighter">
                      <span>MIN (75%)</span>
                      <span className={masterScale === 0.8 ? 'text-orange-400 font-bold' : ''}>SM</span>
                      <span className={masterScale === 1.0 ? 'text-orange-400 font-bold' : ''}>DEF</span>
                      <span className={masterScale === 1.2 ? 'text-orange-400 font-bold' : ''}>LG</span>
                      <span>MAX</span>
                    </div>
                  </div>

                  {/* Keyboard Height Slider */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                      <div className="flex items-center gap-2">
                        <Maximize2 className="w-4 h-4 text-white/60" />
                        <span className="text-sm font-medium">Keyboard Height</span>
                      </div>
                      <span className="text-xs font-mono text-blue-400">{keyboardSize}vh</span>
                    </div>
                    <input 
                      type="range" 
                      min="30" 
                      max="60" 
                      value={keyboardSize}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setKeyboardSize(val);
                        localStorage.setItem('keyboard_size', val.toString());
                      }}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>

                  {/* Font Size Slider */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                      <div className="flex items-center gap-2">
                        <Type className="w-4 h-4 text-white/60" />
                        <span className="text-sm font-medium">Character Scale</span>
                      </div>
                      <span className="text-xs font-mono text-blue-400">{keyScale}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="80" 
                      max="150" 
                      value={keyScale}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setKeyScale(val);
                        localStorage.setItem('key_scale', val.toString());
                      }}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>

                  {/* Transparency Slider */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                      <div className="flex items-center gap-2">
                        <Palette className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-medium">Theme Transparency</span>
                      </div>
                      <span className="text-xs font-mono text-emerald-400">{themeTransparency}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={themeTransparency}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setThemeTransparency(val);
                        localStorage.setItem('theme_transparency', val.toString());
                      }}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                </div>
              </section>

              {/* Toolbar Customizer Section */}
              <section className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] opacity-40 text-blue-400">Toolbar Customizer</h3>
                  <button onClick={resetToolbar} className="text-[10px] text-white/40 hover:text-white flex items-center gap-1 transition-colors">
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                </div>
                
                <div className="space-y-2">
                  {toolbarOrder.map((toolId, index) => {
                    const isVisible = !hiddenTools.includes(toolId);
                    const toolLabels: Record<string, { label: string, icon: any }> = {
                      ai: { label: 'AI Magic', icon: Sparkles },
                      chat: { label: 'AI Assistant', icon: MessageSquare },
                      globe: { label: 'Language Layout', icon: Globe },
                      translate: { label: 'Translation Bar', icon: ArrowLeftRight },
                      clipboard: { label: 'Smart Clipboard', icon: ClipboardList },
                      settings: { label: 'Settings', icon: Settings2 },
                      mic: { label: 'Voice Input', icon: Mic },
                    };
                    const { label, icon: Icon } = toolLabels[toolId];

                    return (
                      <div key={toolId} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isVisible ? 'bg-white/5 border-white/10' : 'opacity-40 bg-black/20 border-transparent strike-through'}`}>
                        <div className="flex flex-col gap-1">
                          <button onClick={() => moveTool(index, 'up')} disabled={index === 0} className="p-0.5 hover:bg-white/10 rounded disabled:opacity-10"><ChevronUp className="w-3 h-3"/></button>
                          <button onClick={() => moveTool(index, 'down')} disabled={index === toolbarOrder.length - 1} className="p-0.5 hover:bg-white/10 rounded disabled:opacity-10"><CornerDownLeft className="w-3 h-3 rotate-90 scale-y-[-1]"/></button>
                        </div>
                        <Icon className="w-4 h-4 text-blue-400 shrink-0" />
                        <span className="flex-1 text-sm font-medium">{label}</span>
                        <button 
                          onClick={() => toggleToolVisibility(toolId)}
                          className={`p-2 rounded-lg transition-all ${isVisible ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}
                        >
                          {isVisible ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Theme Section */}
              <section>
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] mb-4 opacity-40">Appearance & Theme</h3>
                <div className="grid grid-cols-1 gap-2">
                  {(Object.keys(THEMES) as ThemeKey[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => changeTheme(key)}
                      className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between group h-20 overflow-hidden relative ${
                        themeKey === key 
                          ? 'border-blue-500 bg-blue-500/10' 
                          : 'border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div 
                        className="absolute inset-0 opacity-20 pointer-events-none transition-transform group-hover:scale-110"
                        style={{ background: THEMES[key].mesh.join(', ') }}
                      />
                      <div className="relative z-10">
                        <div className="font-bold text-lg">{THEMES[key].name}</div>
                        <div className="text-xs opacity-50 capitalize">{key} mode</div>
                      </div>
                      {themeKey === key && <Check className="w-6 h-6 text-blue-500 relative z-10" />}
                    </button>
                  ))}
                </div>
              </section>

              {/* Shortcuts Section */}
              <section>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] opacity-40 text-blue-400">Word Shortcuts</h3>
                  <button 
                    onClick={() => toggleMenu('shortcuts')}
                    className="text-[10px] text-blue-400 font-bold px-2 py-1 bg-blue-400/10 rounded-lg hover:bg-blue-400/20"
                  >
                    Manage
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Trigger (e.g. adr)" 
                      value={newShortcutKey}
                      onChange={(e) => setNewShortcutKey(e.target.value)}
                      className={`flex-1 px-4 py-3 rounded-xl text-sm border focus:ring-2 focus:ring-blue-500 transition-all ${currentTheme.isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}
                    />
                    <input 
                      type="text" 
                      placeholder="Expansion" 
                      value={newShortcutValue}
                      onChange={(e) => setNewShortcutValue(e.target.value)}
                      className={`flex-2 px-4 py-3 rounded-xl text-sm border focus:ring-2 focus:ring-blue-500 transition-all ${currentTheme.isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}
                    />
                    <button 
                      onClick={() => {
                        if (newShortcutKey.trim() && newShortcutValue.trim()) {
                          setShortcuts(prev => ({ ...prev, [newShortcutKey.toLowerCase()]: newShortcutValue }));
                          setNewShortcutKey('');
                          setNewShortcutValue('');
                          showToast('Shortcut Added');
                        }
                      }}
                      className="p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto no-scrollbar">
                    {Object.entries(shortcuts).map(([key, value]) => (
                      <div key={key} className={`flex items-center justify-between p-3 rounded-xl border ${currentTheme.isDark ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs text-blue-400">{key}</span>
                          <span className="text-sm opacity-70 truncate max-w-[150px]">{value}</span>
                        </div>
                        <button 
                          onClick={() => {
                            const newShortcuts = { ...shortcuts };
                            delete newShortcuts[key];
                            setShortcuts(newShortcuts);
                          }}
                          className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                        <Trash 
                          className="w-3.5 h-3.5 text-red-400/50 cursor-pointer hover:text-red-400 transition-colors" 
                          onClick={() => {
                            const ns = {...shortcuts};
                            delete ns[key];
                            setShortcuts(ns);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Layout Customization Section */}
              <section className="bg-orange-500/5 border border-orange-500/10 rounded-3xl p-6">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] mb-4 text-orange-400">Keyboard Layout</h3>
                <p className="text-xs opacity-60 mb-6 leading-relaxed">
                  Toggle Layout Editing mode to rearrange keys by dragging them. Your changes will be saved locally.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      setIsEditing(!isEditing);
                      toggleMenu('settings');
                      showToast(isEditing ? 'Editing Disabled' : 'Editing Mode Active');
                    }}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                      isEditing 
                      ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/20' 
                      : 'bg-white/5 hover:bg-white/10 text-orange-400 border border-orange-500/30'
                    }`}
                  >
                    <Wand2 className="w-4 h-4" />
                    {isEditing ? 'Finish Editing' : 'Customize Keys'}
                  </button>
                  <button 
                    onClick={resetLayout}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-all border border-white/5"
                    title="Reset to Default"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </div>
              </section>

              {/* Help & About Section */}
              <section className="pt-4 border-t border-white/5">
                <div className="flex items-center gap-4 text-white/30 text-xs">
                  <span>Version 1.0.4-AI</span>
                  <div className="w-1 h-1 bg-white/10 rounded-full" />
                  <span>Ge'ez Engine 2.0</span>
                </div>
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
        {/* Real-time AI Assistant Chat Overlay */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              className={`fixed inset-0 z-[500] flex flex-col transition-colors duration-500 ${
                currentTheme.isDark ? 'bg-slate-950' : 'bg-slate-100'
              }`}
            >
              {/* Mesh Background for Chat */}
              <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
                <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] ${currentTheme.isDark ? 'bg-indigo-600/30' : 'bg-indigo-400/20'}`} />
                <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] ${currentTheme.isDark ? 'bg-orange-600/20' : 'bg-orange-400/10'}`} />
              </div>

              <div className="relative flex flex-col h-full z-10 backdrop-blur-3xl">
                <div className={`flex items-center justify-between p-4 border-b shrink-0 ${
                  currentTheme.isDark ? 'border-white/10 bg-black/40' : 'border-black/5 bg-white/60'
                }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                    currentTheme.isDark ? 'bg-blue-500/20 border-blue-500/30' : 'bg-blue-500/10 border-blue-500/20'
                  }`}>
                    <Bot className={`w-6 h-6 ${currentTheme.isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                       <h3 className={`font-bold tracking-tight ${currentTheme.isDark ? 'text-white' : 'text-slate-900'}`}>AI Pro Assistant</h3>
                       <span className="px-1.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[8px] font-black uppercase tracking-tighter text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.1)]">PRO</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${isLiveMode ? 'bg-rose-500 animate-[ping_1.5s_infinite]' : 'bg-green-500'} animate-pulse`} />
                      <span className={`text-[10px] uppercase tracking-widest font-bold ${isLiveMode ? 'text-rose-500' : (currentTheme.isDark ? 'text-green-500' : 'text-green-600')}`}>
                         {isLiveMode ? 'Live / Talking' : 'Online'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (panelSources.length > 0) {
                        setShowGroundingPanel(!showGroundingPanel);
                      } else {
                        showToast("No web sources for this chat yet.");
                      }
                    }}
                    className={`p-2.5 rounded-xl transition-all relative ${
                      showGroundingPanel 
                        ? 'bg-blue-600 text-white' 
                        : (currentTheme.isDark ? 'bg-white/5 text-white/80 hover:bg-white/10' : 'bg-black/5 text-black/80 hover:bg-black/10')
                    }`}
                    title="Web Sources"
                  >
                    <Globe className="w-5 h-5" />
                    {panelSources.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full text-[8px] flex items-center justify-center font-black border-2 border-slate-900">
                        {panelSources.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowChatSearch(!showChatSearch);
                      if (showChatSearch) setChatSearchQuery('');
                    }}
                    className={`p-2.5 rounded-xl transition-all ${
                      showChatSearch 
                        ? 'bg-blue-600 text-white' 
                        : (currentTheme.isDark ? 'bg-white/5 text-white/80 hover:bg-white/10' : 'bg-black/5 text-black/80 hover:bg-black/10')
                    }`}
                    title="Search Chat"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Start a new chat session?")) {
                        setChatMessages(() => []);
                        chatSessionRef.current = null;
                        showToast("New chat started");
                      }
                    }}
                    className={`p-2.5 rounded-xl transition-all ${
                      currentTheme.isDark ? 'bg-white/5 text-white/80 hover:bg-white/10' : 'bg-black/5 text-black/80 hover:bg-black/10'
                    }`}
                    title="New Chat"
                  >
                    <MessageSquarePlus className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setShowChatSettingsMenu(!showChatSettingsMenu)}
                    className={`p-2.5 rounded-xl transition-all ${
                      showChatSettingsMenu 
                        ? 'bg-blue-600 text-white' 
                        : (currentTheme.isDark ? 'bg-white/5 text-white/40 hover:bg-white/10' : 'bg-black/5 text-black/40 hover:bg-black/10')
                    }`}
                    title="Universal Settings"
                  >
                    <Settings2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setIsVisionMode(!isVisionMode)}
                    className={`p-2.5 rounded-xl flex items-center gap-2 transition-all group ${
                      isVisionMode 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 ring-1 ring-blue-500/50' 
                        : 'bg-white/5 hover:bg-white/10 text-white/60'
                    }`}
                    title={isVisionMode ? "Disable Vision" : "Enable Vision"}
                  >
                    {isVisionMode ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5 opacity-70 group-hover:opacity-100" />}
                  </button>
                  <button 
                    onClick={() => setShowLiveSettings(!showLiveSettings)}
                    className={`p-2 rounded-full transition-colors ${showLiveSettings ? 'bg-white/20' : 'hover:bg-white/10'}`}
                    title="Live Voice Settings"
                  >
                    <Settings2 className="w-5 h-5 text-white/60" />
                  </button>
                  <button 
                    onClick={() => setIsLiveMode(!isLiveMode)}
                    className={`p-2.5 rounded-xl flex items-center gap-2 transition-all group ${
                      isLiveMode 
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/40 ring-1 ring-rose-500/50' 
                        : 'bg-white/5 hover:bg-white/10 text-white/60'
                    }`}
                  >
                    {isLiveMode ? <Mic2 className="w-5 h-5 animate-pulse" /> : <Headphones className="w-5 h-5 opacity-70 group-hover:opacity-100" />}
                    <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">
                      {isLiveMode ? 'End Call' : 'Talk to AI'}
                    </span>
                  </button>
                  <button 
                    onClick={() => setShowChat(false)}
                    className={`p-2 rounded-full transition-colors ${currentTheme.isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}
                  >
                    <X className={`w-6 h-6 ${currentTheme.isDark ? 'text-white/60' : 'text-black/60'}`} />
                  </button>
                </div>
              </div>

              {/* Search Chat Input Panel */}
              <AnimatePresence>
                {showChatSearch && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`border-b shrink-0 ${currentTheme.isDark ? 'bg-black/40 border-white/5' : 'bg-white/60 border-black/5'} overflow-hidden shadow-inner relative z-20`}
                  >
                    <div className="p-3">
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${currentTheme.isDark ? 'bg-black/50 border-white/10' : 'bg-white border-black/10'}`}>
                        <Search className={`w-4 h-4 ${currentTheme.isDark ? 'text-white/40' : 'text-black/40'}`} />
                        <input
                          type="text"
                          value={chatSearchQuery}
                          onChange={(e) => setChatSearchQuery(e.target.value)}
                          placeholder="Search in conversation..."
                          className="flex-1 bg-transparent border-none focus:outline-none text-sm"
                        />
                        {chatSearchQuery && (
                          <button onClick={() => setChatSearchQuery('')}>
                            <X className={`w-4 h-4 ${currentTheme.isDark ? 'text-white/60' : 'text-black/60'} hover:text-white transition-colors`} />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Chat Universal Settings Panel */}
              <AnimatePresence>
                {showChatSettingsMenu && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`border-b shrink-0 ${currentTheme.isDark ? 'bg-black/60 border-white/5' : 'bg-white/80 border-black/5'} overflow-hidden shadow-2xl relative z-20`}
                  >
                    <div className="p-5 grid grid-cols-2 gap-4">
                      {/* Theme Quick Switch */}
                      <div className="space-y-2">
                        <label className={`text-[10px] font-bold uppercase tracking-widest ${currentTheme.isDark ? 'text-white/30' : 'text-black/40'}`}>Appearance</label>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setThemeKey('black' as ThemeKey)}
                            className={`flex-1 py-2 px-3 rounded-xl border text-[10px] font-bold transition-all ${themeKey === 'black' ? 'bg-white/10 border-white/20 text-white' : (currentTheme.isDark ? 'border-white/5 text-white/40' : 'border-black/5 text-black/40')}`}
                          >
                            Dark Mode
                          </button>
                          <button 
                            onClick={() => setThemeKey('light' as ThemeKey)}
                            className={`flex-1 py-2 px-3 rounded-xl border text-[10px] font-bold transition-all ${themeKey === 'light' ? 'bg-black/10 border-black/20 text-black' : (currentTheme.isDark ? 'border-white/5 text-white/40' : 'border-black/5 text-black/40')}`}
                          >
                            Light Gray
                          </button>
                        </div>
                      </div>

                      {/* Chat Actions */}
                      <div className="space-y-2">
                        <label className={`text-[10px] font-bold uppercase tracking-widest ${currentTheme.isDark ? 'text-white/30' : 'text-black/40'}`}>Chat Options</label>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              if (confirm("Clear all chat history?")) {
                                setChatMessages(() => []);
                                chatSessionRef.current = null;
                                showToast("Chat cleared");
                              }
                            }}
                            className={`flex-1 py-2 px-3 rounded-xl border text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all ${currentTheme.isDark ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : 'border-red-500/20 text-red-600 hover:bg-red-500/5'}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Clear History
                          </button>
                          <button 
                            onClick={() => {
                              const transcript = chatMessages.map(m => `[${m.role.toUpperCase()}] ${m.parts}`).join('\n\n');
                              navigator.clipboard.writeText(transcript);
                              showToast("Chat exported to clipboard");
                            }}
                            className={`flex-1 py-2 px-3 rounded-xl border text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all ${currentTheme.isDark ? 'border-blue-500/30 text-blue-400 hover:bg-blue-500/10' : 'border-blue-500/20 text-blue-600 hover:bg-blue-500/5'}`}
                          >
                            <Copy className="w-3.5 h-3.5" /> Export Chat
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Chat Language Selector */}
              <div className={`px-5 py-2.5 flex items-center gap-3 overflow-x-auto no-scrollbar border-b shrink-0 ${
                currentTheme.isDark ? 'border-indigo-500/20 bg-indigo-950/40' : 'border-indigo-500/10 bg-indigo-50/50'
              }`}>
                <span className={`text-[10px] font-bold uppercase tracking-widest shrink-0 ${currentTheme.isDark ? 'text-indigo-300/60' : 'text-indigo-600/60'}`}>Reply in:</span>
                {[
                  { id: 'auto', label: 'Auto', flag: '🌐' },
                  { id: 'ti', label: 'Tigrinya', flag: '🇪🇷' },
                  { id: 'am', label: 'Amharic', flag: '🇪🇹' },
                  { id: 'en', label: 'English', flag: '🇺🇸' }
                ].map(lang => (
                  <button 
                    key={lang.id}
                    onClick={() => setChatLanguage(lang.id)}
                    className={`py-1.5 px-3 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                      chatLanguage === lang.id 
                        ? 'bg-blue-600 text-white shadow-lg' 
                        : (currentTheme.isDark ? 'bg-white/5 text-white/40 hover:bg-white/10' : 'bg-black/5 text-black/50 hover:bg-black/10')
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </button>
                ))}
              </div>

              <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-6 flex flex-col no-scrollbar">
                {showLiveSettings && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4 space-y-4 overflow-hidden shrink-0"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-blue-400">Assistant Voice</h4>
                      <button onClick={() => setShowLiveSettings(false)} className="text-white/40 hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {['Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir'].map(voice => (
                        <button 
                          key={voice}
                          onClick={() => setLiveVoice(voice)}
                          className={`py-2 px-3 rounded-xl text-xs font-medium transition-all ${
                            liveVoice === voice 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-white/5 text-white/40 hover:bg-white/10'
                          }`}
                        >
                          {voice}
                        </button>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-white/5">
                      <p className="text-[10px] text-white/30 italic">Pick a voice that suits your style. Change takes effect immediately.</p>
                    </div>

                    <div className="pt-4 border-t border-white/5 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-orange-400">Response Language</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'auto', label: 'Auto (Detect)', flag: '🌐' },
                          { id: 'ti', label: 'Tigrinya', flag: '🇪🇷' },
                          { id: 'am', label: 'Amharic', flag: '🇪🇹' },
                          { id: 'en', label: 'English', flag: '🇺🇸' }
                        ].map(lang => (
                          <button 
                            key={lang.id}
                            onClick={() => setLiveLanguage(lang.id)}
                            className={`py-2.5 px-3 rounded-xl text-xs font-medium flex items-center gap-2 transition-all ${
                              liveLanguage === lang.id 
                                ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/40' 
                                : 'bg-white/5 text-white/40 hover:bg-white/10'
                            }`}
                          >
                            <span>{lang.flag}</span>
                            <span>{lang.label}</span>
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-white/30 italic">Force the AI to respond in your preferred language during voice calls.</p>
                    </div>
                  </motion.div>
                )}

                {isLiveMode && (
                  <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
                    <div className="relative">
                      {isVisionMode ? (
                        <div className="relative w-64 h-64 rounded-3xl overflow-hidden border-2 border-blue-500/30 group">
                          <video 
                            ref={videoRef}
                            autoPlay 
                            playsInline 
                            muted 
                            className="w-full h-full object-cover grayscale-[0.5] contrast-[1.2]"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-4 left-4 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-100">Live Vision</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <motion.div 
                            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="absolute inset-0 bg-rose-500/20 rounded-full blur-2xl"
                          />
                          <div className="w-32 h-32 rounded-full bg-rose-500/10 flex items-center justify-center border-2 border-rose-500/30 relative">
                            <div className="flex gap-1.5 items-end h-8">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <motion.div 
                                  key={i}
                                  animate={{ height: [10, 32, 15, 25, 10] }}
                                  transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1 }}
                                  className="w-1.5 bg-rose-400 rounded-full"
                                />
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="text-center space-y-3">
                      <h4 className="text-2xl font-bold text-white tracking-tight">
                        {isVisionMode ? 'AI is Watching' : 'Assistant is Listening'}
                      </h4>
                      <p className="text-white/40 text-sm italic max-w-[250px]">
                        {isVisionMode 
                          ? '"Show me something, I can see and describe it in Tigrinya!"'
                          : '"I am here. speak to me in Tigrinya or English..."'}
                      </p>
                    </div>
                    
                    {liveTranscript && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/5 border border-white/10 p-5 rounded-3xl max-w-sm"
                      >
                        <p className="text-sm text-blue-100 leading-relaxed italic">
                          {liveTranscript}
                        </p>
                      </motion.div>
                    )}

                    <div className="flex items-center gap-6 mt-8 p-3 rounded-full bg-black/10 backdrop-blur-md border border-white/5">
                      <button 
                         onClick={() => setIsVisionMode(!isVisionMode)}
                         className={`p-3 rounded-full transition-all ${isVisionMode ? 'bg-blue-500/20 text-blue-300' : 'text-white/60 hover:text-white'}`}
                         title="Toggle Vision"
                      >
                        <Camera className="w-6 h-6" />
                      </button>
                      <button 
                        onClick={() => setIsLiveMode(false)}
                        className="p-4 rounded-full bg-rose-600 text-white shadow-xl shadow-rose-900/40 hover:scale-105 transition-all"
                        title="End Call"
                      >
                        <X className="w-8 h-8" />
                      </button>
                      <button 
                         onClick={() => setShowLiveSettings(prev => !prev)}
                         className="p-3 rounded-full text-white/60 hover:text-white transition-all"
                         title="Settings"
                      >
                        <Settings2 className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                )}

                {chatMessages.length === 0 && !isLiveMode && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center px-8 space-y-6">
                    <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                      <Sparkles className="w-10 h-10 text-blue-400 opacity-40" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xl font-bold text-white">How can I help you?</h4>
                      <p className="text-white/40 text-sm max-w-[280px]">Ask me anything in Tigrinya, Amharic or English. I can translate, write stories, or fix grammar.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-2 w-full max-w-[280px]">
                      {['Translate "Hello" to Tigrinya', 'Write a short poem in Amharic', 'Explain Tigrinya grammar'].map(hint => (
                        <button 
                          key={hint}
                          onClick={() => setChatInput(hint)}
                          className="p-3 text-xs text-left bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors text-white/70"
                        >
                          {hint}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {chatMessages.filter(msg => {
                  if (!chatSearchQuery.trim()) return true;
                  return msg.parts.toLowerCase().includes(chatSearchQuery.toLowerCase());
                }).map((msg, i) => {
                  // Find origin index for correct edit references
                  const originIndex = chatMessages.indexOf(msg);
                  return (
                  <div key={originIndex} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold ${msg.role === 'user' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.1)]' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]'}`}>
                        {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-lg relative group ${
                        msg.role === 'user' 
                          ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-900/20' 
                          : (currentTheme.isDark 
                              ? 'bg-slate-800 text-slate-100 rounded-tl-none font-ethiopic' 
                              : 'bg-slate-100 text-slate-800 rounded-tl-none font-ethiopic')
                      }`}>
                        
                        {msg.role === 'user' && !isAssistantTyping && editingMessageIndex !== originIndex && (
                          <div className="absolute top-0 right-[100%] pr-2 opacity-0 group-hover:opacity-100 transition-opacity flex h-full items-center">
                            <button
                              onClick={() => {
                                setEditingMessageIndex(originIndex);
                                setEditMessageInput(msg.parts);
                              }}
                              className="p-2 rounded-full w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white shadow-lg backdrop-blur"
                              title="Edit Message"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("Delete this message?")) {
                                  setChatMessages(prev => prev.filter((_, idx) => idx !== originIndex));
                                }
                              }}
                              className="p-2 rounded-full w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-red-500/50 text-white shadow-lg backdrop-blur"
                              title="Delete Message"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {editingMessageIndex === originIndex ? (
                          <div className="flex flex-col gap-3 min-w-[250px] sm:min-w-[300px]">
                            <textarea
                              value={editMessageInput}
                              onChange={(e) => setEditMessageInput(e.target.value)}
                              className="w-full bg-black/20 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
                              rows={3}
                            />
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => setEditingMessageIndex(null)} 
                                className="text-xs font-bold px-4 py-2 rounded-xl bg-black/20 hover:bg-black/30 text-white/80 transition-colors"
                              >
                                Cancel
                              </button>
                              <button 
                                onClick={() => submitEditedMessage(originIndex)} 
                                className="text-xs font-bold px-4 py-2 rounded-xl bg-white text-orange-600 hover:bg-white/90 shadow-lg transition-colors"
                              >
                                Save & Send
                              </button>
                            </div>
                          </div>
                        ) : (
                          <ReactMarkdown 
                            rehypePlugins={[rehypeRaw]}
                            components={{
                              p: ({ children }) => (
                                <p 
                                  className="mb-0"
                                  onMouseUp={() => {
                                    if (isHighlightMode) {
                                        const selection = window.getSelection();
                                        if (selection && selection.toString().length > 0) {
                                            const range = selection.getRangeAt(0);
                                            const span = document.createElement("span");
                                            // Using yellow as default but can be extended
                                            span.className = "bg-yellow-300 text-black px-0.5 rounded cursor-pointer";
                                            span.onclick = () => span.outerHTML = span.innerHTML; // Allow removing highlight
                                            range.surroundContents(span);
                                            selection.removeAllRanges();
                                        }
                                    }
                                  }}
                                >
                                  {children}
                                </p>
                              )
                            }}
                          >
                            {msg.parts}
                          </ReactMarkdown>
                        )}
                        
                        {msg.role === 'model' && (
                          <div className={`mt-3 pt-3 flex flex-col gap-3 border-t ${currentTheme.isDark ? 'border-indigo-500/20' : 'border-indigo-500/10'}`}>
                            {msg.groundingSources && msg.groundingSources.length > 0 && (
                              <div className="flex flex-col gap-2 mt-1">
                                <button 
                                  onClick={() => {
                                    setPanelSources(msg.groundingSources || []);
                                    setShowGroundingPanel(true);
                                  }}
                                  className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all px-2 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 ${currentTheme.isDark ? 'text-blue-400' : 'text-blue-600'}`}
                                >
                                  <Globe className="w-3 h-3"/> {msg.groundingSources.length} Sites Visited
                                </button>
                                <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide snap-x">
                                  {msg.groundingSources.map((src, idx) => {
                                    let hostname = '';
                                    try { hostname = new URL(src.uri).hostname.replace('www.', ''); } catch(e) { hostname = src.uri; }
                                    return (
                                      <a key={idx} href={src.uri} target="_blank" rel="noreferrer" 
                                         className={`flex-none w-44 p-2.5 rounded-xl border flex flex-col justify-center gap-1 transition-transform hover:-translate-y-0.5 snap-start ${
                                           currentTheme.isDark ? 'bg-slate-800/60 border-slate-700/50 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 hover:bg-white shadow-sm'
                                         }`}>
                                        <div className="flex items-center gap-1.5">
                                          <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${currentTheme.isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                                            <Globe className="w-2.5 h-2.5 text-blue-500" />
                                          </div>
                                          <span className="text-[11px] font-bold truncate opacity-90">{hostname}</span>
                                        </div>
                                        <span className="text-[10px] truncate opacity-60 ml-5">{src.title}</span>
                                      </a>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handlePlayChatTts(msg.parts, i)}
                                disabled={playingChatTtsIndex === i}
                                className={`text-[10px] uppercase font-bold tracking-widest ${playingChatTtsIndex === i ? 'text-blue-400 opacity-80' : 'text-indigo-400 hover:text-indigo-300'} flex items-center gap-1.5 transition-colors disabled:opacity-50`}
                              >
                                {playingChatTtsIndex === i ? <Loader2 className="w-3 h-3 animate-spin"/> : <Volume2 className="w-3 h-3" />} 
                                {playingChatTtsIndex === i ? "Playing..." : "Read"}
                              </button>
                               <button 
                                onClick={() => {
                                  setText(prev => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + msg.parts);
                                  setShowChat(false);
                                  showToast("Added to main text");
                                }}
                                className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors"
                              >
                                <Plus className="w-3 h-3" /> Add to Text
                              </button>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(msg.parts);
                                  showToast("Copied content");
                                }}
                                className="text-[10px] uppercase font-bold tracking-widest text-white/40 hover:text-white flex items-center gap-1.5 transition-colors"
                              >
                                <Copy className="w-3 h-3" /> Copy
                              </button>
                               <button 
                                 onClick={async () => {
                                   setIsGeneratingTTS(true);
                                   try {
                                     const audioData = await generateTTS(msg.parts);
                                     if (audioData) {
                                       setAudioData(audioData);
                                       await playBase64Audio(audioData);
                                     }
                                   } catch (e) {
                                     console.error(e);
                                     showToast("Failed to generate audio.");
                                   } finally {
                                     setIsGeneratingTTS(false);
                                   }
                                 }}
                                 className="text-[10px] uppercase font-bold tracking-widest text-white/40 hover:text-white flex items-center gap-1.5 transition-colors"
                               >
                                 <Volume2 className="w-3 h-3" /> Read
                               </button>
                               <button 
                                 onClick={() => {
                                     if (!audioData) {
                                       showToast("Read audio first.");
                                       return;
                                     }
                                     downloadWav(audioData, "audio_export.wav");
                                 }}
                                 className="text-[10px] uppercase font-bold tracking-widest text-white/40 hover:text-white flex items-center gap-1.5 transition-colors"
                               >
                                 <Download className="w-3 h-3" /> Download
                               </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })}
                
                {isAssistantTyping && (
                  <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex gap-3 max-w-[85%]">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.1)] shrink-0">
                        <Bot className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="space-y-2 flex-1">
                        {isSearching && !streamingResponse && (
                          <div className={`p-3 rounded-2xl flex items-center gap-2 border animate-pulse ${currentTheme.isDark ? 'bg-blue-900/20 border-blue-500/20 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
                            <Search className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-bold uppercase tracking-widest">Searching the web...</span>
                          </div>
                        )}
                        
                        {streamingThought && (
                          <details className={`p-3 rounded-2xl border ${currentTheme.isDark ? 'bg-slate-900/50 border-white/5 text-white/40' : 'bg-black/5 border-black/5 text-black/40'}`} open>
                            <summary className="text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:text-white/60 transition-colors list-none flex items-center gap-2">
                              <BrainCircuit className="w-3 h-3" /> THOUGHT PROCESS
                            </summary>
                            <p className="mt-2 text-xs italic leading-relaxed whitespace-pre-wrap opacity-60">
                              {streamingThought}
                            </p>
                          </details>
                        )}

                        <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-lg rounded-tl-none ${
                          currentTheme.isDark 
                            ? 'bg-indigo-900/30 border border-indigo-500/30 text-indigo-50' 
                            : 'bg-white border border-slate-200 text-slate-800 shadow-sm'
                        }`}>
                          {displayedStreamingResponse ? (
                            <div className="custom-typewriter-container">
                              <ReactMarkdown 
                                rehypePlugins={[rehypeRaw]}
                                components={{
                                  p: ({ children }) => <p className="mb-0">{children}</p>
                                }}
                              >
                                {displayedStreamingResponse + (displayedStreamingResponse.length < streamingResponse.length ? " ▊" : "")}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <div className="flex gap-1.5 items-center py-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          )}
                          
                          {streamingSources.length > 0 && (
                            <div className={`mt-3 pt-3 border-t ${currentTheme.isDark ? 'border-indigo-500/20' : 'border-indigo-500/10'} flex flex-col gap-2`}>
                                <button 
                                  onClick={() => {
                                    setPanelSources(streamingSources);
                                    setShowGroundingPanel(true);
                                  }}
                                  className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all px-2 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 ${currentTheme.isDark ? 'text-blue-400' : 'text-blue-600'}`}
                                >
                                  <Globe className="w-3 h-3"/> {streamingSources.length} Sites Visited
                                </button>
                              <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide snap-x">
                                {streamingSources.map((src, idx) => {
                                  let hostname = '';
                                  try { hostname = new URL(src.uri).hostname.replace('www.', ''); } catch(e) { hostname = src.uri; }
                                  return (
                                    <a key={idx} href={src.uri} target="_blank" rel="noreferrer" 
                                       className={`flex-none w-44 p-2.5 rounded-xl border flex flex-col justify-center gap-1 transition-transform hover:-translate-y-0.5 snap-start ${
                                         currentTheme.isDark ? 'bg-slate-800/60 border-slate-700/50 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 hover:bg-white shadow-sm'
                                       }`}>
                                      <div className="flex items-center gap-1.5">
                                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${currentTheme.isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                                          <Globe className="w-2.5 h-2.5 text-blue-500" />
                                        </div>
                                        <span className="text-[11px] font-bold truncate opacity-90">{hostname}</span>
                                      </div>
                                      <span className="text-[10px] truncate opacity-60 ml-5">{src.title}</span>
                                    </a>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {chatSuggestions.length > 0 && !isAssistantTyping && (
                <div className={`px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar shrink-0 border-t ${
                  currentTheme.isDark ? 'bg-indigo-950/40 border-indigo-500/10' : 'bg-slate-50 border-slate-200'
                }`}>
                  {chatSuggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setChatInput(suggestion);
                        setChatSuggestions([]);
                        sendToAI(suggestion, chatMessages);
                      }}
                      className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all border shadow-sm flex items-center gap-2 group ${
                        currentTheme.isDark
                          ? 'bg-slate-800 border-white/10 text-slate-300 hover:bg-slate-700 hover:text-white'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              <div className={`p-4 border-t backdrop-blur-3xl shrink-0 ${
                currentTheme.isDark ? 'bg-indigo-950/60 border-indigo-500/20' : 'bg-white/80 border-slate-200'
              }`}>
                {/* Grounding Sources Sidebar/Panel */}
                <AnimatePresence>
                  {showGroundingPanel && (
                    <motion.div
                      initial={{ x: '100%' }}
                      animate={{ x: 0 }}
                      exit={{ x: '100%' }}
                      className={`fixed top-0 right-0 w-80 h-full z-50 flex flex-col shadow-2xl border-l backdrop-blur-3xl overflow-hidden ${
                        currentTheme.isDark ? 'bg-slate-900/95 border-white/10' : 'bg-white/95 border-black/10'
                      }`}
                    >
                      <div className="flex items-center justify-between p-5 border-b border-white/10">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                             <Globe className="w-4 h-4 text-blue-400" />
                           </div>
                           <h3 className="font-bold text-sm text-white tracking-tight">Sites Visited</h3>
                        </div>
                        <button onClick={() => setShowGroundingPanel(false)} className="text-white/40 hover:text-white transition-colors">
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                        {panelSources.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-4">
                            <Globe className="w-12 h-12" />
                            <p className="text-xs font-bold uppercase tracking-widest text-white">No sites visited</p>
                          </div>
                        ) : (
                          panelSources.map((src, idx) => {
                            let hostname = '';
                            try { hostname = new URL(src.uri).hostname.replace('www.', ''); } catch(e) { hostname = src.uri; }
                            return (
                              <a 
                                key={idx} 
                                href={src.uri} 
                                target="_blank" 
                                rel="noreferrer"
                                className={`block p-4 rounded-2xl border transition-all hover:scale-[1.02] active:scale-95 group ${
                                  currentTheme.isDark ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-black/5 border-black/5 hover:bg-black/10'
                                }`}
                              >
                                <div className="flex items-start gap-4">
                                  <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center font-bold text-lg select-none ${
                                    currentTheme.isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-600'
                                  }`}>
                                    {hostname.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="space-y-1 min-w-0">
                                    <h4 className={`text-xs font-bold truncate ${currentTheme.isDark ? 'text-white' : 'text-slate-900'}`}>{src.title}</h4>
                                    <p className={`text-[10px] truncate opacity-50 font-medium ${currentTheme.isDark ? 'text-blue-300' : 'text-blue-600'}`}>{hostname}</p>
                                  </div>
                                </div>
                              </a>
                            );
                          })
                        )}
                      </div>
                      
                      <div className="p-5 border-t border-white/10 bg-black/20 text-center">
                         <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">Verified Sources via Google Search</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {interimTranscript && listeningTarget === 'chat' && (
                  <div className="mb-2 italic text-sm text-rose-400 font-ethiopic animate-pulse">
                    Listening: {interimTranscript}...
                  </div>
                )}
                <div className={`flex items-center gap-3 border rounded-full p-1 pl-5 pr-2 focus-within:border-indigo-400/50 transition-all ${
                  currentTheme.isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'
                }`}>
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                    placeholder="Ask AI Pro Assistant..."
                    className={`flex-1 bg-transparent border-none focus:ring-0 text-sm py-3 font-ethiopic ${
                      currentTheme.isDark ? 'text-white placeholder:text-white/20' : 'text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                  <button 
                    onClick={() => toggleListening('chat')}
                    className={`p-2 rounded-xl transition-all ${isListening && listeningTarget === 'chat' ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/20' : (currentTheme.isDark ? 'text-white/40 hover:text-white/60 hover:bg-white/5' : 'text-slate-400 hover:text-slate-600 hover:bg-black/5')}`}
                    title="Voice Input"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={handleSendChatMessage}
                    disabled={!chatInput.trim() || isAssistantTyping}
                    className={`p-2 rounded-xl transition-all ${chatInput.trim() ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : (currentTheme.isDark ? 'bg-white/5 text-white/20' : 'bg-black/5 text-black/20')}`}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
}

