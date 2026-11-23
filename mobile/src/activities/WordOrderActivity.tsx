import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { playCurriculumAudio, stopAllAudio } from '@/utils/audio';
import { colors } from '@/theme/colors';

interface WordOrderActivityProps {
  data: any;
  media?: any;
  onComplete: (correct?: boolean) => void;
}

export function WordOrderActivity({ data, media, onComplete }: WordOrderActivityProps) {
  // Normalize: handle data.sentences array vs flat data
  const sentences = Array.isArray(data?.sentences) && data.sentences.length > 0
    ? data.sentences
    : [data || {}];

  const [sentenceIdx, setSentenceIdx] = useState(0);
  const currentItem = sentences[sentenceIdx] || {};

  const target = (
    currentItem.target_sentence ||
    currentItem.sentence ||
    currentItem.text ||
    data?.target_sentence ||
    data?.sentence ||
    ''
  ).trim();

  const rawWords = currentItem.words || currentItem.jumbled || data?.words || data?.jumbled || (target ? target.split(/\s+/) : []);

  // Shuffled bank
  const [bankWords, setBankWords] = useState<string[]>(() => {
    return [...rawWords].sort(() => Math.random() - 0.5);
  });
  const [placedWords, setPlacedWords] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const audioPath = media?.audio?.[sentenceIdx]?.url || media?.audio?.[0]?.url || currentItem.audio_url;

  const handlePlaceWord = (word: string, index: number) => {
    if (checked) return;
    setPlacedWords([...placedWords, word]);
    const nextBank = [...bankWords];
    nextBank.splice(index, 1);
    setBankWords(nextBank);
  };

  const handleReturnWord = (word: string, index: number) => {
    if (checked) return;
    setBankWords([...bankWords, word]);
    const nextPlaced = [...placedWords];
    nextPlaced.splice(index, 1);
    setPlacedWords(nextPlaced);
  };

  const handleCheckOrContinue = () => {
    if (!checked) {
      const constructed = placedWords.join(' ');
      const cleanTarget = target.replace(/[.,?!]/g, '').toLowerCase();
      const cleanConstructed = constructed.replace(/[.,?!]/g, '').toLowerCase();
      const match = cleanConstructed === cleanTarget;
      setIsCorrect(match);
      setChecked(true);
      if (match) {
        playCurriculumAudio(audioPath, target);
      }
    } else {
      stopAllAudio();
      if (sentenceIdx + 1 < sentences.length) {
        setSentenceIdx((i) => i + 1);
        const nextTarget = (sentences[sentenceIdx + 1]?.target_sentence || sentences[sentenceIdx + 1]?.sentence || '').trim();
        const nextWords = sentences[sentenceIdx + 1]?.words || (nextTarget ? nextTarget.split(/\s+/) : []);
        setBankWords([...nextWords].sort(() => Math.random() - 0.5));
        setPlacedWords([]);
        setChecked(false);
      } else {
        onComplete(isCorrect);
      }
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.instruction}>
        {sentences.length > 1
          ? `جملة ${sentenceIdx + 1} من ${sentences.length} — رتّب الكلمات لتكوين جملة صحيحة 🧩`
          : 'رتّب الكلمات لتكوين جملة صحيحة 🧩'}
      </Text>

      {/* Target Sentence Drop Slot */}
      <View style={[styles.targetBox, checked && (isCorrect ? styles.targetCorrect : styles.targetIncorrect)]}>
        <Text style={styles.slotLabel}>الجملة المركّبة:</Text>
        <View style={styles.chipsWrap}>
          {placedWords.length === 0 ? (
            <Text style={styles.placeholderText}>اضغط على الكلمات بالأسفل لإضافتها هنا...</Text>
          ) : (
            placedWords.map((word, idx) => (
              <TouchableOpacity
                key={`${word}-${idx}`}
                style={styles.placedChip}
                onPress={() => handleReturnWord(word, idx)}
                disabled={checked}
              >
                <Text style={styles.placedChipText}>{word}</Text>
                {!checked && <Ionicons name="close" size={14} color={colors.textSecondary} style={{ marginLeft: 4 }} />}
              </TouchableOpacity>
            ))
          )}
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
          <View style={{ flex: 1 }}>
            <Text style={[styles.feedbackTitle, isCorrect ? styles.feedbackTitleCorrect : styles.feedbackTitleIncorrect]}>
              {isCorrect ? 'أحسنت! ترتيب ممتاز' : 'حاول مرة أخرى'}
            </Text>
            {!isCorrect ? (
              <Text style={styles.correctSentenceHint}>الجملة الصحيحة: {target}</Text>
            ) : null}
          </View>
        </View>
      )}

      {/* Word Bank */}
      <View style={styles.bankSection}>
        <Text style={styles.bankLabel}>بنك الكلمات:</Text>
        <View style={styles.chipsWrap}>
          {bankWords.map((word, idx) => (
            <TouchableOpacity
              key={`${word}-${idx}`}
              style={styles.bankChip}
              onPress={() => handlePlaceWord(word, idx)}
              disabled={checked}
              activeOpacity={0.7}
            >
              <Text style={styles.bankChipText}>{word}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Action Button */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          placedWords.length === 0 && !checked && styles.actionButtonDisabled,
        ]}
        onPress={handleCheckOrContinue}
        disabled={placedWords.length === 0 && !checked}
        activeOpacity={0.85}
      >
        <Text style={styles.actionButtonText}>
          {!checked
            ? 'تحقق من الترتيب  •  Check'
            : sentenceIdx + 1 < sentences.length
            ? 'الجملة التالية  •  Next'
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
  targetBox: {
    minHeight: 120,
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    marginBottom: 20,
  },
  targetCorrect: {
    borderColor: colors.accentEmerald,
    backgroundColor: '#F0FDF4',
    borderStyle: 'solid',
  },
  targetIncorrect: {
    borderColor: colors.accentRed,
    backgroundColor: '#FEF2F2',
    borderStyle: 'solid',
  },
  slotLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 8,
    textAlign: 'right',
  },
  placeholderText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 14,
    fontStyle: 'italic',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  placedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.touchHighlight,
    borderWidth: 1.5,
    borderColor: colors.selectedBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  placedChipText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.selectedBorder,
  },
  bankSection: {
    backgroundColor: colors.cardBg,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 28,
  },
  bankLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
    textAlign: 'right',
  },
  bankChip: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderBottomWidth: 3,
    borderBottomColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bankChipText: {
    fontSize: 16,
    fontWeight: '600',
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
  feedbackTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  feedbackTitleCorrect: {
    color: '#166534',
  },
  feedbackTitleIncorrect: {
    color: '#991B1B',
  },
  correctSentenceHint: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 4,
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
