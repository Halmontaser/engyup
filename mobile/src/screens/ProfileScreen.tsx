import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, Linking } from 'react-native';
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
  const { xp, streak, rank, accuracyRate, studyMinutes, completedLessons } = useProgress();
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const completedCount = Object.keys(completedLessons).length;

  const handleSignOut = () => {
    Alert.alert('تسجيل الخروج', 'هل أنت متأكد من رغبتك في تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'تسجيل الخروج', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'حذف الحساب والبيانات نهائياً',
      'بموجب نظام حماية البيانات الشخصية وسياسة Google Play، سيؤدي حذف الحساب إلى إتلاف كافة بياناتك الدراسية (النقاط XP، التمارين المكتملة، سجلات الأيام) بشكل نهائي وغير قابل للاسترجاع. هل ترغب في الاستمرار؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تأكيد طلب الحذف',
          style: 'destructive',
          onPress: async () => {
            Alert.alert(
              'تم تسجيل طلب الحذف',
              'تم استلام طلبك لحذف الحساب نهائياً. سيتم إتلاف جميع البيانات المرتبطة بحسابك خلال 7 أيام عمل. سيتم الآن تسجيل خروجك.',
              [{ text: 'حسناً', onPress: () => signOut() }]
            );
          },
        },
      ]
    );
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

        {/* Student Level & Rank Card */}
        <View style={styles.rankCard}>
          <View style={styles.rankHeader}>
            <View style={styles.rankBadge}>
              <Ionicons name="ribbon" size={18} color="#9333EA" />
              <Text style={styles.rankBadgeText}>المستوى {rank.level}: {rank.titleAr}</Text>
            </View>
            <Text style={styles.rankProgressText}>{rank.progressPercent}% للترقية</Text>
          </View>
          <View style={styles.rankProgressBarBg}>
            <View style={[styles.rankProgressBarFill, { width: `${rank.progressPercent}%` }]} />
          </View>
        </View>

        {/* Enhanced Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Ionicons name="star" size={22} color={colors.accentGold} />
            <Text style={styles.statValue}>{xp}</Text>
            <Text style={styles.statLabel}>إجمالي XP</Text>
          </View>

          <View style={styles.statBox}>
            <Ionicons name="flame" size={22} color="#EA580C" />
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>أيام متواصلة</Text>
          </View>

          <View style={styles.statBox}>
            <Ionicons name="checkmark-done-circle" size={22} color={colors.accentEmerald} />
            <Text style={styles.statValue}>{completedCount}</Text>
            <Text style={styles.statLabel}>دروس مكتملة</Text>
          </View>

          <View style={styles.statBox}>
            <Ionicons name="trending-up" size={22} color="#2563EB" />
            <Text style={styles.statValue}>{accuracyRate}%</Text>
            <Text style={styles.statLabel}>معدل الدقة</Text>
          </View>
        </View>

        {/* Privacy & Legal Section */}
        <View style={styles.legalSection}>
          <Text style={styles.legalSectionTitle}>الخصوصية وحماية البيانات (KSA PDPL)</Text>
          
          <TouchableOpacity
            style={styles.legalRow}
            onPress={() => setShowPrivacyModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.legalRowLeft}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.accentEmerald} />
              <Text style={styles.legalRowText}>سياسة الخصوصية وحقوق صاحب البيانات</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.legalRow}
            onPress={() => Linking.openURL('https://engyup.vercel.app/terms')}
            activeOpacity={0.7}
          >
            <View style={styles.legalRowLeft}>
              <Ionicons name="document-text-outline" size={20} color="#0D9488" />
              <Text style={styles.legalRowText}>شروط الاستخدام والخدمة التعليمية</Text>
            </View>
            <Ionicons name="open-outline" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.legalRow}
            onPress={() => Linking.openURL('https://engyup.vercel.app/privacy')}
            activeOpacity={0.7}
          >
            <View style={styles.legalRowLeft}>
              <Ionicons name="globe-outline" size={20} color="#2563EB" />
              <Text style={styles.legalRowText}>عرض السياسة الكاملة على الويب</Text>
            </View>
            <Ionicons name="open-outline" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.signOutButtonText}>تسجيل الخروج</Text>
        </TouchableOpacity>

        {/* Delete Account (Google Play Requirement) */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount} activeOpacity={0.85}>
          <Ionicons name="trash-outline" size={18} color={colors.accentRed} style={{ marginRight: 8 }} />
          <Text style={styles.deleteButtonText}>حذف الحساب وجميع البيانات نهائياً</Text>
        </TouchableOpacity>

        <Text style={styles.complianceFooter}>
          متوافق مع نظام حماية البيانات الشخصية السعودي (PDPL) وضوابط Google Play
        </Text>
      </ScrollView>

      {/* Privacy Policy Modal */}
      <Modal visible={showPrivacyModal} animationType="slide" transparent>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>حماية البيانات والخصوصية</Text>
              <TouchableOpacity onPress={() => setShowPrivacyModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalBadge}>نظام حماية البيانات السعودي (KSA PDPL) & Google Play</Text>
              
              <Text style={styles.modalH1}>1. البيانات التي نجمعها</Text>
              <Text style={styles.modalP}>
                نجمع فقط الاسم والبريد الإلكتروني والصف الدراسي وتقدم التمارين (XP). لا نجمع بيانات موقع جغرافي، أو بيانات مالية، أو أي بيانات حساسة.
              </Text>

              <Text style={styles.modalH1}>2. خصوصية الأطفال والطلاب</Text>
              <Text style={styles.modalP}>
                التطبيق موجه للطلاب، ولا يتضمن أي إعلانات تجارية أو تتبع سلوكي. يشترط موافقة ولي الأمر لإنشاء حساب للقُصّر.
              </Text>

              <Text style={styles.modalH1}>3. حقوقك بموجب نظام حماية البيانات (PDPL)</Text>
              <Text style={styles.modalP}>
                يحق لك في أي وقت: العلم بمسوغات المعالجة، الوصول إلى نسختك من البيانات، طلب التصحيح، وطلب إتلاف البيانات وحذف الحساب، وسحب الموافقة مجاناً.
              </Text>

              <Text style={styles.modalH1}>4. التشفير والأمان</Text>
              <Text style={styles.modalP}>
                جميع البيانات مشفرة أثناء النقل (TLS 1.3) وفي قواعد البيانات السحابية (AES-256) مع عزل كامل لكل حساب عبر Row-Level Security.
              </Text>

              <Text style={styles.modalH1}>5. التواصل ومسؤول الحماية</Text>
              <Text style={styles.modalP}>
                مسؤول حماية البيانات: privacy@engyup.com{'\n'}
                الدعم الفني: support@engyup.com
              </Text>
            </ScrollView>

            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowPrivacyModal(false)}>
              <Text style={styles.modalCloseButtonText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
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
  rankCard: {
    backgroundColor: '#FAF5FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  rankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rankBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#7E22CE',
  },
  rankProgressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9333EA',
  },
  rankProgressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E9D5FF',
    overflow: 'hidden',
  },
  rankProgressBarFill: {
    height: '100%',
    backgroundColor: '#9333EA',
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
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
  legalSection: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  legalSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'right',
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  legalRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legalRowText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  signOutButton: {
    flexDirection: 'row',
    height: 48,
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 12,
  },
  signOutButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  deleteButton: {
    flexDirection: 'row',
    height: 48,
    backgroundColor: colors.incorrectBg,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 16,
  },
  deleteButtonText: {
    color: colors.accentRed,
    fontSize: 13,
    fontWeight: '700',
  },
  complianceFooter: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    paddingBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primary,
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    paddingVertical: 16,
  },
  modalBadge: {
    fontSize: 11,
    color: colors.accentEmerald,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'right',
  },
  modalH1: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 10,
    marginBottom: 4,
    textAlign: 'right',
  },
  modalP: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
    textAlign: 'right',
  },
  modalCloseButton: {
    backgroundColor: colors.accentEmerald,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  modalCloseButtonText: {
    color: colors.textInverse,
    fontSize: 15,
    fontWeight: '700',
  },
});
