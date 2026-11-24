import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export interface Activity {
  id: string;
  lesson_id: string;
  type: string;
  title: string;
  instruction: string;
  data: any;
  media?: {
    audio?: Array<{ filename: string; url: string; text?: string; audioType?: string }>;
    images?: Array<{ filename: string; url: string; text?: string }>;
  };
  compensates?: string | null;
  book_type?: string | null;
  book_page?: string | null;
  order_index: number;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  order_index: number;
  activities?: Activity[];
  completed?: boolean;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  course_code?: string;
  tenant_id: string;
  modules?: Module[];
}

const CACHE_PREFIX = '@crescent_cache_';

export async function fetchCourses(tenantId?: string): Promise<Course[]> {
  const cacheKey = `${CACHE_PREFIX}courses_${tenantId || 'all'}`;

  // Read local cache first for instant offline loading
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      // Background re-fetch to keep fresh
      refreshCoursesCache(tenantId, cacheKey);
      return parsed;
    }

    // Fallback: If cold start with no tenant, search for any cached courses
    const allKeys = await AsyncStorage.getAllKeys();
    const courseKeys = (allKeys || []).filter((k: string) => k.startsWith(`${CACHE_PREFIX}courses_`));
    for (const key of courseKeys) {
      const alt = await AsyncStorage.getItem(key);
      if (alt) {
        const parsed = JSON.parse(alt);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch (e) {
    // Ignore cache read error and proceed to network
  }

  return refreshCoursesCache(tenantId, cacheKey);
}

async function refreshCoursesCache(tenantId: string | undefined, cacheKey: string): Promise<Course[]> {
  try {
    let query = supabase
      .from('courses')
      .select('*, modules(*, lessons(*))')
      .order('created_at', { ascending: true });

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Network error fetching courses from Supabase:', error);
      return [];
    }

    const filtered = (data || []).filter(
      (c) =>
        c.title?.toLowerCase().includes('grade') ||
        c.course_code?.toLowerCase().startsWith('g')
    );

    AsyncStorage.setItem(cacheKey, JSON.stringify(filtered)).catch(() => {});
    return filtered;
  } catch (err) {
    console.warn('Offline error fetching courses:', err);
    return [];
  }
}

export async function fetchCourseModules(courseId: string): Promise<Module[]> {
  const cacheKey = `${CACHE_PREFIX}modules_${courseId}`;

  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      refreshModulesCache(courseId, cacheKey);
      return parsed;
    }
  } catch (e) {}

  return refreshModulesCache(courseId, cacheKey);
}

async function refreshModulesCache(courseId: string, cacheKey: string): Promise<Module[]> {
  try {
    const { data, error } = await supabase
      .from('modules')
      .select('*, lessons(*)')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (error) {
      console.warn('Network error fetching modules:', error);
      return [];
    }

    const modules = (data || []).map((m) => ({
      ...m,
      lessons: (m.lessons || []).sort(
        (a: Lesson, b: Lesson) => a.order_index - b.order_index
      ),
    }));

    AsyncStorage.setItem(cacheKey, JSON.stringify(modules)).catch(() => {});
    return modules;
  } catch (err) {
    console.warn('Offline error fetching modules:', err);
    return [];
  }
}

export async function fetchLessonActivities(lessonId: string): Promise<Activity[]> {
  const cacheKey = `${CACHE_PREFIX}activities_${lessonId}`;

  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      refreshActivitiesCache(lessonId, cacheKey);
      return parsed;
    }
  } catch (e) {}

  return refreshActivitiesCache(lessonId, cacheKey);
}

async function refreshActivitiesCache(lessonId: string, cacheKey: string): Promise<Activity[]> {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('order_index', { ascending: true });

    if (error) {
      console.warn('Network error fetching activities:', error);
      return [];
    }

    const activities = data || [];
    AsyncStorage.setItem(cacheKey, JSON.stringify(activities)).catch(() => {});
    return activities;
  } catch (err) {
    console.warn('Offline error fetching activities:', err);
    return [];
  }
}
