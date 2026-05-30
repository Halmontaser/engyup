"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, ChevronRight, ChevronDown, Trophy, Heart, ChevronLeft, Edit, Sparkles, Star, Zap } from 'lucide-react';
import ActivityPlayer from './ActivityPlayer';
import LessonSidebar from './LessonSidebar';
import { getMediaUrl } from "@/utils/assets";
import { stopAllAudio } from "@/utils/audio";
import { useAuth } from "@/context/AuthContext";
import { useStudyMode } from "@/context/StudyModeContext";
import type { CourseHierarchy, HierarchicalPosition, ModuleNode, LessonNode, ActivityNode } from '@/types/courseHierarchy';

interface LessonPlayerProps {
  courseHierarchy: CourseHierarchy;
  initialPosition: HierarchicalPosition;
  onBack?: () => void;
  onNavigate?: (courseId: string, lessonId: string, activityIndex?: number) => void;
  onLessonComplete?: (lessonId: string) => void;
  onActivityComplete?: (activityId: string) => void;
}

// Confetti particle component for celebration
function ConfettiParticle({ delay, color }: { delay: number; color: string }) {
  const randomX = Math.random() * 100;
  const randomRotation = Math.random() * 360;
  const randomScale = 0.5 + Math.random() * 0.8;
  const duration = 2 + Math.random() * 2;

  return (
    <motion.div
      initial={{ y: -20, x: `${randomX}vw`, opacity: 1, rotate: 0, scale: randomScale }}
      animate={{
        y: '100vh',
        rotate: randomRotation + 360,
        opacity: [1, 1, 0],
      }}
      transition={{ duration, delay, ease: 'linear' }}
      className="fixed top-0 z-[100] pointer-events-none"
      style={{
        width: '10px',
        height: '10px',
        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
        backgroundColor: color,
      }}
    />
  );
}

// Celebration confetti burst
function CelebrationConfetti() {
  const colors = ['#1e40af', '#06b6d4', '#a855f7', '#f59e0b', '#10b981', '#ec4899', '#0ea5e9'];
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    delay: Math.random() * 0.5,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {particles.map(p => (
        <ConfettiParticle key={p.id} delay={p.delay} color={p.color} />
      ))}
    </div>
  );
}

