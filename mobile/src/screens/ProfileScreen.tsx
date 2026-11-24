import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useProgress } from '@/context/ProgressContext';
import { colors } from '@/theme/colors';

interface ProfileScreenProps {
  onBack: () => void;
}

export function ProfileScreen({ onBack }: ProfileScreenProps) {
  const { user, profile, signOut } = useAuth();
  const { xp, streak, completedLessons } = useProgress();

  const completedCount = Object.keys(completedLessons).length;

  const handleSignOut = () => {
    Alert.alert('تسجيل الخروج', 'هل أنت متأكد من رغبتك في تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'تسجيل الخروج', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 48 }} />
        )}
        <Text style={styles.headerTitle}>الملف الشخصي</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={colors.accentEmerald} />
          </View>
          <Text style={styles.userName}>{profile?.full_name || 'طالب متميز'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.gradeBadge}>
            <Text style={styles.gradeBadgeText}>{profile?.grade || 'Grade 7'}</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Ionicons name="star" size={24} color={colors.accentGold} />
            <Text style={styles.statValue}>{xp}</Text>
            <Text style={styles.statLabel}>إجمالي النقاط (XP)</Text>
          </View>

          <View style={styles.statBox}>
            <Ionicons name="flame" size={24} color="#EA580C" />
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>أيام متواصلة</Text>
          </View>

          <View style={styles.statBox}>
            <Ionicons name="checkmark-done-circle" size={24} color={colors.accentEmerald} />
            <Text style={styles.statValue}>{completedCount}</Text>
            <Text style={styles.statLabel}>دروس مكتملة</Text>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={20} color={colors.accentRed} style={{ marginRight: 8 }} />
          <Text style={styles.signOutButtonText}>تسجيل الخروج</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  content: {
    padding: 20,
  },
  userCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.correctBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  userEmail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  gradeBadge: {
    backgroundColor: colors.touchHighlight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  gradeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.selectedBorder,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 32,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  signOutButton: {
    flexDirection: 'row',
    height: 50,
    backgroundColor: colors.incorrectBg,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  signOutButtonText: {
    color: colors.accentRed,
    fontSize: 15,
    fontWeight: '700',
  },
});
