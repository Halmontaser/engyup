"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, ChevronRight, Trophy, Heart, ChevronLeft } from 'lucide-react';
import ActivityPlayer from './ActivityPlayer';
import LessonSidebar from './LessonSidebar';
import { getMediaUrl } from "@/utils/assets";

interface MediaEntry {
  filename: string;
  url: string;
}

interface ActivityMedia {
  audio: MediaEntry[];
  images: MediaEntry[];
}

interface LessonPlayerProps {
  lesson: {
    id: string;
    title: string;
    description: string;
    lessonNumber: number;
  };
  activities: {
    id: string;
    type: string;
    title: string;
    instruction: string;
    data: any;
    media?: ActivityMedia;
    compensates?: string | null;
  }[];
  onBack?: () => void;
  backHref?: string;
  onLessonComplete?: () => void;
}

export default function LessonPlayer({
  lesson,
  activities,
  onBack,
  backHref,
  onLessonComplete
}: LessonPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEvaluated, setIsEvaluated] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [canContinue, setCanContinue] = useState(false);
  const [triggerCheck, setTriggerCheck] = useState(0);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [completedActivities, setCompletedActivities] = useState<Set<string>>(new Set());

  const total = activities.length;
  const progress = total > 0 ? (currentIndex / total) * 100 : 0;
  const isFinished = currentIndex >= total;

  const currentActivity = activities[currentIndex];

  // Enhanced activities with completion status
  const enhancedActivities = activities.map(activity => ({
    ...activity,
    completed: completedActivities.has(activity.id),
  }));

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backHref) {
      window.location.href = backHref;
    } else {
      window.history.back();
    }
  };

  const handleNext = () => {
    setIsEvaluated(false);
    setIsCorrect(null);
    setCanContinue(false);
    if (currentIndex < total - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(total);
      onLessonComplete?.();
    }
  };

  const handleComplete = (correct?: boolean) => {
    setIsCorrect(correct ?? true);
    setIsEvaluated(true);
    setCanContinue(true);

    // Mark current activity as completed if correct
    if (correct !== false && currentActivity) {
      setCompletedActivities(prev => new Set(prev).add(currentActivity.id));
    }
  };

  const handleActivityClick = (index: number) => {
    // Allow navigation to completed activities or the current activity
    if (index <= currentIndex || enhancedActivities[index]?.completed) {
      setCurrentIndex(index);
      setIsEvaluated(false);
      setIsCorrect(null);
      setCanContinue(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded);
  };

  const handleCheck = () => {
    setTriggerCheck(prev => prev + 1);
  };

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-amber-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Trophy size={48} className="text-white" />
          </div>
          <h1 className="text-4xl font-black mb-4">Lesson Complete!</h1>
          <p className="text-xl text-slate-500 mb-8 font-medium">You dominated this lesson. +12 XP</p>
          <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
            <button onClick={handleBack} className="btn-duo btn-duo-green w-full">Continue</button>
            <button onClick={() => setCurrentIndex(0)} className="btn-ghost w-full">Review Lessons</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* FIXED TOP HEADER */}
      <header className="fixed-top-bar flex items-center justify-between gap-4 md:gap-6 px-4 md:px-10">
        <button
          onClick={handleBack}
          className="text-slate-400 hover:text-slate-600 transition-colors p-1"
        >
          <X size={24} className="md:w-7 md:h-7" strokeWidth={3} />
        </button>

        <div className="flex-1 max-w-2xl px-4">
          <div className="progress-track bg-slate-100 h-4 rounded-full">
            <motion.div
              className="progress-fill bg-green-500 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', stiffness: 50 }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 font-black text-rose-500 text-lg">
          <Heart size={24} fill="currentColor" />
          <span>5</span>
        </div>

        {/* Desktop Sidebar Toggle */}
        <button
          onClick={toggleSidebar}
          className="hidden md:flex items-center justify-center p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
        >
          <ChevronLeft size={20} className={sidebarExpanded ? 'rotate-0' : 'rotate-180'} />
        </button>
      </header>

      {/* SIDEBAR */}
      <LessonSidebar
        activities={enhancedActivities}
        currentIndex={currentIndex}
        onActivityClick={handleActivityClick}
        isExpanded={sidebarExpanded}
        onToggle={toggleSidebar}
      />

      {/* MAIN LEARNING CANVAS */}
      <main className={`main-learning-canvas max-w-5xl mx-auto transition-all duration-300 ${
        sidebarExpanded ? 'md:ml-[280px]' : ''
      }`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full flex flex-col items-center"
          >
              <div className="w-full mb-6 md:mb-10 text-center md:text-left">
                <div className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">
                  Lesson {lesson.lessonNumber}: {lesson.title}
                </div>
                <h2 className="text-2xl md:text-3xl font-black mb-2 md:mb-4 text-slate-800 leading-tight">
                  {currentActivity.instruction || 'Choose the correct option'}
                </h2>
              </div>

             <div className="w-full">
                <ActivityPlayer
                  activity={currentActivity}
                  media={currentActivity.media}
                  onComplete={handleComplete}
                  triggerCheck={triggerCheck}
                />
             </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* FIXED BOTTOM ACTION BAR */}
      <footer className={`fixed-bottom-bar transition-colors duration-300 ${
        isEvaluated 
          ? isCorrect === false ? 'bg-red-100 border-red-200' : 'bg-green-100 border-green-200'
          : 'bg-white'
      }`}>
        <div className="max-w-4xl w-full flex items-center justify-between gap-3 md:gap-4">
          <div className="flex-1 min-w-0">
            {isEvaluated && (
              <div className={`flex items-center gap-2 md:gap-4 ${isCorrect === false ? 'text-red-600' : 'text-green-700'}`}>
                <div className={`w-10 h-10 md:w-12 md:h-12 flex-shrink-0 rounded-full flex items-center justify-center ${isCorrect === false ? 'bg-red-200' : 'bg-green-200'}`}>
                   {isCorrect === false ? <X size={20} className="md:hidden" strokeWidth={4} /> : <Check size={20} className="md:hidden" strokeWidth={4} />}
                   {isCorrect === false ? <X size={24} className="hidden md:block" strokeWidth={4} /> : <Check size={24} className="hidden md:block" strokeWidth={4} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-base md:text-xl leading-none">
                    {isCorrect === false ? 'Incorrect' : 'Amazing Job!'}
                  </h3>
                  <p className="font-bold opacity-80 text-[11px] md:text-sm mt-0.5 md:mt-1 truncate">
                    {isCorrect === false ? 'Check lesson notes.' : 'Keep up the momentum!'}
                  </p>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={canContinue ? handleNext : handleCheck}
            className={`btn-duo flex-shrink-0 ${canContinue ? 'btn-duo-green' : 'btn-duo-gray'} min-w-[120px] md:min-w-[200px] h-12 md:h-16 text-sm md:text-lg`}
          >
            {canContinue ? 'Continue' : 'Check'}
          </button>
        </div>
      </footer>
    </div>
  );
}
