// Supabase-based database functions
// All data is stored in Supabase now - no more SQLite
import { supabase } from './supabase';
import type { CourseHierarchy, ModuleNode, LessonNode, ActivityNode } from '../types/courseHierarchy';
import { buildActivityMediaFromContent } from './unitData';

export interface Grade {
  id: string;
  grade_number: number;
  label: string;
}

export interface Unit {
  id: string;
  grade_id: string;
  unit_number: number;
  title: string;
  total_lessons: number;
  lesson_count: number;
}

export interface Lesson {
  id: string;
  unit_id: string;
  lesson_number: number;
  title: string;
  description: string;
  objectives: string | null;
  language_focus: string | null;
  vocabulary: string | null;
  cover_image_src: string | null;
  passing_score: number;
}

export interface Activity {
  id: string;
  lesson_id: string;
  type: string;
  title: string;
  instruction: string;
  difficulty: string | null;
  book_type: string | null;
  book_page: string | null;
  compensates: string | null;
  data: any;
  sort_order: number;
  is_required: boolean;
  xp_reward: number;
  time_estimate_minutes: number | null;
}

export async function getLessonsForUnit(gradeNumber: number, unitNumber: number): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .order('title', { ascending: true });

  if (error || !data) return [];
  
  return data.map((l: any) => ({
    id: l.id,
    unit_id: l.module_id || '',
    lesson_number: l.order_index || 0,
    title: l.title || '',
    description: l.description || '',
    objectives: l.objectives || null,
    language_focus: l.language_focus || null,
    vocabulary: l.vocabulary || null,
    cover_image_src: l.cover_image_src || null,
    passing_score: l.passing_score || 70,
  }));
}

export async function getLesson(id: string): Promise<Lesson | null> {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return {
    id: data.id,
    unit_id: data.module_id || '',
    lesson_number: data.order_index || 0,
    title: data.title || '',
    description: data.description || '',
    objectives: data.objectives || null,
    language_focus: data.language_focus || null,
    vocabulary: data.vocabulary || null,
    cover_image_src: data.cover_image_src || null,
    passing_score: data.passing_score || 70,
  };
}

export async function createActivity(activity: Omit<Activity, 'id'>): Promise<Activity> {
  const { data, error } = await supabase
    .from('activities')
    .insert([{
      lesson_id: activity.lesson_id,
      activity_type: activity.type,
      title: activity.title,
      instruction: activity.instruction,
      difficulty: activity.difficulty,
      book_type: activity.book_type,
      book_page: activity.book_page,
      compensates: activity.compensates,
      content: activity.data,
      order_index: activity.sort_order,
      is_required: activity.is_required ?? true,
      xp_reward: activity.xp_reward ?? 10,
      time_estimate_minutes: activity.time_estimate_minutes ?? null,
    }])
    .select('*')
    .single();

  if (error) throw error;
  return {
    id: data.activity_id,
    lesson_id: data.lesson_id,
    type: data.activity_type,
    title: data.title || '',
    instruction: data.instruction || '',
    difficulty: data.difficulty || null,
    book_type: data.book_type || null,
    book_page: data.book_page || null,
    compensates: data.compensates || null,
    data: data.content,
    sort_order: data.order_index || 0,
    is_required: data.is_required ?? true,
    xp_reward: data.xp_reward ?? 10,
    time_estimate_minutes: data.time_estimate_minutes ?? null,
  };
}

export async function updateActivity(id: string, updates: Partial<Activity>): Promise<Activity> {
  const supabaseUpdates: any = {};
  if (updates.lesson_id !== undefined) supabaseUpdates.lesson_id = updates.lesson_id;
  if (updates.type !== undefined) supabaseUpdates.activity_type = updates.type;
  if (updates.title !== undefined) supabaseUpdates.title = updates.title;
  if (updates.instruction !== undefined) supabaseUpdates.instruction = updates.instruction;
  if (updates.difficulty !== undefined) supabaseUpdates.difficulty = updates.difficulty;
  if (updates.book_type !== undefined) supabaseUpdates.book_type = updates.book_type;
  if (updates.book_page !== undefined) supabaseUpdates.book_page = updates.book_page;
  if (updates.compensates !== undefined) supabaseUpdates.compensates = updates.compensates;
  if (updates.data !== undefined) supabaseUpdates.content = updates.data;
  if (updates.sort_order !== undefined) supabaseUpdates.order_index = updates.sort_order;
  if (updates.is_required !== undefined) supabaseUpdates.is_required = updates.is_required;
  if (updates.xp_reward !== undefined) supabaseUpdates.xp_reward = updates.xp_reward;
  if (updates.time_estimate_minutes !== undefined) supabaseUpdates.time_estimate_minutes = updates.time_estimate_minutes;

  const { data, error } = await supabase
    .from('activities')
    .update(supabaseUpdates)
    .eq('activity_id', id)
    .select('*')
    .single();

  if (error) throw error;
  return {
    id: data.activity_id,
    lesson_id: data.lesson_id,
    type: data.activity_type,
    title: data.title || '',
    instruction: data.instruction || '',
    difficulty: data.difficulty || null,
    book_type: data.book_type || null,
    book_page: data.book_page || null,
    compensates: data.compensates || null,
    data: data.content,
    sort_order: data.order_index || 0,
    is_required: data.is_required ?? true,
    xp_reward: data.xp_reward ?? 10,
    time_estimate_minutes: data.time_estimate_minutes ?? null,
  };
}

