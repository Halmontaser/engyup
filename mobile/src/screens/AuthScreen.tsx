import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme/colors';

const GRADES = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('Grade 7');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async () => {
    setErrorMsg('');
    if (!email || !password) {
      setErrorMsg('يرجى كتابة البريد الإلكتروني وكلمة المرور');
      return;
    }
    if (isRegister && !fullName) {
      setErrorMsg('يرجى كتابة اسمك الكامل');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        const { error } = await signUp(email, password, fullName, selectedGrade);
        if (error) setErrorMsg(error.message);
      } else {
        const { error } = await signIn(email, password);
        if (error) setErrorMsg(error.message);
      }
    } catch (e: any) {
      setErrorMsg(e?.message || 'حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Brand Header */}
      <View style={styles.brandHeader}>
        <View style={styles.logoCircle}>
          <Ionicons name="school" size={36} color={colors.accentEmerald} />
        </View>
        <Text style={styles.brandTitle}>Engy Up</Text>
        <Text style={styles.brandSubtitle}>منصة تعلم اللغة الإنجليزية التفاعلية</Text>
      </View>

      {/* Auth Card */}
      <View style={styles.card}>
        {/* Tab Toggle */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleTab, !isRegister && styles.toggleTabActive]}
            onPress={() => { setIsRegister(false); setErrorMsg(''); }}
          >
            <Text style={[styles.toggleText, !isRegister && styles.toggleTextActive]}>تسجيل الدخول</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleTab, isRegister && styles.toggleTabActive]}
            onPress={() => { setIsRegister(true); setErrorMsg(''); }}
          >
            <Text style={[styles.toggleText, isRegister && styles.toggleTextActive]}>حساب جديد</Text>
          </TouchableOpacity>
        </View>

        {errorMsg ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={colors.accentRed} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {isRegister ? (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>الاسم الكامل / Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="مثال: أحمد عبد الله"
              placeholderTextColor={colors.textMuted}
              value={fullName}
              onChangeText={setFullName}
            />
          </View>
        ) : null}

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>البريد الإلكتروني / Email</Text>
          <TextInput
            style={styles.input}
            placeholder="student@example.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>كلمة المرور / Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {isRegister ? (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>الصف الدراسي / Grade</Text>
            <View style={styles.gradesRow}>
              {GRADES.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.gradeChip, selectedGrade === g && styles.gradeChipActive]}
                  onPress={() => setSelectedGrade(g)}
                >
                  <Text style={[styles.gradeChipText, selectedGrade === g && styles.gradeChipTextActive]}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Text style={styles.submitButtonText}>
              {isRegister ? 'إنشاء حساب والانطلاق' : 'دخول'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Privacy & Legal Notice - Arabic Norms */}
        <View style={styles.legalNoticeBox}>
          <Text style={styles.legalNoticeText}>
            {isRegister
              ? 'بإنشاء حسابك فإنك تقر بالموافقة على الشروط والخصوصية:'
              : 'تسجيل الدخول يخضع للأحكام والضوابط المعتمدة:'}
          </Text>
          <View style={styles.legalNoticeLinks}>
            <TouchableOpacity onPress={() => Linking.openURL('https://engyup.vercel.app/terms')} activeOpacity={0.7}>
              <Text style={styles.legalLink}>شروط الاستخدام</Text>
            </TouchableOpacity>
            <Text style={styles.legalDot}>•</Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://engyup.vercel.app/privacy')} activeOpacity={0.7}>
              <Text style={styles.legalLink}>سياسة الخصوصية وحماية البيانات</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  contentContainer: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textInverse,
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    color: colors.accentEmerald,
    marginTop: 6,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  toggleTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleTabActive: {
    backgroundColor: colors.cardBg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.incorrectBg,
    borderWidth: 1,
    borderColor: colors.incorrectBorder,
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: colors.accentRed,
    fontSize: 13,
    flex: 1,
    textAlign: 'right',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  gradesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  gradeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  gradeChipActive: {
    backgroundColor: colors.accentEmerald,
    borderColor: colors.accentEmerald,
  },
  gradeChipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  gradeChipTextActive: {
    color: colors.textInverse,
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: colors.accentEmerald,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: colors.accentEmerald,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  submitButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '700',
  },
  legalNoticeBox: {
    marginTop: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    paddingTop: 16,
  },
  legalNoticeText: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 6,
  },
  legalNoticeLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legalLink: {
    fontSize: 12,
    color: colors.accentEmerald,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  legalDot: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
