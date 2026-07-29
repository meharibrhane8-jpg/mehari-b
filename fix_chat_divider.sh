#!/bin/bash
sed -i '5704,5707c\
                />\
                \
                <div className={`w-full h-[1px] my-2 ${currentTheme.isDark ? '"'"'bg-white/5'"'"' : '"'"'bg-slate-200/50'"'"'}`} />\
\
              <div className="flex items-center justify-between w-full px-1">\
                <div className="flex items-center gap-1">\
' src/App.tsx
