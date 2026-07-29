#!/bin/bash
sed -i '1822,1832c\
                  <div className="relative flex items-center justify-center w-2 h-2">\
                    {/* Magical Aura */}\
                    <div className={`absolute -inset-1.5 rounded-full mix-blend-screen transition-all duration-700 ${\
                      isLivePaused ? '"'"'bg-slate-500/20 opacity-0'"'"' : \
                      liveTalkState === '"'"'listening'"'"' ? '"'"'bg-cyan-400/60 blur-[3px] animate-pulse opacity-100 scale-110'"'"' :\
                      liveTalkState === '"'"'thinking'"'"' ? '"'"'bg-indigo-500/60 blur-[4px] animate-[pulse_3s_ease-in-out_infinite] opacity-100 scale-100'"'"' :\
                      liveTalkState === '"'"'speaking'"'"' ? '"'"'bg-fuchsia-500/60 blur-[5px] animate-pulse opacity-100 scale-125'"'"' :\
                      '"'"'bg-emerald-400/50 blur-[3px] animate-[pulse_2s_ease-in-out_infinite] opacity-80 scale-100'"'"'\
                    }`} />\
                    {/* Core Dot */}\
                    <div className={`relative w-1.5 h-1.5 rounded-full transition-all duration-500 ${\
                      isLivePaused \
                        ? '"'"'bg-slate-400 shadow-[0_0_8px_rgba(100,116,139,0.5)]'"'"'\
                        : liveTalkState === '"'"'listening'"'"'\
                          ? '"'"'bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,1)]'"'"'\
                          : liveTalkState === '"'"'thinking'"'"'\
                            ? '"'"'bg-indigo-300 shadow-[0_0_12px_rgba(99,102,241,1)]'"'"'\
                            : liveTalkState === '"'"'speaking'"'"'\
                              ? '"'"'bg-fuchsia-200 shadow-[0_0_15px_rgba(217,70,239,1)] scale-110'"'"'\
                              : '"'"'bg-emerald-300 shadow-[0_0_10px_rgba(52,211,153,1)]'"'"'\
                    }`} />\
                  </div>\
' src/App.tsx
