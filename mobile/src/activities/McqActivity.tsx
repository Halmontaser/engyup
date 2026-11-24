import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { playCurriculumAudio, stopAllAudio } from '@/utils/audio';
import { PressableBilingual } from '@/components/PressableBilingual';
import { colors } from '@/theme/colors';

interface McqActivityProps {
  data: any;
  media?: any;
  onComplete: (correct?: boolean) => void;
}

export function McqActivity({ data, media, onComplete }: McqActivityProps) {
  // Normalize: handle both nested data.questions array and flat data object
  const questions = Array.isArray(data?.questions) && data.questions.length > 0
    ? data.questions
    : [data || {}];

  const [questionIdx, setQuestionIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, []);

  const currentQ = questions[questionIdx] || {};
  const questionText = currentQ.question || currentQ.prompt || data?.question || data?.prompt || 'اختر الإجابة الصحيحة:';
  const explanationAr = currentQ.explanation_ar || currentQ.explanation || data?.explanation_ar || data?.explanation || 'إجابة صحيحة وفق سياق الجملة.';

  // Normalize options array
  const rawOptions = currentQ.options || data?.options || ['نعم  •  Yes', 'لا  •  No'];
  const optionsList: string[] = rawOptions.map((opt: any) =>
    typeof opt === 'string' ? opt : opt.text || opt.label || ''
  );

  // Determine correct index
  let correctIndex = -1;
  if (typeof currentQ.correct_answer === 'number') {
    correctIndex = currentQ.correct_answer;
  } else if (typeof currentQ.correct_answer === 'string') {
    correctIndex = optionsList.findIndex((opt) => opt.toLowerCase() === currentQ.correct_answer.toLowerCase());
  } else if (typeof data?.correct_answer === 'number') {
    correctIndex = data.correct_answer;
  } else {
    // Check for is_correct or isCorrect boolean on option objects
    correctIndex = rawOptions.findIndex((opt: any) => opt?.is_correct || opt?.isCorrect);
  }

  const audioPath = media?.audio?.[questionIdx]?.url || currentQ.audio || currentQ.audio_url || data?.audio;

  const handleSpeak = async () => {
    setIsPlayingAudio(true);
    await playCurriculumAudio(audioPath, questionText, () => setIsPlayingAudio(false));
  };

  const handleCheckOrContinue = () => {
    if (!checked) {
      if (selectedIdx === null) return;
      const isCorrect = selectedIdx === correctIndex || correctIndex === -1;
      if (isCorrect) {
        setCorrectCount((c) => c + 1);
      }
      setChecked(true);
    } else {
      stopAllAudio();
      const isCorrect = selectedIdx === correctIndex || correctIndex === -1;

      if (questionIdx + 1 < questions.length) {
        setQuestionIdx((i) => i + 1);
        setSelectedIdx(null);
        setChecked(false);
      } else {
        const totalCorrect = correctCount + (isCorrect ? 1 : 0);
        onComplete(totalCorrect >= Math.ceil(questions.length * 0.6));
      }
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Question Card */}
      <View style={styles.questionCard}>
        <View style={styles.questionHeader}>
          <TouchableOpacity style={styles.audioButton} onPress={handleSpeak}>
            <Ionicons
              name={isPlayingAudio ? 'volume-high' : 'volume-medium'}
              size={22}
              color={isPlayingAudio ? colors.accentEmerald : colors.accentCyan}
            />
          </TouchableOpacity>
          <Text style={styles.questionInstruction}>
            {questions.length > 1 ? `سؤال ${questionIdx + 1} من ${questions.length}` : 'السؤال / Question'}
          </Text>
        </View>

        <PressableBilingual
          text={questionText}
          arabicExplanation={explanationAr}
          textStyle={styles.questionText}
          style={styles.bilingualWrapper}
        />
      </View>

      {/* Choices List */}
      <View style={styles.optionsList}>
        {optionsList.map((option, idx) => {
          const isSelected = selectedIdx === idx;
          const isCorrect = idx === correctIndex;

          let cardStyle: any = styles.optionCard;
          let textStyle: any = styles.optionText;

          if (checked) {
            if (isCorrect) {
              cardStyle = [styles.optionCard, styles.optionCorrect];
              textStyle = [styles.optionText, styles.optionTextCorrect];
            } else if (isSelected && !isCorrect) {
              cardStyle = [styles.optionCard, styles.optionIncorrect];
              textStyle = [styles.optionText, styles.optionTextIncorrect];
            }
          } else if (isSelected) {
            cardStyle = [styles.optionCard, styles.optionSelected];
            textStyle = [styles.optionText, styles.optionTextSelected];
          }

          return (
            <TouchableOpacity
              key={idx}
              style={cardStyle}
              onPress={() => {
                if (!checked) setSelectedIdx(idx);
              }}
              disabled={checked}
              activeOpacity={0.8}
            >
              <View style={styles.optionLetterBox}>
                <Text style={styles.optionLetter}>{String.fromCharCode(65 + idx)}</Text>
              </View>
              <Text style={textStyle}>{option}</Text>
              {checked && isCorrect && (
                <Ionicons name="checkmark-circle" size={22} color={colors.accentEmerald} style={styles.optionIcon} />
              )}
              {checked && isSelected && !isCorrect && (
                <Ionicons name="close-circle" size={22} color={colors.accentRed} style={styles.optionIcon} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Action Button */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          selectedIdx === null && !checked && styles.actionButtonDisabled,
          checked && (selectedIdx === correctIndex || correctIndex === -1 ? styles.actionButtonCorrect : styles.actionButtonIncorrect),
        ]}
        onPress={handleCheckOrContinue}
        disabled={selectedIdx === null && !checked}
        activeOpacity={0.85}
      >
        <Text style={styles.actionButtonText}>
          {!checked ? 'تحقق من الإجابة  •  Check' : questionIdx + 1 < questions.length ? 'السؤال التالي  •  Next Question' : 'استمرار  •  Continue'}
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
  questionCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  audioButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.touchHighlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionInstruction: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  bilingualWrapper: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    lineHeight: 26,
  },
  optionsList: {
    gap: 12,
    marginBottom: 28,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    minHeight: 56,
  },
  optionSelected: {
    borderColor: colors.selectedBorder,
    backgroundColor: colors.touchHighlight,
  },
  optionCorrect: {
    borderColor: colors.correctBorder,
    backgroundColor: colors.correctBg,
  },
  optionIncorrect: {
    borderColor: colors.incorrectBorder,
    backgroundColor: colors.incorrectBg,
  },
  optionLetterBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionLetter: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
    flex: 1,
  },
  optionTextSelected: {
    color: colors.selectedBorder,
  },
  optionTextCorrect: {
    color: colors.accentEmerald,
    fontWeight: '700',
  },
  optionTextIncorrect: {
    color: colors.accentRed,
  },
  optionIcon: {
    marginLeft: 8,
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
  actionButtonCorrect: {
    backgroundColor: colors.accentEmerald,
  },
  actionButtonIncorrect: {
    backgroundColor: colors.accentAmber,
  },
  actionButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '700',
  },
});
