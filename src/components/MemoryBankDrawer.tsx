import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  BrainCircuit, 
  Trash2, 
  Plus, 
  HelpCircle, 
  Sparkles, 
  AlertCircle, 
  Info, 
  Pencil, 
  Check,
  Terminal,
  CheckCircle2,
  CloudLightning,
  CloudRain
} from 'lucide-react';

interface MemoryBankDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  memories: string[];
  onAddMemory: (memory: string) => void;
  onEditMemory: (index: number, newText: string) => void;
  onDeleteMemory: (index: number) => void;
  onClearAllMemories: () => void;
  currentTheme: {
    isDark: boolean;
    accent?: string;
  };
  isMemoryEnabled: boolean;
  onToggleMemoryEnabled: (enabled: boolean) => void;
  customSystemInstructions: string;
  onSaveCustomSystemInstructions: (instructions: string) => void;
  t: (key: string) => string;
  activeLanguage: string;
}

export const MemoryBankDrawer = ({
  isOpen,
  onClose,
  memories,
  onAddMemory,
  onEditMemory,
  onDeleteMemory,
  onClearAllMemories,
  currentTheme,
  isMemoryEnabled,
  onToggleMemoryEnabled,
  customSystemInstructions,
  onSaveCustomSystemInstructions,
  t,
  activeLanguage
}: MemoryBankDrawerProps) => {
  const [newMemoryInput, setNewMemoryInput] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [localInstructions, setLocalInstructions] = useState(customSystemInstructions || '');

  useEffect(() => {
    setLocalInstructions(customSystemInstructions || '');
  }, [customSystemInstructions]);

  const handleTextareaChange = (val: string) => {
    setLocalInstructions(val);
    onSaveCustomSystemInstructions(val);
  };

  const handleImportMemories = () => {
    if (!memories || memories.length === 0) return;
    const memoryBulletPoints = memories.map((m: string) => `- ${m}`).join('\n');
    const updated = localInstructions.trim()
      ? `${localInstructions}\n\n# Imported Memories:\n${memoryBulletPoints}`
      : `# Imported Memories:\n${memoryBulletPoints}`;
    handleTextareaChange(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMemoryInput.trim()) {
      onAddMemory(newMemoryInput.trim());
      setNewMemoryInput('');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          {/* Overlay Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          />
          
          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
            className={`fixed top-0 right-0 h-full w-full sm:w-[420px] z-50 border-l shadow-3xl flex flex-col transition-all duration-300 outline-none ${
              currentTheme.isDark 
                ? 'bg-[#0b0f19] border-white/5 text-white' 
                : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            {/* Header */}
            <div className={`flex justify-between items-center px-6 py-5 border-b shrink-0 ${
              currentTheme.isDark ? 'border-white/5' : 'border-slate-100'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl flex items-center justify-center transition-all ${
                  currentTheme.isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
                }`}>
                  <BrainCircuit className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight font-sans">{t('memoryVault')}</h3>
                  <p className="text-[10px] opacity-60 mt-0.5 leading-none">{t('subtitle')}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowHelp(!showHelp)}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    showHelp 
                      ? 'bg-indigo-500/15 text-indigo-400 font-bold scale-105' 
                      : currentTheme.isDark
                        ? 'hover:bg-white/5 text-white/50 hover:text-white'
                        : 'hover:bg-slate-100 text-slate-400 hover:text-slate-800'
                  }`}
                  title="How Memory Works"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
                <button 
                  onClick={onClose} 
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    currentTheme.isDark
                      ? 'hover:bg-white/5 text-white/50 hover:text-white'
                      : 'hover:bg-slate-100 text-slate-400 hover:text-slate-800'
                  }`}
                  aria-label="Close memory vault"
                >
                  <X className="w-4 h-4"/>
                </button>
              </div>
            </div>
            
            {/* Body */}
            <div className="p-6 flex flex-col gap-5 flex-1 overflow-y-auto custom-scrollbar">
              
              {/* Enable/Disable Switch Card */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between transition-all duration-300 ${
                currentTheme.isDark 
                  ? 'bg-white/[0.015] border-white/5 hover:border-white/10' 
                  : 'bg-slate-50/50 border-slate-200/80 hover:bg-slate-100/20'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl transition-all ${
                    isMemoryEnabled 
                      ? (currentTheme.isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600')
                      : (currentTheme.isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400')
                  }`}>
                    <BrainCircuit className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold font-sans tracking-tight">
                      {isMemoryEnabled ? t('memoryActive') : t('memoryPaused')}
                    </span>
                    <span className="text-[10px] opacity-60 leading-normal max-w-[190px] font-sans">
                      {isMemoryEnabled ? (activeLanguage === 'en' ? "Custom detail and contexts automatically persist." : activeLanguage === 'am' ? "ተጨማሪ መረጃዎች በራስ-ሰር ይቀመጣሉ" : "ዝርዝር ሓበሬታታት ብባዕሉ ይዕቀብ።") : (activeLanguage === 'en' ? "No personal context is currently running." : activeLanguage === 'am' ? "ምንም የግል መረጃ አሁን እየሰራ አይደለም" : "ዝኾነ ናይ ውልቀ ሓበሬታ ሕጂ ኣይሰርሕን ዘሎ።")}
                    </span>
                  </div>
                </div>
                
                {/* Switch Button */}
                <button
                  onClick={() => onToggleMemoryEnabled(!isMemoryEnabled)}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none relative cursor-pointer ${
                    isMemoryEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                  title={isMemoryEnabled ? "Pause Memory" : "Activate Memory"}
                >
                  <motion.div
                    layout
                    className="w-5 h-5 rounded-full bg-white shadow-md"
                    animate={{ x: isMemoryEnabled ? 20 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>



              {/* Help Tip Overlay */}
              <AnimatePresence>
                {showHelp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`rounded-2xl p-4 border text-[11px] flex flex-col gap-2 relative overflow-hidden ${
                      currentTheme.isDark 
                        ? 'bg-indigo-500/[0.03] border-indigo-500/10 text-indigo-200' 
                        : 'bg-indigo-50 border-indigo-100 text-indigo-900'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{t('howMemoryWorks')}</span>
                    </div>
                    <p className="opacity-80 leading-relaxed font-sans">
                      As you converse, the AI organically identifies and notes personal preferences, names, dialects, or rules and applies them back into your chats and speech.
                    </p>
                    <div className="opacity-80 flex flex-col gap-0.5 border-t border-indigo-500/10 pt-2 mt-1">
                      <span className="font-semibold block mb-0.5">Try saying:</span>
                      <code className="text-[10px] block font-mono opacity-80">"My name is Samuel"</code>
                      <code className="text-[10px] block font-mono opacity-80">"I speak Amharic"</code>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* System Instructions Custom Rules & Persona */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-50 flex items-center gap-1.5 font-sans">
                  <Terminal className="w-3.5 h-3.5 text-indigo-500" /> System Instructions
                </span>
                
                <div className={`p-4 rounded-2xl border flex flex-col gap-3.5 ${
                  currentTheme.isDark ? 'border-white/5 bg-white/[0.015]' : 'border-slate-200 bg-slate-50/40'
                }`}>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold font-sans">Custom Rules & Persona</span>
                      {localInstructions.trim() ? (
                        <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Active
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                          Standard
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] opacity-60 leading-normal font-sans">
                      Specify persistent behavior rules, personalities, or key translation guides.
                    </span>
                  </div>

                  <textarea
                    rows={4}
                    value={localInstructions}
                    onChange={(e) => handleTextareaChange(e.target.value)}
                    placeholder="e.g. Speak with friendly warmth. Support Ge'ez input dynamically..."
                    className={`w-full text-xs p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none font-sans leading-relaxed transition-colors ${
                      currentTheme.isDark 
                        ? 'bg-[#060913] border-white/5 text-white placeholder:text-white/20 focus:border-indigo-500/40' 
                        : 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-indigo-500/40'
                    }`}
                  />

                  <div className="flex items-center justify-between gap-2">
                    {/* Clear Button */}
                    <button
                      type="button"
                      onClick={() => handleTextareaChange('')}
                      disabled={!localInstructions.trim()}
                      className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-all ${
                        localInstructions.trim()
                          ? 'border-rose-500/20 text-rose-500 bg-rose-500/5 hover:bg-rose-500/10 cursor-pointer'
                          : 'border-slate-200 dark:border-white/5 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-40'
                      }`}
                      title={t('clear')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t('clear')}</span>
                    </button>

                    {/* Import Memory Vault Button */}
                    <button
                      type="button"
                      onClick={handleImportMemories}
                      disabled={!memories || memories.length === 0}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold flex items-center gap-1.5 transition-all ${
                        memories && memories.length > 0
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-40'
                      }`}
                      title={memories && memories.length > 0 ? t('importMemory') : "Memory Vault is empty"}
                    >
                      <BrainCircuit className="w-3.5 h-3.5" />
                      <span>{t('importMemory')} ({memories?.length || 0})</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Add Manual Memory Form */}
              <form 
                onSubmit={handleSubmit} 
                className={`flex flex-col gap-2 transition-all duration-300 ${!isMemoryEnabled ? 'opacity-40 pointer-events-none' : ''}`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-50 font-sans flex items-center gap-1">
                  {t('addDetail')}
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMemoryInput}
                    onChange={(e) => setNewMemoryInput(e.target.value)}
                    disabled={!isMemoryEnabled}
                    placeholder={isMemoryEnabled ? (activeLanguage === 'en' ? "e.g. I prefer Tigrinya translations." : activeLanguage === 'am' ? "ለምሳሌ፦ የአማርኛ ትርጉሞችን እመርጣለሁ" : "ንኣብነት፡ ትግርኛ ትርጉማት ይመርጽ እየ።") : (activeLanguage === 'en' ? "Enable Memory to add details" : activeLanguage === 'am' ? "መረጃ ለመጨመር ትውስታን ያብሩ" : "ሓበሬታ ንምውሳኽ ዝኽሪ ኣንጥፉ")}
                    className={`flex-1 text-xs px-3.5 py-2.5 rounded-xl border font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                      currentTheme.isDark 
                        ? 'bg-white/[0.015] border-white/5 text-white placeholder:text-white/20 focus:border-indigo-500/40' 
                        : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-450 focus:border-indigo-500/40'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={!newMemoryInput.trim() || !isMemoryEnabled}
                    className={`px-3 py-2.5 rounded-xl text-white font-bold text-xs flex items-center justify-center transition-all ${
                      newMemoryInput.trim() && isMemoryEnabled
                        ? 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 cursor-pointer shadow-sm hover:shadow-indigo-500/15' 
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {/* Memories List */}
              <div className={`flex-1 flex flex-col gap-3 min-h-[220px] transition-all duration-300 ${!isMemoryEnabled ? 'opacity-50' : ''}`}>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-50 font-sans flex items-center gap-1.5">
                    <span>{t('activeContexts')} ({memories.length})</span>
                    {!isMemoryEnabled && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-bold uppercase tracking-wider">
                        {t('memoryPaused')}
                      </span>
                    )}
                  </span>
                  {memories.length > 0 && (
                    <button
                      onClick={onClearAllMemories}
                      className="text-[9px] text-rose-500 hover:text-rose-600 font-extrabold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      {t('clear')}
                    </button>
                  )}
                </div>

                {memories.length === 0 ? (
                  <div className={`flex-1 flex flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center gap-3.5 ${
                    currentTheme.isDark ? 'border-white/5 text-white/30' : 'border-slate-200 text-slate-400'
                  }`}>
                    <div className={`p-3 rounded-full ${currentTheme.isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                      <BrainCircuit className="w-5 h-5 opacity-40 text-indigo-500" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold font-sans text-slate-700 dark:text-white/80">Vault is empty</span>
                      <span className="text-[10px] opacity-60 max-w-[200px] font-sans leading-relaxed">
                        No saved details. Speak organically with the assistant or add a fact manually above.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2.5 pr-1">
                    <AnimatePresence initial={false}>
                      {memories.map((memory, index) => (
                        <motion.div
                          key={`mem-${index}-${memory}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className={`flex items-center justify-between p-3.5 rounded-2xl border text-xs leading-relaxed group transition-all duration-200 ${
                            currentTheme.isDark 
                              ? 'bg-white/[0.015] border-white/5 text-white/90 hover:bg-white/[0.035] hover:border-white/10' 
                              : 'bg-slate-50/50 border-slate-205 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          {editingIndex === index ? (
                            <div className="flex flex-col gap-2 flex-1">
                              <input
                                type="text"
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                className={`w-full text-xs px-3 py-2 rounded-xl border font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                                  currentTheme.isDark 
                                    ? 'bg-[#060913] border-white/5 text-white focus:border-indigo-500/40' 
                                    : 'bg-white border-slate-300 text-slate-800 focus:border-indigo-500/40'
                                }`}
                              />
                              <div className="flex justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setEditingIndex(null)}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                                    currentTheme.isDark ? 'hover:bg-white/5 text-white/50 hover:text-white' : 'hover:bg-slate-100 text-slate-500'
                                  }`}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (editingValue.trim()) {
                                      onEditMemory(index, editingValue.trim());
                                    }
                                    setEditingIndex(null);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Check className="w-3 h-3" />
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <React.Fragment>
                              <div className="flex gap-2.5 items-start flex-1 min-w-0 pr-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0 animate-pulse" />
                                <span className="font-medium font-sans text-[11px] break-words text-slate-700 dark:text-white/80 leading-normal">{memory}</span>
                              </div>
                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => {
                                    setEditingIndex(index);
                                    setEditingValue(memory);
                                  }}
                                  className={`p-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${
                                    currentTheme.isDark 
                                      ? 'hover:bg-white/5 text-slate-400 hover:text-indigo-400' 
                                      : 'hover:bg-slate-200/50 text-slate-450 hover:text-indigo-600'
                                  }`}
                                  title="Edit memory"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => onDeleteMemory(index)}
                                  className={`p-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${
                                    currentTheme.isDark 
                                      ? 'hover:bg-white/5 text-slate-400 hover:text-rose-400' 
                                      : 'hover:bg-slate-200/50 text-slate-450 hover:text-rose-600'
                                  }`}
                                  title="Delete memory"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </React.Fragment>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer */}
            <div className={`px-6 py-4 border-t text-[10px] text-center opacity-50 flex items-center justify-center gap-1.5 font-sans shrink-0 ${
              currentTheme.isDark ? 'border-white/5' : 'border-slate-100'
            }`}>
              <Info className="w-3.5 h-3.5" />
              <span>{activeLanguage === 'en' ? 'Memories automatically persist securely across visits.' : activeLanguage === 'am' ? 'ትውስታዎች በራስ-ሰር ደህንነቱ በተጠበቀ ሁኔታ ይቀመጣሉ' : 'ዝኽርታት ብባዕሉ ብውሑስ መንገዲ ይዕቀብ።'}</span>
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};
