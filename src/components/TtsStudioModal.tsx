import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Mic, 
  Plus, 
  Play, 
  Download, 
  ThumbsUp, 
  ThumbsDown, 
  Radio, 
  Loader2,
  ChevronDown,
  Trash2,
  History,
  Clock,
  Settings,
  Music,
  Sliders,
  Volume2,
  MoreVertical,
  Wand2,
  Type,
  AlignLeft,
  Pause,
  FastForward,
  Rewind,
  Share2,
  Minimize2,
  Sparkles,
  Square
} from 'lucide-react';
import { generateTTS, refineText, callGeminiAPI, refineTigrinya } from '../services/geminiService';
import { playBase64Audio, stopAllAudio, resumeAudioContext, speakWithWebSpeech } from '../services/audioService';
import { downloadWav } from '../lib/wavUtils';
import { VoicePreviewGallery } from './VoicePreviewGallery';

interface TtsStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: {
    isDark: boolean;
    accent?: string;
  };
  defaultSpeaker?: string;
  defaultModel?: string;
  showToast: (msg: string) => void;
  activeLanguage?: string;
  initialBlocks?: SpeechBlock[];
  initialScene?: string;
  initialContext?: string;
}

interface SpeechBlock {
  id: string;
  speaker: string;
  text: string;
  speed?: number;
  pitch?: number;
}

interface HistoryItem {
  id: string;
  timestamp: number;
  scene: string;
  blocks: SpeechBlock[];
  audioBlocks: Record<string, string>;
}

// --- IndexedDB Helpers ---
const DB_NAME = 'TTS_Studio_DB';
const STORE_NAME = 'history';

const getDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

const saveHistoryIDB = async (history: HistoryItem[]) => {
  try {
    const db = await getDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(history, 'history_v2');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("IDB save error:", err);
  }
};

const loadHistoryIDB = async (): Promise<HistoryItem[] | null> => {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get('history_v2');
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("IDB load error:", err);
    return null;
  }
};
// -------------------------

const LOCALIZED_STRINGS: Record<string, Record<string, string>> = {
  en: {
    title: "TTS Studio Pro",
    sceneNameLabel: "Scene Name",
    scenePlaceholder: "e.g. Commercial Voiceover",
    globalContextLabel: "Global Context & Emotion",
    globalContextPlaceholder: "Describe the mood, pacing, and intended audience...",
    masterAudioLabel: "Master Audio",
    globalSpeedLabel: "Global Speed",
    globalPitchLabel: "Global Pitch",
    scriptEditorLabel: "Script Editor",
    addTrackButton: "Add Track",
    addDialogueButton: "Add Dialogue Track",
    projectHistoryLabel: "Project History",
    historyTab: "History",
    noRendersLabel: "No renders yet",
    noRendersSubLabel: "Generated audio tracks will be saved here automatically.",
    exportMixButton: "Export Mix",
    restoreButton: "Restore",
    dialoguePlaceholder: "Type the dialogue or narration here... Use [brackets] for directions.",
    projectHistorySaves: "saves",
    masterOut: "Master Out",
    wavSpecs: "WAV • 44.1kHz",
    rateLimitToast: "Rate limit reached. Please wait a moment before trying again.",
    failureToast: "Synthesis failed. Please verify configurations and try again.",
    successToast: "✓ Speech synthesized and played successfully!",
    synthesizingToast: "Synthesizing speech sequence...",
    emptyToast: "Please enter text for at least one speech block.",
    loadedToast: "Loaded project from history.",
    deleteTrack: "Delete Track",
    aiRewrite: "AI Rewrite",
    autoRewrite: "Auto Rewrite",
    playMaster: "Play Master",
    downloadWav: "Download WAV",
    rewritingToast: "Rewriting dialogue with AI...",
    rewrittenToast: "Dialogue rewritten successfully!",
    rewriteFailedToast: "Failed to rewrite dialogue.",
    downloadStartedToast: "Download started.",
    noAudioToast: "No rendered audio to export yet.",
    playingLabel: "PLAYING",
    today: "Today",
    thisWeek: "This Week",
    older: "Older",
  },
  ti: {
    title: "ቲቲኤስ ስቱድዮ ፕሮ",
    sceneNameLabel: "ስም ድርሰት",
    scenePlaceholder: "ንኣብነት: ንግዳዊ ድምጺ",
    globalContextLabel: "ዓለማዊ ኩነታትን ስምዒትን",
    globalContextPlaceholder: "ስምዒት፣ ቅልጣፈን ተደላዪ ሰማዕታትን ግለጽ...",
    masterAudioLabel: "ዋና ድምጺ",
    globalSpeedLabel: "ዓለማዊ ፍጥነት",
    globalPitchLabel: "ዓለማዊ ቃና",
    scriptEditorLabel: "ጽሑፍ ኣርታዒ",
    addTrackButton: "መስመር ወስኽ",
    addDialogueButton: "ናይ ዘተ መስመር ወስኽ",
    projectHistoryLabel: "ታሪኽ ፕሮጀክት",
    historyTab: "ታሪኽ",
    noRendersLabel: "ዝተሰርሐ ድምጺ የለን",
    noRendersSubLabel: "ዝተዳለዉ ናይ ድምጺ ፋይላት ኣብዚ ብኣውቶማቲክ ክዕቀቡ እዮም።",
    exportMixButton: "ውጽኢት ፍጠር",
    restoreButton: "መልስ",
    dialoguePlaceholder: "ዘተ ወይ ጽሑፍ ኣብዚ ጸሓፍ... ንምምልካት [ሓጹር] ተጠቐም።",
    projectHistorySaves: "ዝተዓቀቡ",
    masterOut: "ዋና ውጽኢት",
    wavSpecs: "WAV • 44.1kHz",
    rateLimitToast: "ዓቐን ተበጺሑ። በጃኹም ቁሩብ ተጸቢኹም ደግምኩም ፈትኑ።",
    failureToast: "ድምጺ ምፍጣር ኣይተዓወተን። በጃኹም ቅጥዕታት ኣረጋጊጽኩም ደጊምኩም ፈትኑ።",
    successToast: "✓ ድምጺ ብዓወት ተፈጢሩን ተጻዊቱን!",
    synthesizingToast: "ድምጺ ንምፍጣር ይስራሕ ኣሎ...",
    emptyToast: "በጃኹም እንተወሓደ ኣብ ሓደ መስመር ጽሑፍ የእትዉ።",
    loadedToast: "ካብ ታሪኽ ተጻዒኑ ኣሎ።",
    deleteTrack: "መስመር ሰርዝ",
    aiRewrite: "ብኣይ መስተኻኸሊ",
    autoRewrite: "ባዕላዊ መስተኻኸሊ",
    playMaster: "ዋና ድምጺ ስማዕ",
    downloadWav: "WAV ኣውርድ",
    rewritingToast: "ብኣይ ጽሑፍ ይስተኻኸል ኣሎ...",
    rewrittenToast: "ጽሑፍ ብዓወት ተስተኻኺሉ!",
    rewriteFailedToast: "ጽሑፍ ክስተኻኸል ኣይከኣለን።",
    downloadStartedToast: "ምውራድ ጀሚሩ ኣሎ።",
    noAudioToast: "ዝተሰርሐ ድምጺ የለን።",
    playingLabel: "ይጻወት ኣሎ",
    today: "ሎሚ",
    thisWeek: "ሎሚ ቅነ",
    older: "ቀደምት",
  },
  am: {
    title: "ቲቲኤስ ስቱዲዮ ፕሮ",
    sceneNameLabel: "የዕይታ ስም",
    scenePlaceholder: "ለምሳሌ: የንግድ ማስታወቂያ ትረካ",
    globalContextLabel: "አጠቃላይ ይዘትና ስሜት",
    globalContextPlaceholder: "ስሜቱን፣ ፍጥነቱን እና የታለመውን ታዳሚ ይግለጹ...",
    masterAudioLabel: "ዋና ኦዲዮ",
    globalSpeedLabel: "አጠቃላይ ፍጥነት",
    globalPitchLabel: "አጠቃላይ ድምፅ ቃና",
    scriptEditorLabel: "የስክሪፕት አርታዒ",
    addTrackButton: "መስመር ጨምር",
    addDialogueButton: "የንግግር መስመር ጨምር",
    projectHistoryLabel: "የፕሮጀክት ታሪክ",
    historyTab: "ታሪክ",
    noRendersLabel: "እስካሁን የተሰራ ድምፅ የለም",
    noRendersSubLabel: "የተፈጠሩ የድምፅ ፋይሎች እዚህ በራስ-ሰር ይቀመጣሉ።",
    exportMixButton: "ድምፅ አውጣ",
    restoreButton: "መልስ",
    dialoguePlaceholder: "ውይይቱን ወይም ትረካውን እዚህ ይጻፉ... ለመመሪያ [ቅንፍ] ይጠቀሙ።",
    projectHistorySaves: "የተቀመጡ",
    masterOut: "ዋና ውጽኢት",
    wavSpecs: "WAV • 44.1kHz",
    rateLimitToast: "ገደብ ላይ ደርሷል። እባክዎን ጥቂት ቆይተው እንደገና ይሞክሩ።",
    failureToast: "ድምፅ ማቀናጀቱ አልተሳካም። እባክዎን ውቅሮቹን አረጋግጠው እንደገና ይሞክሩ።",
    successToast: "✓ ድምፅ በተሳካ ሁኔታ ተፈጥሮ ተጫውቷል!",
    synthesizingToast: "ድምፅ በመዘጋጀት ላይ ነው...",
    emptyToast: "እባክዎን ቢያንስ በአንድ መስመር ላይ ጽሑፍ ያስገቡ።",
    loadedToast: "ከታሪክ ተጭኗል።",
    deleteTrack: "መስመር ሰርዝ",
    aiRewrite: "በአይ አሻሽል",
    autoRewrite: "ራስ-ሰር አሻሽል",
    playMaster: "ዋናውን አጫውት",
    downloadWav: "WAV አውርድ",
    rewritingToast: "በአይ ጽሑፍ በመስተካከል ላይ ነው...",
    rewrittenToast: "ጽሑፍ በተሳካ ሁኔታ ተስተካክሏል!",
    rewriteFailedToast: "ጽሑፍ ማስተካከል አልተሳካም።",
    downloadStartedToast: "ማውረድ ተጀምሯል።",
    noAudioToast: "የተዘጋጀ ድምፅ የለም።",
    playingLabel: "እየተጫወተ ነው",
    today: "ዛሬ",
    thisWeek: "በዚህ ሳምንት",
    older: "ቀደም ያሉ",
  },
  gez: {
    title: "ቲቲኤስ ስቱድዮ ፕሮ",
    sceneNameLabel: "ስመ ድርሰት",
    scenePlaceholder: "በአምሳል: ንግዳዊ ቃል",
    globalContextLabel: "ኵለንታዊ ኵነት ወስምዒት",
    globalContextPlaceholder: "ስምዒት፣ ቅልጣፌ ወሰማዕያን ግለጽ...",
    masterAudioLabel: "ዋና ቃል",
    globalSpeedLabel: "ኵለንታዊ ፍጥነት",
    globalPitchLabel: "ኵለንታዊ ቃና",
    scriptEditorLabel: "ጽሕፈተ አርታዒ",
    addTrackButton: "ድርሳን ወስክ",
    addDialogueButton: "ናይ ዘተ ድርሳን ወስክ",
    projectHistoryLabel: "ታሪኽ ፕሮጀክት",
    historyTab: "ታሪኽ",
    noRendersLabel: "ዘተገብረ ቃለ ዘይኮነ",
    noRendersSubLabel: "ዘተገብረ ቃላት ኣብዚ ብኣውቶማቲክ ክዕቀቡ እዮም።",
    exportMixButton: "ውጽኢተ ፍጥር",
    restoreButton: "መልስ",
    dialoguePlaceholder: "ዘተ አው ጽሕፈተ ዝየ ጸሓፍ... ንምልከት [ሐጹር] ተጠቀሙ።",
    projectHistorySaves: "ዝተዓቀቡ",
    masterOut: "ዋና ውጽኢት",
    wavSpecs: "WAV • 44.1kHz",
    rateLimitToast: "ዐቅን ተበጽሐ። ንስቲተ ተጸቢየከ ድጋሜ ፈትን።",
    failureToast: "ምፍጣር ቃል ኢተከህነ። ስርዐታተ አረጋጊጸከ ድጋሜ ፈትን።",
    successToast: "✓ ቃል በሰላም ተፈጥረ ወተሰምዓ!",
    synthesizingToast: "ቃል ንምፍጣር ይትገበር ሀሎ...",
    emptyToast: "በእንተ እግዚአብሔር አሐደ ጽሕፈተ አእትው።",
    loadedToast: "እምታሪኽ ተጻዒኑ ሀሎ።",
    deleteTrack: "ድርሳን ሰርዝ",
    aiRewrite: "በአይ አርታዒ",
    autoRewrite: "ባዕላዊ አርታዒ",
    playMaster: "ዋና ቃል ስማዕ",
    downloadWav: "WAV አውርድ",
    rewritingToast: "ብኣይ ጽሕፈት ይስተኻኸል ሀሎ...",
    rewrittenToast: "ጽሕፈት በሰላም ተስተካከለ!",
    rewriteFailedToast: "ጽሕፈት ክስተኻኸል ኢተከህነ።",
    downloadStartedToast: "ምውራድ ጀሚሩ ሀሎ።",
    noAudioToast: "ዘተገብረ ቃል የልቦ።",
    playingLabel: "ይጻወት ሀሎ",
    today: "ዮም",
    thisWeek: "በዝ ሰሙን",
    older: "ቀዲሙ",
  }
};