export async function getActivityById(id: string): Promise<Activity | null> {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('activity_id', id)
    .single();

  if (error || !data) return null;
  return {
    id: data.activity_id,
    lesson_id: data.lesson_id,
    type: data.activity_type,
    title: data.title || '',
    instruction: data.instruction || '',
    difficulty: data.difficulty || null,
    book_type: data.book_type || null,
    book_page: data.book_page || null,
    compensates: data.compensates || null,
    data: data.content,
    sort_order: data.order_index || 0,
    is_required: data.is_required ?? true,
    xp_reward: data.xp_reward ?? 10,
    time_estimate_minutes: data.time_estimate_minutes ?? null,
  };
}

export async function getCourseHierarchyWithProgress(
  courseId: string,
  userId: string
): Promise<CourseHierarchy | null> {
  // Fetch the full hierarchy: course -> modules -> lessons -> activities
  const { data: courseData, error: courseError } = await supabase
    .from('courses')
    .select(`
      id, title,
      modules(
        id, title, order_index,
        lessons(
          id, title, order_index, description, objectives, language_focus, vocabulary, cover_image_src,
          activities(activity_id, lesson_id, activity_type, title, instruction, content, compensates, order_index, difficulty, book_type, book_page, is_required, xp_reward, time_estimate_minutes)
        )
      )
    `)
    .eq('id', courseId)
    .single();

  if (courseError || !courseData) return null;

  // Fetch user progress in parallel
  const [lessonProgressRes, activityProgressRes] = await Promise.all([
    supabase.from('user_progress').select('lesson_id, status').eq('user_id', userId),
    supabase.from('activity_progress').select('activity_id, status').eq('user_id', userId),
  ]);

  const lessonProgressMap = new Map<string, boolean>();
  (lessonProgressRes.data || []).forEach((p: any) => {
    lessonProgressMap.set(p.lesson_id, p.status === 'completed');
  });

  const activityProgressMap = new Map<string, boolean>();
  (activityProgressRes.data || []).forEach((p: any) => {
    activityProgressMap.set(p.activity_id, p.status === 'completed');
  });

  // Build the hierarchy with progress
  const modules: ModuleNode[] = (courseData.modules || [])
    .sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .map((mod: any) => {
      const lessons: LessonNode[] = (mod.lessons || [])
        .sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
        .map((lesson: any) => {
          const activities: ActivityNode[] = (lesson.activities || [])
            .sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
            .map((a: any) => ({
              id: a.activity_id,
              lesson_id: a.lesson_id,
              type: a.activity_type || 'other',
              title: a.title || '',
              instruction: a.instruction || '',
              data: a.content,
              media: buildActivityMediaFromContent(a.content),
              compensates: a.compensates || null,
              order_index: a.order_index ?? 0,
              completed: activityProgressMap.get(a.activity_id) ?? false,
              difficulty: a.difficulty || null,
              book_type: a.book_type || null,
              book_page: a.book_page || null,
              is_required: a.is_required ?? true,
              xp_reward: a.xp_reward ?? 10,
              time_estimate_minutes: a.time_estimate_minutes ?? null,
            }));

          const lessonCompleted = lessonProgressMap.get(lesson.id) ?? false;

          return {
            id: lesson.id,
            module_id: mod.id,
            title: lesson.title || '',
            order_index: lesson.order_index ?? 0,
            description: lesson.description || '',
            objectives: lesson.objectives || null,
            vocabulary: lesson.vocabulary || null,
            language_focus: lesson.language_focus || null,
            cover_image_src: lesson.cover_image_src || null,
            activities,
            completed: lessonCompleted || (activities.length > 0 && activities.every(a => a.completed)),
          };
        });

      const moduleCompleted = lessons.length > 0 && lessons.every(l => l.completed);

      return {
        id: mod.id,
        title: mod.title || '',
        order_index: mod.order_index ?? 0,
        lessons,
        completed: moduleCompleted,
      };
    });

  return {
    id: courseData.id,
    title: courseData.title || '',
    modules,
  };
}