import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Sparkles, BrainCircuit, Copy, Volume2, File as FileIcon, ArrowUpRight, Pencil, Check, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage as ChatMessageType } from '../services/geminiService';
import { MessageLinksAndSources } from './MessageLinksAndSources';

interface ChatMessageProps {
  msg: ChatMessageType;
  currentTheme: { isDark: boolean };
  index: number;
  onCopy: (text: string) => void;
  onPlayTTS?: (text: string, index: number) => void;
  onEditSave?: (index: number, newText: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ msg, currentTheme, index, onCopy, onPlayTTS, onEditSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(msg.parts);

  const handleSave = () => {
    if (onEditSave && editText.trim() !== "") {
      onEditSave(index, editText);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditText(msg.parts);
    setIsEditing(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative flex items-start gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl transition-all bg-transparent hover:bg-black/[0.015] dark:hover:bg-white/[0.01]"
      role="listitem"
    >
      <div className="shrink-0 mt-1">
        {msg.role === 'user' ? (
          <div className={`w-8 h-8 sm:w-9.5 sm:h-9.5 rounded-full flex items-center justify-center border ${
            currentTheme.isDark 
              ? 'bg-white/5 border-white/10 text-white/75' 
              : 'bg-slate-100 border-slate-200 text-slate-600'
          } shadow-sm`}>
            <User className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </div>
        ) : (
          <div className="w-8 h-8 sm:w-9.5 sm:h-9.5 rounded-full flex items-center justify-center bg-cosmic-bg shadow-lg shadow-indigo-500/20 relative group/avatar overflow-hidden border border-indigo-500/30">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 opacity-20 group-hover/avatar:opacity-40 transition-opacity" />
            <div className="absolute inset-0 animate-pulse bg-indigo-500/5 blur-sm" />
            <Sparkles className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-indigo-300 relative z-10 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <span className={`text-xs font-bold uppercase tracking-widest ${
          currentTheme.isDark ? 'text-white/40' : 'text-slate-400'
        }`}>
          {msg.role === 'user' ? 'You' : 'Assistant'}
        </span>
        
        <div className={`markdown-body prose ${currentTheme.isDark ? 'prose-invert text-white/90' : 'text-slate-800'} max-w-none text-base sm:text-lg font-ethiopic leading-relaxed`}>
          {msg.thought && (
            <div className={`mb-4 rounded-xl p-3 border text-xs leading-relaxed font-sans ${
              currentTheme.isDark 
                ? 'bg-amber-500/5 border-amber-500/10 text-amber-200/80' 
                : 'bg-amber-500/[0.02] border-amber-500/15 text-amber-800'
            }`}>
              <details className="outline-none select-none cursor-pointer" open={false}>
                <summary className="flex items-center justify-between font-bold uppercase tracking-widest text-[9px] outline-none">
                  <span className="flex items-center gap-1.5 cursor-pointer">
                    <BrainCircuit className="w-3.5 h-3.5 text-amber-500/85 animate-pulse" />
                    <span>Gemini Deep Thinking Detail ({msg.thought.length} chars)</span>
                  </span>
                </summary>
                <div className="whitespace-pre-wrap italic mt-2 border-t pt-2 border-amber-500/10 font-ethiopic">
                  {msg.thought}
                </div>
              </details>
            </div>
          )}
          {msg.attachedFiles && msg.attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1 mb-2">
              {msg.attachedFiles.map((file: any) => (
                <div 
                  key={file.id}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border ${
                    currentTheme.isDark 
                      ? "bg-white/[0.04] border-white/5 text-white/70" 
                      : "bg-slate-100 border-zinc-200 text-zinc-650"
                  }`}
                >
                  {file.mimeType.startsWith("image/") && file.dataUrl ? (
                    <img 
                      src={file.dataUrl} 
                      alt={file.name} 
                      className="w-4 h-4 rounded object-cover border border-white/10"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <FileIcon className="w-3.5 h-3.5 text-zinc-400" />
                  )}
                  <span className="truncate max-w-[150px]">{file.name}</span>
                </div>
              ))}
            </div>
          )}

          {isEditing ? (
            <div className="flex flex-col gap-2 mt-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className={`w-full p-3 rounded-xl border font-ethiopic text-base sm:text-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${
                  currentTheme.isDark 
                    ? 'bg-white/5 border-white/10 text-white' 
                    : 'bg-white border-slate-200 text-slate-800'
                }`}
                rows={Math.max(3, editText.split('\n').length)}
                autoFocus
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save & Regenerate
                </button>
                <button
                  onClick={handleCancel}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    currentTheme.isDark 
                      ? 'bg-white/10 hover:bg-white/20 text-white' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <ReactMarkdown
              components={{
                a: ({ href, children }) => (
                  <a 
                    href={href} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 transition-all font-semibold border border-indigo-500/10 decoration-transparent align-baseline text-sm sm:text-base my-0.5"
                    title={href}
                  >
                    <span>{children as React.ReactNode}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 shrink-0 text-indigo-500/80 dark:text-indigo-300/80" />
                  </a>
                )
              }}
            >
              {msg.parts}
            </ReactMarkdown>
          )}
          {!isEditing && <MessageLinksAndSources msg={msg} isDark={currentTheme.isDark} />}
        </div>
      </div>
      
      {/* Inner micro-actions for absolute control */}
      {!isEditing && (
        <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-black/40 dark:bg-black/80 p-1.5 rounded-lg border border-white/10 z-20">
          <button
            onClick={() => onCopy(msg.parts)}
            className="p-1 hover:text-indigo-400 text-white/70 transition-colors"
            title="Copy Text"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          {msg.role === 'user' && onEditSave && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 hover:text-amber-400 text-white/70 transition-colors"
              title="Edit Message"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {msg.role === 'model' && onPlayTTS && (
            <button
              onClick={() => onPlayTTS(msg.parts, index)}
              className="p-1 hover:text-emerald-400 text-white/70 transition-colors"
              title="Play AI Voice"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default ChatMessage;
