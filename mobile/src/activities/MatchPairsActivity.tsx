import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { playCurriculumAudio, stopAllAudio } from '@/utils/audio';
import { colors } from '@/theme/colors';

interface MatchPairsActivityProps {
  data: any;
  media?: any;
  onComplete: (correct?: boolean) => void;
}

export function MatchPairsActivity({ data, media, onComplete }: MatchPairsActivityProps) {
  // Normalize pairs: handle data.pairs, data.items, data.associations
  const rawList = data?.pairs || data?.items || data?.associations || [];

  const rawPairs = rawList.map((item: any, idx: number) => {
    const leftText = item.left || item.en || item.word || item.term || `Word ${idx + 1}`;
    const rightText = item.right || item.ar || item.arabic || item.meaning || item.definition || `الترجمة ${idx + 1}`;
    return { left: leftText, right: rightText };
  });

  const leftItems = rawPairs.map((p: any, idx: number) => ({ id: `left-${idx}`, text: p.left, pairId: idx }));
  const [rightItems] = useState(() => {
    return rawPairs
      .map((p: any, idx: number) => ({ id: `right-${idx}`, text: p.right, pairId: idx }))
      .sort(() => Math.random() - 0.5);
  });

  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Set<number>>(new Set());

  const handleSelectLeft = (pairId: number, text: string) => {
    if (matchedPairs.has(pairId)) return;
    const audioPath = media?.audio?.[pairId]?.url;
    playCurriculumAudio(audioPath, text);
    setSelectedLeft(pairId);

    if (selectedRight !== null) {
      checkMatch(pairId, selectedRight);
    }
  };

  const handleSelectRight = (pairId: number) => {
    if (matchedPairs.has(pairId)) return;
    setSelectedRight(pairId);

    if (selectedLeft !== null) {
      checkMatch(selectedLeft, pairId);
    }
  };

  const checkMatch = (leftId: number, rightId: number) => {
    if (leftId === rightId) {
      const nextMatched = new Set(matchedPairs);
      nextMatched.add(leftId);
      setMatchedPairs(nextMatched);
      setSelectedLeft(null);
      setSelectedRight(null);

      if (nextMatched.size === rawPairs.length) {
        setTimeout(() => {
          stopAllAudio();
          onComplete(true);
        }, 600);
      }
    } else {
      setTimeout(() => {
        setSelectedLeft(null);
        setSelectedRight(null);
      }, 500);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.instruction}>صل كل كلمة باللغة الإنجليزية بترجمتها الصحيحة 🔗</Text>

      <View style={styles.columnsContainer}>
        {/* Left Column (English) */}
        <View style={styles.column}>
          <Text style={styles.columnHeader}>English</Text>
          {leftItems.map((item: any) => {
            const isMatched = matchedPairs.has(item.pairId);
            const isSelected = selectedLeft === item.pairId;

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.card,
                  isSelected && styles.cardSelected,
                  isMatched && styles.cardMatched,
                ]}
                onPress={() => handleSelectLeft(item.pairId, item.text)}
                disabled={isMatched}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.cardText,
                    isSelected && styles.cardTextSelected,
                    isMatched && styles.cardTextMatched,
                  ]}
                >
                  {item.text}
                </Text>
                {isMatched && <Ionicons name="checkmark-circle" size={18} color={colors.accentEmerald} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Right Column (Arabic) */}
        <View style={styles.column}>
          <Text style={styles.columnHeader}>العربية</Text>
          {rightItems.map((item: any) => {
            const isMatched = matchedPairs.has(item.pairId);
            const isSelected = selectedRight === item.pairId;

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.card,
                  isSelected && styles.cardSelected,
                  isMatched && styles.cardMatched,
                ]}
                onPress={() => handleSelectRight(item.pairId)}
                disabled={isMatched}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.cardText,
                    styles.arabicText,
                    isSelected && styles.cardTextSelected,
                    isMatched && styles.cardTextMatched,
                  ]}
                >
                  {item.text}
                </Text>
                {isMatched && <Ionicons name="checkmark-circle" size={18} color={colors.accentEmerald} />}
              </TouchableOpacity>
            );
          })}
        </View>
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
    paddingBottom: 40,
  },
  instruction: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  columnsContainer: {
    flexDirection: 'row',
    gap: 14,
  },
  column: {
    flex: 1,
    gap: 10,
  },
  columnHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    minHeight: 52,
  },
  cardSelected: {
    borderColor: colors.selectedBorder,
    backgroundColor: colors.touchHighlight,
  },
  cardMatched: {
    borderColor: colors.correctBorder,
    backgroundColor: colors.correctBg,
  },
  cardText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    flex: 1,
  },
  arabicText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  cardTextSelected: {
    color: colors.selectedBorder,
    fontWeight: '700',
  },
  cardTextMatched: {
    color: colors.accentEmerald,
    fontWeight: '700',
  },
});
