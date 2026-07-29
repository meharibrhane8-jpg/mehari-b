#!/bin/bash
sed -i '5790,5802c\
                  <button \
                      onClick={handleSendChatMessage}\
                      className={`w-9 h-9 ml-1.5 flex items-center justify-center rounded-full transition-all cursor-pointer hover:scale-105 active:scale-95 ${\
                        currentTheme.accent === '"'"'indigo-600'"'"'\
                          ? '"'"'bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]'"'"'\
                          : currentTheme.accent === '"'"'slate-400'"'"'\
                            ? '"'"'bg-slate-700 hover:bg-slate-600 text-white shadow-[0_0_15px_rgba(51,65,85,0.4)]'"'"'\
                            : '"'"'bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]'"'"'\
                      }`}\
                      title="Send"\
                  >\
                      <Send className="w-4 h-4 ml-[-2px] mt-[1px]" />\
                  </button>\
' src/App.tsx
