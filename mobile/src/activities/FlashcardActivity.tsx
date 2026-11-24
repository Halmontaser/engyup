import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { playCurriculumAudio, stopAllAudio } from '@/utils/audio';
import { colors } from '@/theme/colors';

interface FlashcardActivityProps {
  data: any;
  media?: any;
  onComplete: (correct?: boolean) => void;
}

export function FlashcardActivity({ data, media, onComplete }: FlashcardActivityProps) {
  // Normalize: handle data.items array vs flat data
  const items = Array.isArray(data?.items) && data.items.length > 0
    ? data.items
    : [data || {}];

  const [currentIdx, setCurrentIdx] = useState(0);
  const [masteredCount, setMasteredCount] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, []);

  const currentItem = items[currentIdx] || {};
  const englishWord = currentItem.word || currentItem.front || currentItem.en || data?.word || 'Vocabulary';
  const arabicWord =
    currentItem.translation ||
    currentItem.arabic ||
    currentItem.ar ||
    currentItem.definition ||
    currentItem.meaning ||
    currentItem.back ||
    data?.translation ||
    'الترجمة';
  const phonetic = currentItem.phonetic || data?.phonetic || '';
  const example = currentItem.example || currentItem.sentence || data?.example || '';

  const audioPath = media?.audio?.[currentIdx]?.url || currentItem.wordAudio || currentItem.audio_url || currentItem.audio;

  const handleSpeak = async () => {
    setIsPlayingAudio(true);
    await playCurriculumAudio(audioPath, englishWord, () => setIsPlayingAudio(false));
  };

  const handleNext = (mastered = true) => {
    stopAllAudio();
    setIsFlipped(false);
    if (mastered) {
      setMasteredCount((c) => c + 1);
    }
    if (currentIdx + 1 < items.length) {
      setCurrentIdx((i) => i + 1);
    } else {
      const total = masteredCount + (mastered ? 1 : 0);
      onComplete(total >= Math.ceil(items.length * 0.5));
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.instruction}>
        {items.length > 1
          ? `بطاقة ${currentIdx + 1} من ${items.length} — المس لقلب البطاقة 🔄`
          : 'المس البطاقة لقلبها واكتشاف المعنى 🔄'}
      </Text>

      {/* Flip Card */}
      <TouchableOpacity
        style={[styles.card, isFlipped && styles.cardFlipped]}
        onPress={() => setIsFlipped(!isFlipped)}
        activeOpacity={0.9}
      >
        <View style={styles.cardHeader}>
          <TouchableOpacity style={styles.speakButton} onPress={handleSpeak}>
            <Ionicons
              name={isPlayingAudio ? 'volume-high' : 'volume-medium'}
              size={24}
              color={isPlayingAudio ? colors.accentEmerald : colors.accentCyan}
            />
          </TouchableOpacity>
          <View style={styles.flipPill}>
            <Ionicons name="sync" size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
            <Text style={styles.flipPillText}>{isFlipped ? 'الوجه العربي' : 'الوجه الإنجليزي'}</Text>
          </View>
        </View>

        {!isFlipped ? (
          <View style={styles.cardBody}>
            <Text style={styles.englishWord}>{englishWord}</Text>
            {phonetic ? <Text style={styles.phoneticText}>/{phonetic}/</Text> : null}
            <Text style={styles.tapPrompt}>اضغط للاطلاع على الشرح العربي</Text>
          </View>
        ) : (
          <View style={styles.cardBody}>
            <Text style={styles.arabicWord}>{arabicWord}</Text>
            {example ? (
              <View style={styles.exampleBox}>
                <Text style={styles.exampleLabel}>سياق الاستخدام:</Text>
                <Text style={styles.exampleText}>{example}</Text>
              </View>
            ) : null}
          </View>
        )}
      </TouchableOpacity>

      {/* Response Actions */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.reviewBtn]}
          onPress={() => handleNext(false)}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh" size={18} color={colors.accentAmber} />
          <Text style={styles.reviewBtnText}>أحتاج مراجعة</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.masteredBtn]}
          onPress={() => handleNext(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-circle" size={18} color={colors.textInverse} />
          <Text style={styles.masteredBtnText}>
            {currentIdx + 1 < items.length ? 'التالي (+10 XP)' : 'حفظت الكلمة (+10 XP)'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 40,
  },
  instruction: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    minHeight: 280,
    backgroundColor: colors.cardBg,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    padding: 20,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 28,
  },
  cardFlipped: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  speakButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.correctBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  flipPillText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  cardBody: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  englishWord: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
  },
  phoneticText: {
    fontSize: 16,
    color: colors.selectedBorder,
    marginTop: 8,
    fontFamily: 'monospace',
  },
  tapPrompt: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 20,
  },
  arabicWord: {
    fontSize: 30,
    fontWeight: '800',
    color: '#065F46',
    textAlign: 'center',
    lineHeight: 46,
    writingDirection: 'rtl',
  },
  exampleBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    width: '100%',
  },
  exampleLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  exampleText: {
    fontSize: 14,
    color: colors.primary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  reviewBtn: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
  },
  reviewBtnText: {
    color: colors.accentAmber,
    fontSize: 14,
    fontWeight: '700',
  },
  masteredBtn: {
    backgroundColor: colors.accentEmerald,
    shadowColor: colors.accentEmerald,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  masteredBtnText: {
    color: colors.textInverse,
    fontSize: 14,
    fontWeight: '700',
  },
});