export default function LessonPlayer({
  courseHierarchy,
  initialPosition,
  onBack,
  onNavigate,
  onLessonComplete,
  onActivityComplete,
}: LessonPlayerProps) {
  const [position, setPosition] = useState<HierarchicalPosition>(initialPosition);
  const [isEvaluated, setIsEvaluated] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [canContinue, setCanContinue] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [instructionExpanded, setInstructionExpanded] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const { canEditActivities } = useAuth();
  const mainRef = useRef<HTMLDivElement>(null);

  // Auto-collapse instruction after 6 seconds
  useEffect(() => {
    setInstructionExpanded(true);
    const timer = setTimeout(() => setInstructionExpanded(false), 6000);
    return () => clearTimeout(timer);
  }, [position.activityIndex]);

  const { mode, isFreeMode, isToggleVisible, setMode } = useStudyMode();

  // Sync local position when parent changes initialPosition (e.g. sidebar lesson nav)
  useEffect(() => {
    stopAllAudio();
    setPosition(initialPosition);
    setIsEvaluated(false);
    setIsCorrect(null);
    setCanContinue(false);
  }, [initialPosition.moduleId, initialPosition.lessonId, initialPosition.activityIndex]);

  // Derive current module, lesson, and activities from position
  const currentModule = useMemo(() =>
    courseHierarchy.modules.find(m => m.id === position.moduleId),
    [courseHierarchy.modules, position.moduleId]
  );

  const currentLesson = useMemo(() =>
    currentModule?.lessons.find(l => l.id === position.lessonId),
    [currentModule, position.lessonId]
  );

  const currentActivities = useMemo(() =>
    currentLesson?.activities || [],
    [currentLesson]
  );

  const currentActivity = currentActivities[position.activityIndex] || null;

  // Progress within current lesson
  const total = currentActivities.length;
  const completedCount = currentActivities.filter(a => a.completed).length;
  const progress = total > 0 ? (position.activityIndex / total) * 100 : 0;
  const isFinished = position.activityIndex >= total;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  const handleNext = () => {
    stopAllAudio();
    setIsEvaluated(false);
    setIsCorrect(null);
    setCanContinue(false);

    const nextIndex = position.activityIndex + 1;

    if (nextIndex < total) {
      // Move to next activity in same lesson
      setPosition(prev => ({
        ...prev,
        activityId: currentActivities[nextIndex].id,
        activityIndex: nextIndex,
      }));
    } else {
      // All activities done in this lesson - try to move to next lesson
      const next = findNextLesson(courseHierarchy, position.moduleId, position.lessonId);
      if (next && onNavigate) {
        onLessonComplete?.(position.lessonId);
        onNavigate(courseHierarchy.id, next.lesson.id);
      } else {
        // No more lessons - mark complete and show finished
        onLessonComplete?.(position.lessonId);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4000);
        setPosition(prev => ({ ...prev, activityIndex: nextIndex })); // trigger isFinished
      }
    }
  };

  const handleComplete = (correct?: boolean) => {
    setIsCorrect(correct ?? true);
    setIsEvaluated(true);
    setCanContinue(true);

    if (correct !== false && currentActivity) {
      onActivityComplete?.(currentActivity.id);
    }
  };

  const handleNavigateToActivity = (moduleId: string, lessonId: string, activityIndex: number) => {
    // If navigating to a different lesson
    if (lessonId !== position.lessonId && onNavigate) {
      onNavigate(courseHierarchy.id, lessonId, activityIndex);
      return;
    }

    // Same lesson, different activity
    const targetActivity = currentActivities[activityIndex];
    if (targetActivity) {
      setPosition(prev => ({
        ...prev,
        moduleId,
        lessonId,
        activityId: targetActivity.id,
        activityIndex,
      }));
      setIsEvaluated(false);
      setIsCorrect(null);
      setCanContinue(false);
    }
  };

  const handleNavigateToLesson = (lessonId: string) => {
    if (onNavigate) {
      onNavigate(courseHierarchy.id, lessonId);
    }
  };

  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded);
  };

  const handleEditActivity = () => {
    if (currentActivity) {
      window.location.href = `/admin/activities/${currentActivity.id}`;
    }
  };

  // Lesson title for display
  const lessonTitle = currentLesson?.title || 'Lesson';
  const lessonNumber = currentModule ?
    currentModule.lessons.findIndex(l => l.id === position.lessonId) + 1 : 1;

  if (isFinished) {
    return (
      <>
        {showConfetti && <CelebrationConfetti />}
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20 p-8 relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-primary-400/10 to-accent-400/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-br from-accent-400/10 to-secondary-400/10 rounded-full blur-3xl" />
          </div>

          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="text-center relative z-10"
          >
            {/* Trophy with animated glow */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.2 }}
              className="relative mx-auto mb-8"
            >
              <div className="w-28 h-28 bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-amber-300/50">
                <Trophy size={52} className="text-white drop-shadow-lg" />
              </div>
              {/* Animated rings */}
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full border-2 border-amber-300"
              />
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                className="absolute inset-0 rounded-full border-2 border-amber-200"
              />
              {/* Floating stars */}
              <motion.div
                animate={{ y: [-5, 5, -5], rotate: [0, 15, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-2 -right-2"
              >
                <Star size={20} className="text-amber-400 fill-amber-400" />
              </motion.div>
              <motion.div
                animate={{ y: [5, -5, 5], rotate: [0, -15, 0] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="absolute -bottom-1 -left-3"
              >
                <Sparkles size={18} className="text-cyan-400" />
              </motion.div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 bg-clip-text text-transparent"
            >
              Lesson Complete!
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center gap-2 mb-8"
            >
              <div className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-primary-50 to-accent-50 rounded-full border border-primary-200">
                <Zap size={18} className="text-accent-500" />
                <span className="text-lg font-bold text-primary-700">+12 XP</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col gap-3 w-full max-w-xs mx-auto"
            >
              <button
                onClick={handleBack}
                className="lesson-complete-btn-primary w-full"
              >
                <span className="flex items-center justify-center gap-2">
                  Continue
                  <ChevronRight size={20} />
                </span>
              </button>
              <button
                onClick={() => setPosition(prev => ({ ...prev, activityIndex: 0 }))}
                className="btn-ghost w-full"
              >
                Review Lessons
              </button>
            </motion.div>
          </motion.div>
        </div>
      </>
    );
  }

  if (!currentActivity) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20 p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles size={28} className="text-slate-400" />
          </div>
          <p className="text-slate-500 font-medium mb-4">No activities found for this lesson.</p>
          <button onClick={handleBack} className="lesson-complete-btn-primary">Go Back</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="lesson-viewport bg-gradient-to-br from-slate-50/80 via-white to-blue-50/30 text-slate-900 font-sans">
      {/* FIXED TOP HEADER - Premium Glassmorphism */}
      <header className="lesson-player-header">
        {/* Subtle gradient line at very top */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 opacity-80" />

        <button
          onClick={handleBack}
          className="text-slate-400 hover:text-slate-600 transition-all p-1.5 hover:bg-slate-100 rounded-lg group"
        >
          <X size={22} className="md:w-6 md:h-6 group-hover:rotate-90 transition-transform duration-300" strokeWidth={2.5} />
        </button>

        {/* Progress Bar with step indicators */}
        <div className="flex-1 max-w-2xl px-4">
          <div className="relative">
            {/* Step dots */}
            <div className="absolute -top-1 left-0 right-0 flex justify-between px-0.5 z-10">
              {currentActivities.map((_, idx) => (
                <motion.div
                  key={idx}
                  initial={false}
                  animate={{
                    scale: idx === position.activityIndex ? 1.3 : 1,
                    backgroundColor: idx < position.activityIndex
                      ? '#10b981'
                      : idx === position.activityIndex
                      ? '#1e40af'
                      : '#e2e8f0',
                  }}
                  className="w-2 h-2 rounded-full transition-colors relative"
                  style={{ display: total > 15 ? 'none' : 'block' }}
                />
              ))}
            </div>
            {/* Progress track */}
            <div className="progress-track bg-slate-100/80 h-3.5 rounded-full overflow-hidden backdrop-blur-sm border border-slate-200/50 mt-1.5">
              <motion.div
                className="lesson-progress-fill h-full rounded-full relative"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ type: 'spring', stiffness: 50, damping: 15 }}
              />
            </div>
            {/* Activity counter */}
            <div className="flex justify-between mt-1">
              <span className="text-[10px] font-semibold text-slate-400">
                {position.activityIndex + 1} / {total}
              </span>
              <span className="text-[10px] font-bold text-primary-500">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
        </div>

        {/* Hearts with pulse animation */}
        <motion.div
          className="flex items-center gap-1.5 font-black text-rose-500 text-lg"
          whileHover={{ scale: 1.05 }}
        >
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Heart size={22} fill="currentColor" className="drop-shadow-sm" />
          </motion.div>
          <span className="text-base">5</span>
        </motion.div>

        {/* Study Mode Toggle - only visible for students */}
        {isToggleVisible && (
          <div className="flex items-center bg-slate-100/80 backdrop-blur-sm rounded-xl p-0.5 border border-slate-200/50">
            <button
              onClick={() => setMode('free')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 ${
                isFreeMode
                  ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-md shadow-primary-500/20'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Free
            </button>
            <button
              onClick={() => setMode('guided')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 ${
                !isFreeMode
                  ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-md shadow-primary-500/20'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Guided
            </button>
          </div>
        )}

        {canEditActivities && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleEditActivity}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-600 rounded-xl font-medium transition-all border border-indigo-200/60"
            title="Edit this activity"
          >
            <Edit size={15} />
            <span className="hidden sm:inline text-sm">Edit</span>
          </motion.button>
        )}

        {/* Desktop Sidebar Toggle */}
        <button
          onClick={toggleSidebar}
          className="hidden md:flex items-center justify-center p-2 hover:bg-slate-100 rounded-lg transition-all text-slate-500 hover:text-primary-500"
        >
          <ChevronLeft size={20} className={`transition-transform duration-300 ${sidebarExpanded ? 'rotate-0' : 'rotate-180'}`} />
        </button>
      </header>

      {/* SIDEBAR */}
      <LessonSidebar
        hierarchy={courseHierarchy}
        currentPosition={position}
        studyMode={mode}
        onNavigateToActivity={handleNavigateToActivity}
        onNavigateToLesson={handleNavigateToLesson}
        isExpanded={sidebarExpanded}
        onToggle={toggleSidebar}
        canEdit={canEditActivities}
        onEditActivity={(activityId) => {
          window.location.href = `/admin/activities/${activityId}`;
        }}
        canNavigateFreely={isFreeMode}
      />

      {/* MAIN LEARNING CANVAS */}
      <main
        ref={mainRef}
        className={`lesson-main-content transition-all duration-300 ${
          sidebarExpanded ? 'md:pl-[300px]' : ''
        }`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${position.lessonId}-${position.activityIndex}`}
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full max-w-5xl flex flex-col items-center"
          >
            {/* Lesson title & instruction area */}
            <div className="w-full mb-3 md:mb-4 text-center md:text-left">
              <div className="flex items-center justify-between">
                {/* Lesson badge */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-primary-50 to-accent-50 rounded-full border border-primary-200/50"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 animate-pulse" />
                  <span className="text-xs font-bold text-primary-600 uppercase tracking-widest">
                    Lesson {lessonNumber}: {lessonTitle}
                  </span>
                </motion.div>
                <button
                  onClick={() => setInstructionExpanded(!instructionExpanded)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-primary-500 transition-colors p-1.5 hover:bg-primary-50 rounded-lg"
                >
                  <span>{instructionExpanded ? 'Hide' : 'Show'}</span>
                  <ChevronDown size={14} className={`transition-transform duration-300 ${instructionExpanded ? 'rotate-180' : ''}`} />
                </button>
              </div>
              <AnimatePresence>
                {instructionExpanded && (
                  <motion.h2
                    initial={{ height: 0, opacity: 0, y: -5 }}
                    animate={{ height: 'auto', opacity: 1, y: 0 }}
                    exit={{ height: 0, opacity: 0, y: -5 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="text-xl md:text-2xl font-black mt-2 text-slate-800 leading-tight overflow-hidden"
                  >
                    {currentActivity.instruction || currentActivity.title || 'Choose the correct option'}
                  </motion.h2>
                )}
              </AnimatePresence>
            </div>

            <div className="w-full">
              <ActivityPlayer
                activity={currentActivity}
                media={currentActivity.media}
                onComplete={handleComplete}
                showControls={position.activityIndex === 0}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* FIXED BOTTOM ACTION BAR — Only show after check */}
      {isEvaluated && (
        <footer
          className={`lesson-feedback-bar ${
            isCorrect === false ? 'lesson-feedback-incorrect' : 'lesson-feedback-correct'
          }`}
        >
          {/* Animated gradient accent line */}
          <div className={`absolute top-0 left-0 right-0 h-[3px] ${
            isCorrect === false
              ? 'bg-gradient-to-r from-red-400 via-red-500 to-red-400'
              : 'bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-400'
          }`} />

          <div className="max-w-4xl w-full flex items-center justify-between gap-3 md:gap-4">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }}
              className={`flex items-center gap-2.5 md:gap-4 flex-1 min-w-0 ${isCorrect === false ? 'text-red-600' : 'text-emerald-700'}`}
            >
              {/* Animated icon circle */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 15, delay: 0.15 }}
                className={`w-11 h-11 md:w-14 md:h-14 flex-shrink-0 rounded-full flex items-center justify-center shadow-lg ${
                  isCorrect === false
                    ? 'bg-gradient-to-br from-red-400 to-red-500 shadow-red-200'
                    : 'bg-gradient-to-br from-emerald-400 to-green-500 shadow-green-200'
                }`}
              >
                {isCorrect === false
                  ? <X size={22} className="text-white md:hidden" strokeWidth={3} />
                  : <Check size={22} className="text-white md:hidden" strokeWidth={3} />
                }
                {isCorrect === false
                  ? <X size={28} className="text-white hidden md:block" strokeWidth={3} />
                  : <Check size={28} className="text-white hidden md:block" strokeWidth={3} />
                }
              </motion.div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-base md:text-xl leading-none">
                  {isCorrect === false ? 'Incorrect' : 'Amazing Job!'}
                </h3>
                <p className="font-semibold opacity-70 text-[11px] md:text-sm mt-0.5 md:mt-1 truncate">
                  {isCorrect === false ? 'Review and try again.' : 'Keep up the momentum!'}
                </p>
              </div>
            </motion.div>

            <motion.button
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.2 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleNext}
              className={`lesson-continue-btn flex-shrink-0 min-w-[120px] md:min-w-[200px] h-12 md:h-14 text-sm md:text-base ${
                isCorrect === false
                  ? 'lesson-continue-btn-retry'
                  : 'lesson-continue-btn-success'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                Continue
                <ChevronRight size={18} className="md:w-5 md:h-5" />
              </span>
            </motion.button>
          </div>
        </footer>
      )}
    </div>
  );
}

// Helper: find the next lesson in the hierarchy (works across modules/units)
function findNextLesson(hierarchy: CourseHierarchy, currentModuleId: string, currentLessonId: string): { moduleId: string; lesson: LessonNode } | null {
  const flatLessons: { moduleId: string; lesson: LessonNode }[] = [];
  for (const mod of hierarchy.modules) {
    for (const lesson of mod.lessons) {
      flatLessons.push({ moduleId: mod.id, lesson });
    }
  }

  const currentIdx = flatLessons.findIndex(
    l => l.moduleId === currentModuleId && l.lesson.id === currentLessonId
  );

  if (currentIdx >= 0 && currentIdx < flatLessons.length - 1) {
    return flatLessons[currentIdx + 1];
  }
  return null;
}
