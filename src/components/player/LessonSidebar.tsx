"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Check, ChevronDown, ChevronUp } from 'lucide-react';

export interface Activity {
  id: string;
  type: string;
  title: string;
  instruction: string;
  unit?: string;
  completed?: boolean;
}

export interface Unit {
  id: string;
  name: string;
  activities: Activity[];
}

interface LessonSidebarProps {
  activities: Activity[];
  currentIndex: number;
  onActivityClick: (index: number) => void;
  isExpanded?: boolean;
  onToggle?: () => void;
}

// Group activities by unit
function groupActivitiesByUnit(activities: Activity[]): Unit[] {
  const grouped = new Map<string, Activity[]>();

  activities.forEach((activity, index) => {
    const unitName = activity.unit || `Unit ${getUnitIndex(activities, activity) + 1}`;
    if (!grouped.has(unitName)) {
      grouped.set(unitName, []);
    }
    grouped.set(unitName, [...grouped.get(unitName)!, { ...activity, index }]);
  });

  return Array.from(grouped.entries()).map(([name, activities]) => ({
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    activities: activities.map((a: any) => ({ ...a, globalIndex: a.index })),
  }));
}

function getUnitIndex(activities: Activity[], activity: Activity): number {
  const units: string[] = [];
  activities.forEach(a => {
    const unitName = a.unit || `Unit ${activities.length}`;
    if (!units.includes(unitName)) {
      units.push(unitName);
    }
  });
  return units.indexOf(activity.unit || `Unit ${activities.length}`);
}

