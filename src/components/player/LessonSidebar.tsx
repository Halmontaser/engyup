"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Check, ChevronDown, Edit, Lock, BookOpen, Layers, FileText } from 'lucide-react';
import type { CourseHierarchy, HierarchicalPosition, StudyMode, ModuleNode, LessonNode, ActivityNode } from '@/types/courseHierarchy';

let progressRingCounter = 0;

interface LessonSidebarProps {
  hierarchy: CourseHierarchy;
  currentPosition: HierarchicalPosition;
  studyMode: StudyMode;
  onNavigateToActivity: (moduleId: string, lessonId: string, activityIndex: number) => void;
  onNavigateToLesson: (lessonId: string) => void;
  isExpanded?: boolean;
  onToggle?: () => void;
  canEdit?: boolean;
  onEditActivity?: (activityId: string) => void;
  canNavigateFreely?: boolean;
}

/* ── Circular Progress Ring ─────────────────────────── */
function ProgressRing({ progress, size = 48, strokeWidth = 4 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const gradientId = `progressGradient-${++progressRingCounter}`;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e40af" />
            <stop offset="50%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[11px] font-black bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
          {progress}%
        </span>
      </div>
    </div>
  );
}

export default function LessonSidebar({
  hierarchy,
  currentPosition,
  studyMode,
  onNavigateToActivity,
  onNavigateToLesson,
  isExpanded = true,
  onToggle,
  canEdit = false,
  onEditActivity,
  canNavigateFreely = false,
}: LessonSidebarProps) {
  const [localExpanded, setLocalExpanded] = useState(isExpanded);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());

  // Sync localExpanded when parent-controlled isExpanded changes
  useEffect(() => {
    setLocalExpanded(isExpanded);
  }, [isExpanded]);

  const expanded = onToggle ? isExpanded : localExpanded;

  // Auto-expand current module and lesson
  useEffect(() => {
    const modulesToExpand = new Set<string>();
    const lessonsToExpand = new Set<string>();

    if (currentPosition.moduleId) {
      modulesToExpand.add(currentPosition.moduleId);
    }
    if (currentPosition.lessonId) {
      lessonsToExpand.add(currentPosition.lessonId);
    }
    // Also expand first module if nothing is expanded
    if (hierarchy.modules.length > 0 && modulesToExpand.size === 0) {
      modulesToExpand.add(hierarchy.modules[0].id);
    }

    setExpandedModules(prev => {
      const merged = new Set([...prev, ...modulesToExpand]);
      return merged;
    });
    setExpandedLessons(prev => {
      const merged = new Set([...prev, ...lessonsToExpand]);
      return merged;
    });
  }, [currentPosition.moduleId, currentPosition.lessonId, hierarchy.modules]);

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setLocalExpanded(!expanded);
    }
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const toggleLesson = (lessonId: string) => {
    setExpandedLessons(prev => {
      const newSet = new Set(prev);
      if (newSet.has(lessonId)) {
        newSet.delete(lessonId);
      } else {
        newSet.add(lessonId);
      }
      return newSet;
    });
  };

  // Calculate overall progress
  const totalActivities = hierarchy.modules.reduce(
    (sum, m) => sum + m.lessons.reduce((s, l) => s + l.activities.length, 0), 0
  );
  const completedActivities = hierarchy.modules.reduce(
    (sum, m) => sum + m.lessons.reduce(
      (s, l) => s + l.activities.filter(a => a.completed).length, 0
    ), 0
  );
  const progress = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;

  // Check if an activity is accessible (for guided mode)
  const isActivityAccessible = (moduleId: string, lessonId: string, activityIndex: number): boolean => {
    if (canNavigateFreely) return true;

    // Flatten all activities across all modules/lessons in order
    const flatActivities: { moduleId: string; lessonId: string; index: number }[] = [];
    for (const mod of hierarchy.modules) {
      for (const lesson of mod.lessons) {
        lesson.activities.forEach((_, idx) => {
          flatActivities.push({ moduleId: mod.id, lessonId: lesson.id, index: idx });
        });
      }
    }

    const targetIdx = flatActivities.findIndex(
      a => a.moduleId === moduleId && a.lessonId === lessonId && a.index === activityIndex
    );
    if (targetIdx <= 0) return true; // First activity always accessible

    // Check if previous activity is completed
    const prev = flatActivities[targetIdx - 1];
    const prevLesson = hierarchy.modules
      .find(m => m.id === prev.moduleId)?.lessons
      .find(l => l.id === prev.lessonId);
    const prevActivity = prevLesson?.activities[prev.index];
    return prevActivity?.completed === true;
  };

  // Check if a lesson is accessible
  const isLessonAccessible = (moduleId: string, lessonId: string): boolean => {
    if (canNavigateFreely) return true;

    const flatLessons: { moduleId: string; lessonId: string }[] = [];
    for (const mod of hierarchy.modules) {
      for (const lesson of mod.lessons) {
        flatLessons.push({ moduleId: mod.id, lessonId: lesson.id });
      }
    }

    const targetIdx = flatLessons.findIndex(
      l => l.moduleId === moduleId && l.lessonId === lessonId
    );
    if (targetIdx <= 0) return true;

    const prev = flatLessons[targetIdx - 1];
    const prevLesson = hierarchy.modules
      .find(m => m.id === prev.moduleId)?.lessons
      .find(l => l.id === prev.lessonId);
    return prevLesson?.completed === true;
  };

  const renderActivity = (activity: ActivityNode, moduleId: string, lessonId: string, index: number, totalInLesson: number) => {
    const isActive = currentPosition.activityId === activity.id;
    const isCompleted = activity.completed;
    const accessible = isActivityAccessible(moduleId, lessonId, index);
    const locked = studyMode === 'guided' && !accessible;
    const isLast = index === totalInLesson - 1;

    return (
      <div key={activity.id} className="relative flex gap-0">
        {/* Step connector column */}
        <div className="relative flex flex-col items-center w-6 flex-shrink-0">
          {/* Vertical connector line (above) */}
          {index > 0 && (
            <div className={`absolute top-0 w-0.5 h-2.5 ${
              isCompleted || isActive ? 'bg-gradient-to-b from-primary-400/60 to-primary-400/30' : 'bg-slate-200'
            }`} />
          )}
          {/* Step circle */}
          <div className={`relative z-10 mt-2.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] transition-all duration-300 ${
            locked
              ? 'bg-slate-200 text-slate-400'
              : isActive
              ? 'bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 text-white shadow-md shadow-primary-500/30 ring-2 ring-primary-200'
              : isCompleted
              ? 'bg-green-500 text-white shadow-sm'
              : 'bg-slate-200 text-slate-600'
          }`}>
            {locked ? (
              <Lock size={10} />
            ) : isCompleted ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              >
                <Check size={10} />
              </motion.div>
            ) : (
              <span>{index + 1}</span>
            )}
            {/* Active pulse ring */}
            {isActive && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-primary-400"
                animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
          </div>
          {/* Vertical connector line (below) */}
          {!isLast && (
            <div className={`w-0.5 flex-1 min-h-[8px] ${
              isCompleted ? 'bg-gradient-to-b from-primary-400/30 to-primary-400/10' : 'bg-slate-200'
            }`} />
          )}
        </div>

        {/* Activity card */}
        <motion.div
          onClick={() => {
            if (locked) return;
            onNavigateToActivity(moduleId, lessonId, index);
          }}
          onKeyDown={(e) => {
            if (locked) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNavigateToActivity(moduleId, lessonId, index);
            }
          }}
          className={`flex-1 text-left p-2.5 rounded-lg border transition-all ml-2 mb-1 ${
            locked
              ? 'border-slate-100 bg-slate-50/50 opacity-50 cursor-not-allowed'
              : isActive
              ? 'border-primary-300/50 bg-gradient-to-r from-primary-50 to-accent-50/30 shadow-md shadow-primary-500/10 ring-1 ring-primary-200/50'
              : isCompleted
              ? 'border-green-200 bg-green-50/70'
              : 'border-slate-200 hover:border-primary-200 hover:bg-slate-50 hover:shadow-sm cursor-pointer'
          }`}
          whileHover={locked ? undefined : { scale: 1.015, y: -1 }}
          whileTap={locked ? undefined : { scale: 0.99 }}
          role="button"
          tabIndex={0}
        >
          <div className="flex items-center gap-2">
            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-[10px] leading-tight truncate ${
                locked
                  ? 'text-slate-400'
                  : isActive
                  ? 'text-primary-600'
                  : isCompleted
                  ? 'text-green-700'
                  : 'text-slate-700'
              }`}>
                {activity.instruction || activity.title}
              </p>
              <p className="text-[9px] text-slate-400 capitalize truncate">
                {activity.type.replace(/-/g, ' ')}
              </p>
            </div>

            {/* Edit Button */}
            {canEdit && onEditActivity && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditActivity(activity.id);
                }}
                className="p-1 hover:bg-indigo-100 rounded-lg transition-colors ml-1"
                title="Edit activity"
              >
                <Edit size={12} className="text-indigo-600" />
              </button>
            )}

            {/* Active Indicator — pulsing dot */}
            {isActive && (
              <motion.div
                layoutId="activeActivityIndicator"
                className="flex-shrink-0 w-2 h-2 rounded-full bg-gradient-to-br from-primary-500 to-accent-500"
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
          </div>
        </motion.div>
      </div>
    );
  };

  const renderLesson = (lesson: LessonNode, moduleId: string) => {
    const isLessonExpanded = expandedLessons.has(lesson.id);
    const isCurrentLesson = currentPosition.lessonId === lesson.id;
    const lessonCompleted = lesson.completed;
    const lessonActivityCount = lesson.activities.length;
    const lessonCompletedCount = lesson.activities.filter(a => a.completed).length;
    const lessonProgress = lessonActivityCount > 0 ? lessonCompletedCount / lessonActivityCount : 0;
    const accessible = isLessonAccessible(moduleId, lesson.id);
    const locked = studyMode === 'guided' && !accessible;

    return (
      <div key={lesson.id} className="ml-3">
        <button
          onClick={() => {
            if (locked) return;
            toggleLesson(lesson.id);
            onNavigateToLesson(lesson.id);
          }}
          className={`group w-full flex items-center justify-between p-2.5 rounded-lg transition-all duration-200 ${
            locked
              ? 'bg-slate-50/50 opacity-50 cursor-not-allowed'
              : isCurrentLesson
              ? 'bg-gradient-to-r from-primary-50/80 to-accent-50/30'
              : 'hover:bg-slate-50 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Current lesson pulsing dot */}
            {isCurrentLesson && (
              <motion.div
                className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-primary-500 to-accent-500"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
            <FileText size={14} className={`transition-colors ${locked ? 'text-slate-300' : isCurrentLesson ? 'text-primary-500' : 'text-slate-400 group-hover:text-primary-400'}`} />
            <span className={`text-xs font-semibold truncate transition-colors ${
              locked ? 'text-slate-400' : isCurrentLesson ? 'text-primary-600 font-bold' : 'text-slate-700 group-hover:text-slate-900'
            }`}>
              {lesson.title || `Lesson ${lesson.order_index + 1}`}
            </span>
            {locked && <Lock size={10} className="text-slate-300 flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400">
              {lessonCompletedCount}/{lessonActivityCount}
            </span>
            <div className="w-10 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${lessonCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-primary-500 to-accent-500'}`}
                style={{ width: `${lessonProgress * 100}%` }}
              />
            </div>
            <motion.div
              animate={{ rotate: isLessonExpanded ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <ChevronDown
                size={12}
                className="text-slate-400"
              />
            </motion.div>
          </div>
        </button>

        <AnimatePresence>
          {isLessonExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="ml-3 mt-1 overflow-hidden"
            >
              {lesson.activities.map((activity, idx) =>
                renderActivity(activity, moduleId, lesson.id, idx, lesson.activities.length)
              )}
              {lesson.activities.length === 0 && (
                <p className="text-[10px] text-slate-400 italic p-2">No activities yet</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderModule = (module: ModuleNode) => {
    const isModuleExpanded = expandedModules.has(module.id);
    const isCurrentModule = currentPosition.moduleId === module.id;
    const moduleLessonCount = module.lessons.length;
    const moduleCompletedCount = module.lessons.filter(l => l.completed).length;
    const moduleProgress = moduleLessonCount > 0 ? moduleCompletedCount / moduleLessonCount : 0;

    return (
      <div
        key={module.id}
        className={`relative rounded-xl overflow-hidden transition-all duration-300 ${
          isCurrentModule
            ? 'ring-1 ring-primary-200/60 shadow-md shadow-primary-500/5'
            : 'ring-1 ring-slate-200 hover:ring-primary-200/40 hover:shadow-sm'
        }`}
      >
        {/* Left accent bar for current module */}
        {isCurrentModule && (
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-primary-500 via-accent-500 to-primary-400 rounded-l-xl z-10" />
        )}

        {/* Module Header */}
        <button
          onClick={() => toggleModule(module.id)}
          className={`w-full flex items-center justify-between p-3 transition-all duration-200 ${
            isCurrentModule
              ? 'bg-gradient-to-r from-primary-50/80 via-white to-accent-50/30'
              : 'bg-slate-50/70 hover:bg-slate-100/80'
          }`}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`p-1 rounded-md transition-colors ${isCurrentModule ? 'bg-primary-100/60' : ''}`}>
              <Layers size={16} className={`transition-colors ${isCurrentModule ? 'text-primary-500' : 'text-slate-400'}`} />
            </div>
            <span className={`text-xs font-black uppercase tracking-wide truncate transition-colors ${
              isCurrentModule ? 'text-primary-600' : 'text-slate-600'
            }`}>
              {module.title}
            </span>
            <span className="text-[10px] text-slate-400">
              ({moduleLessonCount})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-semibold">
              {moduleCompletedCount}/{moduleLessonCount}
            </span>
            <div className="w-14 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${moduleProgress * 100}%` }}
                transition={{ duration: 0.5 }}
                className={`h-full rounded-full ${module.completed ? 'bg-green-500' : 'bg-gradient-to-r from-primary-500 to-accent-500'}`}
              />
            </div>
            <motion.div
              animate={{ rotate: isModuleExpanded ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <ChevronDown
                size={14}
                className="text-slate-400"
              />
            </motion.div>
          </div>
        </button>

        {/* Lessons */}
        <AnimatePresence>
          {isModuleExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="border-t border-slate-200/60 p-2 space-y-1 overflow-hidden"
            >
              {module.lessons.map(lesson => renderLesson(lesson, module.id))}
              {module.lessons.length === 0 && (
                <p className="text-[10px] text-slate-400 italic p-2">No lessons yet</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        onClick={handleToggle}
        className={`fixed left-0 top-1/2 -translate-y-1/2 z-50 rounded-r-xl shadow-lg p-2 transition-all border border-l-0 ${expanded ? 'md:hidden' : ''} bg-gradient-to-br from-primary-500 to-accent-500 text-white border-primary-400/30 shadow-primary-500/20 hover:shadow-primary-500/40`}
        whileHover={{ scale: 1.08, x: 2 }}
        whileTap={{ scale: 0.93 }}
        animate={{ boxShadow: ['0 4px 14px rgba(30,64,175,0.2)', '0 4px 20px rgba(6,182,212,0.35)', '0 4px 14px rgba(30,64,175,0.2)'] }}
        transition={{ boxShadow: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } }}
      >
        {expanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </motion.button>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: expanded ? '300px' : '0px' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed left-0 top-0 bottom-0 bg-white/95 backdrop-blur-xl overflow-hidden z-40 hidden md:block"
      >
        {/* Gradient right border */}
        <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary-500/30 via-accent-500/20 to-primary-500/10 z-10" />

        <div className="w-[300px] h-full flex flex-col pt-4">
          {/* Header with Progress */}
          <div className="p-4 border-b border-slate-200/60 bg-gradient-to-br from-slate-50 via-primary-50/20 to-accent-50/10 relative overflow-hidden shrink-0">
            {/* Subtle decorative orb */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-primary-200/20 to-accent-200/20 rounded-full blur-xl" />
            <div className="flex items-center justify-between mb-3 relative z-10">
              <h3 className="font-black text-sm uppercase tracking-wider bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                Course Progress
              </h3>
              <ProgressRing progress={progress} size={44} strokeWidth={3.5} />
            </div>
            {/* Shimmer progress bar */}
            <div className="w-full bg-slate-200/70 rounded-full h-2.5 overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-primary-500 via-accent-400 to-accent-500 rounded-full relative overflow-hidden"
              >
                {/* Shimmer overlay */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
                />
              </motion.div>
            </div>
            <p className="text-xs text-slate-500 mt-2 font-semibold relative z-10">
              {completedActivities} of {totalActivities} activities
            </p>
          </div>

          {/* Modules Tree */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 sidebar-scroll min-h-0">
            {hierarchy.modules.map(module => renderModule(module))}
            {hierarchy.modules.length === 0 && (
              <div className="text-center py-8">
                <BookOpen size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs text-slate-400">No content available</p>
              </div>
            )}
          </div>

          {/* Collapse Button */}
          <div className="p-3 border-t border-slate-200/60 bg-gradient-to-r from-slate-50 to-white shrink-0">
            <button
              onClick={handleToggle}
              className="group w-full flex items-center justify-center gap-2 p-2 rounded-lg transition-all duration-200 text-slate-500 font-semibold text-sm hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50/30 hover:text-primary-600"
            >
              <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
              <span>Collapse</span>
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Mobile Bottom Sheet */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 32 }}
            className="fixed left-0 right-0 bottom-0 bg-white/95 backdrop-blur-xl border-t border-slate-200/60 rounded-t-2xl shadow-2xl shadow-slate-900/20 z-50 md:hidden max-h-[60vh] flex flex-col"
          >
            {/* Drag handle pill */}
            <div className="flex justify-center pt-2 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-300/80" />
            </div>

            {/* Header */}
            <div className="px-4 pb-3 pt-1 border-b border-slate-200/60 bg-gradient-to-br from-slate-50 via-primary-50/10 to-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <ProgressRing progress={progress} size={40} strokeWidth={3} />
                <div>
                  <h3 className="font-black text-sm bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">Course Progress</h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    {completedActivities} / {totalActivities} activities
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggle}
                className="p-2 hover:bg-primary-50 rounded-lg transition-colors"
              >
                <ChevronRight size={20} className="text-slate-500" />
              </button>
            </div>

            {/* Modules Tree */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 sidebar-scroll min-h-0">
              {hierarchy.modules.map(module => renderModule(module))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
