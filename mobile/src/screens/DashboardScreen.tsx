import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useProgress } from '@/context/ProgressContext';
import { fetchCourses, Course } from '@/api/curriculum';
import { colors } from '@/theme/colors';

const ALL_GRADES = [
  { grade: 'Grade 7', labelAr: 'الصف السابع', code: 'G7', icon: 'book' },
  { grade: 'Grade 8', labelAr: 'الصف الثامن', code: 'G8', icon: 'book' },
  { grade: 'Grade 9', labelAr: 'الصف التاسع (شهادة أساسية)', code: 'G9', icon: 'ribbon' },
  { grade: 'Grade 10', labelAr: 'الصف الأول الثانوي', code: 'G10', icon: 'library' },
  { grade: 'Grade 11', labelAr: 'الصف الثاني الثانوي', code: 'G11', icon: 'library' },
  { grade: 'Grade 12', labelAr: 'الصف الثالث الثانوي (شهادة ثانوية)', code: 'G12', icon: 'school' },
];

interface DashboardScreenProps {
  onSelectCourse: (course: Course) => void;
  onOpenProfile: () => void;
}

export function DashboardScreen({ onSelectCourse, onOpenProfile }: DashboardScreenProps) {
  const { profile, activeTenant } = useAuth();
  const { xp, streak, rank } = useProgress();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const result = await fetchCourses(activeTenant?.id);
      setCourses(result);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTenant?.id]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greetingSub}>أهلاً بك يا بطل 👋</Text>
          <Text style={styles.greetingName}>{profile?.full_name || 'طالب متميز'}</Text>
        </View>

        <TouchableOpacity
          style={styles.avatarButton}
          onPress={onOpenProfile}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="person-circle" size={42} color={colors.accentEmerald} />
        </TouchableOpacity>
      </View>

      {/* Gamification / Stats Row */}
      <View style={styles.statsContainer}>
        {/* Streak */}
        <View style={styles.statCard}>
          <View style={[styles.statIconBox, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="flame" size={24} color={colors.accentGold} />
          </View>
          <View>
            <Text style={styles.statValue}>{streak} أيام</Text>
            <Text style={styles.statLabel}>سلسلة التعلّم</Text>
          </View>
        </View>

        {/* XP Points */}
        <View style={styles.statCard}>
          <View style={[styles.statIconBox, { backgroundColor: '#E0F2FE' }]}>
            <Ionicons name="star" size={22} color={colors.accentCyan} />
          </View>
          <View>
            <Text style={styles.statValue}>{xp} XP</Text>
            <Text style={styles.statLabel}>نقاط الخبرة</Text>
          </View>
        </View>

        {/* Level / Rank */}
        <View style={styles.statCard}>
          <View style={[styles.statIconBox, { backgroundColor: '#F3E8FF' }]}>
            <Ionicons name="ribbon" size={22} color="#9333EA" />
          </View>
          <View>
            <Text style={styles.statValue}>مستوى {rank.level}</Text>
            <Text style={styles.statLabel}>{rank.titleAr}</Text>
          </View>
        </View>
      </View>

      {/* Section Title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>مناهج اللغة الإنجليزية باليمن</Text>
        <Text style={styles.sectionSubtitle}>اختر صفك الدراسي لبدء التمارين والدروس</Text>
      </View>

      {/* Grades List */}
      {loading ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color={colors.accentEmerald} />
        </View>
      ) : (
        <View style={styles.gradesList}>
          {ALL_GRADES.map((item) => {
            const matchedCourse = courses.find((c) =>
              c.title?.toLowerCase().includes(item.grade.toLowerCase()) ||
              c.course_code?.toLowerCase() === item.code.toLowerCase()
            );

            return (
              <TouchableOpacity
                key={item.grade}
                style={styles.gradeCard}
                onPress={() => {
                  if (matchedCourse) {
                    onSelectCourse(matchedCourse);
                  } else {
                    // Fallback stub course
                    onSelectCourse({
                      id: item.code,
                      title: item.grade,
                      course_code: item.code,
                      tenant_id: activeTenant?.id || 'general',
                    });
                  }
                }}
                activeOpacity={0.8}
              >
                <View style={styles.gradeLeft}>
                  <View style={styles.gradeIconBox}>
                    <Ionicons name={item.icon as any} size={24} color={colors.accentEmerald} />
                  </View>
                  <View>
                    <Text style={styles.gradeTitle}>{item.grade}</Text>
                    <Text style={styles.gradeArabic}>{item.labelAr}</Text>
                  </View>
                </View>

                <View style={styles.gradeAction}>
                  <Text style={styles.startText}>ادخل</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.accentEmerald} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  greetingSub: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    fontWeight: '600',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  greetingName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  avatarButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    writingDirection: 'rtl',
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    writingDirection: 'rtl',
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'right',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 2,
  },
  loaderBox: {
    padding: 40,
    alignItems: 'center',
  },
  gradesList: {
    gap: 12,
  },
  gradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBg,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  gradeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  gradeIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.correctBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
  },
  gradeArabic: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  gradeAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.touchHighlight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  startText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accentEmerald,
  },
});
