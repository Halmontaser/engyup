import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { McqActivity } from '@/activities/McqActivity';
import { FlashcardActivity } from '@/activities/FlashcardActivity';
import { SpellingBeeActivity } from '@/activities/SpellingBeeActivity';
import { WordOrderActivity } from '@/activities/WordOrderActivity';
import { useProgress } from '@/context/ProgressContext';
import { colors } from '@/theme/colors';

const PRACTICE_ACTIVITIES = [
  {
    type: 'mcq',
    title: 'تحدي القواعد والمفردات',
    data: {
      question: 'Which of the following sentences is grammatically correct?',
      options: [
        'She go to Sana\'a yesterday.',
        'She went to Sana\'a yesterday.',
        'She going to Sana\'a yesterday.',
        'She goes to Sana\'a yesterday.'
      ],
      correct_answer: 1,
      explanation_ar: 'نستخدم صيغة الماضي البسيط (went) مع الكلمة الدالة (yesterday).',
    },
  },
  {
    type: 'spelling',
    title: 'تحدي التهجئة',
    data: {
      word: 'HOSPITAL',
      hint: 'مستشفى لعلاج المرضى',
    },
  },
  {
    type: 'word-order',
    title: 'تحدي ترتيب الجملة',
    data: {
      target_sentence: 'English is important for our future',
      words: ['future', 'English', 'important', 'our', 'is', 'for'],
    },
  },
  {
    type: 'flashcard',
    title: 'بطاقة مفردات سريعة',
    data: {
      word: 'Opportunity',
      translation: 'فرصة ثمينة ومواتية',
      phonetic: 'ˌɒpəˈtjuːnəti',
      example: 'Education provides great opportunity for youth in Yemen.',
    },
  },
];

export function PracticeScreen() {
  const { addXp } = useProgress();
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [completedMap, setCompletedMap] = useState<Record<number, boolean>>({});

  const handleComplete = (idx: number, correct = true) => {
    if (correct) addXp(25);
    setCompletedMap((prev) => ({ ...prev, [idx]: true }));
    setActiveIdx(null);
  };

  if (activeIdx !== null) {
    const act = PRACTICE_ACTIVITIES[activeIdx];

    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => setActiveIdx(null)}>
            <Ionicons name="close" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{act.title}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={{ flex: 1 }}>
          {act.type === 'mcq' && (
            <McqActivity data={act.data} onComplete={(c) => handleComplete(activeIdx, c)} />
          )}
          {act.type === 'spelling' && (
            <SpellingBeeActivity data={act.data} onComplete={(c) => handleComplete(activeIdx, c)} />
          )}
          {act.type === 'word-order' && (
            <WordOrderActivity data={act.data} onComplete={(c) => handleComplete(activeIdx, c)} />
          )}
          {act.type === 'flashcard' && (
            <FlashcardActivity data={act.data} onComplete={(c) => handleComplete(activeIdx, c)} />
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleBox}>
          <Text style={styles.mainTitle}>التمرين اليومي السريع ⚡</Text>
          <Text style={styles.subTitle}>تمارين ممتعة لتنشيط الذاكرة وكسب نقاط إضافية (+25 XP)</Text>
        </View>

        <View style={styles.list}>
          {PRACTICE_ACTIVITIES.map((item, idx) => {
            const isDone = completedMap[idx];

            return (
              <TouchableOpacity
                key={idx}
                style={[styles.practiceCard, isDone && styles.practiceCardDone]}
                onPress={() => setActiveIdx(idx)}
                activeOpacity={0.8}
              >
                <View style={styles.cardLeft}>
                  <View style={[styles.iconCircle, isDone && styles.iconCircleDone]}>
                    <Ionicons
                      name={isDone ? 'checkmark' : item.type === 'mcq' ? 'help-circle' : item.type === 'spelling' ? 'keypad' : 'extension-puzzle'}
                      size={22}
                      color={isDone ? colors.textInverse : colors.accentEmerald}
                    />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardType}>{item.type.toUpperCase()} • +25 XP</Text>
                  </View>
                </View>

                <View style={[styles.badge, isDone && styles.badgeDone]}>
                  <Text style={[styles.badgeText, isDone && styles.badgeTextDone]}>
                    {isDone ? 'مكتمل' : 'ابدأ'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  titleBox: {
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'right',
  },
  subTitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  list: {
    gap: 12,
  },
  practiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBg,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
  },
  practiceCardDone: {
    borderColor: '#BBF7D0',
    backgroundColor: colors.correctBg,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.correctBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleDone: {
    backgroundColor: colors.accentEmerald,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  cardType: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    backgroundColor: colors.touchHighlight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  badgeDone: {
    backgroundColor: '#DCFCE7',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.selectedBorder,
  },
  badgeTextDone: {
    color: colors.accentEmerald,
  },
});
