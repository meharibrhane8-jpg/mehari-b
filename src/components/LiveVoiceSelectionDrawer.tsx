import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mic, Play, Square, Check, Radio, Sparkles, Volume2, ArrowRight } from 'lucide-react';
import { TIGRINYA_VOICE_PROFILES } from '../data/tigrinyaVoiceProfiles';
import { VoicePreviewGallery } from './VoicePreviewGallery';

interface LiveVoiceSelectionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSpeaker: string;
  onSelectSpeaker: (speakerName: string, gender: 'female' | 'male') => void;
  onConnectLiveSession: (speakerName: string) => void;
  onPreviewVoice: (voiceName: string, sampleText: string, gender: 'female' | 'male') => void;
  playingVoiceName?: string | null;
  isDark?: boolean;
}

export const LiveVoiceSelectionDrawer: React.FC<LiveVoiceSelectionDrawerProps> = ({
  isOpen,
  onClose,
  selectedSpeaker,
  onSelectSpeaker,
  onConnectLiveSession,
  onPreviewVoice,
  playingVoiceName,
  isDark = true,
}) => {
  const currentProfile = TIGRINYA_VOICE_PROFILES.find(
    p => p.name.toLowerCase() === selectedSpeaker.toLowerCase()
  ) || TIGRINYA_VOICE_PROFILES[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[2050] bg-black/60 "
          />

          {/* Side Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className={`fixed top-0 right-0 bottom-0 z-[2051] w-full max-w-lg shadow-2xl flex flex-col border-l ${
              isDark ? 'bg-[#0b0c10] text-white border-white/10' : 'bg-slate-50 text-slate-900 border-slate-200'
            }`}
          >
            {/* Drawer Header */}
            <div className={`p-5 flex items-center justify-between border-b ${
              isDark ? 'border-white/10 bg-slate-900/50' : 'border-slate-200 bg-white'
            }`}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Mic className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-base font-bold tracking-tight">Live Voice Selection</h2>
                  <p className={`text-xs ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
                    ድምጺ ምረፅ • Switch voice persona on the fly
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className={`p-2 rounded-xl transition-colors ${
                  isDark ? 'hover:bg-white/10 text-white/70 hover:text-white' : 'hover:bg-slate-200 text-slate-500'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Active Voice Spotlight Banner */}
            <div className={`p-4 mx-4 mt-4 rounded-2xl border ${
              isDark ? 'bg-indigo-500/10 border-indigo-500/30 text-white' : 'bg-indigo-50 border-indigo-200 text-indigo-950'
            }`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-md">
                    {currentProfile.name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Selected Persona</span>
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                        Ready to Connect
                      </span>
                    </div>
                    <h3 className="text-sm font-extrabold">{currentProfile.name} ({currentProfile.gender})</h3>
                    <p className={`text-xs ${isDark ? 'text-white/70' : 'text-slate-600'}`}>{currentProfile.title}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onPreviewVoice(currentProfile.name, currentProfile.sampleText, currentProfile.gender)}
                  className={`p-2.5 rounded-xl transition-all font-bold text-xs flex items-center gap-1.5 shrink-0 ${
                    playingVoiceName?.toLowerCase() === currentProfile.name.toLowerCase()
                      ? 'bg-indigo-600 text-white animate-pulse'
                      : isDark
                        ? 'bg-white/10 hover:bg-white/20 text-white'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                  title="Audition Selected Persona"
                >
                  <Volume2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Audition</span>
                </button>
              </div>
            </div>

            {/* Scrollable Voice Profile Gallery */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <VoicePreviewGallery
                selectedVoiceName={selectedSpeaker}
                onSelectVoice={(voiceName, gender) => onSelectSpeaker(voiceName, gender)}
                onPlaySample={(voiceName, sampleText, gender) => onPreviewVoice(voiceName, sampleText, gender)}
                playingVoiceName={playingVoiceName}
                isDark={isDark}
                title="Tigrinya Voice Profiles"
                subtitle="Tap 'Play Sample' to hear cadence, then select your persona"
                actionLabel="Select"
                compact={true}
              />
            </div>

            {/* Bottom Sticky Action Footer */}
            <div className={`p-4 border-t ${
              isDark ? 'border-white/10 bg-slate-900/90' : 'border-slate-200 bg-white'
            }`}>
              <button
                type="button"
                onClick={() => {
                  onConnectLiveSession(selectedSpeaker);
                  onClose();
                }}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                <Mic className="w-4 h-4 animate-bounce" />
                <span>Connect Live Talk with {selectedSpeaker}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};
