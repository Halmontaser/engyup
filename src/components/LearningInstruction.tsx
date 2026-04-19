import { motion } from 'motion/react';
import { Lightbulb, MousePointer2, Volume2, Sparkles } from 'lucide-react';

interface LearningInstructionProps {
  title: string;
  description: string;
  icon?: 'lightbulb' | 'mouse' | 'volume' | 'sparkles';
}

export function LearningInstruction({ title, description, icon = 'lightbulb' }: LearningInstructionProps) {
  const icons = {
    lightbulb: <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6" />,
    mouse: <MousePointer2 className="w-5 h-5 sm:w-6 sm:h-6" />,
    volume: <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />,
    sparkles: <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full mb-6 sm:mb-8 md:mb-10 text-center md:text-left"
    >
      <div className="bg-gradient-to-br from-blue-50 via-white to-cyan-50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border-2 border-blue-100 shadow-lg shadow-blue-500/10 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-tr from-purple-400/10 to-blue-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

        <div className="relative flex items-start gap-3 sm:gap-4 md:gap-6">
          {/* Icon */}
          <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            {icons[icon]}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black mb-1.5 sm:mb-2 md:mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-cyan-600 to-blue-700 leading-tight">
              {title}
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-600 leading-relaxed font-medium">
              {description}
            </p>
          </div>
        </div>

        {/* Accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-purple-500" />
      </div>
    </motion.div>
  );
}

