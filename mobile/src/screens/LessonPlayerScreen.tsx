import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Lesson, Activity, fetchLessonActivities } from '@/api/curriculum';
import { useProgress } from '@/context/ProgressContext';
import { ProgressBar } from '@/components/ProgressBar';
import { ActivityRenderer } from '@/components/ActivityRenderer';
import { stopAllAudio } from '@/utils/audio';
import { colors } from '@/theme/colors';

interface LessonPlayerScreenProps {
  lesson: Lesson;
  onBack: () => void;
}

export function LessonPlayerScreen({ lesson, onBack }: LessonPlayerScreenProps) {
  const { completeLesson } = useProgress();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    async function loadActivities() {
      try {
        const list = await fetchLessonActivities(lesson.id);
        if (list && list.length > 0) {
          setActivities(list);
        } else {
          // Fallback mock activities if database has 0 activities for this specific lesson
          setActivities([
            {
              id: 'mock-1',
              lesson_id: lesson.id,
              type: 'flashcard',
              title: 'Key Vocabulary',
              instruction: 'Review the word and flip to see Arabic explanation',
              data: {
                word: 'Education',
                translation: 'التعليم والتربية',
                phonetic: 'ˌedʒuˈkeɪʃn',
                example: 'Education is the key to Yemen future.',
              },
              order_index: 0,
            },
            {
              id: 'mock-2',
              lesson_id: lesson.id,
              type: 'mcq',
              title: 'Check Understanding',
              instruction: 'Select the best answer',
              data: {
                question: 'What is the meaning of "Education"?',
                options: ['التعليم', 'السفر', 'الصحة', 'التجارة'],
                correct_answer: 0,
                explanation_ar: 'التعليم هي الترجمة الدقيقة لكلمة Education.',
              },
              order_index: 1,
            },
          ]);
        }
      } finally {
        setLoading(false);
      }
    }
    loadActivities();
    return () => {
      stopAllAudio();
    };
  }, [lesson.id]);

  const handleExit = () => {
    Alert.alert('الخروج من الدرس', 'هل تريد مغادرة الدرس؟ سيتم حفظ تقدمك الحالي.', [
      { text: 'متابعة الدرس', style: 'cancel' },
      { text: 'خروج', style: 'destructive', onPress: onBack },
    ]);
  };

  const handleNextActivity = (correct = true) => {
    if (correct) {
      setScore((s) => s + 1);
    }

    if (currentIndex + 1 < activities.length) {
      setCurrentIndex((idx) => idx + 1);
    } else {
      // Completed full lesson!
      setIsCompleted(true);
      completeLesson(lesson.id, 50);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.accentEmerald} />
        <Text style={styles.loadingText}>جاري تجهيز الدرس والتمارين...</Text>
      </View>
    );
  }

  // Celebration Completion View
  if (isCompleted) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <ScrollView contentContainerStyle={styles.completionContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.trophyCircle}>
            <Ionicons name="trophy" size={54} color={colors.accentGold} />
          </View>

          <Text style={styles.congratsTitle}>مبارك يا بطل! 🎉</Text>
          <Text style={styles.congratsSubtitle}>أتممت درس: {lesson.title} بنجاح</Text>

          <View style={styles.rewardCard}>
            <View style={styles.rewardRow}>
              <Ionicons name="star" size={24} color={colors.accentGold} />
              <Text style={styles.rewardValue}>+50 XP</Text>
            </View>
            <Text style={styles.rewardLabel}>تمت إضافة نقاط الخبرة إلى رصيدك</Text>
          </View>

          <TouchableOpacity style={styles.finishButton} onPress={onBack} activeOpacity={0.85}>
            <Ionicons name="arrow-back" size={20} color={colors.textInverse} style={{ marginRight: 6 }} />
            <Text style={styles.finishButtonText}>العودة لقائمة الدروس</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const currentActivity = activities[currentIndex];
  const bookRef = [
    currentActivity?.book_type?.toUpperCase(),
    currentActivity?.book_page ? `p.${currentActivity.book_page}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      {/* Top Runner Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={handleExit}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={22} color={colors.primary} />
        </TouchableOpacity>

        <ProgressBar current={currentIndex + 1} total={activities.length} />

        {bookRef ? (
          <View style={styles.bookBadge}>
            <Ionicons name="book-outline" size={12} color={colors.accentEmerald} />
            <Text style={styles.bookBadgeText}>{bookRef}</Text>
          </View>
        ) : (
          <View style={{ width: 32 }} />
        )}
      </View>

      {/* Activity Body */}
      <View style={styles.activityBody}>
        {currentActivity ? (
          <ActivityRenderer
            key={currentActivity.id || `act-${currentIndex}`}
            activity={currentActivity}
            onComplete={handleNextActivity}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  closeBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.correctBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  bookBadgeText: {
    fontSize: 11,
    color: colors.accentEmerald,
    fontWeight: '700',
  },
  activityBody: {
    flex: 1,
  },
  completionContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  trophyCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FDE68A',
    marginBottom: 20,
  },
  congratsTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 6,
  },
  congratsSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  rewardCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    width: '100%',
    marginBottom: 32,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  rewardValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.accentGold,
  },
  rewardLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  finishButton: {
    width: '100%',
    height: 52,
    backgroundColor: colors.accentEmerald,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accentEmerald,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  finishButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '700',
  },
});
