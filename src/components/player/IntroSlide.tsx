import { motion } from "motion/react";
import { BookOpen, Target, Languages, Lightbulb, ArrowRight, Sparkles } from "lucide-react";
import { getMediaUrl } from "@/utils/assets";
import type { LessonNode } from "@/types/courseHierarchy";

interface IntroSlideProps {
  lesson: LessonNode;
  lessonNumber: number;
  onStart: () => void;
}

export default function IntroSlide({ lesson, lessonNumber, onStart }: IntroSlideProps) {
  const hasObjectives = !!(lesson.objectives || lesson.description);
  const hasVocab = !!lesson.vocabulary;
  const hasFocus = !!lesson.language_focus;
  const hasCover = !!lesson.cover_image_src;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header with cover image */}
        <div className="relative">
          {hasCover ? (
            <div className="h-48 md:h-56 overflow-hidden">
              <img
                src={getMediaUrl(lesson.cover_image_src!)}
                alt={lesson.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            </div>
          ) : (
            <div className="h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          )}
          {/* Title overlay */}
          <div className={`absolute bottom-0 left-0 right-0 p-6 ${hasCover ? "" : "relative"}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wider">
                Lesson {lessonNumber}
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-400/80 text-white text-xs font-bold">
                Introduction
              </span>
            </div>
            <h1 className={`text-2xl md:text-3xl font-black ${hasCover ? "text-white" : "text-white"}`}>
              {lesson.title}
            </h1>
          </div>
        </div>

        {/* Content cards */}
        <div className="p-6 md:p-8 space-y-5">
          {/* Objectives */}
          {hasObjectives && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-start gap-4 p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100"
            >
              <div className="shrink-0 w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                <Target size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-black text-sm text-blue-700 mb-1">Lesson Objectives</h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {lesson.objectives || lesson.description}
                </p>
              </div>
            </motion.div>
          )}

          {/* Language Focus */}
          {hasFocus && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-start gap-4 p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100"
            >
              <div className="shrink-0 w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center">
                <Lightbulb size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-black text-sm text-purple-700 mb-1">Language Focus</h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {lesson.language_focus}
                </p>
              </div>
            </motion.div>
          )}

          {/* Vocabulary */}
          {hasVocab && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-start gap-4 p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100"
            >
              <div className="shrink-0 w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                <Languages size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-black text-sm text-emerald-700 mb-1">Key Vocabulary</h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {lesson.vocabulary}
                </p>
              </div>
            </motion.div>
          )}

          {/* Description (if no objectives set) */}
          {!hasObjectives && lesson.description && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-start gap-4 p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200"
            >
              <div className="shrink-0 w-10 h-10 rounded-xl bg-slate-400 flex items-center justify-center">
                <BookOpen size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-700 mb-1">About This Lesson</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{lesson.description}</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Start button */}
        <div className="px-6 md:px-8 pb-6 md:pb-8">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={onStart}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-xl shadow-indigo-200 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Sparkles size={20} />
            Start Lesson
            <motion.span
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowRight size={20} />
            </motion.span>
          </motion.button>

          {/* Activity count */}
          <p className="text-center text-xs text-slate-400 mt-3 font-medium">
            {lesson.activities.length} activities • {lesson.activities.reduce((sum, a) => sum + (a.time_estimate_minutes || 5), 0)} min estimated
          </p>
        </div>
      </div>
    </motion.div>
  );
}
