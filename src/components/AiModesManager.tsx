import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X,
  Volume2,
  Mic,
  Check,
  Sparkles,
  GraduationCap,
  Briefcase,
  PenTool,
  Dumbbell,
  Languages,
  BrainCircuit,
  Smile,
  Search,
  MessageSquare,
  ChevronDown
} from 'lucide-react';


export interface AiModeConfig {
  id: string;
  name: string;
  description: string;
  voiceMood: string;
  maleVoice: string;
  femaleVoice: string;
  previewText: string;
  icon: any;
  color: string;
}

interface AiModesManagerProps {
  isOpen: boolean;
  onClose: () => void;
  activeAiMode: string;
  onSelectMode: (modeId: string) => void;
  activeVoiceGender: 'female' | 'male';
  onSelectGender: (gender: 'female' | 'male') => void;
  currentTheme: {
    isDark: boolean;
  };
  onPreviewVoice: (modeId: string, gender: 'female' | 'male', previewText: string) => Promise<void>;
  isPreviewing: boolean;
  previewingModeId: string | null;
  previewingGender: 'female' | 'male' | null;
  onSpeedChange: (speed: number) => void;
  onMicSelect: (micId: string) => void;
  onModelSelect: (model: string) => void;
  activeModel: string;
  selectedMic: string;
  availableMicrophones: MediaDeviceInfo[];
}

export const AI_MODES_LIST: AiModeConfig[] = [
  {
    id: 'default',
    name: "Default Assistant",
    description: "Standard conversational assistant.",
    voiceMood: "Neutral, helpful, balanced.",
    maleVoice: "Charon",
    femaleVoice: "Kore",
    previewText: "Hello! How can I help you today?",
    icon: Sparkles,
    color: "from-slate-400 to-slate-600",
  },
  {
    id: 'teacher',
    name: "Teacher Mode",
    description: "Patient tutor for learning.",
    voiceMood: "Calm, encouraging.",
    maleVoice: "Charon",
    femaleVoice: "Kore",
    previewText: "Hello! Let's explore and learn something wonderful together.",
    icon: GraduationCap,
    color: "from-blue-500 to-indigo-600",
  },
  {
    id: 'business',
    name: "Business Advisor",
    description: "Strategic consultant.",
    voiceMood: "Professional, direct.",
    maleVoice: "Fenrir",
    femaleVoice: "Kore",
    previewText: "Let's analyze your strategy.",
    icon: Briefcase,
    color: "from-slate-700 to-slate-900",
  },
  {
    id: 'creative',
    name: "Creative Writer",
    description: "Imaginative storyteller.",
    voiceMood: "Warm, expressive.",
    maleVoice: "Charon",
    femaleVoice: "Aoede",
    previewText: "Let's weave an imaginative tale.",
    icon: PenTool,
    color: "from-purple-500 to-pink-600",
  },
  {
    id: 'fitness',
    name: "Fitness Coach",
    description: "Motivating trainer.",
    voiceMood: "Energetic, upbeat.",
    maleVoice: "Puck",
    femaleVoice: "Aoede",
    previewText: "Let's go! Time to push limits!",
    icon: Dumbbell,
    color: "from-amber-500 to-orange-600",
  },
  {
    id: 'linguist',
    name: "Linguist Pro",
    description: "Expert in languages & translation.",
    voiceMood: "Precise, academic.",
    maleVoice: "Charon",
    femaleVoice: "Kore",
    previewText: "I can help with precise translations.",
    icon: Languages,
    color: "from-cyan-500 to-blue-600",
  },
  {
    id: 'tech',
    name: "Tech Advisor",
    description: "Code & systems expert.",
    voiceMood: "Analytical, logical.",
    maleVoice: "Fenrir",
    femaleVoice: "Kore",
    previewText: "Let's debug or architecture this.",
    icon: BrainCircuit,
    color: "from-gray-600 to-gray-800",
  },
  {
    id: 'wellness',
    name: "Wellness Coach",
    description: "Mindfulness & well-being.",
    voiceMood: "Gentle, empathetic.",
    maleVoice: "Puck",
    femaleVoice: "Aoede",
    previewText: "Take a deep breath and relax.",
    icon: Smile,
    color: "from-emerald-500 to-green-600",
  },
  {
    id: 'researcher',
    name: "Deep Researcher",
    description: "Detailed information synthesis.",
    voiceMood: "Curious, thorough.",
    maleVoice: "Charon",
    femaleVoice: "Kore",
    previewText: "Let's dive deep into this topic.",
    icon: Search,
    color: "from-rose-500 to-red-600",
  },
  {
    id: 'content_creator',
    name: "AI Content Creator",
    description: "Expert in content strategy, script generation, and monetization.",
    voiceMood: "Energetic, persuasive, savvy.",
    maleVoice: "Fenrir",
    femaleVoice: "Aoede",
    previewText: "Let's create engaging content that converts and helps you grow.",
    icon: PenTool,
    color: "from-indigo-500 to-violet-600",
  },
  {
    id: 'langbuddy',
    name: "Language Buddy",
    description: "Casual practice partner.",
    voiceMood: "Friendly, informal.",
    maleVoice: "Puck",
    femaleVoice: "Aoede",
    previewText: "Hey! Let's chat and practice.",
    icon: MessageSquare,
    color: "from-yellow-500 to-amber-600",
  }
];

