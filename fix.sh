#!/bin/bash
sed -i '1777,1786c\
    if (isQuotaExceeded) {\
      return (\
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">\
          <div className="w-full max-w-md bg-[#0a0c10] p-8 rounded-[40px] border-2 border-white/5 shadow-2xl text-center">\
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-6 mx-auto text-amber-400">\
              <AlertTriangle className="w-8 h-8" />\
            </div>\
            <h3 className="text-xl font-black text-white mb-4 uppercase tracking-wider">\
              {activeLanguage === '"'"'ti'"'"' ? "ዓቐን ተበጺሑ" : activeLanguage === '"'"'am'"'"' ? "ገደብ አልፏል" : "Quota Exceeded"}\
            </h3>\
            <p className="text-white/60 mb-6 font-medium text-sm">\
              {activeLanguage === '"'"'ti'"'"' ? "ናይ ሕቶ ዓቐንኩም ተበጺሑ ኣሎ።" : activeLanguage === '"'"'am'"'"' ? "የጥያቄ ገደብዎ አልቋል።" : "You have reached your request quota."}\
            </p>\
            <button\
              onClick={() => setIsLiveMode(false)}\
              className="w-full py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold transition-all"\
            >\
              Close\
            </button>\
          </div>\
        </div>\
      );\
    }\
\
    return (\
      <AnimatePresence>' src/App.tsx
