import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StudyModeProvider } from '@/context/StudyModeContext';
import { fetchUnitData } from '@/lib/unitData';
import LessonPlayer from '@/components/player/LessonPlayer';
import type { CourseHierarchy, HierarchicalPosition } from '@/types/courseHierarchy';
import { Loader2 } from 'lucide-react';

export function UnitOfflineView() {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();

  const [hierarchy, setHierarchy] = useState<CourseHierarchy | null>(null);
  const [currentPosition, setCurrentPosition] = useState<HierarchicalPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch unit data from JSON
  useEffect(() => {
    if (!unitId) return;
    setLoading(true);
    setError(null);

    fetchUnitData(unitId)
      .then((data) => {
        if (data) {
          setHierarchy(data);
          // Default to first lesson, first activity
          const firstModule = data.modules[0];
          const firstLesson = firstModule?.lessons[0];
          const firstActivity = firstLesson?.activities[0];
          if (firstLesson && firstActivity) {
            setCurrentPosition({
              moduleId: firstModule.id,
              lessonId: firstLesson.id,
              activityId: firstActivity.id,
              activityIndex: 0,
            });
          }
        } else {
          setError('Could not load unit data.');
        }
      })
      .catch((err) => {
        console.error('Error loading unit data:', err);
        setError('Failed to load unit data.');
      })
      .finally(() => setLoading(false));
  }, [unitId]);

  const handleNavigate = useCallback((_courseId: string, lessonId: string, activityIndex?: number) => {
    if (!hierarchy) return;
    for (const mod of hierarchy.modules) {
      for (const lesson of mod.lessons) {
        if (lesson.id === lessonId) {
          const targetIndex = activityIndex !== undefined ? activityIndex : 0;
          const targetActivity = lesson.activities[targetIndex] || lesson.activities[0];
          setCurrentPosition({
            moduleId: mod.id,
            lessonId: lesson.id,
            activityId: targetActivity?.id || '',
            activityIndex: targetIndex,
          });
          return;
        }
      }
    }
  }, [hierarchy]);

  const handleLessonComplete = useCallback((completedLessonId: string) => {
    setHierarchy((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        modules: prev.modules.map((mod) => ({
          ...mod,
          lessons: mod.lessons.map((lesson) =>
            lesson.id === completedLessonId ? { ...lesson, completed: true } : lesson
          ),
        })),
      };
    });
  }, []);

  const handleActivityComplete = useCallback((activityId: string) => {
    setHierarchy((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        modules: prev.modules.map((mod) => ({
          ...mod,
          lessons: mod.lessons.map((lesson) => ({
            ...lesson,
            activities: lesson.activities.map((act) =>
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

  if (error || !hierarchy || !currentPosition) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {error || 'No Activities Found'}
          </h2>
          <p className="text-slate-500 mb-6">
            Unit "{unitId}" could not be loaded. Make sure the data files exist.
          </p>
          <button onClick={() => navigate('/')} className="btn-duo btn-duo-green">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <StudyModeProvider>
      <LessonPlayer
        courseHierarchy={hierarchy}
        initialPosition={currentPosition}
        onBack={() => navigate('/')}
        onNavigate={handleNavigate}
        onLessonComplete={handleLessonComplete}
        onActivityComplete={handleActivityComplete}
      />
    </StudyModeProvider>
  );
}
