"use client";

import { motion } from 'motion/react';
import { Check, Lock, Play, Star, CircleDot } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export interface LessonNode {
  id: string;
  title: string;
  order: number;
  completed?: boolean;
  locked?: boolean;
  current?: boolean;
  icon?: string;
  xp?: number;
}

interface LessonMapProps {
  lessons: LessonNode[];
  onLessonClick: (lessonId: string) => void;
  className?: string;
}

export default function LessonMap({ lessons, onLessonClick, className = '' }: LessonMapProps) {
  const [hoveredLesson, setHoveredLesson] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate path coordinates dynamically
  const getPathCoordinates = (index: number) => {
    const containerWidth = containerRef.current?.offsetWidth || 800;
    const nodeWidth = 96; // w-24 = 6rem = 96px
    const horizontalGap = 144; // 180 - 36 (node overlap adjustment)

    const startX = 100 + index * (nodeWidth + horizontalGap);
    const startY = index % 2 === 0 ? 120 : 280;
    const endX = 100 + (index + 1) * (nodeWidth + horizontalGap);
    const endY = index % 2 === 0 ? 280 : 120;

    return { startX, startY, endX, endY };
  };

  return (
    <div className={`w-full overflow-x-auto pb-8 ${className}`}>
      <div ref={containerRef} className="relative min-w-full px-8 py-12">
        {/* Zigzag Path Lines */}
        <svg
          className="absolute inset-0 w-full pointer-events-none"
          style={{ zIndex: 0, height: '400px' }}
          preserveAspectRatio="none"
        >
          {lessons.slice(0, -1).map((lesson, index) => {
            const { startX, startY, endX, endY } = getPathCoordinates(index);
            const nextLesson = lessons[index + 1];
            const pathActive = !lesson.locked && !nextLesson?.locked;

            return (
              <g key={`path-${index}`}>
                {/* Background path */}
                <path
                  d={`M ${startX} ${startY} C ${startX + 72} ${startY}, ${endX - 72} ${endY}, ${endX} ${endY}`}
                  fill="none"
                  stroke={pathActive ? '#58cc02' : '#e5e7eb'}
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                {/* Animated progress line */}
                {pathActive && (
                  <motion.path
                    initial={{ pathOffset: 1 }}
                    animate={{ pathOffset: 0 }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                    d={`M ${startX} ${startY} C ${startX + 72} ${startY}, ${endX - 72} ${endY}, ${endX} ${endY}`}
                    fill="none"
                    stroke="#58cc02"
                    strokeWidth="3"
                    strokeLinecap="round"
                    pathLength="1"
                    style={{ strokeDasharray: '1 1' }}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Lesson Nodes */}
        <div className="relative z-10" style={{ height: '400px' }}>
          {lessons.map((lesson, index) => {
            const isEven = index % 2 === 0;
            const top = isEven ? 120 : 280;
            const left = 100 + index * 240; // 96px (node) + 144px (gap)
            const isHovered = hoveredLesson === lesson.id;

            return (
              <motion.div
                key={lesson.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="absolute"
                style={{ top, left: `calc(${left}px)` }}
                onMouseEnter={() => setHoveredLesson(lesson.id)}
                onMouseLeave={() => setHoveredLesson(null)}
              >
                {/* Glow effect for current/hovered */}
                {(lesson.current || isHovered) && !lesson.locked && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1.2, opacity: 0.3 }}
                    className="absolute inset-0 -m-4 rounded-full bg-green-500 blur-xl"
                  />
                )}

                {/* Node Button */}
                <button
                  onClick={() => !lesson.locked && onLessonClick(lesson.id)}
                  disabled={lesson.locked}
                  className={`
                    relative w-24 h-24 rounded-full flex items-center justify-center
                    transition-all duration-300 hover:scale-110
                    ${lesson.locked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
                  `}
                  style={{
                    background: lesson.locked
                      ? 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)'
                      : lesson.completed
                      ? 'linear-gradient(135deg, #58cc02 0%, #46a302 100%)'
                      : lesson.current
                      ? 'linear-gradient(135deg, #58cc02 0%, #46a302 100%)'
                      : 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%)',
                    boxShadow: lesson.current || isHovered
                      ? '0 0 30px rgba(88, 204, 2, 0.4)'
                      : lesson.completed
                      ? '0 4px 15px rgba(88, 204, 2, 0.3)'
                      : '0 4px 15px rgba(245, 158, 11, 0.3)',
                  }}
                >
                  {/* Inner Circle */}
                  <div
                    className={`
                      absolute inset-2 rounded-full flex items-center justify-center
                      ${lesson.locked ? 'bg-slate-300' : lesson.completed ? 'bg-green-600' : 'bg-orange-500'}
                    `}
                  >
                    {/* Icon/Content */}
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      {lesson.locked ? (
                        <Lock size={24} className="text-slate-500" />
                      ) : lesson.completed ? (
                        <div className="flex flex-col items-center">
                          <Check size={28} className="text-white" strokeWidth={3} />
                          {lesson.xp && (
                            <span className="text-white text-xs font-bold mt-1">+{lesson.xp}XP</span>
                          )}
                        </div>
                      ) : lesson.current ? (
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="flex flex-col items-center"
                        >
                          <Play size={28} className="text-white fill-current" />
                          <span className="text-white text-xs font-bold mt-1">START</span>
                        </motion.div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <CircleDot size={24} className="text-white" />
                          <span className="text-white text-[10px] font-bold mt-1">{lesson.order + 1}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lesson Number Badge */}
                  {lesson.current && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 }}
                      className="absolute -top-3 -right-3 bg-amber-400 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg border-2 border-white"
                    >
                      <Star size={14} fill="currentColor" />
                    </motion.div>
                  )}
                </button>

                {/* Lesson Title Tooltip */}
                {isHovered && !lesson.locked && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-28 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap shadow-xl"
                  >
                    {lesson.title}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Background Decorations */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full opacity-20"
              style={{
                width: `${Math.random() * 40 + 10}px`,
                height: `${Math.random() * 40 + 10}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: `radial-gradient(circle, ${['#58cc02', '#f59e0b', '#3b82f6'][i % 3]} 0%, transparent 70%)`,
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.3, 0.2],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