export default function LessonSidebar({
  activities,
  currentIndex,
  onActivityClick,
  isExpanded = true,
  onToggle,
}: LessonSidebarProps) {
  const [localExpanded, setLocalExpanded] = useState(isExpanded);
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());

  const expanded = onToggle ? isExpanded : localExpanded;

  // Expand the first unit by default, and ensure current activity's unit is expanded
  useEffect(() => {
    if (activities.length > 0) {
      const units = groupActivitiesByUnit(activities);
      if (units.length > 0) {
        // Find which unit contains the current activity
        const currentUnitId = units.find(unit =>
          unit.activities.some((a: any) => a.globalIndex === currentIndex)
        )?.id;

        // Expand the first unit and the unit containing the current activity
        const unitsToExpand = new Set<string>();
        unitsToExpand.add(units[0].id);
        if (currentUnitId) {
          unitsToExpand.add(currentUnitId);
        }
        setExpandedUnits(unitsToExpand);
      }
    }
  }, [activities, currentIndex]);

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setLocalExpanded(!expanded);
    }
  };

  const toggleUnit = (unitId: string) => {
    setExpandedUnits(prev => {
      const newSet = new Set(prev);
      if (newSet.has(unitId)) {
        newSet.delete(unitId);
      } else {
        newSet.add(unitId);
      }
      return newSet;
    });
  };

  const units = groupActivitiesByUnit(activities);

  const progress = activities.length > 0
    ? Math.round((activities.filter(a => a.completed).length / activities.length) * 100)
    : 0;

  return (
    <>
      {/* Toggle Button - Always visible on mobile */}
      <motion.button
        onClick={handleToggle}
        className={`fixed left-0 top-1/2 -translate-y-1/2 z-40 bg-white border-2 border-slate-200 rounded-r-xl shadow-lg p-2 hover:bg-slate-50 transition-colors ${expanded ? 'md:hidden' : ''}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {expanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </motion.button>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: expanded ? '280px' : '0px' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed left-0 top-[64px] md:top-[80px] bottom-[90px] md:bottom-[120px] bg-white border-r-2 border-slate-200 overflow-hidden z-30 hidden md:block"
      >
        <div className="w-[280px] h-full flex flex-col">
          {/* Header with Progress */}
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">
                Progress
              </h3>
              <span className="text-2xl font-black text-primary">
                {progress}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
              />
            </div>
            <p className="text-xs text-slate-500 mt-2 font-semibold">
              {activities.filter(a => a.completed).length} of {activities.length} completed
            </p>
          </div>

          {/* Units List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {units.map((unit, unitIndex) => {
              const isUnitExpanded = expandedUnits.has(unit.id);
              const unitCompleted = unit.activities.every(a => a.completed);
              const unitProgress = unit.activities.filter(a => a.completed).length / unit.activities.length;

              return (
                <div key={unit.id} className="border border-slate-200 rounded-xl overflow-hidden">
                  {/* Unit Header */}
                  <button
                    onClick={() => toggleUnit(unit.id)}
                    className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xs font-black text-slate-600 uppercase">
                        {unit.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        ({unit.activities.length})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Unit Progress */}
                      <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${unitProgress * 100}%` }}
                          transition={{ duration: 0.5 }}
                          className={`h-full rounded-full ${
                            unitCompleted ? 'bg-green-500' : 'bg-primary'
                          }`}
                        />
                      </div>
                      <ChevronDown
                        size={14}
                        className={`transition-transform ${isUnitExpanded ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </button>

                  {/* Activities in Unit */}
                  <AnimatePresence>
                    {isUnitExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-200 p-2 space-y-1"
                      >
                        {unit.activities.map((activity: any) => {
                          const isActive = (activity as any).globalIndex === currentIndex;
                          const isCompleted = activity.completed;

                          return (
                            <motion.button
                              key={activity.id}
                              onClick={() => onActivityClick((activity as any).globalIndex)}
                              className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                                isActive
                                  ? 'border-primary bg-primary-light shadow-sm'
                                  : isCompleted
                                  ? 'border-green-200 bg-green-50'
                                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                            >
                              <div className="flex items-center gap-2">
                                {/* Step Number */}
                                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                  isActive
                                    ? 'bg-primary text-white'
                                    : isCompleted
                                    ? 'bg-green-500 text-white'
                                    : 'bg-slate-200 text-slate-600'
                                }`}>
                                  {isCompleted ? (
                                    <Check size={10} />
                                  ) : (
                                    <span>{(activity as any).globalIndex + 1}</span>
                                  )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <p className={`font-semibold text-[10px] leading-tight truncate ${
                                    isActive
                                      ? 'text-primary'
                                      : isCompleted
                                      ? 'text-green-700'
                                      : 'text-slate-700'
                                  }`}>
                                    {activity.instruction || activity.title}
                                  </p>
                                </div>

                                {/* Active Indicator */}
                                {isActive && (
                                  <motion.div
                                    layoutId="activeIndicator"
                                    className="flex-shrink-0 w-1.5 h-1.5 bg-primary rounded-full"
                                  />
                                )}
                              </div>
                            </motion.button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Collapse Button (Desktop) */}
          <div className="p-3 border-t border-slate-200 bg-slate-50">
            <button
              onClick={handleToggle}
              className="w-full flex items-center justify-center gap-2 p-2 rounded-lg hover:bg-slate-200 transition-colors text-slate-600 font-semibold text-sm"
            >
              <ChevronLeft size={16} />
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
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-0 right-0 bottom-0 bg-white border-t-2 border-slate-200 rounded-t-2xl shadow-2xl z-40 md:hidden max-h-[70vh] flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center">
                  <span className="font-black text-primary">{progress}%</span>
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-sm">Progress</h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    {activities.filter(a => a.completed).length} / {activities.length}
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggle}
                className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Units List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {units.map((unit) => {
                const isUnitExpanded = expandedUnits.has(unit.id);
                const unitCompleted = unit.activities.every(a => a.completed);
                const unitProgress = unit.activities.filter(a => a.completed).length / unit.activities.length;

                return (
                  <div key={unit.id} className="border border-slate-200 rounded-xl overflow-hidden">
                    {/* Unit Header */}
                    <button
                      onClick={() => toggleUnit(unit.id)}
                      className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-xs font-black text-slate-600 uppercase">
                          {unit.name}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold">
                          ({unit.activities.length})
                        </span>
                      </div>
                      <ChevronDown
                        size={14}
                        className={`transition-transform ${isUnitExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {/* Activities in Unit */}
                    <AnimatePresence>
                      {isUnitExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-slate-200 p-2 space-y-1"
                        >
                          {unit.activities.map((activity: any) => {
                            const isActive = (activity as any).globalIndex === currentIndex;
                            const isCompleted = activity.completed;

                            return (
                              <motion.button
                                key={activity.id}
                                onClick={() => {
                                  onActivityClick((activity as any).globalIndex);
                                  setLocalExpanded(false);
                                }}
                                className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                                  isActive
                                    ? 'border-primary bg-primary-light'
                                    : isCompleted
                                    ? 'border-green-200 bg-green-50'
                                    : 'border-slate-200'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] ${
                                    isActive
                                      ? 'bg-primary text-white'
                                      : isCompleted
                                      ? 'bg-green-500 text-white'
                                      : 'bg-slate-200 text-slate-600'
                                  }`}>
                                    {isCompleted ? <Check size={8} /> : <span>{(activity as any).globalIndex + 1}</span>}
                                  </div>
                                  <p className={`font-semibold text-[10px] truncate ${
                                    isActive
                                      ? 'text-primary'
                                      : isCompleted
                                      ? 'text-green-700'
                                      : 'text-slate-700'
                                  }`}>
                                    {activity.instruction || activity.title}
                                  </p>
                                </div>
                              </motion.button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