export const AiModesManager = ({
  isOpen,
  onClose,
  activeAiMode,
  onSelectMode,
  activeVoiceGender,
  onSelectGender,
  currentTheme,
  onPreviewVoice,
  isPreviewing,
  previewingModeId,
  previewingGender,
  onSpeedChange,
  onMicSelect,
  onModelSelect,
  activeModel,
  selectedMic,
  availableMicrophones
}: AiModesManagerProps) => {

  const activeModeObj = AI_MODES_LIST.find(m => m.id === activeAiMode) || AI_MODES_LIST[0];
  const [speed, setSpeed] = useState(1.0);
  const [showPersonalityMenu, setShowPersonalityMenu] = useState(false);
  const [personalityTab, setPersonalityTab] = useState<'models' | 'modes'>('models');

  const handleVoiceSelect = (voice: string, gender: 'female' | 'male') => {
    onSelectGender(gender);
  };
  
  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    onSpeedChange(newSpeed);
  };
  
  const handleMicSelect = (micId: string) => {
    onMicSelect(micId);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          {/* Overlay Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 "
          />
          
          {/* Main Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed top-0 right-0 h-full w-full max-w-[600px] z-50 border-l shadow-2xl flex transition-all ${
              currentTheme.isDark 
                ? 'bg-neutral-900 border-neutral-800 text-neutral-100' 
                : 'bg-white border-neutral-200 text-neutral-900'
            }`}
          >
            {/* Left Panel: Persona Settings */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">AI Persona Settings</h2>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-neutral-800"><X className="w-5 h-5"/></button>
              </div>

              {/* Voice Section */}
              <section>
                <h3 className="text-sm font-semibold text-neutral-400 mb-3">Voice</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { name: 'Ara', gender: 'female', desc: 'Upbeat Female' },
                    { name: 'Eve', gender: 'female', desc: 'Soothing Female' },
                    { name: 'Leo', gender: 'male', desc: 'British Male' },
                    { name: 'Rex', gender: 'male', desc: 'Calm Male' },
                    { name: 'Sal', gender: 'male', desc: 'Smooth Male' },
                    { name: 'Gork', gender: 'male', desc: 'Lazy Male' }
                  ].map(voice => (
                    <button 
                      key={voice.name} 
                      onClick={() => handleVoiceSelect(voice.name, voice.gender as 'female' | 'male')}
                      className={`p-3 rounded-xl border ${voice.gender === activeVoiceGender ? 'border-indigo-500 bg-indigo-900/20' : 'border-neutral-700 bg-neutral-800 hover:border-neutral-500'} text-left transition-all`}
                    >
                      <div className="font-semibold">{voice.name}</div>
                      <div className="text-xs text-neutral-400">{voice.desc}</div>
                    </button>
                  ))}
                </div>
              </section>

                {/* Personality Section */}
                <section>
                  <h3 className="text-sm font-semibold text-neutral-400 mb-3">Personality</h3>
                  <div 
                    className="p-3 rounded-xl border border-neutral-700 bg-neutral-800 flex justify-between items-center cursor-pointer"
                    onClick={() => setShowPersonalityMenu(!showPersonalityMenu)}
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-neutral-400" />
                      <span>{AI_MODES_LIST.find(m => m.id === activeAiMode)?.name || 'Assistant'}</span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-neutral-400" />
                  </div>
                  {showPersonalityMenu && (
                    <div className="mt-2 p-2 rounded-xl border border-neutral-700 bg-neutral-800 space-y-2 max-h-[250px] overflow-y-auto">
                      {AI_MODES_LIST.map(mode => (
                        <button 
                          key={mode.id}
                          onClick={() => onSelectMode(mode.id)}
                          className={`w-full p-2 text-left rounded-lg hover:bg-neutral-700 flex justify-between items-center ${activeAiMode === mode.id ? 'text-indigo-400' : ''}`}
                        >
                          {mode.name}
                          {activeAiMode === mode.id && <Check className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                  )}
                </section>

              {/* Speed Section */}
              <section>
                <h3 className="text-sm font-semibold text-neutral-400 mb-3">Speed</h3>
                <input 
                  type="range" 
                  min="0.5" 
                  max="2.0" 
                  step="0.1" 
                  value={speed}
                  onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer" 
                />
                <div className="text-sm mt-2">{speed.toFixed(1)}x</div>
              </section>

              {/* Microphone Section */}
              <section>
                <h3 className="text-sm font-semibold text-neutral-400 mb-3">Microphone</h3>
                <div className="space-y-2">
                  {availableMicrophones.map(mic => (
                    <div 
                      key={mic.deviceId} 
                      className={`p-3 rounded-xl border ${selectedMic === mic.deviceId ? 'border-neutral-500 bg-neutral-700' : 'border-neutral-700 bg-neutral-800'} flex items-center justify-between cursor-pointer`}
                      onClick={() => handleMicSelect(mic.deviceId)}
                    >
                      <div className="flex items-center gap-2">
                        <Mic className="w-4 h-4 text-neutral-400" />
                        <span>{mic.label || `Microphone ${mic.deviceId.slice(0, 5)}`}</span>
                      </div>
                      {selectedMic === mic.deviceId && <Check className="w-4 h-4 text-emerald-500" />}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};
