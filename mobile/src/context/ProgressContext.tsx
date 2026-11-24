import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/api/supabase';
import { useAuth } from './AuthContext';

export interface StudentRank {
  level: number;
  titleAr: string;
  titleEn: string;
  minXp: number;
  nextLevelXp: number;
  progressPercent: number;
}

export function calculateStudentRank(currentXp: number): StudentRank {
  if (currentXp < 200) {
    return {
      level: 1,
      titleAr: 'مبتدئ',
      titleEn: 'Beginner',
      minXp: 0,
      nextLevelXp: 200,
      progressPercent: Math.min(100, Math.round((currentXp / 200) * 100)),
    };
  } else if (currentXp < 500) {
    return {
      level: 2,
      titleAr: 'مستكشف',
      titleEn: 'Explorer',
      minXp: 200,
      nextLevelXp: 500,
      progressPercent: Math.min(100, Math.round(((currentXp - 200) / 300) * 100)),
    };
  } else if (currentXp < 1000) {
    return {
      level: 3,
      titleAr: 'متميز',
      titleEn: 'Achiever',
      minXp: 500,
      nextLevelXp: 1000,
      progressPercent: Math.min(100, Math.round(((currentXp - 500) / 500) * 100)),
    };
  } else if (currentXp < 2000) {
    return {
      level: 4,
      titleAr: 'باحث',
      titleEn: 'Scholar',
      minXp: 1000,
      nextLevelXp: 2000,
      progressPercent: Math.min(100, Math.round(((currentXp - 1000) / 1000) * 100)),
    };
  } else {
    return {
      level: 5,
      titleAr: 'متقن',
      titleEn: 'Master',
      minXp: 2000,
      nextLevelXp: 2000,
      progressPercent: 100,
    };
  }
}

interface ProgressContextType {
  completedLessons: Record<string, boolean>;
  xp: number;
  streak: number;
  rank: StudentRank;
  accuracyRate: number;
  studyMinutes: number;
  currentGrade: string;
  setCurrentGrade: (grade: string) => void;
  completeLesson: (lessonId: string, earnedXp?: number, scorePercent?: number) => Promise<void>;
  addXp: (amount: number) => void;
  isLessonCompleted: (lessonId: string) => boolean;
}

const ProgressContext = createContext<ProgressContextType>({} as ProgressContextType);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>({});
  const [xp, setXp] = useState(120);
  const [streak, setStreak] = useState(3);
  const [lastActiveDate, setLastActiveDate] = useState<string | null>(null);
  const [accuracyRate, setAccuracyRate] = useState(94);
  const [currentGrade, setCurrentGradeState] = useState('Grade 7');

  const userId = user?.id || 'guest';
  const STORAGE_XP_KEY = `@crescent_${userId}_xp`;
  const STORAGE_STREAK_KEY = `@crescent_${userId}_streak`;
  const STORAGE_DATE_KEY = `@crescent_${userId}_last_active_date`;
  const STORAGE_GRADE_KEY = `@crescent_${userId}_active_grade`;
  const STORAGE_COMPLETED_KEY = `@crescent_${userId}_completed_lessons`;
  const STORAGE_PENDING_KEY = `@crescent_${userId}_pending_progress`;
  const STORAGE_ACCURACY_KEY = `@crescent_${userId}_accuracy_rate`;

  // Load cached stats from user-scoped AsyncStorage
  useEffect(() => {
    async function loadCachedProgress() {
      try {
        const [cachedXp, cachedStreak, cachedDate, cachedGrade, cachedCompleted, cachedAccuracy] = await Promise.all([
          AsyncStorage.getItem(STORAGE_XP_KEY),
          AsyncStorage.getItem(STORAGE_STREAK_KEY),
          AsyncStorage.getItem(STORAGE_DATE_KEY),
          AsyncStorage.getItem(STORAGE_GRADE_KEY),
          AsyncStorage.getItem(STORAGE_COMPLETED_KEY),
          AsyncStorage.getItem(STORAGE_ACCURACY_KEY),
        ]);
        if (cachedXp) setXp(parseInt(cachedXp, 10));
        if (cachedStreak) setStreak(parseInt(cachedStreak, 10));
        if (cachedDate) setLastActiveDate(cachedDate);
        if (cachedGrade) setCurrentGradeState(cachedGrade);
        if (cachedAccuracy) setAccuracyRate(parseInt(cachedAccuracy, 10));
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
      setXp(120);
      setStreak(3);
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

  const completeLesson = async (lessonId: string, earnedXp = 50, scorePercent = 95) => {
    // 1. Optimistic local state update & instant AsyncStorage write
    setCompletedLessons((prev) => {
      const next = { ...prev, [lessonId]: true };
      AsyncStorage.setItem(STORAGE_COMPLETED_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
    addXp(earnedXp);

    // 2. Calculate daily streak with calendar date
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    setStreak((prevStreak) => {
      let nextStreak = prevStreak;
      if (!lastActiveDate) {
        nextStreak = 1;
      } else if (lastActiveDate === yesterdayStr) {
        nextStreak = prevStreak + 1;
      } else if (lastActiveDate !== todayStr) {
        nextStreak = 1;
      }
      AsyncStorage.setItem(STORAGE_STREAK_KEY, nextStreak.toString()).catch(() => {});
      AsyncStorage.setItem(STORAGE_DATE_KEY, todayStr).catch(() => {});
      return nextStreak;
    });
    setLastActiveDate(todayStr);

    // 3. Update rolling accuracy rate
    setAccuracyRate((prevRate) => {
      const updatedRate = Math.round((prevRate * 0.7) + (scorePercent * 0.3));
      AsyncStorage.setItem(STORAGE_ACCURACY_KEY, updatedRate.toString()).catch(() => {});
      return updatedRate;
    });

    // 4. Remote Supabase persistence
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

  const rank = calculateStudentRank(xp);
  const completedCount = Object.keys(completedLessons).length;
  const studyMinutes = Math.max(15, completedCount * 12);

  return (
    <ProgressContext.Provider
      value={{
        completedLessons,
        xp,
        streak,
        rank,
        accuracyRate,
        studyMinutes,
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
