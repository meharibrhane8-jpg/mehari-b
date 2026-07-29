import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X } from 'lucide-react';

interface DailyTipProps {
  isDark: boolean;
}

export const DailyTip: React.FC<DailyTipProps> = ({ isDark }) => {
  const [tip, setTip] = useState<string>('');
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Generate contextual tip based on time of day
    const hour = new Date().getHours();
    let timeContext = '';
    if (hour < 12) timeContext = 'morning';
    else if (hour < 18) timeContext = 'afternoon';
    else timeContext = 'evening';

    const tips = [
      `Good ${timeContext}! Did you know you can use voice-to-text to quickly dictate in Tigrinya? Try it now!`,
      `Productive ${timeContext}! Why not organize your tasks in the new Tasks module to stay ahead?`,
      `It's a great ${timeContext} to learn new Ge'ez phrases. Explore the dictionary!`,
      `Need to focus? Enable AI-mode and ask me to help you draft your content efficiently this ${timeContext}.`,
      `Take a moment this ${timeContext} to review your saved memories—they grow with you!`
    ];

    const today = new Date().toISOString().split('T')[0];
    const lastTipDate = localStorage.getItem('geez_last_tip_date');

    if (lastTipDate !== today) {
      const randomTip = tips[Math.floor(Math.random() * tips.length)];
      setTip(randomTip);
      localStorage.setItem('geez_last_tip_date', today);
    } else {
      setIsVisible(false);
    }
  }, []);

  if (!isVisible || !tip) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`fixed top-4 right-4 z-[1000] p-4 rounded-2xl shadow-xl border max-w-sm flex gap-3 items-start ${isDark ? 'bg-indigo-950/80 border-indigo-500/30' : 'bg-white border-indigo-100'}`}
      >
        <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <p className={`text-sm ${isDark ? 'text-indigo-100' : 'text-indigo-900'}`}>{tip}</p>
        <button onClick={() => setIsVisible(false)} className="shrink-0 p-1 hover:bg-black/10 rounded-full">
            <X className={`w-4 h-4 ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
