import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { StudyModeProvider } from '@/context/StudyModeContext';
import { getCourseHierarchyWithProgress } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import LessonPlayer from '@/components/player/LessonPlayer';
import type { CourseHierarchy, HierarchicalPosition } from '@/types/courseHierarchy';
import { Loader2 } from 'lucide-react';

export function CrescentLessonView() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const { user, setProgress } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [hierarchy, setHierarchy] = useState<CourseHierarchy | null>(null);
  const [currentPosition, setCurrentPosition] = useState<HierarchicalPosition | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch full course hierarchy once per courseId
  useEffect(() => {
    if (courseId && user) fetchHierarchy();
  }, [courseId, user]);

  const fetchHierarchy = async () => {
    if (!courseId || !user) return;
    setLoading(true);
    try {
      const data = await getCourseHierarchyWithProgress(courseId, user.id);
      if (data) {
        setHierarchy(data);
      }
    } catch (err) {
      console.error('Error fetching course hierarchy:', err);
    } finally {
      setLoading(false);
    }
  };

  // Derive current position from hierarchy + URL lessonId
  useEffect(() => {
    if (!hierarchy || !lessonId) return;

    const state = location.state as { activityIndex?: number } | null;

    for (const mod of hierarchy.modules) {
      for (const lesson of mod.lessons) {
        if (lesson.id === lessonId) {
          // Find first incomplete activity, or default to 0
          const firstIncomplete = lesson.activities.findIndex(a => !a.completed);
          const activityIndex = (state?.activityIndex !== undefined)
            ? state.activityIndex
            : -1; // Start with intro slide
          const activity = activityIndex >= 0
            ? (lesson.activities[activityIndex] || lesson.activities[0])
            : (lesson.activities[0] || null);

          setCurrentPosition({
            moduleId: mod.id,
            lessonId: lesson.id,
            activityId: activity?.id || '',
            activityIndex: lesson.activities.indexOf(activity) >= 0 ? lesson.activities.indexOf(activity) : 0,
          });
          return;
        }
      }
    }

    // If lessonId not found in hierarchy, default to first lesson
    const firstModule = hierarchy.modules[0];
    const firstLesson = firstModule?.lessons[0];
    if (firstLesson) {
      const firstActivity = firstLesson.activities[0];
      setCurrentPosition({
        moduleId: firstModule.id,
        lessonId: firstLesson.id,
        activityId: firstActivity?.id || '',
        activityIndex: 0,
      });
    }
  }, [hierarchy, lessonId, location.state]);

  const handleNavigate = useCallback((newCourseId: string, newLessonId: string, activityIndex?: number) => {
    // activityIndex -1 means show intro slide
    navigate(`/learn/${newCourseId}/${newLessonId}`, { state: { activityIndex: activityIndex ?? -1 } });
  }, [navigate]);

  const handleLessonComplete = useCallback(async (completedLessonId: string) => {
    if (!user) return;
    try {
      await supabase.from('user_progress').upsert({
        user_id: user.id,
        lesson_id: completedLessonId,
        status: 'completed',
        completion_date: new Date().toISOString(),
      }, { onConflict: 'user_id,lesson_id' });

      setProgress(prev => ({ ...prev, [completedLessonId]: true }));

      // Update hierarchy state to reflect completion
      setHierarchy(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          modules: prev.modules.map(mod => ({
            ...mod,
            lessons: mod.lessons.map(lesson =>
              lesson.id === completedLessonId
                ? { ...lesson, completed: true }
                : lesson
            ),
          })),
        };
      });
    } catch (err) {
      console.error('Error saving lesson progress:', err);
    }
  }, [user, setProgress]);

  const handleActivityComplete = useCallback((activityId: string) => {
    // Update hierarchy state to reflect activity completion
    setHierarchy(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        modules: prev.modules.map(mod => ({
          ...mod,
          lessons: mod.lessons.map(lesson => ({
            ...lesson,
            activities: lesson.activities.map(act =>
              act.id === activityId ? { ...act, completed: true } : act
            ),
          })),
        })),
      };
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!hierarchy || !currentPosition) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">No Activities Found</h2>
          <p className="text-slate-500 mb-6">This course doesn't have any activities yet.</p>
          <button onClick={() => navigate(-1)} className="btn-duo btn-duo-green">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <StudyModeProvider>
      <LessonPlayer
        courseHierarchy={hierarchy}
        initialPosition={currentPosition}
        onBack={() => navigate(`/course/${courseId}`)}
        onNavigate={handleNavigate}
        onLessonComplete={handleLessonComplete}
        onActivityComplete={handleActivityComplete}
      />
    </StudyModeProvider>
  );
}
