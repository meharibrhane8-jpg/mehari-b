/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Delete, ChevronUp, Space, CornerDownLeft, Globe, Copy, Trash2, Check, Settings2, RotateCcw, X, Save, Languages, Mic, MicOff, Palette, Smile, Rows, Wand2, Sparkles, Loader2, ArrowLeftRight, Type, ClipboardList, Pin, PinOff } from 'lucide-react';
import { GEEZ_MAP, VOWEL_MAP, PHONETIC_MAP } from './geezUtils';

// Predefined Emoji List
const EMOJIS = ['😀', '😂', '😍', '🥰', '😊', '🤔', '🙌', '👏', '🔥', '✨', '❤️', '🇪🇷', '🇪🇹', '👍', '🙏', '🎉', '🌟', '😎', '😜', '😢', '📍', '✅', '❌', '💯'];

// Theme Definitions
import { GoogleGenAI } from "@google/genai";

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
const GEEZ_ROWS = [
  ['ሀ', 'ለ', 'ሐ', 'መ', 'ረ', 'ሰ', 'ሸ', 'ቀ', 'በ'],
  ['ተ', 'ነ', 'ኘ', 'አ', 'ከ', 'ኸ', 'ወ', 'ዐ', 'ዘ'],
  ['የ', 'ደ', 'ጀ', 'ገ', 'ጠ', 'ጸ', 'ፈ', 'backspace'],
  ['123', 'globe', 'mic', 'emoji', 'space', 'enter'],
];

const LATIN_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace'],
  ['123', 'globe', 'mic', 'emoji', 'space', 'enter'],
];

const DEFAULT_ROWS = GEEZ_ROWS;

const SYMBOL_ROWS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['-', '/', '(', ')', '$', '&', '@', '"', '.', ','],
  ['shift', '፣', '፤', '።', '፥', 'backspace'],
  ['ABC', 'globe', 'mic', 'emoji', 'space', 'enter'],
];

