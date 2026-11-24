import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ArabicExplanationModal } from './ArabicExplanationModal';
import { colors } from '@/theme/colors';

interface PressableBilingualProps {
  text: string;
  arabicExplanation: string;
  phonetic?: string;
  exampleSentence?: string;
  audioPrompt?: string;
  showHelperPill?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function PressableBilingual({
  text,
  arabicExplanation,
  phonetic,
  exampleSentence,
  audioPrompt,
  showHelperPill = true,
  style,
  textStyle,
}: PressableBilingualProps) {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={[styles.container, style]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={[styles.text, textStyle]}>{text}</Text>
        {showHelperPill ? (
          <View style={styles.pill}>
            <Ionicons name="help-circle-outline" size={12} color={colors.emeraldText} style={{ marginEnd: 3 }} />
            <Text style={styles.pillText}>شرح</Text>
          </View>
        ) : null}
      </TouchableOpacity>

      <ArabicExplanationModal
        visible={modalVisible}
        title={text}
        arabicExplanation={arabicExplanation}
        phonetic={phonetic}
        exampleSentence={exampleSentence}
        audioText={audioPrompt || text}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderBottomWidth: 2,
    borderBottomColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 44,
    marginVertical: 2,
    gap: 6,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  pillText: {
    fontSize: 11,
    lineHeight: 18,
    fontWeight: '700',
    color: colors.emeraldText,
    writingDirection: 'rtl',
  },
});
