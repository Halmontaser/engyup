import { useEffect, useState, useCallback } from 'react';
import { StudyModeProvider } from '@/context/StudyModeContext';
import LessonPlayer from '@/components/player/LessonPlayer';
import type { CourseHierarchy, HierarchicalPosition, ActivityNode } from '@/types/courseHierarchy';
import { Loader2 } from 'lucide-react';

export function EmbedLessonView() {
  const [hierarchy, setHierarchy] = useState<CourseHierarchy | null>(null);
  const [currentPosition, setCurrentPosition] = useState<HierarchicalPosition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Notify parent window that Engyup is ready to receive data
    window.parent.postMessage({ type: 'ENGYUP_READY' }, '*');

    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data;
      if (type === 'ENGYUP_INIT' && payload?.data?.activities) {
        // Construct a dummy hierarchy around the provided activities
        const activities: ActivityNode[] = payload.data.activities;
        
        const dummyLessonId = payload.context?.lessonId || 'embed-lesson';
        const dummyModuleId = 'embed-module';
        
        const dummyHierarchy: CourseHierarchy = {
          id: payload.context?.courseSlug || 'embed-course',
          title: 'Embedded Course',
          modules: [
            {
              id: dummyModuleId,
              title: payload.context?.unitCode || 'Embedded Unit',
              order_index: 0,
              lessons: [
                {
                  id: dummyLessonId,
                  module_id: dummyModuleId,
                  title: 'Embedded Lesson',
                  order_index: 0,
                  description: '',
                  activities: activities,
                }
              ]
            }
          ]
        };

        setHierarchy(dummyHierarchy);
        setCurrentPosition({
          moduleId: dummyModuleId,
          lessonId: dummyLessonId,
          activityId: activities[0]?.id || '',
          activityIndex: -1 // Start at intro slide
        });
        setLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleNavigate = useCallback((newCourseId: string, newLessonId: string, activityIndex?: number) => {
    // Just update the internal position state for the embedded lesson player
    if (hierarchy && currentPosition) {
      const activities = hierarchy.modules[0].lessons[0].activities;
      const index = activityIndex ?? -1;
      const activityId = index >= 0 ? (activities[index]?.id || '') : '';
      
      setCurrentPosition({
        ...currentPosition,
        activityId,
        activityIndex: index
      });
    }
  }, [hierarchy, currentPosition]);

  const handleLessonComplete = useCallback(async (completedLessonId: string) => {
    // Notify parent LMS that lesson is complete
    window.parent.postMessage({ type: 'ENGYUP_COMPLETED', payload: { lessonId: completedLessonId } }, '*');
  }, []);

  const handleActivityComplete = useCallback((activityId: string) => {
    // Update local state and optionally notify parent
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
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!hierarchy || !currentPosition) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-2">No Activities Found</h2>
          <p className="text-slate-400">The provided lesson has no activities.</p>
        </div>
      </div>
    );
  }

  return (
    <StudyModeProvider>
      <LessonPlayer
        courseHierarchy={hierarchy}
        initialPosition={currentPosition}
        onBack={() => window.parent.postMessage({ type: 'ENGYUP_EXIT' }, '*')}
        onNavigate={handleNavigate}
        onLessonComplete={handleLessonComplete}
        onActivityComplete={handleActivityComplete}
      />
    </StudyModeProvider>
  );
}
