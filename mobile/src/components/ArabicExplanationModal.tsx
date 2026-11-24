import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { colors } from '@/theme/colors';

interface ArabicExplanationModalProps {
  visible: boolean;
  title: string;
  arabicExplanation: string;
  phonetic?: string;
  exampleSentence?: string;
  audioText?: string;
  onClose: () => void;
}

export function ArabicExplanationModal({
  visible,
  title,
  arabicExplanation,
  phonetic,
  exampleSentence,
  audioText,
  onClose,
}: ArabicExplanationModalProps) {
  const insets = useSafeAreaInsets();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const handleClose = () => {
    Speech.stop();
    setIsPlayingAudio(false);
    onClose();
  };

  const handleSpeak = () => {
    const textToSpeak = audioText || title;
    if (!textToSpeak) return;

    const isArabic = /[\u0600-\u06FF]/.test(textToSpeak);
    setIsPlayingAudio(true);
    Speech.speak(textToSpeak, {
      language: isArabic ? 'ar-SA' : 'en-US',
      rate: isArabic ? 0.95 : 0.9,
      onDone: () => setIsPlayingAudio(false),
      onStopped: () => setIsPlayingAudio(false),
      onError: () => setIsPlayingAudio(false),
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom + 16, 28) }]}>
          {/* Grab handle indicator */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.englishTitle}>{title}</Text>
              {phonetic ? (
                <View style={styles.phoneticBadge}>
                  <Text style={styles.phoneticText}>{phonetic}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.audioButton, isPlayingAudio && styles.audioButtonActive]}
                onPress={handleSpeak}
                accessibilityLabel="Listen to pronunciation"
              >
                <Ionicons
                  name={isPlayingAudio ? 'volume-high' : 'volume-medium'}
                  size={20}
                  color={isPlayingAudio ? colors.accentEmerald : colors.accentCyan}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                accessibilityLabel="Close modal"
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Explanation Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Arabic Card */}
            <View style={styles.arabicCard}>
              <View style={styles.badgeRow}>
                <View style={styles.arabicPill}>
                  <Text style={styles.arabicPillText}>الشرح والتوضيح بالعربية</Text>
                </View>
              </View>
              <Text style={styles.arabicExplanationText}>
                {arabicExplanation || 'لا يوجد شرح إضافي متوفر حالياً'}
              </Text>
            </View>

            {/* Example sentence if provided */}
            {exampleSentence ? (
              <View style={styles.exampleCard}>
                <Text style={styles.exampleLabel}>مثال في سياق الجملة:</Text>
                <Text style={styles.exampleText}>{exampleSentence}</Text>
              </View>
            ) : null}
          </ScrollView>

          {/* Bottom dismissal action */}
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleClose}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.textInverse} style={{ marginRight: 6 }} />
            <Text style={styles.confirmButtonText}>فهمت  •  Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetContainer: {
    backgroundColor: colors.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  handle: {
    width: 44,
    height: 4,
    backgroundColor: colors.cardBorder,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  englishTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  phoneticBadge: {
    backgroundColor: colors.touchHighlight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  phoneticText: {
    fontSize: 12,
    color: colors.selectedBorder,
    fontFamily: 'monospace',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  audioButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.touchHighlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioButtonActive: {
    backgroundColor: colors.correctBg,
  },
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    marginBottom: 20,
  },
  arabicCard: {
    backgroundColor: '#F0FDF4', // Light mint emerald
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    padding: 16,
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  arabicPill: {
    backgroundColor: colors.accentEmerald,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  arabicPillText: {
    color: colors.textInverse,
    fontSize: 11,
    fontWeight: '700',
  },
  arabicExplanationText: {
    fontSize: 16,
    lineHeight: 28, // 1.7x line height for Arabic diacritics
    color: '#064E3B',
    textAlign: 'right',
    writingDirection: 'rtl',
    fontWeight: '500',
  },
  exampleCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  exampleLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    textAlign: 'right',
  },
  exampleText: {
    fontSize: 14,
    color: colors.primary,
    fontStyle: 'italic',
  },
  confirmButton: {
    backgroundColor: colors.accentEmerald,
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accentEmerald,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  confirmButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '700',
  },
});
