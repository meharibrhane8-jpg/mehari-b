#!/bin/bash
sed -i '5675,5679c\
            <div className={`w-full relative flex flex-col p-3 sm:p-3.5 rounded-[24px] border transition-all duration-300 focus-within:border-indigo-500/50 ${\
              currentTheme.isDark \
                ? '"'"'bg-[#0a0c10] border-white/5 shadow-2xl backdrop-blur-2xl'"'"' \
                : '"'"'bg-white/90 border-slate-200 shadow-lg backdrop-blur-2xl'"'"'\
            }`}>\
' src/App.tsx
