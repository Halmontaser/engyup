import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { playCurriculumAudio, stopAllAudio } from '@/utils/audio';
import { colors } from '@/theme/colors';

interface CategorySortActivityProps {
  data: any;
  media?: any;
  onComplete: (correct?: boolean) => void;
}

export function CategorySortActivity({ data, media, onComplete }: CategorySortActivityProps) {
  const rawCats = Array.isArray(data?.categories) && data.categories.length > 0
    ? data.categories
    : [
        { name: 'Nouns', items: ['School', 'Teacher', 'Book'] },
        { name: 'Verbs', items: ['Read', 'Write', 'Listen'] },
      ];

  const categories: Array<{ name: string; items: string[] }> = rawCats.map((cat: any) => ({
    name: cat.name || cat.title || 'Category',
    items: (cat.items || []).map((it: any) =>
      typeof it === 'string' ? it : it?.text || it?.name || ''
    ).filter(Boolean),
  }));

  const allItems = categories.flatMap((cat) =>
    cat.items.map((it) => ({ text: it, category: cat.name }))
  );

  const [pool, setPool] = useState<Array<{ text: string; category: string }>>(() => {
    return [...allItems].sort(() => Math.random() - 0.5);
  });
  const [selectedWord, setSelectedWord] = useState<{ text: string; category: string } | null>(null);
  const [buckets, setBuckets] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(categories.map((c) => [c.name, []]))
  );
  const [checked, setChecked] = useState(false);
  const [allCorrect, setAllCorrect] = useState(false);

  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, []);

  const handleSelectWord = (item: { text: string; category: string }) => {
    if (checked) return;
    playCurriculumAudio(null, item.text);
    setSelectedWord(item);
  };

  const handlePlaceInBucket = (catName: string) => {
    if (!selectedWord || checked) return;

    setBuckets((prev) => ({
      ...prev,
      [catName]: [...prev[catName], selectedWord.text],
    }));

    setPool((prev) => prev.filter((p) => p.text !== selectedWord.text));
    setSelectedWord(null);
  };

  const handleReturnFromBucket = (catName: string, word: string) => {
    if (checked) return;
    const item = allItems.find((i) => i.text === word) || { text: word, category: catName };
    setBuckets((prev) => ({
      ...prev,
      [catName]: prev[catName].filter((w) => w !== word),
    }));
    setPool((prev) => [...prev, item]);
  };

  const handleCheckOrContinue = () => {
    if (!checked) {
      let isMatch = true;
      categories.forEach((cat) => {
        const bucketWords = buckets[cat.name] || [];
        const requiredWords = cat.items || [];
        if (
          bucketWords.length !== requiredWords.length ||
          !bucketWords.every((w) => requiredWords.includes(w))
        ) {
          isMatch = false;
        }
      });
      setAllCorrect(isMatch);
      setChecked(true);
    } else {
      onComplete(allCorrect);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.instruction}>صنّف الكلمات في أقسامها الصحيحة 📂</Text>

      {/* Word Pool */}
      <View style={styles.poolCard}>
        <Text style={styles.poolTitle}>اختر كلمة لنقلها للقسم المطلوب:</Text>
        <View style={styles.chipsRow}>
          {pool.length === 0 ? (
            <Text style={styles.emptyPoolText}>تم تصنيف جميع الكلمات! اضغط تحقق بالأسفل.</Text>
          ) : (
            pool.map((item) => {
              const isSelected = selectedWord?.text === item.text;
              return (
                <TouchableOpacity
                  key={item.text}
                  style={[styles.poolChip, isSelected && styles.poolChipSelected]}
                  onPress={() => handleSelectWord(item)}
                  activeOpacity={0.7}
                  disabled={checked}
                >
                  <Text style={[styles.poolChipText, isSelected && styles.poolChipTextSelected]}>
                    {item.text}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </View>

      {/* Category Buckets */}
      <View style={styles.bucketsContainer}>
        {categories.map((cat) => {
          const catWords = buckets[cat.name] || [];

          return (
            <TouchableOpacity
              key={cat.name}
              style={[styles.bucketCard, selectedWord && styles.bucketCardTarget]}
              onPress={() => handlePlaceInBucket(cat.name)}
              activeOpacity={selectedWord ? 0.7 : 1}
              disabled={!selectedWord || checked}
            >
              <View style={styles.bucketHeader}>
                <View style={styles.bucketPill}>
                  <Text style={styles.bucketPillText}>{catWords.length}</Text>
                </View>
                <Text style={styles.bucketTitle}>{cat.name}</Text>
              </View>

              <View style={styles.bucketItems}>
                {catWords.length === 0 ? (
                  <Text style={styles.bucketPlaceholder}>
                    {selectedWord ? `المس لإضافة "${selectedWord.text}" هنا` : 'اسحب أو انقل الكلمات هنا'}
                  </Text>
                ) : (
                  catWords.map((word) => (
                    <TouchableOpacity
                      key={word}
                      style={styles.placedChip}
                      onPress={() => handleReturnFromBucket(cat.name, word)}
                      disabled={checked}
                    >
                      <Text style={styles.placedChipText}>{word}</Text>
                      {!checked && <Ionicons name="close" size={14} color={colors.textSecondary} style={{ marginLeft: 4 }} />}
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Action Button */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          pool.length > 0 && !checked && styles.actionButtonDisabled,
          checked && (allCorrect ? styles.actionButtonCorrect : styles.actionButtonIncorrect),
        ]}
        onPress={handleCheckOrContinue}
        disabled={pool.length > 0 && !checked}
        activeOpacity={0.85}
      >
        <Text style={styles.actionButtonText}>
          {!checked ? 'تحقق من التصنيف  •  Check' : 'استمرار  •  Continue'}
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
  poolCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    marginBottom: 16,
  },
  poolTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 10,
    textAlign: 'right',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emptyPoolText: {
    fontSize: 13,
    color: colors.accentEmerald,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
    paddingVertical: 8,
  },
  poolChip: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  poolChipSelected: {
    backgroundColor: colors.touchHighlight,
    borderColor: colors.selectedBorder,
    borderWidth: 2,
  },
  poolChipText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  poolChipTextSelected: {
    color: colors.selectedBorder,
    fontWeight: '700',
  },
  bucketsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  bucketCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    minHeight: 100,
  },
  bucketCardTarget: {
    borderColor: colors.selectedBorder,
    borderStyle: 'dashed',
    backgroundColor: '#F8FAFC',
  },
  bucketHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  bucketTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  bucketPill: {
    backgroundColor: colors.touchHighlight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  bucketPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.selectedBorder,
  },
  bucketItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bucketPlaceholder: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: 6,
  },
  placedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.correctBg,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  placedChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
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
