#!/bin/bash
sed -i '1822c\
                  <div className={`w-1.5 h-1.5 rounded-full transition-all duration-700 ${\
                    isLivePaused \
                      ? '"'"'bg-slate-500 shadow-[0_0_8px_rgba(100,116,139,0.5)]'"'"'\
                      : liveTalkState === '"'"'listening'"'"'\
                        ? '"'"'bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-pulse'"'"'\
                        : liveTalkState === '"'"'thinking'"'"'\
                          ? '"'"'bg-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.6)] animate-[pulse_3s_ease-in-out_infinite]'"'"'\
                          : liveTalkState === '"'"'speaking'"'"'\
                            ? '"'"'bg-purple-400 shadow-[0_0_20px_rgba(168,85,247,1)]'"'"'\
                            : '"'"'bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.4)]'"'"'\
                  }`} />\
' src/App.tsx
