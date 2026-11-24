import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useProgress } from '@/context/ProgressContext';
import { fetchCourseModules, Course, Module, Lesson } from '@/api/curriculum';
import { colors } from '@/theme/colors';

interface CourseDetailScreenProps {
  course: Course;
  onBack: () => void;
  onSelectLesson: (lesson: Lesson) => void;
}

export function CourseDetailScreen({ course, onBack, onSelectLesson }: CourseDetailScreenProps) {
  const { isLessonCompleted } = useProgress();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadModules() {
      try {
        const mods = await fetchCourseModules(course.id);
        setModules(mods);
      } finally {
        setLoading(false);
      }
    }
    loadModules();
  }, [course.id]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>{course.title}</Text>
          <Text style={styles.headerSubtitle}>الوحدات والدروس الدراسية</Text>
        </View>
        <View style={{ width: 48 }} />
      </View>

      {loading ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color={colors.accentEmerald} />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {modules.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="folder-open-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>لا توجد وحدات متوفرة حالياً</Text>
            </View>
          ) : (
            modules.map((module, mIdx) => (
              <View key={module.id} style={styles.moduleCard}>
                {/* Module Header */}
                <View style={styles.moduleHeader}>
                  <View style={styles.unitPill}>
                    <Text style={styles.unitPillText}>الوحدة {mIdx + 1}</Text>
                  </View>
                  <Text style={styles.moduleTitle}>{module.title}</Text>
                </View>

                {/* Lessons in Module */}
                <View style={styles.lessonList}>
                  {module.lessons.map((lesson, lIdx) => {
                    const completed = isLessonCompleted(lesson.id);

                    return (
                      <TouchableOpacity
                        key={lesson.id}
                        style={[styles.lessonRow, completed && styles.lessonRowCompleted]}
                        onPress={() => onSelectLesson(lesson)}
                        activeOpacity={0.75}
                      >
                        <View style={styles.lessonLeft}>
                          <View
                            style={[
                              styles.lessonIndexCircle,
                              completed && styles.lessonIndexCircleCompleted,
                            ]}
                          >
                            {completed ? (
                              <Ionicons name="checkmark" size={16} color={colors.textInverse} />
                            ) : (
                              <Text style={styles.lessonIndexText}>{lIdx + 1}</Text>
                            )}
                          </View>
                          <View>
                            <Text style={styles.lessonTitle}>{lesson.title}</Text>
                            {lesson.description ? (
                              <Text style={styles.lessonDescription} numberOfLines={1}>
                                {lesson.description}
                              </Text>
                            ) : null}
                          </View>
                        </View>

                        <View style={styles.lessonAction}>
                          <Ionicons
                            name={completed ? 'refresh-circle' : 'play-circle'}
                            size={28}
                            color={completed ? colors.accentEmerald : colors.accentCyan}
                          />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
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
  headerTitleBox: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    writingDirection: 'rtl',
    color: colors.textSecondary,
    marginTop: 2,
  },
  loaderBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 12,
  },
  moduleCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  moduleHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  unitPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  unitPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.selectedBorder,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  lessonList: {
    gap: 8,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  lessonRowCompleted: {
    backgroundColor: colors.correctBg,
    borderColor: '#BBF7D0',
  },
  lessonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  lessonIndexCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  lessonIndexCircleCompleted: {
    backgroundColor: colors.accentEmerald,
    borderColor: colors.accentEmerald,
  },
  lessonIndexText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  lessonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  lessonDescription: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  lessonAction: {
    marginLeft: 8,
  },
});
