import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { playCurriculumAudio, stopAllAudio } from '@/utils/audio';
import { PressableBilingual } from '@/components/PressableBilingual';
import { colors } from '@/theme/colors';

interface TrueFalseActivityProps {
  data: any;
  media?: any;
  onComplete: (correct?: boolean) => void;
}

export function TrueFalseActivity({ data, media, onComplete }: TrueFalseActivityProps) {
  // Normalize: handle data.statements array vs flat data
  const statements = Array.isArray(data?.statements) && data.statements.length > 0
    ? data.statements
    : [data || {}];

  const [statementIdx, setStatementIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [checked, setChecked] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, []);

  const currentItem = statements[statementIdx] || {};
  const statementText = currentItem.statement || currentItem.prompt || currentItem.text || data?.statement || data?.prompt || 'Is this statement true or false?';
  const explanationAr = currentItem.explanation_ar || currentItem.explanation || data?.explanation_ar || data?.explanation || 'تحقق من صحة العبارة حسب الدرس.';

  const rawTrue =
    currentItem.isTrue !== undefined
      ? currentItem.isTrue
      : currentItem.is_true !== undefined
      ? currentItem.is_true
      : currentItem.correct_answer !== undefined
      ? currentItem.correct_answer
      : data?.isTrue !== undefined
      ? data?.isTrue
      : data?.is_true;
  const isActuallyTrue = rawTrue === true || rawTrue === 'true' || rawTrue === 1 || rawTrue === '1';

  const audioPath = media?.audio?.[statementIdx]?.url || currentItem.audio || currentItem.audio_url;

  const handleSpeak = async () => {
    setIsPlayingAudio(true);
    await playCurriculumAudio(audioPath, statementText, () => setIsPlayingAudio(false));
  };

  const handleCheckOrContinue = () => {
    if (!checked) {
      if (selectedAnswer === null) return;
      const isCorrect = selectedAnswer === isActuallyTrue;
      if (isCorrect) {
        setCorrectCount((c) => c + 1);
      }
      setChecked(true);
    } else {
      stopAllAudio();
      const isCorrect = selectedAnswer === isActuallyTrue;
      if (statementIdx + 1 < statements.length) {
        setStatementIdx((i) => i + 1);
        setSelectedAnswer(null);
        setChecked(false);
      } else {
        const totalCorrect = correctCount + (isCorrect ? 1 : 0);
        onComplete(totalCorrect >= Math.ceil(statements.length * 0.6));
      }
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Statement Card */}
      <View style={styles.statementCard}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.audioButton} onPress={handleSpeak}>
            <Ionicons
              name={isPlayingAudio ? 'volume-high' : 'volume-medium'}
              size={22}
              color={isPlayingAudio ? colors.accentEmerald : colors.accentCyan}
            />
          </TouchableOpacity>
          <Text style={styles.instructionBadge}>
            {statements.length > 1
              ? `عبارة ${statementIdx + 1} من ${statements.length}`
              : 'صح أم خطأ؟  •  True or False?'}
          </Text>
        </View>

        <PressableBilingual
          text={statementText}
          arabicExplanation={explanationAr}
          textStyle={styles.statementText}
          style={styles.bilingualContainer}
        />
      </View>

      {/* Large True / False Buttons */}
      <View style={styles.buttonsRow}>
        {/* True Button */}
        <TouchableOpacity
          style={[
            styles.choiceButton,
            styles.trueButton,
            selectedAnswer === true && styles.choiceButtonSelected,
            checked && isActuallyTrue && styles.choiceButtonCorrect,
            checked && selectedAnswer === true && !isActuallyTrue && styles.choiceButtonIncorrect,
          ]}
          onPress={() => {
            if (!checked) setSelectedAnswer(true);
          }}
          disabled={checked}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-circle" size={36} color={colors.accentEmerald} />
          <Text style={styles.trueButtonText}>صح  •  True</Text>
        </TouchableOpacity>

        {/* False Button */}
        <TouchableOpacity
          style={[
            styles.choiceButton,
            styles.falseButton,
            selectedAnswer === false && styles.choiceButtonSelected,
            checked && !isActuallyTrue && styles.choiceButtonCorrect,
            checked && selectedAnswer === false && isActuallyTrue && styles.choiceButtonIncorrect,
          ]}
          onPress={() => {
            if (!checked) setSelectedAnswer(false);
          }}
          disabled={checked}
          activeOpacity={0.8}
        >
          <Ionicons name="close-circle" size={36} color={colors.accentRed} />
          <Text style={styles.falseButtonText}>خطأ  •  False</Text>
        </TouchableOpacity>
      </View>

      {/* Action CTA */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          selectedAnswer === null && !checked && styles.actionButtonDisabled,
        ]}
        onPress={handleCheckOrContinue}
        disabled={selectedAnswer === null && !checked}
        activeOpacity={0.85}
      >
        <Text style={styles.actionButtonText}>
          {!checked
            ? 'تحقق من الإجابة  •  Check'
            : statementIdx + 1 < statements.length
            ? 'العبارة التالية  •  Next'
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
  statementCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  audioButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.touchHighlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  bilingualContainer: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
  },
  statementText: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.primary,
    lineHeight: 28,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 32,
  },
  choiceButton: {
    flex: 1,
    height: 120,
    borderRadius: 20,
    backgroundColor: colors.cardBg,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  trueButton: {
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },
  falseButton: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  choiceButtonSelected: {
    borderWidth: 3,
    borderColor: colors.selectedBorder,
  },
  choiceButtonCorrect: {
    borderWidth: 3,
    borderColor: colors.accentEmerald,
    backgroundColor: '#DCFCE7',
  },
  choiceButtonIncorrect: {
    borderWidth: 3,
    borderColor: colors.accentRed,
    backgroundColor: '#FEE2E2',
  },
  trueButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#065F46',
  },
  falseButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#991B1B',
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
