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

  // Load cached stats from AsyncStorage
  useEffect(() => {
    async function loadCachedProgress() {
      try {
        const [cachedXp, cachedStreak, cachedGrade] = await Promise.all([
          AsyncStorage.getItem(STORAGE_XP_KEY),
          AsyncStorage.getItem(STORAGE_STREAK_KEY),
          AsyncStorage.getItem(STORAGE_GRADE_KEY),
        ]);
        if (cachedXp) setXp(parseInt(cachedXp, 10));
        if (cachedStreak) setStreak(parseInt(cachedStreak, 10));
        if (cachedGrade) setCurrentGradeState(cachedGrade);
      } catch (e) {
        console.warn('Failed to load local progress:', e);
      }
    }
    loadCachedProgress();
  }, []);

  // Fetch remote lesson completions from Supabase
  const fetchProgress = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('lesson_id, status')
        .eq('user_id', user.id);

      if (!error && data) {
        const map: Record<string, boolean> = {};
        data.forEach((row: { lesson_id: string; status: string }) => {
          if (row.status === 'completed') map[row.lesson_id] = true;
        });
        setCompletedLessons(map);
      }
    } catch (err) {
      console.error('Error fetching progress from Supabase:', err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchProgress();
    } else {
      setCompletedLessons({});
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
    // Optimistic local state update
    setCompletedLessons((prev) => ({ ...prev, [lessonId]: true }));
    addXp(earnedXp);

    if (user) {
      try {
        await supabase.from('user_progress').upsert(
          {
            user_id: user.id,
            lesson_id: lessonId,
            status: 'completed',
            completion_date: new Date().toISOString(),
          },
          { onConflict: 'user_id,lesson_id' }
        );
      } catch (err) {
        console.error('Error recording lesson completion in user_progress:', err);
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
