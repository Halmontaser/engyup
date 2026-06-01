"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, Star, Zap, Flame, Award, Sparkles, PartyPopper, Target } from "lucide-react";

export type MilestoneType =
  | "lesson-complete"
  | "module-complete"
  | "streak-3"
  | "streak-5"
  | "streak-10";

interface MilestoneSlideProps {
  type: MilestoneType;
  title?: string;
  xp?: number;
  onDismiss: () => void;
}

const configs: Record<MilestoneType, {
  icon: React.ElementType;
  emoji: string;
  title: string;
  subtitle: string;
  gradient: string;
  glow: string;
}> = {
  "lesson-complete": {
    icon: Trophy,
    emoji: "🏆",
    title: "Lesson Complete!",
    subtitle: "You finished all activities",
    gradient: "from-amber-400 via-orange-500 to-rose-500",
    glow: "shadow-amber-300/50",
  },
  "module-complete": {
    icon: Award,
    emoji: "🌟",
    title: "Module Complete!",
    subtitle: "Outstanding achievement",
    gradient: "from-violet-400 via-purple-500 to-fuchsia-500",
    glow: "shadow-purple-300/50",
  },
  "streak-3": {
    icon: Flame,
    emoji: "🔥",
    title: "3-Day Streak!",
    subtitle: "You're on fire",
    gradient: "from-orange-400 via-red-500 to-rose-500",
    glow: "shadow-orange-300/50",
  },
  "streak-5": {
    icon: Zap,
    emoji: "⚡",
    title: "5 in a Row!",
    subtitle: "Unstoppable accuracy",
    gradient: "from-cyan-400 via-blue-500 to-indigo-500",
    glow: "shadow-blue-300/50",
  },
  "streak-10": {
    icon: Target,
    emoji: "💎",
    title: "10 in a Row!",
    subtitle: "Perfect precision",
    gradient: "from-emerald-400 via-teal-500 to-cyan-500",
    glow: "shadow-emerald-300/50",
  },
};

function FloatingParticle({ delay, color, size }: { delay: number; color: string; size: number }) {
  const x = Math.random() * 100;
  const rotation = Math.random() * 360;
  const duration = 2.5 + Math.random() * 3;

  return (
    <motion.div
      initial={{ y: "110vh", x: `${x}vw`, opacity: 0, rotate: 0 }}
      animate={{ y: "-10vh", opacity: [0, 1, 1, 0], rotate: rotation + 180 }}
      transition={{ duration, delay, ease: "easeOut" }}
      className="fixed z-[200] pointer-events-none"
      style={{ width: size, height: size, borderRadius: "50%", backgroundColor: color }}
    />
  );
}

export default function MilestoneSlide({ type, title, xp, onDismiss }: MilestoneSlideProps) {
  const [visible, setVisible] = useState(true);
  const cfg = configs[type];
  const Icon = cfg.icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 400);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    delay: Math.random() * 1.5,
    color: ["#fbbf24", "#f97316", "#ef4444", "#8b5cf6", "#06b6d4", "#10b981", "#ec4899"][
      Math.floor(Math.random() * 7)
    ],
    size: 6 + Math.random() * 10,
  }));

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => { setVisible(false); setTimeout(onDismiss, 400); }}
        >
          {/* Particles */}
          {particles.map((p) => (
            <FloatingParticle key={p.id} delay={p.delay} color={p.color} size={p.size} />
          ))}

          {/* Main card */}
          <motion.div
            initial={{ scale: 0.3, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="relative mx-4 w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Top gradient banner */}
            <div className={`relative bg-gradient-to-r ${cfg.gradient} p-8 pb-6 text-center`}>
              {/* Glow orb behind icon */}
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <div className={`w-32 h-32 rounded-full bg-white blur-2xl ${cfg.glow}`} />
              </div>

              {/* Animated icon ring */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.2 }}
                className="relative mx-auto w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4"
              >
                <Icon size={40} className="text-white drop-shadow-lg" />
                {/* Pulsing ring */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-white/40"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-black text-white drop-shadow-md"
              >
                {cfg.emoji} {title || cfg.title}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-white/80 font-semibold mt-1 text-sm"
              >
                {cfg.subtitle}
              </motion.p>
            </div>

            {/* Bottom section */}
            <div className="p-6 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 25, delay: 0.5 }}
                className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 shadow-sm"
              >
                <Sparkles size={18} className="text-amber-500" />
                <span className="text-lg font-black text-amber-700">
                  +{xp || (type === "module-complete" ? 50 : type === "lesson-complete" ? 20 : type === "streak-10" ? 30 : 15)} XP
                </span>
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                onClick={() => { setVisible(false); setTimeout(onDismiss, 400); }}
                className={`mt-4 w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r ${cfg.gradient} hover:opacity-90 transition-opacity shadow-lg`}
              >
                Continue
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
