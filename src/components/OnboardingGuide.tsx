import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, CheckCircle2, ChevronRight, Zap, Keyboard, BrainCircuit, Camera } from 'lucide-react';

interface OnboardingGuideProps {
  onComplete: () => void;
  isDark: boolean;
}

export const OnboardingGuide: React.FC<OnboardingGuideProps> = ({ onComplete, isDark }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: 'እንቋዕ ብደሓን መጻእኩም!',
      englishTitle: 'Welcome to Tigrina AI',
      subtitle: 'ሓድሽ ናይ ቴክኖሎጂ ተመክሮ • Premium Neural Experience',
      icon: <Sparkles className="w-12 h-12 text-amber-500 animate-pulse" />,
      content: 'ትግርኛን እንግሊዝኛን ብዘደንቕ መንገዲ ዘወሃህድ መስተውዓሊ ናይ ኪቦርድን ኣይፒ (AI) ቴክኖሎጅን። Experience the ultimate high-fidelity intelligent virtual companion designed specifically for Tigrinya & English.',
    },
    {
      title: 'ምቹእ ናይ ድምጺ ኣገልግሎት',
      englishTitle: 'Natural Voice & Smart Keys',
      subtitle: 'ብዘይተሓላለኸ መንገዲ ተጠቐሙ • Effortless & Fluid',
      icon: <Zap className="w-12 h-12 text-indigo-500" />,
      content: 'ብሉጽ ናይ ድምጺ መቐረጺ (Voice Recording Enhancer) ተጠቐሙ። ንጥሙር ናይ ጽሕፈት ተመክሮ፡ ናይ ኮምፒተር ኪቦርድ ምትእስሳር (Physical Sync) ብመበገሲኡ ተዓጽዩ እዩ ዘሎ። Voice Enhancer is active. Physical keyboard sync is off by default for clean typing.',
    },
    {
      title: 'ብሉጽ ናይ ኣይፒ (AI) ትሕዝቶ',
      englishTitle: 'Premium AI Features',
      subtitle: 'TTS Studio, Memory Vault & Personas',
      icon: <BrainCircuit className="w-12 h-12 text-pink-500" />,
      content: 'TTS Studio Pro ንፍሉይ ድምጺ፣ Memory Vault ንነዊሕ ዝኽሪ፣ ከምኡውን ናይ ባህርያት መምርሒ (Custom Rules) ተጠቐሙ። Unlock advanced capabilities: Ge\'ez voice synthesis, long-term context with Memory Vault, and adaptable AI Personas across Tigrinya, Amharic, and English.',
    },
    {
      title: 'ኩሉ ድሉው እዩ!',
      englishTitle: 'Ready to Explore',
      subtitle: 'ናብ መጻኢ ንኺድ • Journey into the Future',
      icon: <Keyboard className="w-12 h-12 text-emerald-500" />,
      content: 'ብሉጽ ናይ ትርጉምን ጽሕፈትን ሓገዝቲ ንምርካብ ሕጂ ጀምሩ። Everything is ready. Unleash creative bilingual AI assistance, perfect translation, and powerful custom layouts. Let’s begin!',
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const currentStep = steps[step];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 "
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse delay-75" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.05, y: -15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className={`w-full max-w-lg rounded-3xl shadow-2xl border overflow-hidden flex flex-col relative z-10 ${
            isDark ? 'bg-slate-900/90 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex-1 p-8 sm:p-12 flex flex-col items-center text-center">
            <div className={`p-5 rounded-2xl mb-6 relative ${isDark ? 'bg-white/5' : 'bg-indigo-50'}`}>
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-amber-500/10 rounded-2xl opacity-50 blur-sm" />
              <div className="relative z-10">{currentStep.icon}</div>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight mb-1">
              {currentStep.title}
            </h2>
            <h4 className={`text-lg sm:text-xl font-bold mb-3 ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
              {currentStep.englishTitle}
            </h4>

            <div className={`inline-block px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider mb-6 ${
              isDark ? 'bg-indigo-500/10 text-indigo-300' : 'bg-indigo-50 text-indigo-700'
            }`}>
              {currentStep.subtitle}
            </div>

            <p className={`text-sm sm:text-base leading-relaxed max-w-md ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {currentStep.content}
            </p>
          </div>

          <div className={`p-6 border-t flex items-center justify-between ${
            isDark ? 'border-white/10 bg-black/30' : 'border-slate-100 bg-slate-50'
          }`}>
            <div className="flex gap-2">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === step ? 'w-6 bg-indigo-500' : 'w-1.5 opacity-20 ' + (isDark ? 'bg-white' : 'bg-black')
                  }`} 
                />
              ))}
            </div>
            <button 
              onClick={handleNext}
              className="px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              <span>{step === steps.length - 1 ? 'ጀምር / Get Started' : 'ቀጽል / Next'}</span>
              {step === steps.length - 1 ? <CheckCircle2 className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};
