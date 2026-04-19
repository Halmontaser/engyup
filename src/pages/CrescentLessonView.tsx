import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import LessonPlayer from '@/components/player/LessonPlayer';
import { Loader2 } from 'lucide-react';

// Format activity type to readable unit name
function formatUnitName(type: string): string {
  if (!type) return 'Activities';
  return type
    .split(/[_\s-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function CrescentLessonView() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const { user, setProgress } = useAuth();
  const navigate = useNavigate();
  
  const [lesson, setLesson] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (lessonId) fetchLessonData();
  }, [lessonId]);

  const fetchLessonData = async () => {
    setLoading(true);
    try {
      // Fetch lesson
      const { data: lessonData } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (lessonData) {
        setLesson({
          id: lessonData.id,
          title: lessonData.title,
          description: lessonData.description || '',
          lessonNumber: lessonData.order_index || 0,
        });
      }

      // Fetch activities
      const { data: activitiesData } = await supabase
        .from('activities')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_index', { ascending: true });

      if (activitiesData) {
        // Group activities by type to create units
        const unitGroups = activitiesData.reduce((groups: Record<string, any[]>, a) => {
          const type = a.activity_type || 'Other';
          if (!groups[type]) {
            groups[type] = [];
          }
          groups[type].push(a);
          return groups;
        }, {});

        // Create units with descriptive names
        const unitNames: Record<string, string> = {
          'flashcard': 'Vocabulary Review',
          'mcq': 'Multiple Choice',
          'true_false': 'True or False',
          'gap_fill': 'Fill in the Blanks',
          'matching': 'Match the Pairs',
          'word_order': 'Sentence Building',
          'dictation': 'Listening Practice',
          'reading': 'Reading Comprehension',
          'conversation': 'Conversation Practice',
          'pronunciation': 'Speaking Practice',
          'image_label': 'Image Recognition',
          'guessing': 'Guess the Word',
          'spelling': 'Spelling Practice',
          'picture_description': 'Picture Description',
          'sequence': 'Reading Sequence',
          'transform': 'Sentence Transformation',
          'category_sort': 'Category Sorting',
        };

        // Map each activity to its unit
        const activitiesWithUnits = activitiesData.map(a => ({
          id: a.activity_id,
          type: a.activity_type,
          title: a.title || '',
          instruction: a.instruction || a.title || 'Complete this activity',
          data: a.content,
          compensates: a.compensates || null,
          unit: unitNames[a.activity_type] || formatUnitName(a.activity_type),
          media: { audio: [], images: [] }, // Media will be resolved from content URLs
        }));

        setActivities(activitiesWithUnits);
      }
    } catch (err) {
      console.error('Error fetching lesson data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLessonComplete = async () => {
    if (!user || !lessonId) return;

    try {
      await supabase.from('user_progress').upsert({
        user_id: user.id,
        lesson_id: lessonId,
        status: 'completed',
        completion_date: new Date().toISOString(),
      }, { onConflict: 'user_id,lesson_id' });

      setProgress(prev => ({ ...prev, [lessonId]: true }));
    } catch (err) {
      console.error('Error saving progress:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!lesson || activities.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">No Activities Found</h2>
          <p className="text-slate-500 mb-6">This lesson doesn't have any activities yet.</p>
          <button onClick={() => navigate(-1)} className="btn-duo btn-duo-green">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <LessonPlayer
      lesson={lesson}
      activities={activities}
      onBack={() => navigate(-1)}
      onLessonComplete={handleLessonComplete}
    />
  );
}