export default function App() {
  const [text, setText] = useState('');
  const [isShift, setIsShift] = useState(false);
  const [isLatin, setIsLatin] = useState(false);
  const [isSymbols, setIsSymbols] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [themeKey, setThemeKey] = useState<ThemeKey>('black');
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [layout, setLayout] = useState<string[][]>(DEFAULT_ROWS);
  const [selectedKey, setSelectedKey] = useState<{ row: number; col: number } | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isToneAdjusting, setIsToneAdjusting] = useState(false);
  const [showToneMenu, setShowToneMenu] = useState(false);
  const [showTranslationBar, setShowTranslationBar] = useState(false);
  const [translationInput, setTranslationInput] = useState('');
  const [translationDirection, setTranslationDirection] = useState<'en-ti' | 'ti-en'>('en-ti');
  const [isTranslatingRealtime, setIsTranslatingRealtime] = useState(false);
  const [activePhonetic, setActivePhonetic] = useState('');
  const [cursorIndex, setCursorIndex] = useState(0);
  const cursorIndexRef = useRef(0);
  useEffect(() => {
    cursorIndexRef.current = cursorIndex;
  }, [cursorIndex]);

  const [isCursorMode, setIsCursorMode] = useState(false);
  const swipeStartX = useRef<number | null>(null);
  const lastMoveRef = useRef<number>(0);

  useEffect(() => {
    if (text === '') setCursorIndex(0);
  }, [text]);
  const [clipboardItems, setClipboardItems] = useState<string[]>([]);
  const [pinnedItems, setPinnedItems] = useState<string[]>([]);
  const [isClipboardOpen, setIsClipboardOpen] = useState(false);
  const [clipboardActionMenu, setClipboardActionMenu] = useState<{ item: string; isPinned: boolean; x: number; y: number } | null>(null);
  
  const currentTheme = THEMES[themeKey] || THEMES.black;

  // Long press state
  const [vowelMenu, setVowelMenu] = useState<{ key: string; variations: string[]; x: number; y: number } | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'ti-ER'; // Tigrinya

      recognitionRef.current.onresult = (event: any) => {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
          const transcript = lastResult[0].transcript;
          setText(prev => {
            const index = cursorIndexRef.current;
            const newText = prev.slice(0, index) + transcript + prev.slice(index);
            setCursorIndex(index + transcript.length);
            return newText;
          });
        }
      };

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = (event: any) => {
        console.error('Recognition error:', event.error);
        setIsListening(false);
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

    // Priority 1: Direct phonetic match from active buffer
    if (activePhonetic && TIGRINYA_DICTIONARY[activePhonetic.toLowerCase()]) {
      setSuggestions(TIGRINYA_DICTIONARY[activePhonetic.toLowerCase()]);
      return;
    }

    // Priority 2: Fuzzy phonetic match
    const fuzzyMatch = Object.keys(TIGRINYA_DICTIONARY).find(k => 
      activePhonetic && k.startsWith(activePhonetic.toLowerCase())
    );
    if (fuzzyMatch) {
      setSuggestions(TIGRINYA_DICTIONARY[fuzzyMatch]);
      return;
    }

    // Priority 3: Auto-correct for existing Ge'ez words
    if (AUTOCORRECT_MAP[lastWord]) {
      setSuggestions([AUTOCORRECT_MAP[lastWord]]);
      return;
    }

    setSuggestions([]);
  }, [text, activePhonetic]);

  // Real-time Translation (Debounced)
  useEffect(() => {
    if (!showTranslationBar || !translationInput.trim()) return;

    const timeoutId = setTimeout(async () => {
      setIsTranslatingRealtime(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const [source, target] = translationDirection === 'en-ti' ? ['English', 'Tigrinya'] : ['Tigrinya', 'English'];
        
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Translate the following text from ${source} to ${target}. Only return the translation. Do not include any explanations or alternative versions.\n\nText: ${translationInput}`,
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
  }, [translationInput, translationDirection, showTranslationBar]);

  const handleTranslate = async () => {
    if (!text || isTranslating) return;
    setIsTranslating(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Translate the following text between Tigrinya and English. If it is Tigrinya, translate to English. If English, to Tigrinya. Only return the translation: "${text}"`,
      });
      
      const translation = response.text;
      if (translation) {
        setText(translation);
        setCursorIndex(translation.length);
      }
    } catch (err) {
      console.error("Translation failed:", err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleAdjustTone = async (tone: string) => {
    if (!text.trim() || isToneAdjusting) return;
    setIsToneAdjusting(true);
    setShowToneMenu(false);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Rewrite this Tigrinya text to sound ${tone}. Keep the meaning the same but adjust the grammar and word choice to be culturally appropriate. Only return the translated text.\n\nText: ${text}`,
      });
      
      const adjusted = response.text;
      if (adjusted) {
        setText(adjusted.trim());
        setCursorIndex(adjusted.trim().length);
      }
    } catch (err) {
      console.error("Tone adjustment failed:", err);
    } finally {
      setIsToneAdjusting(false);
    }
  };

  const toggleListening = () => {
    if (isListening) recognitionRef.current?.stop();
    else {
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

  const handleKeyPress = useCallback((key: string, rowIndex: number, colIndex: number) => {
    if (isEditing) {
      handleLayoutEdit(rowIndex, colIndex);
      return;
    }

    setActiveKey(key);
    setTimeout(() => setActiveKey(null), 100);

    if (key === 'backspace') {
      if (cursorIndex > 0) {
        setText((prev) => prev.slice(0, cursorIndex - 1) + prev.slice(cursorIndex));
        setCursorIndex(prev => prev - 1);
        setActivePhonetic((prev) => prev.slice(0, -1));
      }
      return;
    }

    if (key === 'space') {
      setText((prev) => prev.slice(0, cursorIndex) + ' ' + prev.slice(cursorIndex));
      setCursorIndex(prev => prev + 1);
      setSuggestions([]);
      setActivePhonetic('');
      return;
    }

    if (key === 'mic') {
      toggleListening();
      return;
    }

    if (key === 'emoji') {
      setShowEmojiMenu(!showEmojiMenu);
      return;
    }

    if (key === 'enter') {
      setText((prev) => prev.slice(0, cursorIndex) + '\n' + prev.slice(cursorIndex));
      setCursorIndex(prev => prev + 1);
      return;
    }

    if (key === 'shift') {
      setIsShift(!isShift);
      return;
    }

    if (key === 'globe') {
      const nextIsLatin = !isLatin;
      setIsLatin(nextIsLatin);
      if (!isSymbols) {
        setLayout(nextIsLatin ? LATIN_ROWS : GEEZ_ROWS);
      }
      return;
    }

    if (key === '123') {
      setIsSymbols(true);
      return;
    }

    if (key === 'ABC') {
      setIsSymbols(false);
      setLayout(isLatin ? LATIN_ROWS : GEEZ_ROWS);
      return;
    }

    // Phonetic Buffer Logic
    const lowerKey = key.toLowerCase();
    const vowelIdx = VOWEL_MAP[lowerKey];
    const phoneticBase = PHONETIC_MAP[lowerKey];

    // If it's a vowel and we have a preceding character to modify
    if (vowelIdx !== undefined && cursorIndex > 0) {
      const lastChar = text[cursorIndex - 1];
      let found = false;
      for (const forms of Object.values(GEEZ_MAP)) {
        // Check if last character is the 1st or 6th order of this series
        if (forms[0] === lastChar || forms[5] === lastChar) {
          const newChar = forms[vowelIdx];
          setText((prev) => prev.slice(0, cursorIndex - 1) + newChar + prev.slice(cursorIndex));
          found = true;
          break;
        }
      }
      if (found) {
        if (isShift) setIsShift(false);
        return;
      }
    }

    // If it's a phonetic base (like 'm' -> 'መ')
    if (phoneticBase && (isLatin || !GEEZ_MAP[key])) {
      setText((prev) => prev.slice(0, cursorIndex) + phoneticBase + prev.slice(cursorIndex));
      setCursorIndex(prev => prev + 1);
      setActivePhonetic((prev) => prev + (isShift ? key.toUpperCase() : key.toLowerCase()));
      if (isShift) setIsShift(false);
      return;
    }

    if (isLatin || isSymbols) {
      const char = isShift ? key.toUpperCase() : key;
      setText((prev) => prev.slice(0, cursorIndex) + char + prev.slice(cursorIndex));
      setCursorIndex(prev => prev + 1);
      if (char.length === 1 && /[a-z]/i.test(char)) {
        setActivePhonetic((prev) => prev + char);
      } else {
        setActivePhonetic('');
      }
      if (isShift) setIsShift(false);
      return;
    }

    const char = isShift ? key.toUpperCase() : key;

    const forms = GEEZ_MAP[char];
    if (forms) {
      setText((prev) => prev.slice(0, cursorIndex) + forms[0] + prev.slice(cursorIndex));
      setCursorIndex(prev => prev + 1);
      setActivePhonetic((prev) => prev + (isShift ? key.toUpperCase() : key.toLowerCase()));
    } else {
      setText((prev) => prev.slice(0, cursorIndex) + char + prev.slice(cursorIndex));
      setCursorIndex(prev => prev + 1);
      setActivePhonetic('');
    }
    
    if (isShift) setIsShift(false);
  }, [isEditing, isLatin, isShift, layout, selectedKey, text, isListening, handleLayoutEdit, toggleListening, isSymbols, showEmojiMenu, activePhonetic, cursorIndex]);

  const startLongPress = (key: string, e: any) => {
    if (isEditing || isLatin || isSymbols) return;
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
    setShowThemeMenu(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    if (text.trim()) {
      addToClipboard(text);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

      {/* Main iPad-Style Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`relative z-10 w-full h-full sm:max-w-[800px] flex flex-col p-4 sm:p-6 overflow-hidden transition-colors duration-500 ${currentTheme.isDark ? 'text-white' : 'text-slate-900'}`}
      >
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

        {/* Header/Actions */}
        <header className="flex items-center justify-between mb-4 px-2 shrink-0">
          <div className="flex flex-col">
            <h1 className={`text-xl sm:text-2xl font-light tracking-tight ${currentTheme.isDark ? 'text-white/90' : 'text-slate-800'}`}>
              {isEditing ? 'Customize Layout' : 'Eritrean Keyboard'}
            </h1>
            <span className={`text-[9px] sm:text-[10px] uppercase tracking-widest ${currentTheme.isDark ? 'opacity-30' : 'opacity-40'} font-mono`}>
              {isEditing ? 'Select two keys to swap them' : isLatin ? 'English Mode (Latin)' : 'Tigrinya Input Method'}
            </span>
          </div>
          
          <div className="flex gap-2 relative">
            {!isEditing ? (
              <>
                <div className="relative">
                  <button 
                    onClick={() => setShowToneMenu(!showToneMenu)}
                    className={`p-2.5 transition-all border ${currentTheme.isDark ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-black/5 border-black/5 hover:bg-black/10'} rounded-xl ${showToneMenu ? (currentTheme.isDark ? 'bg-white/20' : 'bg-black/20') : ''}`}
                    title="AI Tone Adjuster"
                    disabled={isToneAdjusting}
                  >
                    {isToneAdjusting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    ) : (
                      <Wand2 className="w-4 h-4 opacity-60 text-purple-400" />
                    )}
                  </button>
                  <AnimatePresence>
                    {showToneMenu && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className={`absolute right-0 top-full mt-2 w-48 border rounded-2xl p-2 z-[60] shadow-2xl backdrop-blur-3xl ${currentTheme.isDark ? 'bg-black/40 border-white/10' : 'bg-white/60 border-black/10'}`}
                      >
                        {[
                          { label: 'Formal (Respectful)', tone: 'Formal (Respectful)' },
                          { label: 'Casual (Friends)', tone: 'Casual (Friends)' },
                          { label: 'Poetic/Traditional', tone: 'Poetic/Traditional' }
                        ].map((option) => (
                          <button
                            key={option.tone}
                            onClick={() => handleAdjustTone(option.tone)}
                            className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-3 ${currentTheme.isDark ? 'hover:bg-white/5 text-white/80' : 'hover:bg-black/5 text-slate-700'}`}
                          >
                            <Sparkles className="w-3 h-3 opacity-40" />
                            {option.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button 
                  onClick={() => setShowTranslationBar(!showTranslationBar)}
                  className={`p-2.5 transition-all border rounded-xl ${showTranslationBar ? 'bg-blue-500/20 border-blue-500/30' : (currentTheme.isDark ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-black/5 border-black/5 hover:bg-black/10')}`}
                  title="Integrated Translation Bar"
                >
                  <Type className={`w-4 h-4 ${showTranslationBar ? 'text-blue-400' : 'opacity-60'}`} />
                </button>

                <div className="relative">
                  <button 
                    onClick={() => setShowThemeMenu(!showThemeMenu)}
                    className={`p-2.5 transition-all border ${currentTheme.isDark ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-black/5 border-black/5 hover:bg-black/10'} rounded-xl ${showThemeMenu ? (currentTheme.isDark ? 'bg-white/20' : 'bg-black/20') : ''}`}
                    title="Change Theme"
                  >
                    <Palette className="w-4 h-4 opacity-60" />
                  </button>
                  <AnimatePresence>
                    {showThemeMenu && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className={`absolute right-0 top-full mt-2 w-48 border rounded-2xl p-2 z-[60] shadow-2xl backdrop-blur-3xl ${currentTheme.isDark ? 'bg-black/40 border-white/10' : 'bg-white/60 border-black/10'}`}
                      >
                        {(Object.keys(THEMES) as ThemeKey[]).map(key => (
                          <button
                            key={key}
                            onClick={() => changeTheme(key)}
                            className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-3 ${themeKey === key ? (currentTheme.isDark ? 'bg-white/20 text-white' : 'bg-black/10 text-black') : (currentTheme.isDark ? 'hover:bg-white/5 text-white/60' : 'hover:bg-black/5 text-slate-600')}`}
                          >
                            <div className="w-3 h-3 rounded-full border border-white/10" style={{ backgroundColor: THEMES[key].bg }} />
                            {THEMES[key].name}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button 
                  onClick={() => setIsClipboardOpen(!isClipboardOpen)}
                  className={`p-2.5 transition-all border rounded-xl ${isClipboardOpen ? 'bg-orange-500/20 border-orange-500/30 text-orange-400' : (currentTheme.isDark ? 'bg-white/5 border-white/5 hover:bg-white/10 opacity-60' : 'bg-black/5 border-black/5 hover:bg-black/10 opacity-60')}`}
                  title="Smart Clipboard Manager"
                >
                  <ClipboardList className="w-4 h-4" />
                </button>

                <button 
                  onClick={() => { setIsEditing(true); setIsSymbols(false); }}
                  className={`p-2.5 transition-all border rounded-xl ${currentTheme.isDark ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-black/5 border-black/5 hover:bg-black/10'}`}
                  title="Customize Layout"
                >
                  <Settings2 className="w-4 h-4 opacity-60" />
                </button>
                <button 
                  onClick={clearText}
                  className={`p-2.5 transition-all border rounded-xl ${currentTheme.isDark ? 'bg-white/5 border-white/5 hover:bg-red-500/20 hover:border-red-500/30' : 'bg-black/5 border-black/5 hover:bg-red-500/10 hover:border-red-500/20'}`}
                  title="Clear all"
                >
                  <Trash2 className="w-4 h-4 opacity-60" />
                </button>
                <button 
                  onClick={copyToClipboard}
                  className={`px-4 py-2 rounded-xl transition-all border flex items-center gap-2 ${
                    copied ? 'bg-green-500/20 border-green-500/30' : `${currentTheme.accentBg} ${currentTheme.accentBorder} ${currentTheme.isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`
                  }`}
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className={`w-4 h-4 opacity-60 ${currentTheme.accentText}`} />}
                  <span className={`text-sm font-medium ${currentTheme.accentText}`}>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={resetLayout}
                  className="p-2.5 bg-white/5 hover:bg-orange-500/20 rounded-xl transition-all border border-white/5 flex items-center gap-2"
                  title="Reset to default"
                >
                  <RotateCcw className="w-4 h-4 opacity-60" />
                  <span className="text-xs font-medium text-white/80">Reset</span>
                </button>
                <button 
                  onClick={() => { setIsEditing(false); setSelectedKey(null); }}
                  className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 flex items-center gap-2"
                  title="Cancel"
                >
                  <X className="w-4 h-4 opacity-60" />
                  <span className="text-xs font-medium text-white/80">Cancel</span>
                </button>
                <button 
                  onClick={saveLayout}
                  className={`px-4 py-2 ${currentTheme.accentBg} hover:bg-opacity-40 rounded-xl transition-all border ${currentTheme.accentBorder} flex items-center gap-2`}
                  title="Save Layout"
                >
                  <Save className={`w-4 h-4 ${currentTheme.accentText}`} />
                  <span className={`text-sm font-medium ${currentTheme.accentText}`}>Save</span>
                </button>
              </>
            )}
          </div>
        </header>

        {/* Display Area */}
        <section className={`flex-1 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border mb-4 relative group overflow-hidden transition-all ${isEditing ? 'bg-white/[0.02] border-white/5 grayscale' : 'bg-black/60 border-white/5 shadow-inner'}`}>
          <div className="flex justify-between items-center mb-2">
            <div className={`text-white/40 text-[9px] sm:text-[10px] uppercase tracking-widest font-mono transition-colors ${isListening ? currentTheme.accentText : ''}`}>
              {isListening ? (
                <span className="flex items-center gap-2 animate-pulse">
                  <div className={`w-1.5 h-1.5 rounded-full`} style={{ backgroundColor: 'currentColor' }} />
                  Listening...
                </span>
              ) : (
                isLatin ? 'English Input' : 'ትግርኛ - Tigrinya'
              )}
            </div>
            {!isEditing && text && (
              <button 
                onClick={copyToClipboard}
                className={`opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 hover:bg-white/20 p-2 rounded-lg flex items-center gap-2 text-[10px] uppercase tracking-wider ${currentTheme.accentText}`}
              >
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Success' : 'Copy'}
              </button>
            )}
          </div>
          <div 
            ref={scrollRef}
            className={`h-[calc(100%-20px)] sm:h-[calc(100%-24px)] overflow-y-auto text-2xl sm:text-4xl leading-relaxed whitespace-pre-wrap break-all custom-scrollbar flex flex-col font-ethiopic text-white`}
          >
            {text ? (
              <div className="min-h-full">
                <span className="w-full">
                  {text.slice(0, cursorIndex)}
                  <motion.span
                    animate={{ opacity: !isEditing ? [1, 0, 1] : 0 }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className={`inline-block w-[2px] h-[0.9em] align-middle rounded-full ${isCursorMode ? 'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]' : 'bg-white'}`}
                  />
                  {text.slice(cursorIndex)}
                </span>
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
          {showTranslationBar && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-2 sm:px-4 mb-2 sm:mb-4 overflow-hidden"
            >
              <div className={`p-2 sm:p-3 rounded-2xl border transition-all ${currentTheme.isDark ? 'bg-blue-950/30 border-blue-500/20' : 'bg-blue-50/50 border-blue-500/20'} backdrop-blur-xl`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                    <span className="text-[10px] uppercase tracking-wider opacity-60 font-medium">
                      {translationDirection === 'en-ti' ? 'English' : 'ትግርኛ'}
                    </span>
                    <button 
                      onClick={() => setTranslationDirection(prev => prev === 'en-ti' ? 'ti-en' : 'en-ti')}
                      className="p-1 hover:bg-white/10 rounded-md transition-colors"
                    >
                      <ArrowLeftRight className="w-3 h-3 text-blue-400" />
                    </button>
                    <span className="text-[10px] uppercase tracking-wider opacity-60 font-medium">
                      {translationDirection === 'en-ti' ? 'ትግርኛ' : 'English'}
                    </span>
                  </div>
                  <div className="flex-1" />
                  <button 
                    onClick={() => { setShowTranslationBar(false); setTranslationInput(''); }}
                    className="p-1 hover:bg-red-500/10 rounded-md transition-colors"
                  >
                    <X className="w-3 h-3 opacity-40 hover:opacity-100" />
                  </button>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={translationInput}
                    onChange={(e) => setTranslationInput(e.target.value)}
                    placeholder={translationDirection === 'en-ti' ? "Type in English..." : "ብትግርኛ ጽሓፉ..."}
                    className={`w-full bg-transparent border-none focus:ring-0 text-sm sm:text-base font-ethiopic ${currentTheme.isDark ? 'text-white' : 'text-slate-900'} placeholder:opacity-30`}
                    autoFocus
                  />
                  {isTranslatingRealtime && (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400 absolute right-1" />
                  )}
                </div>
              </div>
            </motion.div>
          )}
          
          {!isEditing && !showTranslationBar && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={`flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4 px-2 sm:px-4 overflow-x-auto no-scrollbar py-2 rounded-2xl backdrop-blur-xl border transition-all ${currentTheme.isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/5 shadow-sm'}`}
            >
              {/* Translation Tool */}
              <button 
                onClick={handleTranslate}
                className={`flex-shrink-0 p-2 rounded-lg transition-all ${isTranslating ? 'animate-spin opacity-50' : 'hover:bg-white/20 opacity-70'}`}
                title="Translate with Gemini"
                disabled={isTranslating}
              >
                <Languages className={`w-4 h-4 ${currentTheme.isDark ? 'text-white' : 'text-slate-800'}`} />
              </button>

              <div className="h-6 w-[1px] bg-white/10 flex-shrink-0" />

              {/* Dynamic Vowel Preview (Long Press) */}
              {vowelMenu && (
                <div className="flex gap-2 flex-shrink-0">
                  {[vowelMenu.variations[3], vowelMenu.variations[5]].filter(Boolean).map((v, i) => (
                    <motion.button
                      key={`vowel-${i}`}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      onClick={() => {
                        setText(prev => prev.slice(0, -1) + v);
                        setVowelMenu(null);
                      }}
                      className={`px-3 py-1 rounded-lg ${currentTheme.accentBg} ${currentTheme.accentText} border ${currentTheme.accentBorder} font-ethiopic text-lg`}
                    >
                      {v}
                    </motion.button>
                  ))}
                  <div className="h-6 w-[1px] bg-white/10 flex-shrink-0" />
                </div>
              )}

              {/* Word Suggestions */}
              {suggestions.length > 0 ? (
                suggestions.map((suggestion, idx) => {
                  const isAutoCorrect = lastWordForUI && AUTOCORRECT_MAP[lastWordForUI] === suggestion;
                  return (
                    <motion.button
                      key={idx}
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
                })
              ) : (
                <span className={`text-[10px] sm:text-xs opacity-30 italic font-light px-4 ${currentTheme.isDark ? 'text-white' : 'text-black'}`}>
                  {isLatin ? 'Suggestions disabled in English mode' : 'AI is listening...'}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Keyboard Area */}
        <div 
          className={`mx-auto w-full max-w-[500px] flex flex-col gap-1.5 sm:gap-2 transition-all relative shrink-0 pb-[env(safe-area-inset-bottom,16px)] ${isEditing ? 'scale-[1.02]' : ''}`}
          style={{ height: '40vh' }}
        >
          {/* Clipboard Overlay */}
          <AnimatePresence>
            {isClipboardOpen && (
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
                  <button onClick={() => setIsClipboardOpen(false)} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
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

          {/* Emoji Picker Popup */}
          <AnimatePresence>
            {showEmojiMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: -20 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="absolute left-1/2 -translate-x-1/2 z-[100] w-full max-w-[400px] bg-white/10 backdrop-blur-3xl border border-white/20 p-4 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
                style={{ top: -160 }}
              >
                <div className="flex justify-between items-center mb-3 px-1">
                  <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Frequently Used</span>
                  <button onClick={() => setShowEmojiMenu(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
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
                        setShowEmojiMenu(false);
                      }}
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
            <div key={rowIndex} className="flex justify-center gap-2 flex-1 items-stretch">
              {row.map((key, colIndex) => {
                const isSpecial = ['shift', 'backspace', 'globe', 'space', 'enter', '123', 'mic', 'emoji', 'ABC'].includes(key);
                const isPressed = activeKey === key;
                const isSelected = selectedKey?.row === rowIndex && selectedKey?.col === colIndex;
                const currentLabel = isShift ? key.toUpperCase() : key;
                const displayChar = (isLatin || isSymbols) ? currentLabel : (GEEZ_MAP[currentLabel]?.[0] || key);

                return (
                  <motion.button
                    key={`${rowIndex}-${colIndex}-${key}`}
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
                    whileTap={{ scale: 0.95, backgroundColor: 'rgba(255,255,255,0.2)' }}
                    className={`
                      relative rounded-lg sm:rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer font-ethiopic
                      ${isSpecial ? (currentTheme.isDark ? 'bg-white/[0.03] text-white/70' : 'bg-black/[0.03] text-black/60') : (currentTheme.isDark ? 'bg-white/[0.08] border-white/[0.12] text-white' : 'bg-white border-black/[0.05] text-slate-800 shadow-sm')}
                      backdrop-blur-[12px] border px-2 text-[clamp(1rem,5vw,1.5rem)]
                      ${isSpecial ? 'text-[clamp(0.6rem,2vw,0.8rem)] uppercase tracking-tight' : ''}
                      ${key === 'space' ? (isCursorMode ? '!bg-blue-400 !text-white' : (currentTheme.isDark ? '!bg-white !text-black' : '!bg-slate-800 !text-white')) + ' flex-[5] tracking-widest min-w-0 transition-colors' : 'flex-1'}
                      ${key === 'globe' && !isLatin ? currentTheme.accentText : ''}
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
                    <span className="relative z-10 flex flex-col items-center">
                      {key === 'shift' && <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 opacity-80" />}
                      {key === 'backspace' && <Delete className="w-4 h-4 sm:w-5 sm:h-5 opacity-80" />}
                      {key === 'mic' && (isListening ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5 opacity-80" />)}
                      {key === 'emoji' && <Smile className="w-4 h-4 sm:w-5 sm:h-5 opacity-80" />}
                      {key === 'globe' && (isLatin ? <Languages className="w-4 h-4 sm:w-5 sm:h-5 opacity-60" /> : <Globe className="w-4 h-4 sm:w-5 sm:h-5 opacity-80" />)}
                      {key === 'space' && <span className="text-xs sm:text-sm font-semibold">ቦታ</span>}
                      {key === 'enter' && <span>return</span>}
                      {key === '123' && <span>123</span>}
                      {key === 'ABC' && <span>ABC</span>}
                      
                      {!isSpecial && (
                        <>
                          <span className="absolute top-1 left-1.5 text-[6px] sm:text-[8px] opacity-30 uppercase font-sans font-medium tracking-tighter">
                            {currentLabel}
                          </span>
                          <span className="leading-none">
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
    </div>
  );
}
