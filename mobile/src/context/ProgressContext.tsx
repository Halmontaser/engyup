import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/api/supabase';
import { useAuth } from './AuthContext';

interface ProgressContextType {
  completedLessons: Record<string, boolean>;
  xp: number;
  streak: number;
  currentGrade: string;
  setCurrentGrade: (grade: string) => void;
  completeLesson: (lessonId: string, earnedXp?: number) => Promise<void>;
  addXp: (amount: number) => void;
  isLessonCompleted: (lessonId: string) => boolean;
}

const ProgressContext = createContext<ProgressContextType>({} as ProgressContextType);

const STORAGE_XP_KEY = '@crescent_user_xp';
const STORAGE_STREAK_KEY = '@crescent_user_streak';
const STORAGE_GRADE_KEY = '@crescent_active_grade';

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>({});
  const [xp, setXp] = useState(120);
  const [streak, setStreak] = useState(3);
  const [currentGrade, setCurrentGradeState] = useState('Grade 7');

  const userId = user?.id || 'guest';
  const STORAGE_XP_KEY = `@crescent_${userId}_xp`;
  const STORAGE_STREAK_KEY = `@crescent_${userId}_streak`;
  const STORAGE_GRADE_KEY = `@crescent_${userId}_active_grade`;
  const STORAGE_COMPLETED_KEY = `@crescent_${userId}_completed_lessons`;
  const STORAGE_PENDING_KEY = `@crescent_${userId}_pending_progress`;

  // Load cached stats from AsyncStorage
  useEffect(() => {
    async function loadCachedProgress() {
      try {
        const [cachedXp, cachedStreak, cachedGrade, cachedCompleted] = await Promise.all([
          AsyncStorage.getItem(STORAGE_XP_KEY),
          AsyncStorage.getItem(STORAGE_STREAK_KEY),
          AsyncStorage.getItem(STORAGE_GRADE_KEY),
          AsyncStorage.getItem(STORAGE_COMPLETED_KEY),
        ]);
        if (cachedXp) setXp(parseInt(cachedXp, 10));
        if (cachedStreak) setStreak(parseInt(cachedStreak, 10));
        if (cachedGrade) setCurrentGradeState(cachedGrade);
        if (cachedCompleted) {
          try {
            setCompletedLessons(JSON.parse(cachedCompleted));
          } catch (e) {}
        }
      } catch (e) {
        console.warn('Failed to load local progress:', e);
      }
    }
    loadCachedProgress();
  }, [userId]);

  // Fetch remote lesson completions from Supabase & flush offline pending queue
  const fetchProgress = useCallback(async () => {
    if (!user) return;
    try {
      // 1. Flush any pending offline lesson completions
      const pendingRaw = await AsyncStorage.getItem(STORAGE_PENDING_KEY);
      if (pendingRaw) {
        const pendingIds: string[] = JSON.parse(pendingRaw);
        if (Array.isArray(pendingIds) && pendingIds.length > 0) {
          const rows = pendingIds.map((lid) => ({
            user_id: user.id,
            lesson_id: lid,
            status: 'completed',
            completion_date: new Date().toISOString(),
          }));
          await supabase.from('user_progress').upsert(rows, { onConflict: 'user_id,lesson_id' });
          await AsyncStorage.removeItem(STORAGE_PENDING_KEY);
        }
      }

      // 2. Fetch full progress
      const { data, error } = await supabase
        .from('user_progress')
        .select('lesson_id, status')
        .eq('user_id', user.id);

      if (!error && data) {
        setCompletedLessons((prev) => {
          const map: Record<string, boolean> = { ...prev };
          data.forEach((row: { lesson_id: string; status: string }) => {
            if (row.status === 'completed') map[row.lesson_id] = true;
          });
          AsyncStorage.setItem(STORAGE_COMPLETED_KEY, JSON.stringify(map)).catch(() => {});
          return map;
        });
      }
    } catch (err) {
      console.error('Error fetching progress from Supabase:', err);
    }
  }, [user, STORAGE_PENDING_KEY, STORAGE_COMPLETED_KEY]);

  useEffect(() => {
    if (user) {
      fetchProgress();
    } else {
      setCompletedLessons({});
      setXp(0);
      setStreak(0);
    }
  }, [user, fetchProgress]);

  const setCurrentGrade = (grade: string) => {
    setCurrentGradeState(grade);
    AsyncStorage.setItem(STORAGE_GRADE_KEY, grade).catch(() => {});
  };

  const addXp = (amount: number) => {
    setXp((prev) => {
      const next = prev + amount;
      AsyncStorage.setItem(STORAGE_XP_KEY, next.toString()).catch(() => {});
      return next;
    });
  };

  const completeLesson = async (lessonId: string, earnedXp = 50) => {
    // 1. Optimistic local state update & instant AsyncStorage write
    setCompletedLessons((prev) => {
      const next = { ...prev, [lessonId]: true };
      AsyncStorage.setItem(STORAGE_COMPLETED_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
    addXp(earnedXp);

    if (user) {
      try {
        const { error } = await supabase.from('user_progress').upsert(
          {
            user_id: user.id,
            lesson_id: lessonId,
            status: 'completed',
            completion_date: new Date().toISOString(),
          },
          { onConflict: 'user_id,lesson_id' }
        );

        if (error) throw error;
      } catch (err) {
        // Enqueue to offline pending progress
        try {
          const existing = await AsyncStorage.getItem(STORAGE_PENDING_KEY);
          const queue: string[] = existing ? JSON.parse(existing) : [];
          if (!queue.includes(lessonId)) {
            queue.push(lessonId);
            await AsyncStorage.setItem(STORAGE_PENDING_KEY, JSON.stringify(queue));
          }
        } catch (queueErr) {
          console.warn('Failed to queue offline lesson completion:', queueErr);
        }
      }
    }
  };

  const isLessonCompleted = (lessonId: string) => Boolean(completedLessons[lessonId]);

  return (
    <ProgressContext.Provider
      value={{
        completedLessons,
        xp,
        streak,
        currentGrade,
        setCurrentGrade,
        completeLesson,
        addXp,
        isLessonCompleted,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export const useProgress = () => useContext(ProgressContext);
