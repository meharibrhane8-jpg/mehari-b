#!/bin/bash
sed -i '1810,1818c\
            {/* Outer Magical Glow behind the entire container */}\
            <div className={`absolute -inset-2 px-2 pointer-events-none transition-all duration-1000 ${isLivePaused ? '"'"'opacity-0'"'"' : '"'"'opacity-100'"'"'}`}>\
              <div className={`w-full h-full rounded-[30px] blur-2xl transition-all duration-1000 ${\
                  liveTalkState === '"'"'listening'"'"' ? '"'"'bg-gradient-to-r from-cyan-500/50 via-blue-500/50 to-indigo-500/50 animate-pulse'"'"' :\
                  liveTalkState === '"'"'thinking'"'"' ? '"'"'bg-gradient-to-r from-indigo-500/60 via-purple-500/60 to-pink-500/60 animate-[pulse_3s_ease-in-out_infinite]'"'"' :\
                  liveTalkState === '"'"'speaking'"'"' ? '"'"'bg-gradient-to-r from-fuchsia-500/70 via-purple-500/70 to-cyan-500/70 animate-pulse scale-105'"'"' :\
                  '"'"'bg-gradient-to-r from-emerald-500/40 via-teal-500/40 to-emerald-500/40'"'"'\
              }`} />\
            </div>\
' src/App.tsx
