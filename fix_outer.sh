#!/bin/bash
sed -i '1808,1817c\
            className="relative w-full max-w-lg mx-auto px-2 pointer-events-none mb-3 z-30"\
          >\
            {/* Outer Magical Glow behind the entire container */}\
            <div className={`absolute inset-0 px-2 pointer-events-none transition-all duration-1000 ${isLivePaused ? '"'"'opacity-0'"'"' : '"'"'opacity-100'"'"'}`}>\
              <div className={`w-full h-full rounded-[24px] blur-xl transition-all duration-1000 ${\
                  liveTalkState === '"'"'listening'"'"' ? '"'"'bg-gradient-to-r from-cyan-500/40 via-blue-500/40 to-indigo-500/40 animate-pulse'"'"' :\
                  liveTalkState === '"'"'thinking'"'"' ? '"'"'bg-gradient-to-r from-indigo-500/50 via-purple-500/50 to-pink-500/50 animate-[pulse_3s_ease-in-out_infinite]'"'"' :\
                  liveTalkState === '"'"'speaking'"'"' ? '"'"'bg-gradient-to-r from-fuchsia-500/60 via-purple-500/60 to-cyan-500/60 animate-pulse scale-[1.02]'"'"' :\
                  '"'"'bg-gradient-to-r from-emerald-500/30 via-teal-500/30 to-emerald-500/30'"'"'\
              }`} />\
            </div>\
\
            {/* Main Glowing Container - Even more compact */}\
            <motion.div\
              className="relative w-full bg-[#0a0c10]/98 rounded-[24px] border border-white/10 overflow-hidden flex flex-col pointer-events-auto backdrop-blur-2xl"\
            >\
' src/App.tsx
