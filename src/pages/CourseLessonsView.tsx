import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import LessonMap from '@/components/player/LessonMap';
import { getCourseImage } from '@/lib/utils';
import { Loader2, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export function CourseLessonsView() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user, progress, enrollments } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId) fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    setLoading(true);
    try {
      // Fetch course with modules and lessons
      const { data: courseData, error } = await supabase
        .from('courses')
        .select('*, modules!inner(*, lessons!inner(*))')
        .eq('id', courseId)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Course data:', courseData);

      if (courseData) {
        setCourse(courseData);

        // Flatten all lessons from all modules
        const allLessons = (courseData.modules || []).flatMap((m: any) =>
          (m.lessons || []).map((l: any) => ({
            id: l.id,
            title: l.title || `Lesson ${l.order_index + 1}`,
            description: l.description,
            order: l.order_index || 0,
            module_id: l.module_id,
          }))
        ).sort((a, b) => a.order - b.order);

        console.log('All lessons:', allLessons);

        // Add completion and lock status
        const lessonsWithStatus = allLessons.map((lesson, index) => {
          const isCompleted = !!progress[lesson.id];
          // A lesson is locked if the previous lesson is not completed
          const isLocked = index > 0 && !progress[allLessons[index - 1]?.id];
          const isFirstIncomplete = !isCompleted && !allLessons.slice(0, index).some((l: any) => !progress[l.id]);

          return {
            ...lesson,
            completed: isCompleted,
            locked: isLocked,
            current: isFirstIncomplete,
            xp: 10 + (index * 5), // Progressive XP
          };
        });

        setLessons(lessonsWithStatus);
      }
    } catch (err) {
      console.error('Error fetching course data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLessonClick = (lessonId: string) => {
    navigate(`/learn/${courseId}/${lessonId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Loader2 className="w-12 h-12 text-blue-700 animate-spin" />
      </div>
    );
  }

  if (!course) {
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
            <span className="font-semibold">Back to Courses</span>
          </button>

          <div className="flex items-center gap-4">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">
              {course.title}
            </h1>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
              {lessons.filter(l => l.completed).length} / {lessons.length}
            </span>
          </div>

          {/* Overall Progress */}
          <div className="hidden md:flex items-center gap-2 bg-green-100 px-4 py-2 rounded-full">
            <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(lessons.filter(l => l.completed).length / lessons.length) * 100}%` }}
                transition={{ duration: 1 }}
                className="h-full bg-green-500 rounded-full"
              />
            </div>
            <span className="text-sm font-bold text-green-700">
              {Math.round((lessons.filter(l => l.completed).length / lessons.length) * 100)}%
            </span>
          </div>
        </div>
      </header>

      {/* Course Image Banner */}
      <div className="relative h-48 md:h-64 overflow-hidden">
        <img
          src={course.image_url || getCourseImage(course.title, course.course_code)}
          alt={course.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 md:left-8">
          <h2 className="text-white text-2xl md:text-3xl font-black mb-2">
            {course.title}
          </h2>
          <p className="text-white/90 text-sm md:text-base max-w-2xl">
            {course.description || 'Complete all lessons to master this course.'}
          </p>
        </div>
      </div>

      {/* Lesson Map */}
      <div className="bg-white border-t border-slate-200 shadow-inner">
        <div className="max-w-7xl mx-auto py-8">
          {lessons.length === 0 ? (
            <div className="text-center py-20 px-4">
              <p className="text-slate-500 text-lg mb-4">No lessons available yet.</p>
              <button onClick={() => navigate('/')} className="btn-duo btn-duo-gray">
                Back to Dashboard
              </button>
            </div>
          ) : (
            <LessonMap
              lessons={lessons}
              onLessonClick={handleLessonClick}
            />
          )}
        </div>
      </div>
    </div>
  );
}
