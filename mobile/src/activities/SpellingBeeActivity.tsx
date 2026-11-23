import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { playCurriculumAudio, stopAllAudio } from '@/utils/audio';
import { PressableBilingual } from '@/components/PressableBilingual';
import { colors } from '@/theme/colors';

interface SpellingBeeActivityProps {
  data: any;
  media?: any;
  onComplete: (correct?: boolean) => void;
}

export function SpellingBeeActivity({ data, media, onComplete }: SpellingBeeActivityProps) {
  const words = Array.isArray(data?.words) && data.words.length > 0
    ? data.words
    : [data || { word: 'STUDENT', hint: 'طالب في المدرسة' }];

  const [wordIdx, setWordIdx] = useState(0);
  const currentItem = words[wordIdx] || {};

  const targetWord = (currentItem.word || currentItem.text || 'WORD').toUpperCase();
  const arabicHint = currentItem.hint || currentItem.translation || currentItem.definition || 'حاول تهجئة الكلمة الإنجليزية';

  const scrambled = (
    currentItem.scrambled ||
    targetWord.split('').sort(() => Math.random() - 0.5)
  ).map((letter: string, i: number) => ({ id: `${letter}-${i}`, letter: letter.toUpperCase() }));

  const [availableLetters, setAvailableLetters] = useState<Array<{ id: string; letter: string }>>(scrambled);
  const [spelledLetters, setSpelledLetters] = useState<Array<{ id: string; letter: string }>>([]);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const audioPath = media?.audio?.[wordIdx]?.url || currentItem.audio_url;

  const handleSpeak = () => {
    playCurriculumAudio(audioPath, targetWord);
  };

  const handlePickLetter = (item: { id: string; letter: string }, index: number) => {
    if (checked) return;
    setSpelledLetters([...spelledLetters, item]);
    const nextAvail = [...availableLetters];
    nextAvail.splice(index, 1);
    setAvailableLetters(nextAvail);
  };

  const handleReturnLetter = (item: { id: string; letter: string }, index: number) => {
    if (checked) return;
    setAvailableLetters([...availableLetters, item]);
    const nextSpelled = [...spelledLetters];
    nextSpelled.splice(index, 1);
    setSpelledLetters(nextSpelled);
  };

  const handleCheckOrContinue = () => {
    if (!checked) {
      const spelled = spelledLetters.map((l) => l.letter).join('');
      const match = spelled === targetWord;
      setIsCorrect(match);
      setChecked(true);
      if (match) {
        playCurriculumAudio(audioPath, targetWord);
      }
    } else {
      stopAllAudio();
      if (wordIdx + 1 < words.length) {
        setWordIdx((w) => w + 1);
        const nextTarget = (words[wordIdx + 1]?.word || '').toUpperCase();
        const nextScrambled = (words[wordIdx + 1]?.scrambled || nextTarget.split('').sort(() => Math.random() - 0.5))
          .map((letter: string, i: number) => ({ id: `${letter}-${i}`, letter: letter.toUpperCase() }));
        setAvailableLetters(nextScrambled);
        setSpelledLetters([]);
        setChecked(false);
      } else {
        onComplete(isCorrect);
      }
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.instruction}>
        {words.length > 1
          ? `كلمة ${wordIdx + 1} من ${words.length} — رتّب الحروف لتهجئة الكلمة 🐝`
          : 'رتّب الحروف لتهجئة الكلمة الإنجليزية 🐝'}
      </Text>

      {/* Audio & Hint Bar */}
      <View style={styles.promptBar}>
        <TouchableOpacity style={styles.audioButton} onPress={handleSpeak}>
          <Ionicons name="volume-high" size={24} color={colors.accentCyan} />
          <Text style={styles.audioButtonText}>استمع للكلمة</Text>
        </TouchableOpacity>

        <PressableBilingual
          text="تلميح بالعربية"
          arabicExplanation={arabicHint}
          style={styles.hintPill}
        />
      </View>

      {/* Target Word Slots */}
      <View style={[styles.targetBox, checked && (isCorrect ? styles.targetCorrect : styles.targetIncorrect)]}>
        <View style={styles.slotsRow}>
          {Array.from({ length: targetWord.length }).map((_, slotIdx) => {
            const letterObj = spelledLetters[slotIdx];

            return (
              <TouchableOpacity
                key={slotIdx}
                style={[styles.letterSlot, letterObj && styles.letterSlotFilled]}
                onPress={() => {
                  if (letterObj) handleReturnLetter(letterObj, slotIdx);
                }}
                disabled={!letterObj || checked}
              >
                <Text style={styles.letterSlotText}>{letterObj ? letterObj.letter : ''}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Feedback banner */}
      {checked && (
        <View style={[styles.feedbackBanner, isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect]}>
          <Ionicons
            name={isCorrect ? 'checkmark-circle' : 'alert-circle'}
            size={22}
            color={isCorrect ? colors.accentEmerald : colors.accentRed}
          />
          <Text style={[styles.feedbackText, isCorrect ? styles.feedbackTextCorrect : styles.feedbackTextIncorrect]}>
            {isCorrect ? 'تهجئة صحيحة! أحسنت' : `التهجئة الصحيحة هي: ${targetWord}`}
          </Text>
        </View>
      )}

      {/* Scrambled Letter Bank */}
      <View style={styles.bankCard}>
        <Text style={styles.bankTitle}>المس الحرف لإضافته للكلمة:</Text>
        <View style={styles.lettersRow}>
          {availableLetters.map((item, idx) => (
            <TouchableOpacity
              key={item.id}
              style={styles.letterChip}
              onPress={() => handlePickLetter(item, idx)}
              disabled={checked}
              activeOpacity={0.7}
            >
              <Text style={styles.letterChipText}>{item.letter}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Action Button */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          spelledLetters.length < targetWord.length && !checked && styles.actionButtonDisabled,
        ]}
        onPress={handleCheckOrContinue}
        disabled={spelledLetters.length < targetWord.length && !checked}
        activeOpacity={0.85}
      >
        <Text style={styles.actionButtonText}>
          {!checked
            ? 'تحقق من التهجئة  •  Check'
            : wordIdx + 1 < words.length
            ? 'الكلمة التالية  •  Next Word'
            : 'استمرار  •  Continue'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  instruction: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  promptBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.touchHighlight,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 8,
  },
  audioButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.selectedBorder,
  },
  hintPill: {
    marginVertical: 0,
  },
  targetBox: {
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  targetCorrect: {
    borderColor: colors.accentEmerald,
    backgroundColor: '#F0FDF4',
  },
  targetIncorrect: {
    borderColor: colors.accentRed,
    backgroundColor: '#FEF2F2',
  },
  slotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  letterSlot: {
    width: 44,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterSlotFilled: {
    borderStyle: 'solid',
    borderColor: colors.selectedBorder,
    backgroundColor: colors.touchHighlight,
  },
  letterSlotText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    gap: 10,
  },
  feedbackCorrect: {
    backgroundColor: '#DCFCE7',
  },
  feedbackIncorrect: {
    backgroundColor: '#FEE2E2',
  },
  feedbackText: {
    fontSize: 14,
    fontWeight: '700',
  },
  feedbackTextCorrect: {
    color: '#166534',
  },
  feedbackTextIncorrect: {
    color: '#991B1B',
  },
  bankCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 28,
  },
  bankTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
    textAlign: 'right',
  },
  lettersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  letterChip: {
    width: 48,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderBottomWidth: 3,
    borderBottomColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterChipText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  actionButton: {
    backgroundColor: colors.accentEmerald,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonDisabled: {
    backgroundColor: colors.cardBorder,
  },
  actionButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '700',
  },
});
