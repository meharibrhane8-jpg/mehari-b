import React, { useState } from 'react';
import { Volume2, Play, Square, Check, Mic, User, Sparkles, Radio, ChevronDown, ChevronUp } from 'lucide-react';
import { TIGRINYA_VOICE_PROFILES, VoiceProfile } from '../data/tigrinyaVoiceProfiles';

interface VoicePreviewGalleryProps {
  selectedVoiceName?: string;
  onSelectVoice?: (voiceName: string, gender: 'female' | 'male') => void;
  onPlaySample?: (voiceName: string, sampleText: string, gender: 'female' | 'male') => void;
  playingVoiceName?: string | null;
  isDark?: boolean;
  title?: string;
  subtitle?: string;
  actionLabel?: string;
  compact?: boolean;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  layout?: 'grid' | 'carousel';
}

export const VoicePreviewGallery: React.FC<VoicePreviewGalleryProps> = ({
  selectedVoiceName = 'Selam',
  onSelectVoice,
  onPlaySample,
  playingVoiceName,
  isDark = true,
  title = "Tigrinya Voice Preview Gallery",
  subtitle = "Audition native voice personas with authentic cadence, pronunciation, and emotion",
  actionLabel = "Select Persona",
  compact = false,
  collapsible = false,
  defaultExpanded = true,
  layout = 'grid',
}) => {
  const [filterGender, setFilterGender] = useState<'all' | 'female' | 'male'>('all');
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);

  const filteredVoices = TIGRINYA_VOICE_PROFILES.filter(v => {
    if (filterGender === 'female') return v.gender === 'female';
    if (filterGender === 'male') return v.gender === 'male';
    return true;
  });

  const activeVoiceObj = TIGRINYA_VOICE_PROFILES.find(
    v => v.name.toLowerCase() === selectedVoiceName.toLowerCase()
  ) || TIGRINYA_VOICE_PROFILES[0];

  const getAccentBadge = (color: string) => {
    switch (color) {
      case 'emerald': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'pink': return 'bg-pink-500/10 text-pink-500 border-pink-500/20';
      case 'blue': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'amber': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'violet': return 'bg-violet-500/10 text-violet-500 border-violet-500/20';
      case 'teal': return 'bg-teal-500/10 text-teal-500 border-teal-500/20';
      default: return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
    }
  };

  const getAccentBtn = (color: string) => {
    switch (color) {
      case 'emerald': return 'bg-emerald-500 hover:bg-emerald-600 text-white';
      case 'pink': return 'bg-pink-500 hover:bg-pink-600 text-white';
      case 'blue': return 'bg-blue-500 hover:bg-blue-600 text-white';
      case 'amber': return 'bg-amber-500 hover:bg-amber-600 text-white';
      case 'violet': return 'bg-violet-500 hover:bg-violet-600 text-white';
      case 'teal': return 'bg-teal-500 hover:bg-teal-600 text-white';
      default: return 'bg-indigo-500 hover:bg-indigo-600 text-white';
    }
  };

  return (
    <div className={`w-full flex flex-col gap-3 rounded-2xl transition-all ${
      collapsible ? (isDark ? 'p-3 bg-slate-900/60 border border-white/10' : 'p-3 bg-slate-50 border border-slate-200') : ''
    } ${isDark ? 'text-white' : 'text-slate-900'}`}>
      
      {/* Header & Filter Bar / Collapsible Toggle Header */}
      <div 
        onClick={collapsible ? () => setIsExpanded(!isExpanded) : undefined}
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
          collapsible ? 'cursor-pointer select-none' : ''
        }`}
      >
        <div className="flex items-center justify-between w-full sm:w-auto gap-2">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl shrink-0 ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold tracking-tight">{title}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {selectedVoiceName}
                </span>
              </div>
              {subtitle && !collapsible && (
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {collapsible && (
            <div className={`p-1.5 rounded-lg border transition-colors ${
              isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 hover:bg-slate-100'
            }`}>
              {isExpanded ? <ChevronUp className="w-4 h-4 opacity-70" /> : <ChevronDown className="w-4 h-4 opacity-70" />}
            </div>
          )}
        </div>

        {/* Gender Filter Tabs - only shown when expanded or not collapsible */}
        {(!collapsible || isExpanded) && (
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`flex items-center p-1 rounded-xl border self-start sm:self-auto text-[11px] ${
              isDark ? 'bg-slate-900/80 border-white/10' : 'bg-slate-100 border-slate-200'
            }`}
          >
            <button
              type="button"
              onClick={() => setFilterGender('all')}
              className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                filterGender === 'all'
                  ? isDark ? 'bg-white/15 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm'
                  : isDark ? 'text-white/50 hover:text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All (6)
            </button>
            <button
              type="button"
              onClick={() => setFilterGender('female')}
              className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                filterGender === 'female'
                  ? 'bg-pink-500/20 text-pink-400 font-bold shadow-sm'
                  : isDark ? 'text-white/50 hover:text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Female
            </button>
            <button
              type="button"
              onClick={() => setFilterGender('male')}
              className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                filterGender === 'male'
                  ? 'bg-blue-500/20 text-blue-400 font-bold shadow-sm'
                  : isDark ? 'text-white/50 hover:text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Male
            </button>
          </div>
        )}
      </div>

      {/* Voice Cards Container (Grid or Carousel) */}
      {(!collapsible || isExpanded) && (
        <div className={
          layout === 'carousel'
            ? 'flex gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin snap-x snap-mandatory'
            : `grid grid-cols-1 ${compact ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'} gap-3`
        }>
          {filteredVoices.map((voice) => {
            const isSelected = selectedVoiceName?.toLowerCase() === voice.name.toLowerCase();
            const isPlaying = playingVoiceName?.toLowerCase() === voice.name.toLowerCase();

            return (
              <div
                key={voice.id}
                onClick={() => onSelectVoice && onSelectVoice(voice.name, voice.gender)}
                className={`group relative p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2.5 ${
                  layout === 'carousel' ? 'w-[260px] min-w-[260px] max-w-[260px] shrink-0 snap-start' : ''
                } ${
                  isSelected
                    ? isDark
                      ? 'border-indigo-500/80 bg-indigo-500/10 ring-1 ring-indigo-500/30 shadow-md'
                      : 'border-indigo-500 bg-indigo-50/80 ring-1 ring-indigo-500/20 shadow-sm'
                    : isDark
                      ? 'border-white/10 bg-slate-900/80 hover:border-white/20 hover:bg-slate-900'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {/* Card Top: Avatar, Name, Gender Badge */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs border ${getAccentBadge(voice.accentColor)}`}>
                        {voice.name[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <h4 className="text-xs font-bold tracking-tight">{voice.name}</h4>
                          {isSelected && (
                            <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-500 text-white">
                              <Check className="w-2 h-2" />
                            </span>
                          )}
                        </div>
                        <p className={`text-[10px] font-medium line-clamp-1 ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
                          {voice.title}
                        </p>
                      </div>
                    </div>

                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full border ${
                      voice.gender === 'female' 
                        ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' 
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      {voice.gender}
                    </span>
                  </div>

                  {/* Dialect / Cadence Tag */}
                  <div className="mb-1.5">
                    <span className={`inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-md border ${
                      isDark ? 'bg-white/5 border-white/10 text-white/80' : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}>
                      <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                      {voice.dialectTag}
                    </span>
                  </div>

                  {/* Description */}
                  <p className={`text-[11px] leading-snug line-clamp-2 ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                    {voice.desc}
                  </p>

                  {/* Native Ge'ez Sample Phrase display */}
                  <div className={`mt-2 p-1.5 rounded-lg text-[10px] font-mono border ${
                    isDark ? 'bg-black/40 border-white/5 text-emerald-400/90' : 'bg-slate-100 border-slate-200 text-emerald-700'
                  }`}>
                    "{voice.sampleText}"
                  </div>
                </div>

                {/* Card Footer: Play Sample & Select Action */}
                <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onPlaySample) {
                        onPlaySample(voice.name, voice.sampleText, voice.gender);
                      }
                    }}
                    className={`flex-1 py-1 px-2.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                      isPlaying
                        ? 'bg-indigo-600 text-white animate-pulse'
                        : isDark
                          ? 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                    }`}
                  >
                    {isPlaying ? (
                      <>
                        <Square className="w-3 h-3 fill-current" />
                        <span>Playing...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-current" />
                        <span>Sample</span>
                      </>
                    )}
                  </button>

                  {onSelectVoice && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectVoice(voice.name, voice.gender);
                      }}
                      className={`py-1 px-2.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shrink-0 ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : getAccentBtn(voice.accentColor)
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Radio className="w-3 h-3" />
                          <span>Selected</span>
                        </>
                      ) : (
                        <span>{actionLabel}</span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