const INITIAL_DEFAULTS: Record<string, { scene: string; context: string; text: string; defaultSpeaker?: string }> = {
  en: {
    scene: 'The Sound Stage Booth.',
    context: 'Premium commercial. Dynamic pacing—starts intrigued, ends punchy. Tone is polished, persuasive, and inviting.',
    text: "[intrigue] You don't just want a car. [desire] You want a sanctuary. [information] Introducing the all-new Aetheris Sedan. With whisper-quiet cabin technology and an interior designed around you. [inspiration] It's not just about getting to your destination. It's about arriving inspired. [confident] Aetheris. Move beautifully."
  },
  ti: {
    scene: 'ናይ ድምጺ መቅረጺ ክፍሊ።',
    context: 'ሉዑል ጽሬት ዘለዎ ንግዳዊ ምልክታ። ንጡፍ ፍጥነት—ብምድናቕ ይጅምር፣ ብሓያል መደምደምታ ይውድእ። ቃናኡ ብሱል፣ መእመንን ተፈታትን እዩ።',
    text: "[intrigue] መኪና ጥራይ ኣይኮነን ትደሊ ዘለኻ። [desire] ሰላማዊ መዕረፊ ኢኻ ትደሊ። [information] ነታ ሓዳስ ኤተሪስ ሰዳን ነላልየልኩም። ብዘይ ድምጺ ዝንቀሳቐስ ቴክኖሎጅን ፍሉይ ውሽጣዊ ዲዛይንን ዝሓዘት። [inspiration] ናብ ዝደለኻዮ ቦታ ምብጻሕ ጥራይ ኣይኮነን። ተደፋፊእካን ተንኪፍካን ምብጻሕ እዩ። [confident] ኤተሪስ። ብጽባቐ ተንቀሳቐስ።",
    defaultSpeaker: 'Selam (Traditional Female)'
  },
  am: {
    scene: 'የድምፅ መቅረጫ ክፍል ።',
    context: 'ከፍተኛ ጥራት ያለው የንግድ ማስታወቂያ። ተለዋዋጭ ፍጥነት—በመገረም ይጀምራል፣ በጠንካራ መደምደሚያ ያበቃል። ቃናው የጎላ፣ አሳማኝ እና ማራኪ ነው።',
    text: "[intrigue] መኪና ብቻ አይደለም የምትፈልገው። [desire] ሰላማዊ ማረፊያ ነው የምትፈልገው። [information] አዲሷን ኤተሪስ ሰዳን እናስተዋውቅዎ። ድምፅ አልባ የካቢን ቴክኖሎጂ እና ለርስዎ ተብሎ የተሰራ ውበት ያለው። [inspiration] ወደፈለጉበት ቦታ መድረስ ብቻ አይደለም። ተነሳስተውና ረክተው መድረስ ነው። [confident] ኤተሪስ። በውበት ይጓዙ።"
  },
  gez: {
    scene: 'ቤት ማኅደረ ቃል ።',
    context: 'ክቡር ንግዳዊ ቃል ። ቅልጡፍ ፍጥነት—በትዕምርት ይጅምር፣ በጽኑዕ መደምደሚያ ይፌጽም። ቃናኡ ጽኑዕ፣ መእመን ወጽቡቕ ውእቱ።',
    text: "[intrigue] መኪና ባሕቲቶ ኢኮነ ዘትፈቅድ። [desire] ማኅደረ ሰላም ውእቱ ዘትፈቅድ። [information] ኤተሪስ ሐዳስ ነላልየክሙ። ዘእንበለ ቃል ዘይንቀሳቀስ ቴክኖሎጂ ወውድቅ ውሽጥ ዘለዎ። [inspiration] ኀበ ዘፈቀድከ ቦታ ምብጻሕ ባሕቲቶ ኢኮነ። ተንሢእከ ወተንኪፍከ ምብጻሕ ውእቱ። [confident] ኤተሪስ። በስን ተንቀሳቀስ።"
  }
};

const TIGRINYA_VOICES = [
  {
    id: 'selam_traditional_female',
    name: 'Selam (Traditional Female)',
    baseVoice: 'Kore',
    description: 'Traditional Ge\'ez cadence, calm and steady female voice.',
    systemPrompt: "You are a native Tigrinya speaker named Selam with a traditional Ge'ez cadence. Speak clearly and maintain a steady, rhythmic flow typical of classical Ge'ez recitation. Ensure all glottal stops and ejectives (like ቀ, ጠ, ጸ) are pronounced with native precision. Your tone is calm, wise, and authoritative."
  },
  {
    id: 'senait_young_female',
    name: 'Senait (Young Female 20s)',
    baseVoice: 'Aoede',
    description: 'Energetic, vibrant, and modern young female voice.',
    systemPrompt: "You are a native Tigrinya speaker named Senait in her early 20s. Your voice is energetic, vibrant, and modern. Speak with the casual cadence of an urban youth. Your pronunciation is sharp and clear, reflecting a contemporary lifestyle. Use a friendly, high-energy tone."
  },
  {
    id: 'robel_young_male',
    name: 'Robel (Young Male 20s)',
    baseVoice: 'Puck',
    description: 'Lively, tech-savvy, and energetic young male voice.',
    systemPrompt: "You are a native Tigrinya speaker named Robel in his mid-20s. You sound cool, tech-savvy, and energetic. Your tone is dynamic and youthful, like a modern video creator or podcast presenter."
  },
  {
    id: 'aman_formal_male',
    name: 'Aman (Formal News Anchor)',
    baseVoice: 'Charon',
    description: 'Professional, formal, and authoritative news anchor.',
    systemPrompt: "You are a professional Tigrinya news anchor named Aman. Your tone is formal, serious, and highly authoritative. Speak with clear articulation and professional pacing. Focus on perfect Tigrinya grammar and pronunciation."
  },
  {
    id: 'kidane_traditional_male',
    name: 'Kidane (Traditional Ge\'ez Scholar)',
    baseVoice: 'Fenrir',
    description: 'Deep, traditional Ge\'ez orator and scholar male voice.',
    systemPrompt: "You are a traditional Tigrinya scholar and elder named Kidane. Speak with classical Ge'ez cadence, deep resonant tones, and deliberate rhythmic pacing."
  },
  {
    id: 'yohannes_storyteller',
    name: 'Yohannes (Narrator & Storyteller)',
    baseVoice: 'Orus',
    description: 'Warm, expressive narrator for videos and audiobooks.',
    systemPrompt: "You are a master storyteller named Yohannes. Your voice is rich, warm, and highly expressive, ideal for documentary narration, Audiobooks, and YouTube storytelling."
  }
];

const SPEAKERS = [
  'Speaker 1 - Orus',
  'Speaker 2 - Kore',
  'Speaker 3 - Aoede',
  'Speaker 4 - Charon',
  'Speaker 5 - Puck',
  'Speaker 6 - Fenrir',
  ...TIGRINYA_VOICES.map(v => v.name)
];

