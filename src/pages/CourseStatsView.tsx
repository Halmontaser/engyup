import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { getCourseImage } from '@/lib/utils';
import { Loader2, ArrowLeft, Clock, BookOpen, Image as ImageIcon, Music, FileText, Layers, Award, Target, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface CourseStats {
  totalLessons: number;
  completedLessons: number;
  totalActivities: number;
  completedActivities: number;
  estimatedHours: number;
  totalVocabWords: number;
  audioCount: number;
  imageCount: number;
  activityTypes: { type: string; count: number; icon: string }[];
  modulesCount: number;
}

interface StatCard {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}

const activityIcons: Record<string, string> = {
  'mcq': '❓',
  'true_false': '✅',
  'gap_fill': '📝',
  'flashcard': '🃏',
  'matching': '🔗',
  'word_order': '📋',
  'dictation': '🎧',
  'reading': '📖',
  'conversation': '💬',
  'pronunciation': '🎤',
  'image_label': '🏷️',
  'guessing': '🎯',
  'spelling': '✍️',
  'picture_description': '🖼️',
  'sequence': '📊',
  'transform': '🔄',
  'category_sort': '📂',
};

const activityNames: Record<string, string> = {
  'mcq': 'Multiple Choice',
  'true_false': 'True/False',
  'gap_fill': 'Fill Blanks',
  'flashcard': 'Flashcards',
  'matching': 'Matching',
  'word_order': 'Word Order',
  'dictation': 'Dictation',
  'reading': 'Reading',
  'conversation': 'Conversation',
  'pronunciation': 'Speaking',
  'image_label': 'Image Label',
  'guessing': 'Guessing',
  'spelling': 'Spelling',
  'picture_description': 'Picture Description',
  'sequence': 'Sequencing',
  'transform': 'Transformations',
  'category_sort': 'Sorting',
};

export function CourseStatsView() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user, progress, profile } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState<any>(null);
  const [stats, setStats] = useState<CourseStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId) fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    setLoading(true);
    try {
      // Fetch course with modules, lessons, and activities
      const { data: courseData } = await supabase
        .from('courses')
        .select('*, modules!inner(*, lessons!inner(*, activities!inner(*)))')
        .eq('id', courseId)
        .single();

      console.log('Course stats data:', courseData);

      if (courseData) {
        setCourse(courseData);

        // Calculate comprehensive statistics
        const modules = courseData.modules || [];
        const allLessons = modules.flatMap((m: any) => m.lessons || []);
        const allActivities = allLessons.flatMap((l: any) => l.activities || []);

        const totalLessons = allLessons.length;
        const completedLessons = allLessons.filter((l: any) => progress[l.id]).length;
        const totalActivities = allActivities.length;
        const completedActivities = allActivities.filter((a: any) => progress[a.lesson_id]).length;

        // Estimate hours: ~15 minutes per activity
        const estimatedHours = Math.round((totalActivities * 15) / 60 * 10) / 10;

        // Count vocabulary words (from flashcards and vocab activities)
        const vocabActivities = allActivities.filter((a: any) =>
          ['flashcard', 'gap_fill', 'word_order', 'spelling'].includes(a.activity_type)
        );
        const totalVocabWords = vocabActivities.length * 5; // Estimate 5 words per vocab activity

        // Count activities with audio
        const audioActivities = allActivities.filter((a: any) =>
          ['dictation', 'listening_comprehension', 'pronunciation', 'conversation'].includes(a.activity_type)
        );
        const audioCount = audioActivities.length;

        // Count activities with images
        const imageActivities = allActivities.filter((a: any) =>
          ['image_label', 'picture_description', 'matching', 'flashcard'].includes(a.activity_type)
        );
        const imageCount = imageActivities.length;

        // Group by activity types
        const typeGroups = allActivities.reduce((acc: Record<string, number>, a: any) => {
          const type = a.activity_type || 'other';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});

        const activityTypes = Object.entries(typeGroups)
          .map(([type, count]) => ({
            type: activityNames[type] || type,
            count,
            icon: activityIcons[type] || '📝',
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6); // Top 6 activity types

        setStats({
          totalLessons,
          completedLessons,
          totalActivities,
          completedActivities,
          estimatedHours,
          totalVocabWords,
          audioCount,
          imageCount,
          activityTypes,
          modulesCount: modules.length,
        });
      }
    } catch (err) {
      console.error('Error fetching course stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards: StatCard[] = stats ? [
    {
      icon: <Clock size={28} />,
      label: 'Study Time',
      value: `${stats.estimatedHours}h`,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: <BookOpen size={28} />,
      label: 'Lessons',
      value: `${stats.completedLessons}/${stats.totalLessons}`,
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: <Layers size={28} />,
      label: 'Activities',
      value: `${stats.completedActivities}/${stats.totalActivities}`,
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: <Zap size={28} />,
      label: 'Vocabulary',
      value: `${stats.totalVocabWords}+ words`,
      color: 'from-amber-500 to-orange-500',
    },
    {
      icon: <Music size={28} />,
      label: 'Audio Files',
      value: stats.audioCount,
      color: 'from-rose-500 to-red-500',
    },
    {
      icon: <ImageIcon size={28} />,
      label: 'Visual Content',
      value: stats.imageCount,
      color: 'from-indigo-500 to-violet-500',
    },
  ] : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Loader2 className="w-12 h-12 text-blue-700 animate-spin" />
      </div>
    );
  }

  if (!course || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Course Not Found</h2>
          <button onClick={() => navigate('/')} className="btn-duo btn-duo-green">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const progressPercent = stats.totalLessons > 0
    ? Math.round((stats.completedLessons / stats.totalLessons) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200 p-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-semibold">Back to Dashboard</span>
          </button>

          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">
              {course.title}
            </h1>
            {profile?.grade && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                Grade {profile.grade}
              </span>
            )}
          </div>

          {/* Overall Progress */}
          <div className="flex items-center gap-2">
            <div className="hidden md:block w-32 h-3 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1 }}
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
              />
            </div>
            <span className="text-sm font-bold text-green-700">
              {progressPercent}%
            </span>
          </div>
        </div>
      </header>

      {/* Course Image Banner */}
      <div className="relative h-48 md:h-72 overflow-hidden">
        <img
          src={course.image_url || getCourseImage(course.title, course.course_code)}
          alt={course.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 md:left-8">
          <h2 className="text-white text-2xl md:text-4xl font-black mb-2">
            {course.title}
          </h2>
          <p className="text-white/90 text-sm md:text-base max-w-2xl line-clamp-2">
            {course.description || 'Comprehensive English language course designed for excellence.'}
          </p>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="bg-white border-t border-slate-200 shadow-inner">
        <div className="max-w-7xl mx-auto py-8 px-4">
          {/* Main Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 mb-8"
          >
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-slate-50 to-white border-2 border-slate-200 rounded-2xl p-4 md:p-6 hover:shadow-xl transition-all duration-300"
              >
                <div className={`flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br ${stat.color} text-white mb-3 shadow-lg`}>
                  {stat.icon}
                </div>
                <p className="text-xs md:text-sm text-slate-500 font-semibold uppercase tracking-wider mb-1">
                  {stat.label}
                </p>
                <p className="text-2xl md:text-3xl font-black text-slate-900">
                  {stat.value}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Course Modules */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-6 md:p-8 mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <Layers size={28} className="text-blue-700" />
              <h3 className="text-xl md:text-2xl font-black text-slate-900">
                Course Structure
              </h3>
              <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-bold">
                {stats.modulesCount} modules
              </span>
            </div>
            <p className="text-slate-600 text-sm md:text-base">
              This course is organized into <strong>{stats.modulesCount} learning modules</strong> containing{' '}
              <strong>{stats.totalLessons} lessons</strong> with a total of{' '}
              <strong>{stats.totalActivities} activities</strong>. Each lesson builds upon previous concepts to ensure comprehensive learning.
            </p>
          </motion.div>

          {/* Activity Types Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white border-2 border-slate-200 rounded-2xl p-6 md:p-8 mb-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <Target size={28} className="text-purple-700" />
              <h3 className="text-xl md:text-2xl font-black text-slate-900">
                Learning Activities
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.activityTypes.map((type, index) => {
                const percentage = stats.totalActivities > 0
                  ? Math.round((type.count / stats.totalActivities) * 100)
                  : 0;

                return (
                  <motion.div
                    key={type.type}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1 + index * 0.1 }}
                    className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{type.icon}</span>
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                        {type.type}
                      </p>
                    </div>
                    <div className="flex items-end justify-between">
                      <p className="text-3xl font-black text-slate-900">
                        {type.count}
                      </p>
                      <span className="text-sm font-bold text-slate-500">
                        {percentage}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: 1.2 + index * 0.1, duration: 1 }}
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Course Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 }}
            className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6 md:p-8 mb-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <Award size={28} className="text-amber-700" />
              <h3 className="text-xl md:text-2xl font-black text-slate-900">
                Learning Outcomes
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Clock size={20} />
                  Time Investment
                </h4>
                <p className="text-slate-600">
                  Approximately <strong>{stats.estimatedHours} hours</strong> of focused learning time. Each activity is designed to be completed in 15-20 minutes.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Zap size={20} />
                  Vocabulary
                </h4>
                <p className="text-slate-600">
                  Learn <strong>{stats.totalVocabWords}+ new words</strong> through flashcards, fill-in-the-blanks, and spelling exercises.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Music size={20} />
                  Audio Practice
                </h4>
                <p className="text-slate-600">
                  <strong>{stats.audioCount} listening exercises</strong> including dictation, conversations, and pronunciation practice.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <ImageIcon size={20} />
                  Visual Learning
                </h4>
                <p className="text-slate-600">
                  <strong>{stats.imageCount} visual activities</strong> with images, picture descriptions, and matching exercises.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <button
              onClick={() => navigate(`/course/${courseId}`)}
              className="flex-1 max-w-xs py-4 bg-gradient-to-r from-blue-700 to-blue-600 text-white font-bold rounded-2xl hover:from-blue-800 hover:to-blue-700 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:-translate-y-0.5"
            >
              <BookOpen size={24} />
              <span>View Lesson Map</span>
            </button>

            {stats.completedLessons < stats.totalLessons && (
              <button
                onClick={() => {
                  const firstIncomplete = course.modules?.flatMap((m: any) => m.lessons).find((l: any) => !progress[l.id]);
                  if (firstIncomplete) navigate(`/learn/${courseId}/${firstIncomplete.id}`);
                }}
                className="flex-1 max-w-xs py-4 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold rounded-2xl hover:from-green-700 hover:to-green-600 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/35 hover:-translate-y-0.5"
              >
                <Zap size={24} />
                <span>Continue Learning</span>
              </button>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
