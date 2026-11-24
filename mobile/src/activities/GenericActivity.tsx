import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableBilingual } from '@/components/PressableBilingual';
import { colors } from '@/theme/colors';

interface GenericActivityProps {
  activity: {
    id?: string;
    type: string;
    title: string;
    instruction: string;
    data: any;
    media?: any;
    book_type?: string | null;
    book_page?: string | null;
  };
  onComplete: (correct?: boolean) => void;
}

export function GenericActivity({ activity, onComplete }: GenericActivityProps) {
  const bookRef = [
    activity.book_type?.toUpperCase(),
    activity.book_page ? `p.${activity.book_page}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        {/* Textbook Reference Header */}
        <View style={styles.header}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{activity.type}</Text>
          </View>
          {bookRef ? (
            <View style={styles.bookBadge}>
              <Ionicons name="book-outline" size={14} color={colors.accentEmerald} />
              <Text style={styles.bookBadgeText}>{bookRef}</Text>
            </View>
          ) : null}
        </View>

        {/* Title */}
        <Text style={styles.title}>{activity.title || 'نشاط تعليمي'}</Text>

        {/* Instruction with Arabic Explanation */}
        {activity.instruction ? (
          <PressableBilingual
            text={activity.instruction}
            arabicExplanation="اتبع التعليمات الواردة لتنفيذ النشاط التعليمي."
            textStyle={styles.instructionText}
            style={styles.instructionBox}
          />
        ) : null}

        {/* Content info */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={colors.accentCyan} />
          <Text style={styles.infoText}>
            أكمل قراءة وتطبيق هذا النشاط من كتاب المنهج ثم اضغط إنهاء لكسب النقاط.
          </Text>
        </View>
      </View>

      {/* Complete Button */}
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => onComplete(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="checkmark-done" size={20} color={colors.textInverse} style={{ marginRight: 6 }} />
        <Text style={styles.actionButtonText}>إنهاء النشاط  •  Complete Activity</Text>
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
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    marginBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  typeBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  bookBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.correctBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  bookBadgeText: {
    fontSize: 11,
    color: colors.accentEmerald,
    fontWeight: '700',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 12,
  },
  instructionBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  infoText: {
    fontSize: 13,
    color: '#1E40AF',
    flex: 1,
    textAlign: 'right',
  },
  actionButton: {
    backgroundColor: colors.accentEmerald,
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '700',
  },
});