export const TtsStudioModal: React.FC<TtsStudioModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  showToast,
  activeLanguage = 'ti',
  initialBlocks,
  initialScene,
  initialContext
}) => {
  const lang = activeLanguage === 'en' || activeLanguage === 'ti' || activeLanguage === 'am' || activeLanguage === 'gez' ? activeLanguage : 'ti';
  const t = LOCALIZED_STRINGS[lang] || LOCALIZED_STRINGS.en;

  const [scene, setScene] = useState('');
  const [context, setContext] = useState('');
  const [globalSpeed, setGlobalSpeed] = useState(1.0);
  const [globalPitch, setGlobalPitch] = useState(0);
  const [speechBlocks, setSpeechBlocks] = useState<SpeechBlock[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  // States for Smart Script Import
  const [showSmartImport, setShowSmartImport] = useState(false);
  const [rawScriptInput, setRawScriptInput] = useState('');
  const [isSmartImporting, setIsSmartImporting] = useState(false);
  const [showSettings, setShowSettings] = useState(true);

  useEffect(() => {
    if (isOpen) {
      if (window.innerWidth < 1024) {
        setShowSettings(false);
      } else {
        setShowSettings(true);
      }
    }
  }, [isOpen]);

  // Initialize and synchronize with active language defaults when unchanged, OR load from initial props
  const prevLangRef = useRef<string>('');
  useEffect(() => {
    if (isOpen) {
      if (initialBlocks && initialBlocks.length > 0) {
        setSpeechBlocks(initialBlocks);
        if (initialScene) setScene(initialScene);
        if (initialContext) setContext(initialContext);
      } else if (prevLangRef.current !== lang) {
        const defaults = INITIAL_DEFAULTS[lang] || INITIAL_DEFAULTS.en;
        setScene(defaults.scene);
        setContext(defaults.context);
        setSpeechBlocks([
          {
            id: '1',
            speaker: (defaults as any).defaultSpeaker || 'Speaker 1 - Orus',
            text: defaults.text
          }
        ]);
        prevLangRef.current = lang;
      }
    }
  }, [isOpen, lang, initialBlocks, initialScene, initialContext]);
  const [generatedAudioBlocks, setGeneratedAudioBlocks] = useState<Record<string, string>>({});
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [activeRewriteDropdown, setActiveRewriteDropdown] = useState<string | null>(null);
  const [rewritingBlocks, setRewritingBlocks] = useState<Record<string, boolean>>({});
  const [playingHistoryId, setPlayingHistoryId] = useState<string | null>(null);
  const playingHistoryIdRef = useRef<string | null>(null);
  const isPlayingMainRef = useRef<boolean>(false);
  const [currentBlockId, setCurrentBlockId] = useState<string | null>(null);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Calculate total duration and individual block offsets/durations
  const blockDurations = useMemo(() => {
    return speechBlocks.map(block => {
      const base64 = generatedAudioBlocks[block.id];
      if (base64) {
        return base64.length / 48000;
      }
      return Math.max(1.5, block.text.trim().length * 0.08);
    });
  }, [speechBlocks, generatedAudioBlocks]);

  const totalDuration = useMemo(() => {
    return blockDurations.reduce((acc, curr) => acc + curr, 0);
  }, [blockDurations]);

  const blockOffsets = useMemo(() => {
    const offsets: number[] = [];
    let currentOffset = 0;
    for (let i = 0; i < blockDurations.length; i++) {
      offsets.push(currentOffset);
      currentOffset += blockDurations[i];
    }
    return offsets;
  }, [blockDurations]);

  const timelineTicks = useMemo(() => {
    const ticks = [];
    const interval = totalDuration > 60 ? 10 : totalDuration > 30 ? 5 : totalDuration > 15 ? 2 : 1;
    const count = Math.floor(totalDuration / interval);
    for (let i = 0; i <= count; i++) {
      ticks.push(i * interval);
    }
    if (ticks[ticks.length - 1] !== totalDuration && totalDuration > 0) {
      ticks.push(totalDuration);
    }
    return ticks;
  }, [totalDuration]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  const REWRITE_TONES = [
    { 
      id: 'intrigue', 
      label: lang === 'ti' ? 'ኣንቃሒ (Intriguing)' : lang === 'am' ? 'አጓጊ (Intriguing)' : lang === 'gez' ? 'አንቃሒ' : 'Intriguing', 
      prompt: 'Make it sound mysterious, deep, and intriguing.' 
    },
    { 
      id: 'desire', 
      label: lang === 'ti' ? 'ተደላዪ (Desirable)' : lang === 'am' ? 'ተፈላጊ (Desirable)' : lang === 'gez' ? 'ፍትው' : 'Desirable', 
      prompt: 'Make it sound alluring, desirable, and captivating.' 
    },
    { 
      id: 'inspiration', 
      label: lang === 'ti' ? 'መተንፈሲ (Inspirational)' : lang === 'am' ? 'አነቃቂ (Inspirational)' : lang === 'gez' ? 'መንፈሳዊ' : 'Inspirational', 
      prompt: 'Make it sound uplifting, motivational, and inspirational.' 
    },
    { 
      id: 'confident', 
      label: lang === 'ti' ? 'ተኣማኒ (Confident)' : lang === 'am' ? 'በራስ መተማመን (Confident)' : lang === 'gez' ? 'ጽኑዕ' : 'Confident', 
      prompt: 'Make it sound authoritative, bold, and highly confident.' 
    },
    { 
      id: 'casual', 
      label: lang === 'ti' ? 'ልሙድ (Casual)' : lang === 'am' ? 'ቀለል ያለ (Casual)' : lang === 'gez' ? 'ንቡር' : 'Casual', 
      prompt: 'Make it sound relaxed, conversational, and friendly.' 
    },
    { 
      id: 'urgent', 
      label: lang === 'ti' ? 'ህጹጽ (Urgent)' : lang === 'am' ? 'አስቸኳይ (Urgent)' : lang === 'gez' ? 'ህጹጽ' : 'Urgent', 
      prompt: 'Make it sound urgent, fast-paced, and important.' 
    },
    { 
      id: 'dramatic', 
      label: lang === 'ti' ? 'ተውሳኽ (Dramatic)' : lang === 'am' ? 'ተውኔታዊ (Dramatic)' : lang === 'gez' ? 'ዕፁብ' : 'Dramatic', 
      prompt: 'Make it sound theatrical, intense, and dramatic.' 
    },
  ];

  const handleRewriteBlock = async (blockId: string, currentText: string, tonePrompt?: string) => {
    if (!currentText.trim() || rewritingBlocks[blockId]) return;
    setActiveRewriteDropdown(null);
    
    setRewritingBlocks(prev => ({ ...prev, [blockId]: true }));
    try {
      showToast(t.rewritingToast);
      let instruction = `Rewrite this text to be more engaging and natural for a voiceover in the exact same language (Tigrinya, Amharic, Ge'ez, or English) as the input text. Preserve or adjust any bracketed emotional direction placeholders like [intrigue] or [desire] properly. Consider the global context: ${context}`;
      if (tonePrompt) {
        instruction = `${tonePrompt} Make it natural for a voiceover script in the exact same language (Tigrinya, Amharic, Ge'ez, or English) as the input. Preserve or adjust any bracketed emotional directions correctly. Consider the global context: ${context}`;
      }
      const rewritten = await refineText(
        currentText, 
        instruction
      );
      if (rewritten) {
        updateBlockText(blockId, rewritten);
        showToast(t.rewrittenToast);
      }
    } catch (err) {
      console.error(err);
      showToast(t.rewriteFailedToast);
    } finally {
      setRewritingBlocks(prev => ({ ...prev, [blockId]: false }));
    }
  };

  const handleSmartImport = async () => {
    if (!rawScriptInput.trim()) return;
    setIsSmartImporting(true);
    try {
      showToast(lang === 'ti' ? 'ስክሪፕት ይንበብን ይዳለን ኣሎ...' : lang === 'am' ? 'ስክሪፕት እየተነበበና እየተዘጋጀ ነው...' : 'Analyzing and parsing your custom script...');
      
      const prompt = `You are an elite AI Voiceover Architect specializing in high-retention faceless video production.
Given a raw script/text, intelligently analyze, parse, and partition it into a structured, highly engaging, natural-flowing timeline of speech tracks for advanced text-to-speech synthesis.

Valid Speakers to assign:
${SPEAKERS.map(s => `- "${s}"`).join('\n')}

Rules for Maximum Engagement (Faceless Video Optimized):
1. **Pacing & Retention**: Divide the script into punchy, logical blocks (roughly one sentence or coherent phrase per block). This creates dynamic pacing essential for modern faceless videos and shorts.
2. **Intelligent Casting**: Autonomously choose the most fitting speakers. If dialogue cues exist, map them perfectly. If it's a monologue, intelligently alternate between contrasting voices (e.g., Orus for authoritative hooks, Selam for empathetic details) to maximize audience retention.
3. **Emotional Intelligence**: If the user provided emotional cues (e.g., "[intrigue]"), preserve them. If they didn't, YOU MUST AUTONOMOUSLY ADD appropriate emotional/tonal cues in brackets at the start of the text (e.g., "[hook]", "[curiosity]", "[confident]", "[whisper]", "[casual]") based on the context of the sentence.
4. **Bilingual Mastery**: Keep the actual spoken text 100% in the exact original language of the input script (Tigrinya, Amharic, or English). Only the speaker names and bracketed emotional cues should be in English.
5. **Strict JSON Output**: Output format must be a STRICTLY valid JSON array of objects.

Example JSON output structure:
[
  {
    "id": "1",
    "speaker": "Speaker 1 - Orus",
    "text": "[intrigue] Welcome to the mystery of the deep sea."
  },
  {
    "id": "2",
    "speaker": "Speaker 7 - Selam",
    "text": "[desire] Let us explore together."
  }
]

Do NOT return any explanation, code fences, markdown blocks, or extra words. Return ONLY the strict, parseable JSON array.

Raw Script Text:
"""
${rawScriptInput}
"""`;

      const contents = [{ role: 'user', parts: [{ text: prompt }] }];
      const response = await callGeminiAPI('gemini-3.1-pro-preview', contents, { aiModelMode: 'thinking' });
      
      if (response && response.text) {
        let cleanText = response.text.trim();
        // Strip markdown backticks if any
        if (cleanText.startsWith('```json')) {
          cleanText = cleanText.substring(7);
        }
        if (cleanText.startsWith('```')) {
          cleanText = cleanText.substring(3);
        }
        if (cleanText.endsWith('```')) {
          cleanText = cleanText.substring(0, cleanText.length - 3);
        }
        cleanText = cleanText.trim();

        const parsedBlocks = JSON.parse(cleanText);
        if (Array.isArray(parsedBlocks) && parsedBlocks.length > 0) {
          const finalBlocks = parsedBlocks.map((b, i) => ({
            id: b.id || `import_${Date.now()}_${i}`,
            speaker: b.speaker || 'Speaker 1 - Orus',
            text: b.text || ''
          }));
          setSpeechBlocks(finalBlocks);
          setRawScriptInput('');
          setShowSmartImport(false);
          showToast(lang === 'ti' ? 'ስክሪፕት ብዓወት ተሰሪዑ!' : lang === 'am' ? 'ስክሪፕት በተሳካ ሁኔታ ተዘጋጅቷል!' : '✓ Custom script imported and structured successfully!');
        } else {
          throw new Error("Invalid block array format");
        }
      } else {
        throw new Error("Empty response from AI");
      }
    } catch (err) {
      console.error("Smart import failed:", err);
      // Fallback: Split by sentences/paragraphs manually
      const paragraphs = rawScriptInput.split(/\n+/).filter(p => p.trim());
      const fallbackBlocks = paragraphs.map((p, idx) => ({
        id: `fb_${Date.now()}_${idx}`,
        speaker: 'Speaker 1 - Orus',
        text: p.trim()
      }));
      setSpeechBlocks(fallbackBlocks);
      setRawScriptInput('');
      setShowSmartImport(false);
      showToast(lang === 'ti' ? 'ስክሪፕት ብዝርዝር ተመቒሉ!' : lang === 'am' ? 'ስክሪፕት በዝርዝር ተከፋፍሏል!' : 'Imported script split by paragraphs (AI format fallback).');
    } finally {
      setIsSmartImporting(false);
    }
  };
  
  const [showHistory, setShowHistory] = useState(false);
  const [showVoiceGallery, setShowVoiceGallery] = useState(false);
  const [playingGalleryVoice, setPlayingGalleryVoice] = useState<string | null>(null);

  const handlePlayGallerySample = async (voiceName: string, sampleText: string, gender: 'female' | 'male') => {
    if (playingGalleryVoice === voiceName) {
      stopAllAudio();
      setPlayingGalleryVoice(null);
      return;
    }

    setPlayingGalleryVoice(voiceName);
    try {
      const tigVoice = TIGRINYA_VOICES.find(
        v => v.name.toLowerCase().includes(voiceName.toLowerCase()) || v.id.toLowerCase().includes(voiceName.toLowerCase())
      );
      const baseVoice = tigVoice ? tigVoice.baseVoice : (gender === 'female' ? 'Kore' : 'Puck');
      const systemInstruction = tigVoice ? tigVoice.systemPrompt : undefined;

      const cacheKey = `tts_sample_cache_${baseVoice}_${sampleText}`;
      let audioBase64: string | null = null;
      try {
        audioBase64 = localStorage.getItem(cacheKey);
      } catch {}

      if (!audioBase64) {
        audioBase64 = await generateTTS(sampleText, baseVoice, 'gemini-3.1-flash-tts-preview', systemInstruction);
        if (audioBase64) {
          try {
            localStorage.setItem(cacheKey, audioBase64);
          } catch (e) {
            console.warn("Could not cache gallery sample in localStorage:", e);
          }
        }
      } else {
        console.log("Playing cached gallery sample from local storage:", baseVoice);
      }

      if (audioBase64) {
        await playBase64Audio(audioBase64, 24000);
      } else {
        throw new Error("No audio returned");
      }
    } catch (err: any) {
      console.warn("Gallery sample fallback to web speech:", err);
      showToast("TTS quota reached. Playing voice with web speech fallback...");
      await speakWithWebSpeech(sampleText, 'ti');
    } finally {
      setPlayingGalleryVoice(null);
    }
  };
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  const groupedHistory = useMemo(() => {
    const today: HistoryItem[] = [];
    const thisWeek: HistoryItem[] = [];
    const older: HistoryItem[] = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfThisWeek = startOfToday - 6 * 24 * 60 * 60 * 1000;

    history.forEach(item => {
      if (item.timestamp >= startOfToday) {
        today.push(item);
      } else if (item.timestamp >= startOfThisWeek) {
        thisWeek.push(item);
      } else {
        older.push(item);
      }
    });

    return { today, thisWeek, older };
  }, [history]);

  const isHistoryLoaded = useRef(false);

  useEffect(() => {
    const load = async () => {
      const data = await loadHistoryIDB();
      if (data && data.length > 0) {
        setHistory(data);
      } else {
        try {
          const saved = localStorage.getItem('tts_studio_history_v2');
          if (saved) {
            setHistory(JSON.parse(saved));
          }
        } catch {}
      }
      isHistoryLoaded.current = true;
    };
    load();
  }, []);

  useEffect(() => {
    if (isHistoryLoaded.current) {
      saveHistoryIDB(history).catch(console.error);
    }
  }, [history]);

  // The AI Studio colors
  const bgColor = currentTheme.isDark ? 'bg-[#0f0f12]' : 'bg-white';
  const modalBgColor = currentTheme.isDark ? 'bg-white text-slate-900' : 'bg-white text-slate-900'; 
  const isDark = currentTheme.isDark;
  const accent = currentTheme.accent || 'indigo-500';

  // Helper functions to safely map theme accents to exact Tailwind classes
  const getAccentText = () => {
    if (accent === 'indigo-600') return 'text-indigo-600 dark:text-indigo-400';
    if (accent === 'slate-400') return 'text-slate-500 dark:text-slate-400';
    return 'text-indigo-500 dark:text-indigo-400';
  };

  const getAccentTextOnly = () => {
    if (accent === 'indigo-600') return 'text-indigo-600';
    if (accent === 'slate-400') return 'text-slate-400';
    return 'text-indigo-500';
  };

  const getAccentBg = () => {
    if (accent === 'indigo-600') return 'bg-indigo-600';
    if (accent === 'slate-400') return 'bg-slate-500 dark:bg-slate-400';
    return 'bg-indigo-500';
  };

  const getAccentBg10 = () => {
    if (accent === 'indigo-600') return 'bg-indigo-600/10';
    if (accent === 'slate-400') return 'bg-slate-400/10';
    return 'bg-indigo-500/10';
  };

  const getAccentBg5 = () => {
    if (accent === 'indigo-600') return 'bg-indigo-600/5';
    if (accent === 'slate-400') return 'bg-slate-400/5';
    return 'bg-indigo-500/5';
  };

  const getAccentBg20 = () => {
    if (accent === 'indigo-600') return 'bg-indigo-600/20';
    if (accent === 'slate-400') return 'bg-slate-400/20';
    return 'bg-indigo-500/20';
  };

  const getAccentBg25 = () => {
    if (accent === 'indigo-600') return 'bg-indigo-600/25';
    if (accent === 'slate-400') return 'bg-slate-400/25';
    return 'bg-indigo-500/25';
  };

  const getAccentBg35 = () => {
    if (accent === 'indigo-600') return 'bg-indigo-600/35';
    if (accent === 'slate-400') return 'bg-slate-400/35';
    return 'bg-indigo-500/35';
  };

  const getAccentBorder = () => {
    if (accent === 'indigo-600') return 'border-indigo-600/30';
    if (accent === 'slate-400') return 'border-slate-400/30';
    return 'border-indigo-500/30';
  };

  const getAccentBorderSolid = () => {
    if (accent === 'indigo-600') return 'border-indigo-600';
    if (accent === 'slate-400') return 'border-slate-400';
    return 'border-indigo-500';
  };

  const getAccentFocus = () => {
    if (accent === 'indigo-600') return 'focus:border-indigo-600';
    if (accent === 'slate-400') return 'focus:border-slate-400';
    return 'focus:border-indigo-500';
  };

  const getAccentRingShadow = () => {
    if (accent === 'indigo-600') return 'border-indigo-600 bg-indigo-600/[0.03] ring-1 ring-indigo-600/20 shadow-[0_0_15px_rgba(79,70,229,0.15)]';
    if (accent === 'slate-400') return 'border-slate-400 bg-slate-400/[0.03] ring-1 ring-slate-400/20 shadow-[0_0_15px_rgba(148,163,184,0.15)]';
    return 'border-indigo-500 bg-indigo-500/[0.03] ring-1 ring-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]';
  };

  const getAccentHoverBorder = () => {
    if (accent === 'indigo-600') return 'hover:border-indigo-600';
    if (accent === 'slate-400') return 'hover:border-slate-400';
    return 'hover:border-indigo-500';
  };

  const getAccentHoverBorder300 = () => {
    if (accent === 'indigo-600') return 'hover:border-indigo-600';
    if (accent === 'slate-400') return 'hover:border-slate-400';
    return 'hover:border-indigo-300';
  };

  const getAccentAccentClass = () => {
    if (accent === 'indigo-600') return 'accent-indigo-600';
    if (accent === 'slate-400') return 'accent-slate-400';
    return 'accent-indigo-500';
  };

  const getAccentThemeColor = () => {
    if (accent === 'indigo-600') return 'bg-indigo-600 hover:bg-indigo-500';
    if (accent === 'slate-400') return 'bg-slate-500 hover:bg-slate-400';
    return 'bg-indigo-600 hover:bg-indigo-500';
  };

  const handleRun = useCallback(async () => {
    if (speechBlocks.length === 0 || !speechBlocks[0].text.trim()) {
      showToast(t.emptyToast);
      return;
    }
    if (isGenerating) return;

    setIsGenerating(true);
    setProgress(0);
    setCurrentTime(0);
    setCurrentBlockId(null);
    setCurrentlyPlayingId(null);
    showToast(t.synthesizingToast);
    isPlayingMainRef.current = true;

    try {
      const newAudioBlocks = { ...generatedAudioBlocks };
      for (let i = 0; i < speechBlocks.length; i++) {
        if (!isPlayingMainRef.current) break;
        const block = speechBlocks[i];
        const cleanText = block.text.replace(/\[.*?\]/g, '').trim() || block.text;
        
        // Find voice and system prompt for speaker
        const tigVoice = TIGRINYA_VOICES.find(v => v.name === block.speaker || v.id === block.speaker);
        let speakerName = 'Kore';
        let systemInstruction: string | undefined = undefined;

        if (tigVoice) {
          speakerName = tigVoice.baseVoice;
          systemInstruction = tigVoice.systemPrompt;
        } else if (block.speaker) {
          const knownVoices = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Aoede', 'Zephyr', 'Orus'];
          const matched = knownVoices.find(v => block.speaker.toLowerCase().includes(v.toLowerCase()));
          if (matched) {
            speakerName = matched;
          } else {
            const parts = block.speaker.split(' - ');
            speakerName = parts[1] || parts[0] || 'Kore';
          }
        }
        
        let audioBase64 = newAudioBlocks[block.id];
        if (!audioBase64) {
          try {
            audioBase64 = await generateTTS(cleanText, speakerName, 'gemini-3.1-flash-tts-preview', systemInstruction, block.speed, block.pitch);
            if (audioBase64) {
              newAudioBlocks[block.id] = audioBase64;
            }
          } catch (ttsErr: any) {
            if (ttsErr.message === "QUOTA_EXCEEDED") {
              showToast("Gemini API Quota Exceeded. Please try again later.");
              setIsGenerating(false);
              return;
            }
            throw ttsErr;
          }
        }
        
        if (audioBase64) {
          if (!isPlayingMainRef.current) break;
          
          const blockDuration = audioBase64.length / 48000;
          const blockOffset = blockOffsets[i] || 0;
          
          setCurrentBlockId(block.id);
          setCurrentlyPlayingId(block.id);
          setIsPlaying(true);
          
          const playbackStartRealTime = performance.now();
          const timerInterval = setInterval(() => {
            const elapsed = (performance.now() - playbackStartRealTime) / 1000;
            const absoluteTime = Math.min(blockOffset + elapsed, blockOffset + blockDuration);
            setCurrentTime(absoluteTime);
            if (totalDuration > 0) {
              setProgress((absoluteTime / totalDuration) * 100);
            }
          }, 16);

          try {
            await playBase64Audio(audioBase64, 24000);
          } finally {
            clearInterval(timerInterval);
            setCurrentTime(blockOffset + blockDuration);
            if (totalDuration > 0) {
              setProgress(((blockOffset + blockDuration) / totalDuration) * 100);
            }
          }
          
          if (!isPlayingMainRef.current) {
            setIsPlaying(false);
            break;
          }
          setIsPlaying(false);
        }
      }
      setGeneratedAudioBlocks(newAudioBlocks);
      
      if (isPlayingMainRef.current) {
        const newHistoryItem: HistoryItem = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          scene,
          blocks: [...speechBlocks],
          audioBlocks: newAudioBlocks
        };
        setHistory(prev => [newHistoryItem, ...prev].slice(0, 20)); // Keep last 20
        showToast(t.successToast);
      }
    } catch (err) {
      console.error("Synthesis error:", err);
      if (err instanceof Error && err.message === 'QUOTA_EXCEEDED') {
        showToast(t.rateLimitToast);
      } else {
        showToast(t.failureToast);
      }
    } finally {
      setIsGenerating(false);
      setIsPlaying(false);
      isPlayingMainRef.current = false;
      setCurrentBlockId(null);
      setCurrentlyPlayingId(null);
      setCurrentTime(0);
      setProgress(0);
    }
  }, [speechBlocks, generatedAudioBlocks, isGenerating, showToast, scene, t, blockOffsets, totalDuration]);

  const stopMainAudio = () => {
    isPlayingMainRef.current = false;
    setIsPlaying(false);
    setCurrentBlockId(null);
    setCurrentlyPlayingId(null);
    setCurrentTime(0);
    setProgress(0);
    stopAllAudio();
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleRun]);

  const addBlock = () => {
    setSpeechBlocks([
      ...speechBlocks, 
      { id: Date.now().toString(), speaker: 'Speaker 1 - Orus', text: '' }
    ]);
  };

  const updateBlockText = (id: string, text: string) => {
    setSpeechBlocks(speechBlocks.map(b => b.id === id ? { ...b, text } : b));
  };

  const updateBlockSpeaker = (id: string, speaker: string) => {
    setSpeechBlocks(speechBlocks.map(b => b.id === id ? { ...b, speaker } : b));
    setActiveDropdown(null);
  };

  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);

  const handlePreviewVoice = async (e: React.MouseEvent, voiceName: string) => {
    e.stopPropagation();
    
    await resumeAudioContext();

    if (previewingVoice === voiceName) {
      stopAllAudio();
      setPreviewingVoice(null);
      return;
    }
    
    if (previewingVoice) {
      stopAllAudio();
    }
    
    setPreviewingVoice(voiceName);
    try {
      const tigVoice = TIGRINYA_VOICES.find(v => v.name === voiceName || v.id === voiceName);
      let baseVoice = voiceName;
      let systemInstruction: string | undefined = undefined;

      if (tigVoice) {
        baseVoice = tigVoice.baseVoice;
        systemInstruction = tigVoice.systemPrompt;
      } else if (voiceName) {
        const knownVoices = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Aoede', 'Zephyr', 'Orus'];
        const matched = knownVoices.find(v => voiceName.toLowerCase().includes(v.toLowerCase()));
        if (matched) {
          baseVoice = matched;
        } else {
          const parts = voiceName.split(' - ');
          baseVoice = parts[1] || parts[0] || 'Kore';
        }
      }

      const previewText = activeLanguage === 'ti' ? "ሰላም፣ ከመይ ኣለኹም፧" : activeLanguage === 'am' ? "ሰላም፣ እንደምን አላችሁ?" : "Hello, how are you?";
      
      const audioBase64 = await generateTTS(previewText, baseVoice, 'gemini-3.1-flash-tts-preview', systemInstruction);
      if (audioBase64) {
        await playBase64Audio(audioBase64);
      } else {
        throw new Error("No audio returned");
      }
    } catch (err: any) {
      console.error("Preview failed:", err);
      if (err.message === "QUOTA_EXCEEDED") {
        showToast("Gemini API Quota Exceeded. Please try again later.");
      } else {
        showToast("Preview failed to generate.");
      }
    } finally {
      setPreviewingVoice(null);
    }
  };

  const totalCharacters = useMemo(() => {
    return speechBlocks.reduce((acc, block) => acc + block.text.length, 0);
  }, [speechBlocks]);

  const downloadComposition = async () => {
    if (Object.keys(generatedAudioBlocks).length === 0) {
      showToast("Please generate the audio first.");
      return;
    }

    try {
      // Collect all generated audio in order
      const audioChunks: Uint8Array[] = [];
      for (const block of speechBlocks) {
        const base64 = generatedAudioBlocks[block.id];
        if (base64) {
          audioChunks.push(new Uint8Array(atob(base64).split("").map(c => c.charCodeAt(0))));
        }
      }

      if (audioChunks.length === 0) {
        showToast("No audio blocks to export.");
        return;
      }

      // Concatenate all chunks into a single Blob
      // Note: This works for MP3/WAV chunks if they are compatible
      const blob = new Blob(audioChunks, { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TTS_Studio_Composition_${Date.now()}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast("Composition downloaded successfully!");
    } catch (err) {
      console.error("Download error:", err);
      showToast("Failed to download composition.");
    }
  };

  const updateBlockSpeed = (id: string, speed: number) => {
    setSpeechBlocks(speechBlocks.map(b => b.id === id ? { ...b, speed } : b));
  };

  const updateBlockPitch = (id: string, pitch: number) => {
    setSpeechBlocks(speechBlocks.map(b => b.id === id ? { ...b, pitch } : b));
  };

  const handleRefineTigrinya = async (id: string) => {
    const block = speechBlocks.find(b => b.id === id);
    if (!block || !block.text.trim()) return;

    setRewritingBlocks(prev => ({ ...prev, [id]: true }));
    try {
      const refined = await refineTigrinya(block.text, lang === 'am' ? 'am' : 'ti');
      setSpeechBlocks(speechBlocks.map(b => b.id === id ? { ...b, text: refined } : b));
      showToast(lang === 'ti' ? 'ስክሪፕት ተስተካኺሉ!' : lang === 'am' ? 'ስክሪፕት ተስተካክሏል!' : 'Script refined!');
    } catch (err) {
      console.error("Refine error:", err);
      showToast("Refinement failed.");
    } finally {
      setRewritingBlocks(prev => ({ ...prev, [id]: false }));
    }
  };

  const removeBlock = (id: string) => {
    setSpeechBlocks(speechBlocks.filter(b => b.id !== id));
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setScene(item.scene);
    setSpeechBlocks(item.blocks);
    setGeneratedAudioBlocks(item.audioBlocks);
    setShowHistory(false);
    showToast(t.loadedToast);
  };
  
  const playHistoryAudio = async (item: HistoryItem) => {
    if (playingHistoryIdRef.current === item.id) {
      stopHistoryAudio();
      return;
    }
    
    if (playingHistoryIdRef.current !== null) {
      stopHistoryAudio();
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setPlayingHistoryId(item.id);
    playingHistoryIdRef.current = item.id;
    setIsPlaying(true);
    setProgress(0);
    setCurrentTime(0);
    setCurrentlyPlayingId(item.id);
    
    // Calculate durations/offsets for this specific history item
    const histBlockDurations = item.blocks.map(block => {
      const base64 = item.audioBlocks[block.id];
      if (base64) {
        return base64.length / 48000;
      }
      return Math.max(1.5, block.text.trim().length * 0.08);
    });
    const histTotalDuration = histBlockDurations.reduce((a, b) => a + b, 0);
    
    const histBlockOffsets: number[] = [];
    let currentOffset = 0;
    for (let i = 0; i < histBlockDurations.length; i++) {
      histBlockOffsets.push(currentOffset);
      currentOffset += histBlockDurations[i];
    }
    
    try {
      for (let i = 0; i < item.blocks.length; i++) {
        if (playingHistoryIdRef.current !== item.id) break;
        const block = item.blocks[i];
        const audio = item.audioBlocks[block.id];
        
        if (audio) {
          const blockDuration = audio.length / 48000;
          const blockOffset = histBlockOffsets[i] || 0;
          
          setCurrentBlockId(block.id);
          setCurrentlyPlayingId(block.id);
          
          const playbackStartRealTime = performance.now();
          const timerInterval = setInterval(() => {
            const elapsed = (performance.now() - playbackStartRealTime) / 1000;
            const absoluteTime = Math.min(blockOffset + elapsed, blockOffset + blockDuration);
            setCurrentTime(absoluteTime);
            if (histTotalDuration > 0) {
              setProgress((absoluteTime / histTotalDuration) * 100);
            }
          }, 16);
          
          try {
            await playBase64Audio(audio, 24000);
          } finally {
            clearInterval(timerInterval);
            setCurrentTime(blockOffset + blockDuration);
            if (histTotalDuration > 0) {
              setProgress(((blockOffset + blockDuration) / histTotalDuration) * 100);
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to play history audio:", err);
    } finally {
      if (playingHistoryIdRef.current === item.id) {
        setPlayingHistoryId(null);
        playingHistoryIdRef.current = null;
        setCurrentBlockId(null);
        setCurrentlyPlayingId(null);
        setCurrentTime(0);
        setProgress(0);
        setIsPlaying(false);
      }
    }
  };

  const stopHistoryAudio = () => {
    playingHistoryIdRef.current = null;
    setPlayingHistoryId(null);
    setIsPlaying(false);
    setCurrentBlockId(null);
    setCurrentlyPlayingId(null);
    setCurrentTime(0);
    setProgress(0);
    stopAllAudio();
  };

  useEffect(() => {
    if (!isOpen) {
      stopMainAudio();
      stopHistoryAudio();
    }
    return () => {
      stopAllAudio();
    };
  }, [isOpen]);

  const deleteHistoryItem = (id: string) => {
    if (playingHistoryIdRef.current === id) {
      stopHistoryAudio();
    }
    setHistory(prev => prev.filter(item => item.id !== id));
    showToast(lang === 'ti' ? 'ካብ ታሪኽ ተሰሪዙ።' : lang === 'am' ? 'ከታሪክ ተሰርዟል።' : lang === 'gez' ? 'እምታሪክ ተሰረዘ።' : 'Removed from history.');
  };

  const downloadHistoryAudio = (item: HistoryItem) => {
    if (Object.keys(item.audioBlocks).length > 0) {
      const firstAudio = Object.values(item.audioBlocks)[0];
      downloadWav(firstAudio, `voiceover_${item.id}.wav`);
      showToast(t.downloadStartedToast);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
        <div className="fixed inset-0 z-[2001] flex items-center justify-center bg-black/60 p-0 sm:p-4 md:p-6 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`w-full h-full sm:max-h-[92vh] sm:max-w-[1400px] flex flex-col rounded-none sm:rounded-3xl shadow-2xl overflow-hidden border ${isDark ? 'bg-[#0a0a0c] text-white border-white/10' : 'bg-slate-50 text-slate-900 border-slate-200'}`}
          >
            {/* Top Toolbar */}
            <div className={`h-14 flex items-center justify-between px-3 sm:px-6 shrink-0 border-b ${isDark ? 'bg-[#111115] border-white/10' : 'bg-white border-slate-200'}`}>
               <div className="flex items-center gap-2 sm:gap-4">
                 <div className={`p-1.5 sm:p-2 rounded-lg ${isDark ? getAccentBg20() + ' ' + getAccentText() : getAccentBg5() + ' ' + getAccentText()}`}>
                   <Music className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                 </div>
                 <h2 className="text-xs sm:text-[15px] font-bold tracking-wide">{t.title}</h2>
                 <div className="hidden sm:block h-4 w-px bg-slate-300 dark:bg-white/10 mx-1 sm:mx-2" />
                 <span className={`text-[10px] sm:text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full font-mono font-medium tracking-wider hidden md:inline-block ${isDark ? 'bg-white/5 text-white/50' : 'bg-slate-100 text-slate-500'}`}>
                   {scene || (lang === 'ti' ? 'ዘይተሰየመ ፕሮጀክት' : lang === 'am' ? 'ያልተሰየመ ፕሮጀክት' : lang === 'gez' ? 'ዘይተሰየመ ፕሮጀክት' : 'Untitled Project')}
                 </span>
               </div>
               
               <div className="flex items-center gap-1 sm:gap-2">
                 <button 
                   onClick={() => setShowSmartImport(true)}
                   className="flex items-center gap-1.5 px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-all border border-amber-500/20"
                 >
                   <Sparkles className="w-4 h-4" />
                   <span className="hidden sm:inline">{lang === 'ti' ? 'ስክሪፕት የእቱ' : lang === 'am' ? 'ስክሪፕት አስገባ' : 'Smart Import Script'}</span>
                 </button>
                 <div className="hidden sm:block h-4 w-px bg-slate-300 dark:bg-white/10 mx-0.5" />

                 <button 
                   onClick={() => setShowVoiceGallery(!showVoiceGallery)}
                   className={`flex items-center gap-1.5 px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold transition-colors ${showVoiceGallery ? getAccentBg5() + ' dark:' + getAccentBg20() + ' ' + getAccentText() : 'hover:bg-slate-200 dark:hover:bg-white/10 opacity-70 hover:opacity-100'}`}
                   title="Voice Gallery"
                 >
                   <Mic className="w-4 h-4 text-indigo-400" />
                   <span className="hidden sm:inline">Voice Gallery</span>
                 </button>
                 <div className="hidden sm:block h-4 w-px bg-slate-300 dark:bg-white/10 mx-0.5" />
                 
                 <button 
                   onClick={() => setShowHistory(!showHistory)}
                   className={`flex items-center gap-1.5 px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold transition-colors ${showHistory ? getAccentBg5() + ' dark:' + getAccentBg20() + ' ' + getAccentText() : 'hover:bg-slate-200 dark:hover:bg-white/10 opacity-70 hover:opacity-100'}`}
                   title={t.historyTab}
                 >
                   <History className="w-4 h-4" />
                   <span className="hidden sm:inline">{t.historyTab}</span>
                 </button>
                 <div className="hidden sm:block h-4 w-px bg-slate-300 dark:bg-white/10 mx-0.5 sm:mx-1" />
                 
                 <button 
                   onClick={onClose} 
                   className="p-1.5 sm:p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors opacity-70 hover:opacity-100"
                   title={lang === 'ti' ? 'ኣንእስ' : lang === 'am' ? 'ቀንስ' : lang === 'gez' ? 'ኣንእስ' : 'Minimize'}
                 >
                   <Minimize2 className="w-4 sm:w-5 h-4 sm:h-5" />
                 </button>
                 <button onClick={onClose} className="p-1.5 sm:p-2 hover:bg-red-500/10 hover:text-red-500 rounded-full transition-colors opacity-70 hover:opacity-100">
                   <X className="w-4 sm:w-5 h-4 sm:h-5" />
                 </button>
               </div>
            </div>

            <div className="flex-1 flex min-h-0 relative">
              {/* Left Sidebar (Settings) */}
              {showSettings && (
                <>
                  {/* Backdrop for mobile */}
                  <div 
                    className="lg:hidden absolute inset-0 z-30 bg-black/50 backdrop-blur-sm"
                    onClick={() => setShowSettings(false)}
                  />
                  <div className={`absolute lg:relative left-0 top-0 bottom-0 z-40 lg:z-auto w-72 shrink-0 flex flex-col border-r ${isDark ? 'bg-[#0d0d10] border-white/10' : 'bg-slate-50 border-slate-200'} overflow-y-auto custom-scrollbar shadow-2xl lg:shadow-none`}>
                    <div className="p-6 flex flex-col gap-8">
                      {/* Mobile Close Button */}
                      <div className="flex lg:hidden justify-end -mb-4">
                        <button 
                          onClick={() => setShowSettings(false)}
                          className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full text-xs font-bold"
                          title="Close Settings"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Project Meta */}
                      <div className="flex flex-col gap-5">
                        <div className="flex items-center gap-2 opacity-70">
                          <Settings className="w-4 h-4" />
                          <h3 className="text-xs font-bold uppercase tracking-widest">{lang === 'ti' ? 'ቅጥዕታት ፕሮጀክት' : lang === 'am' ? 'የፕሮጀክት ቅንብሮች' : lang === 'gez' ? 'ስርዐተ ፕሮጀክት' : 'Project Settings'}</h3>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-semibold opacity-70">{t.sceneNameLabel}</label>
                          <input 
                            value={scene}
                            onChange={(e) => setScene(e.target.value)}
                            className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all ${isDark ? 'bg-black/20 border-white/10 focus:bg-white/5 ' + getAccentFocus() : 'bg-white border-slate-200 shadow-sm ' + getAccentFocus()}`}
                            placeholder={t.scenePlaceholder}
                          />
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-semibold opacity-70">{t.globalContextLabel}</label>
                          <textarea 
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                            className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all min-h-[100px] resize-y ${isDark ? 'bg-black/20 border-white/10 focus:bg-white/5 ' + getAccentFocus() : 'bg-white border-slate-200 shadow-sm ' + getAccentFocus()}`}
                            placeholder={t.globalContextPlaceholder}
                          />
                        </div>
                      </div>

                      {/* Audio Controls */}
                      <div className="flex flex-col gap-5 pt-6 border-t border-slate-200 dark:border-white/10">
                        <div className="flex items-center gap-2 opacity-70">
                          <Sliders className="w-4 h-4" />
                          <h3 className="text-xs font-bold uppercase tracking-widest">{t.masterAudioLabel}</h3>
                        </div>
                        
                        <div className="flex flex-col gap-3">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium opacity-70">{t.globalSpeedLabel}</span>
                            <span className="font-mono">{globalSpeed.toFixed(1)}x</span>
                          </div>
                          <input 
                            type="range" 
                            min="0.5" max="2" step="0.1" 
                            value={globalSpeed} 
                            onChange={e => setGlobalSpeed(parseFloat(e.target.value))}
                            className={`w-full ${getAccentAccentClass()}`}
                          />
                        </div>

                        <div className="flex flex-col gap-3">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium opacity-70">{t.globalPitchLabel}</span>
                            <span className="font-mono">{globalPitch > 0 ? '+' : ''}{globalPitch}</span>
                          </div>
                          <input 
                            type="range" 
                            min="-10" max="10" step="1" 
                            value={globalPitch} 
                            onChange={e => setGlobalPitch(parseInt(e.target.value))}
                            className={`w-full ${getAccentAccentClass()}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Main Script Area */}
              <div className={`flex-1 flex flex-col min-w-0 ${isDark ? 'bg-[#111115]' : 'bg-white'}`}>
                {/* Blocks Container */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar pt-10">
                  <div className="max-w-3xl mx-auto flex flex-col gap-6">
                    {speechBlocks.map((block, index) => {
                      const isActive = currentlyPlayingId === block.id || currentBlockId === block.id;
                      return (
                        <div 
                          key={block.id} 
                          className={`group rounded-2xl border transition-all duration-300 shadow-sm hover:shadow-md ${
                            isActive 
                              ? getAccentRingShadow() + ' scale-[1.01]'
                              : (isDark ? 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]' : 'border-slate-200 bg-white ' + getAccentHoverBorder300())
                          }`}
                        >
                          {/* Block Header */}
                          <div className={`flex items-center justify-between px-4 py-2.5 border-b ${isDark ? 'border-white/5 bg-black/20' : 'border-slate-100 bg-slate-50'} rounded-t-2xl`}>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black font-mono opacity-40">{(index + 1).toString().padStart(2, '0')}</span>
                              
                              {isActive && (
                                <div className={`flex items-center gap-1 px-2 py-0.5 ${getAccentBg10()} ${getAccentText()} rounded-md text-[9px] font-bold tracking-wider animate-pulse shrink-0`}>
                                  <Volume2 className="w-3 h-3 animate-bounce" />
                                  <span>{lang === 'ti' ? 'ዝርገሐ' : lang === 'am' ? 'ድምፅ' : lang === 'gez' ? 'ቃል' : 'PLAYING'}</span>
                                </div>
                              )}
                              
                              <div className="relative">
                                <button 
                                  onClick={() => setActiveDropdown(activeDropdown === block.id ? null : block.id)}
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${isDark ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                                >
                                  <div className={`w-2 h-2 rounded-full ${getAccentBg()}`} />
                                  {block.speaker}
                                  <ChevronDown className="w-3 h-3 opacity-50" />
                                </button>

                                {/* Speaker Dropdown */}
                                {activeDropdown === block.id && (
                                  <div className={`absolute top-full left-0 mt-2 w-72 rounded-2xl shadow-2xl border z-30 py-2 overflow-hidden backdrop-blur-xl ${isDark ? 'bg-slate-900/95 border-white/10' : 'bg-white border-slate-200'}`}>
                                    <div className="px-4 py-2 border-b border-slate-200 dark:border-white/5 mb-1">
                                      <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Select AI Voice</span>
                                    </div>
                                    <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                                      {SPEAKERS.map(s => {
                                        const tigVoice = TIGRINYA_VOICES.find(v => v.name === s);
                                        const isPreviewing = previewingVoice === s;
                                        return (
                                          <div key={s} className="group relative">
                                            <button 
                                              onClick={() => updateBlockSpeaker(block.id, s)}
                                              className={`w-full flex flex-col gap-0.5 px-4 py-3 text-left transition-all ${s === block.speaker ? 'bg-indigo-500/10 ' + getAccentText() : 'hover:bg-slate-100 dark:hover:bg-white/5 opacity-90 hover:opacity-100'}`}
                                            >
                                              <div className="flex items-center gap-2">
                                                {s === block.speaker && <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${getAccentBg()}`} />}
                                                <span className={`text-sm ${s === block.speaker ? 'font-bold' : 'font-medium'}`}>{s}</span>
                                                {tigVoice && (
                                                  <span className={`text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-bold uppercase tracking-tighter`}>Tigrinya</span>
                                                )}
                                              </div>
                                              {tigVoice && (
                                                <span className="text-[10px] opacity-50 font-medium leading-tight">{tigVoice.description}</span>
                                              )}
                                            </button>
                                            
                                            <button
                                              onClick={(e) => handlePreviewVoice(e, s)}
                                              className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all shadow-sm ${isPreviewing ? 'animate-pulse bg-indigo-500 text-white' : ''}`}
                                              title={isPreviewing ? "Stop Preview" : "Play Preview"}
                                            >
                                              {isPreviewing ? (
                                                <Square className="w-4 h-4 fill-current" />
                                              ) : (
                                                <Play className="w-4 h-4 fill-current" />
                                              )}
                                            </button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                {speechBlocks.length > 1 && (
                                  <button 
                                    onClick={() => removeBlock(block.id)}
                                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-500 transition-colors"
                                    title="Delete Track"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                                <button 
                                  onClick={() => handleRefineTigrinya(block.id)}
                                  disabled={rewritingBlocks[block.id]}
                                  className="p-1.5 rounded-lg hover:bg-indigo-500/10 text-indigo-400 transition-colors flex items-center gap-1" 
                                  title="Tigrinya Refiner"
                                >
                                  {rewritingBlocks[block.id] ? (
                                    <Loader2 className="w-4 h-4 opacity-70 animate-spin" />
                                  ) : (
                                    <Sparkles className="w-4 h-4 opacity-70" />
                                  )}
                                </button>
                                <div className="relative">
                                  <button 
                                    onClick={() => setActiveRewriteDropdown(activeRewriteDropdown === block.id ? null : block.id)}
                                    disabled={rewritingBlocks[block.id]}
                                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 transition-colors flex items-center gap-1" 
                                    title="AI Rewrite"
                                  >
                                    {rewritingBlocks[block.id] ? (
                                      <Loader2 className="w-4 h-4 opacity-70 animate-spin" />
                                    ) : (
                                      <>
                                        <Wand2 className="w-4 h-4 opacity-70" />
                                        <ChevronDown className="w-3 h-3 opacity-50" />
                                      </>
                                    )}
                                  </button>
                                  
                                  {/* Rewrite Tones Dropdown */}
                                  {activeRewriteDropdown === block.id && (
                                    <div className={`absolute top-full right-0 mt-1 w-48 rounded-xl shadow-2xl border z-20 py-1 overflow-hidden ${isDark ? 'bg-slate-800 border-white/10' : 'bg-white border-slate-200'}`}>
                                      {REWRITE_TONES.map(tone => (
                                        <button 
                                          key={tone.id}
                                          onClick={() => handleRewriteBlock(block.id, block.text, tone.prompt)}
                                          className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:${getAccentBg10()} transition-colors opacity-80 hover:opacity-100`}
                                        >
                                          {tone.label}
                                        </button>
                                      ))}
                                      <div className="border-t border-slate-200 dark:border-white/10 my-1"></div>
                                      <button 
                                        onClick={() => handleRewriteBlock(block.id, block.text)}
                                        className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:${getAccentBg10()} transition-colors font-medium ${getAccentText()}`}
                                      >
                                        Auto Rewrite
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <button className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-move">
                                  <MoreVertical className="w-4 h-4 opacity-50" />
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          {/* Block Textarea */}
                          <div className="flex flex-col">
                            <div className="relative p-1">
                              <textarea 
                                value={block.text}
                                onChange={(e) => updateBlockText(block.id, e.target.value)}
                                className="w-full min-h-[100px] p-4 bg-transparent border-none outline-none text-[15px] leading-relaxed resize-y font-medium focus:ring-0"
                                placeholder={t.dialoguePlaceholder}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Add Track Button (Ghost) */}
                    <button 
                      onClick={addBlock}
                      className={`flex flex-col items-center justify-center gap-2 py-8 rounded-2xl border-2 border-dashed transition-all ${isDark ? 'border-white/10 text-white/40 hover:text-white/80 hover:bg-white/5 hover:border-white/20' : 'border-slate-300 text-slate-500 hover:text-slate-800 hover:bg-slate-50 hover:border-slate-400'}`}
                    >
                      <div className={`p-3 rounded-full ${getAccentBg10()} ${getAccentText()}`}>
                        <Plus className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-semibold">{t.addDialogueButton}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Sidebar (History) */}
              {showHistory && (
                <>
                  {/* Backdrop for mobile */}
                  <div 
                    className="lg:hidden absolute inset-0 z-30 bg-black/50 backdrop-blur-sm"
                    onClick={() => setShowHistory(false)}
                  />
                  <div className={`absolute lg:relative right-0 top-0 bottom-0 z-40 lg:z-auto w-80 shrink-0 flex flex-col border-l ${isDark ? 'bg-[#0d0d10] border-white/10' : 'bg-slate-50 border-slate-200'} overflow-y-auto custom-scrollbar shadow-2xl lg:shadow-none`}>
                    <div className={`p-5 border-b ${isDark ? 'border-white/5 bg-[#0d0d10]/95' : 'border-slate-100 bg-slate-50/90'} backdrop-blur-md flex items-center justify-between sticky top-0 z-10 transition-colors duration-300`}>
                      <div className="flex items-center gap-2">
                        <History className={`w-3.5 h-3.5 opacity-90 ${getAccentText()}`} />
                        <h3 className={`text-[11px] font-extrabold uppercase tracking-[0.15em] ${isDark ? 'text-white/85' : 'text-slate-700'}`}>{t.projectHistoryLabel}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${isDark ? 'bg-white/5 border-white/10 text-white/40' : 'bg-slate-200/50 border-slate-300/30 text-slate-500'} transition-all`}>
                          {history.length} {lang === 'ti' ? 'ዝተዓቀቡ' : lang === 'am' ? 'የተቀመጡ' : lang === 'gez' ? 'ዝተዓቀቡ' : 'saves'}
                        </span>
                        
                        {/* Mobile Close Button */}
                        <button 
                          onClick={() => setShowHistory(false)}
                          className="lg:hidden p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full text-slate-500 hover:text-slate-700 dark:hover:text-white"
                          title="Close History"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  <div className="p-5 flex flex-col gap-5">
                    {history.length === 0 ? (
                      <div className="flex flex-col items-center text-center opacity-50 p-6">
                        <History className="w-8 h-8 mb-3 opacity-40" />
                        <p className="text-sm font-semibold">{t.noRendersLabel}</p>
                        <p className="text-xs mt-1">{t.noRendersSubLabel}</p>
                      </div>
                    ) : (
                      (() => {
                        const categories = [
                          { key: 'today', label: t.today, items: groupedHistory.today },
                          { key: 'thisWeek', label: t.thisWeek, items: groupedHistory.thisWeek },
                          { key: 'older', label: t.older, items: groupedHistory.older }
                        ];

                        return (
                          <div className="flex flex-col gap-6">
                            {categories.map((cat) => {
                              if (cat.items.length === 0) return null;
                              return (
                                <div key={cat.key} className="flex flex-col gap-3">
                                  {/* Subheader */}
                                  <div className="flex items-center gap-2 px-1">
                                    <span className={`text-[10px] font-black uppercase tracking-widest opacity-80 ${getAccentText()}`}>
                                      {cat.label}
                                    </span>
                                    <div className="h-px bg-slate-200 dark:bg-white/10 flex-1" />
                                    <span className="text-[9px] font-mono opacity-40">{cat.items.length}</span>
                                  </div>

                                  <div className="flex flex-col gap-3">
                                    {cat.items.map((item) => (
                                      <div 
                                        key={item.id} 
                                        className={`flex flex-col gap-3 p-4 rounded-2xl border transition-all ${
                                          playingHistoryId === item.id 
                                            ? (isDark ? 'bg-emerald-500/5 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20' : 'bg-emerald-500/[0.02] border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)] ring-1 ring-emerald-500/20')
                                            : (isDark ? 'bg-white/5 border-white/5 hover:' + getAccentBorder() : 'bg-white border-slate-200 ' + getAccentHoverBorder300() + ' shadow-sm')
                                        }`}
                                      >
                                        <div className="flex justify-between items-start gap-2">
                                          <div className="flex flex-col gap-1 min-w-0 flex-1">
                                            <h4 className="text-sm font-bold truncate pr-2">{item.scene || (lang === 'ti' ? 'ዘይተሰየመ ቃል' : lang === 'am' ? 'ያልተሰየመ ኦዲዮ' : lang === 'gez' ? 'ዘይተሰየመ ቃል' : 'Untitled Render')}</h4>
                                            {playingHistoryId === item.id && (
                                              <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="flex h-1.5 w-1.5 relative shrink-0">
                                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                                </span>
                                                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider animate-pulse flex items-center gap-1">
                                                  <Volume2 className="w-2.5 h-2.5" />
                                                  {t.playingLabel}
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                          <span className="text-[10px] font-mono opacity-50 shrink-0 mt-0.5">
                                            {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                          </span>
                                        </div>
                                        
                                        <p className="text-xs opacity-60 line-clamp-2 leading-relaxed">
                                          {item.blocks.map(b => b.text).join(' ')}
                                        </p>
                                        
                                        <div className="flex items-center justify-between pt-3 mt-1 border-t border-slate-200 dark:border-white/10">
                                          <button 
                                            onClick={() => loadHistoryItem(item)}
                                            className={`text-xs font-bold hover:underline ${getAccentText()}`}
                                          >
                                            {t.restoreButton}
                                          </button>
                                          
                                          <div className="flex items-center gap-1">
                                            <button 
                                              onClick={() => playHistoryAudio(item)}
                                              className={`p-1.5 rounded-lg transition-colors ${
                                                playingHistoryId === item.id 
                                                  ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' 
                                                  : isDark ? 'hover:bg-white/10 text-white/80' : 'hover:bg-slate-100 text-slate-700'
                                              }`}
                                              title={playingHistoryId === item.id ? (lang === 'ti' ? 'ኣቋርጽ' : lang === 'am' ? 'አቁም' : lang === 'gez' ? 'አምጽእ' : 'Stop') : t.playMaster}
                                            >
                                              {playingHistoryId === item.id ? (
                                                <Pause className="w-4 h-4 fill-current animate-pulse" />
                                              ) : (
                                                <Play className="w-4 h-4 fill-current opacity-80" />
                                              )}
                                            </button>
                                            
                                            <button 
                                              onClick={() => downloadHistoryAudio(item)}
                                              className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
                                              title={t.downloadWav}
                                            >
                                              <Download className="w-4 h-4 opacity-80" />
                                            </button>

                                            <button 
                                              onClick={() => deleteHistoryItem(item.id)}
                                              className={`p-1.5 rounded-lg transition-colors text-red-400 hover:text-red-500 hover:bg-red-500/10`}
                                              title={lang === 'ti' ? 'ሰርዝ' : lang === 'am' ? 'ሰርዝ' : lang === 'gez' ? 'ሰርዝ' : 'Delete'}
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()
                    )}
                  </div>
                </div>
                </>
              )}
            </div>

            {/* Bottom Transport / Timeline Control */}
            <div className={`h-24 shrink-0 flex flex-col border-t ${isDark ? 'bg-[#0a0a0c] border-white/10' : 'bg-white border-slate-200'} shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-10`}>
               {/* Controls */}
               <div className="flex-1 flex items-center justify-between px-3 sm:px-6">
                 {/* Left: Master Info */}
                 <div className="hidden md:flex items-center gap-4 w-64 opacity-80">
                   <div className={`w-10 h-10 flex items-center justify-center rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>
                     <Volume2 className="w-5 h-5" />
                   </div>
                   <div className="flex flex-col">
                     <span className="text-xs font-bold uppercase tracking-widest">{t.masterOut}</span>
                     <span className="text-[10px] font-mono opacity-70">{t.wavSpecs}</span>
                   </div>
                 </div>

                 {/* Center: Transport & Progress */}
                 <div className="flex-1 max-w-2xl flex flex-col items-center gap-1">
                   <div className="flex items-center gap-4 mb-1">
                     <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors opacity-60 hover:opacity-100">
                       <Rewind className="w-4 h-4" />
                     </button>
                     
                     <button 
                         onClick={() => {
                           if (isPlaying) {
                             if (playingHistoryId) {
                               stopHistoryAudio();
                             } else {
                               stopMainAudio();
                             }
                           } else {
                             handleRun();
                           }
                         }}
                         disabled={isGenerating}
                         className={`w-12 h-12 flex items-center justify-center rounded-full shadow-xl transition-all ${isGenerating ? 'bg-amber-500 hover:bg-amber-400' : isPlaying ? 'bg-emerald-500 hover:bg-emerald-400' : getAccentThemeColor() + ' hover:scale-105 active:scale-95 text-white'}`}
                      >
                         {isGenerating ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : 
                          isPlaying ? <Pause className="w-5 h-5 text-white fill-white" /> : 
                          <Play className="w-5 h-5 text-white fill-white ml-1" />}
                      </button>

                     <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors opacity-60 hover:opacity-100">
                       <FastForward className="w-4 h-4" />
                     </button>
                   </div>
                   
                   <div className="w-full flex items-center gap-3">
                     <span className="text-[10px] font-mono opacity-50 w-10 text-right">{formatTime(currentTime)}</span>
                     <div className="flex-1 h-3 bg-slate-200 dark:bg-slate-800/80 rounded-full relative overflow-hidden shadow-inner flex">
                        {/* Proportional Segment Blocks */}
                        {speechBlocks.map((block, i) => {
                          const duration = blockDurations[i] || 0;
                          const pct = totalDuration > 0 ? (duration / totalDuration) * 100 : (100 / speechBlocks.length);
                          const isBlockPlaying = currentBlockId === block.id;
                          return (
                            <div 
                              key={block.id} 
                              className={`h-full border-r border-black/10 transition-colors relative flex items-center justify-center`}
                              style={{ width: `${pct}%` }}
                            >
                              {/* Active status overlay */}
                              <div className={`absolute inset-0 transition-colors ${isBlockPlaying ? 'bg-indigo-500/25' : 'bg-transparent'}`} />
                              
                              {/* Waveform graphic accent inside block */}
                              <div className="absolute inset-x-1 top-0.5 bottom-0.5 opacity-20 flex items-center justify-around pointer-events-none">
                                <div className="w-[1.5px] h-[30%] bg-current rounded-full" />
                                <div className="w-[1.5px] h-[55%] bg-current rounded-full" />
                                <div className="w-[1.5px] h-[40%] bg-current rounded-full" />
                              </div>
                            </div>
                          );
                        })}
                        
                        {/* Sliding Playhead highlight overlay */}
                        <div 
                          className={`absolute left-0 top-0 bottom-0 pointer-events-none transition-all duration-100 ${getAccentBg35()} border-r-2 ${getAccentBorderSolid()}`}
                          style={{ width: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%` }}
                        />
                     </div>
                     <span className="text-[10px] font-mono opacity-50 w-10">{formatTime(totalDuration)}</span>
                   </div>
                 </div>

                 {/* Right: Empty Placeholder to maintain layout */}
                 <div className="flex items-center justify-end gap-1.5 sm:gap-3 w-auto md:w-64">
                 </div>
               </div>
            </div>
            
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    {/* Smart Import Script Modal Overlay */}
    <AnimatePresence>
      {showSmartImport && (
        <div className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            className={`w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-3xl border p-5 sm:p-6 shadow-2xl flex flex-col gap-4 custom-scrollbar ${isDark ? 'bg-[#0f0f12] text-white border-white/10' : 'bg-white text-slate-900 border-slate-200'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500 animate-pulse shrink-0" />
                <h3 className="text-base font-extrabold tracking-wide">
                  {lang === 'ti' ? 'ባዕላዊ ስክሪፕት ስራሕ' : lang === 'am' ? 'ባለሙያ የስክሪፕት አዘጋጅ' : 'Smart Custom Script Architect'}
                </h3>
              </div>
              <button 
                onClick={() => setShowSmartImport(false)} 
                className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs opacity-70 leading-relaxed">
              {lang === 'ti' ? 'ኩሉ ዓይነት ናይ ጽሑፍ ዓንቀጻት ወይ ናይ ዘተ ጽሑፍ ኣብዚ የእትዉ። ናይ ዓለምለኸ ሰብኣዊ ኣተሓሳስባን (AI) ብምጥቃም ናብ ዝተፈላለዩ ናይ ድምጺ መስመራት ብግቡእ ክምቕሎ እዩ።' : 
               lang === 'am' ? 'ማንኛውንም የስክሪፕት ወይም የትረካ ጽሑፍ እዚህ ያስገቡ። ሰው ሰራሽ አስተዋይነትን (AI) በመጠቀም ጽሑፉን ወደ ተለያዩ የድምፅ ትራኮች በቅደም ተከተል ይከፋፍለዋል።' : 
               'Paste any raw voiceover text, YouTube scripts, or dialogue. The AI will intelligently analyze, format, split by voiceover speed blocks, and map to appropriate speakers with emotional bracket cues.'}
            </p>

            {/* Quick Template Presets */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500/80">
                {lang === 'ti' ? 'ቅልጡፍ ናይ ቅጥዒ ምርጫታት:' : lang === 'am' ? 'ፈጣን የአብነት ምርጫዎች:' : 'Quick Template Presets:'}
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setRawScriptInput(
                    "Hook: [intrigue] Stop scrolling! You won't believe this secret AI trick.\nDetail: [casual] Just go to settings, enable the hidden mode, and watch your productivity 10x.\nCall To Action: [desire] Save this video and try it right now!"
                  )}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border ${isDark ? 'bg-amber-500/5 text-amber-300 border-amber-500/20 hover:bg-amber-500/10' : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'}`}
                >
                  {lang === 'ti' ? '📱 ሓጺር ቪድዮ (Reel)' : lang === 'am' ? '📱 አጭር ቪዲዮ (Reel)' : '📱 Viral Reel Hook'}
                </button>
                <button
                  type="button"
                  onClick={() => setRawScriptInput(
                    "Hook: [intrigue] እዚ ሓዱሽ ኣርቲፊሻል ኢንተለጀንስ ንህይወትና ከመይ ክቕይሮ እዩ?\nContent: [information] ኣብዚ ቀረባ ግዜ ዝወጸ ቴክኖሎጂ ብሓቂ ተኣምር ዝመልኦ ዓለም ክንርኢ ኢና።\nCall to Action: [desire] ሰብስክራይብ ብምግባር ዝያዳ ሓበሬታታት ተኸታተሉ።"
                  )}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border ${isDark ? 'bg-amber-500/5 text-amber-300 border-amber-500/20 hover:bg-amber-500/10' : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'}`}
                >
                  {lang === 'ti' ? '🇪🇹 ትግርኛ ቴክኖሎጂ' : lang === 'am' ? '🇪🇹 ትግርኛ ቴክኖሎጂ' : '🇪🇹 Tigrinya Tech'}
                </button>
                <button
                  type="button"
                  onClick={() => setRawScriptInput(
                    "Hook: [confident] You have exactly one life. Why are you spending it doubting yourself?\nBuild-up: [inspiration] Every master was once a beginner. The difference is they didn't quit.\nClimax: [desire] Wake up. Focus. Make today count!"
                  )}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border ${isDark ? 'bg-amber-500/5 text-amber-300 border-amber-500/20 hover:bg-amber-500/10' : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'}`}
                >
                  {lang === 'ti' ? '🇬🇧 ምኽሪ' : lang === 'am' ? '🇬🇧 ማበረታቻ' : '🇬🇧 Motivation'}
                </button>
                <button
                  type="button"
                  onClick={() => setRawScriptInput(
                    "Narrator: [intrigue] Deep within the unforgiving desert, life finds a way.\nDetail: [information] These ancient structures have survived for over a thousand years against all odds.\nConclusion: [inspiration] A true marvel of human endurance and nature."
                  )}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border ${isDark ? 'bg-amber-500/5 text-amber-300 border-amber-500/20 hover:bg-amber-500/10' : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'}`}
                >
                  {lang === 'ti' ? '🌍 ዶክመንተሪ' : lang === 'am' ? '🌍 ዶክመንተሪ' : '🌍 Documentary'}
                </button>
                <button
                  type="button"
                  onClick={() => setRawScriptInput(
                    "Intro: [intrigue] Here are the top 3 mind-blowing facts you didn't know about space.\nNumber 1: [confident] The sun is actually white, not yellow.\nNumber 2: [casual] One day on Venus is longer than a year on Earth.\nOutro: [desire] Subscribe for more daily facts!"
                  )}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border ${isDark ? 'bg-amber-500/5 text-amber-300 border-amber-500/20 hover:bg-amber-500/10' : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'}`}
                >
                  {lang === 'ti' ? '▶️ ዩቱብ ቪድዮ' : lang === 'am' ? '▶️ ዩቲዩብ ቪዲዮ' : '▶️ YouTube Faceless'}
                </button>
              </div>
            </div>

            <textarea
              value={rawScriptInput}
               onChange={(e) => setRawScriptInput(e.target.value)}
              placeholder={
                lang === 'ti' ? 'ንኣብነት:\nመራሒ ተዋሳኢ: ሰላም ኩቡራት ተዓዘብቲ!\nካልኣይ ተዋሳኢ: ሎሚ ሓዳስ መኪና ክንርኢ ኢና...' : 
                lang === 'am' ? 'ለምሳሌ:\nተራኪ: ሰላም ውድ ተመልካቾች!\nሁለተኛ ተዋናይ: ዛሬ አዲስ መኪና እናያለን...' : 
                'Paste your custom script here...'
              }
              className={`w-full h-64 p-4 rounded-2xl border text-sm outline-none font-sans leading-relaxed resize-none ${isDark ? 'bg-black/40 border-white/10 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-500 shadow-inner'}`}
            />

            <div className="flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => setShowSmartImport(false)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'}`}
              >
                {lang === 'ti' ? 'ደምስስ' : lang === 'am' ? 'ሰርዝ' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isSmartImporting || !rawScriptInput.trim()}
                onClick={handleSmartImport}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg shadow-amber-500/10 transition-all ${isSmartImporting ? 'bg-amber-500 opacity-85' : 'bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-400 hover:to-red-400'}`}
              >
                {isSmartImporting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {lang === 'ti' ? 'ስክሪፕት ይንበብ ኣሎ...' : lang === 'am' ? 'ስክሪፕት እየተነበበ ነው...' : 'Analyzing Script (Thinking Mode)...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    {lang === 'ti' ? 'ኣዳሉ (Build)' : lang === 'am' ? 'አዘጋጅ (Build)' : 'Structure & Parse Script'}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    {/* Voice Preview Gallery Modal Overlay */}
    <AnimatePresence>
      {showVoiceGallery && (
        <div className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/80 p-4 sm:p-6 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            className={`w-full max-w-5xl max-h-[88vh] rounded-3xl border p-6 shadow-2xl flex flex-col gap-4 overflow-hidden ${
              isDark ? 'bg-[#0f0f12] text-white border-white/10' : 'bg-white text-slate-900 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-4 border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold tracking-wide">TTS Studio Voice Preview Gallery</h3>
                  <p className="text-xs opacity-60">Audition profile cards for Selam, Senait, Robel, Aman, Kidane & Yohannes</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowVoiceGallery(false)}
                className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              <VoicePreviewGallery
                selectedVoiceName={speechBlocks[0]?.speaker || 'Selam'}
                onSelectVoice={(voiceName) => {
                  if (speechBlocks.length > 0) {
                    updateBlockSpeaker(speechBlocks[0].id, voiceName);
                    showToast(`Assigned ${voiceName} as speaker`);
                  }
                }}
                onPlaySample={(voiceName, sampleText, gender) => {
                  handlePlayGallerySample(voiceName, sampleText, gender);
                }}
                playingVoiceName={playingGalleryVoice}
                isDark={isDark}
                title="Tigrinya Persona Library"
                subtitle="Play sample tones to compare Ge'ez cadences, news anchors, scholars, and storytellers"
                actionLabel="Set Speaker"
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  </>
);
};

