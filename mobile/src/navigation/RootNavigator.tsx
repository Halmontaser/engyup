import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { Course, Lesson } from '@/api/curriculum';
import { AuthScreen } from '@/screens/AuthScreen';
import { DashboardScreen } from '@/screens/DashboardScreen';
import { CourseDetailScreen } from '@/screens/CourseDetailScreen';
import { LessonPlayerScreen } from '@/screens/LessonPlayerScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { PracticeScreen } from '@/screens/PracticeScreen';
import { colors } from '@/theme/colors';

type TabRoute = 'dashboard' | 'practice' | 'profile';

type NavigationRoute =
  | { name: 'dashboard' }
  | { name: 'practice' }
  | { name: 'profile' }
  | { name: 'course'; course: Course }
  | { name: 'lesson'; lesson: Lesson; previousCourse?: Course };

export function RootNavigator() {
  const { user, loading } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<NavigationRoute>({ name: 'dashboard' });
  const [activeTab, setActiveTab] = useState<TabRoute>('dashboard');

  if (loading) {
    return (
      <View style={styles.splashContainer}>
        <ActivityIndicator size="large" color={colors.accentEmerald} />
        <Text style={styles.splashTitle}>English Crescent</Text>
        <Text style={styles.splashSubtitle}>جاري تحميل التطبيق...</Text>
      </View>
    );
  }

  // Not authenticated
  if (!user) {
    return <AuthScreen />;
  }

  const handleTabPress = (tab: TabRoute) => {
    setActiveTab(tab);
    setCurrentRoute({ name: tab } as NavigationRoute);
  };

  const isFullView = currentRoute.name === 'course' || currentRoute.name === 'lesson';

  return (
    <View style={styles.appContainer}>
      {/* Screen Body */}
      <View style={styles.screenContainer}>
        {currentRoute.name === 'course' && (
          <CourseDetailScreen
            course={currentRoute.course}
            onBack={() => setCurrentRoute({ name: 'dashboard' })}
            onSelectLesson={(lesson) =>
              setCurrentRoute({
                name: 'lesson',
                lesson,
                previousCourse: currentRoute.course,
              })
            }
          />
        )}

        {currentRoute.name === 'lesson' && (
          <LessonPlayerScreen
            lesson={currentRoute.lesson}
            onBack={() => {
              if (currentRoute.previousCourse) {
                setCurrentRoute({ name: 'course', course: currentRoute.previousCourse });
              } else {
                setCurrentRoute({ name: 'dashboard' });
              }
            }}
          />
        )}

        {currentRoute.name === 'dashboard' && (
          <DashboardScreen
            onSelectCourse={(course) => setCurrentRoute({ name: 'course', course })}
            onOpenProfile={() => handleTabPress('profile')}
          />
        )}

        {currentRoute.name === 'practice' && <PracticeScreen />}

        {currentRoute.name === 'profile' && (
          <ProfileScreen onBack={() => handleTabPress('dashboard')} />
        )}
      </View>

      {/* Persistent Bottom Tab Bar (shown on top-level tabs) */}
      {!isFullView && (
        <View style={styles.tabBar}>
          {/* Dashboard Tab */}
          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => handleTabPress('dashboard')}
            activeOpacity={0.7}
          >
            <Ionicons
              name={activeTab === 'dashboard' ? 'school' : 'school-outline'}
              size={24}
              color={activeTab === 'dashboard' ? colors.accentEmerald : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'dashboard' && styles.tabTextActive,
              ]}
            >
              المناهج
            </Text>
          </TouchableOpacity>

          {/* Practice Tab */}
          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => handleTabPress('practice')}
            activeOpacity={0.7}
          >
            <Ionicons
              name={activeTab === 'practice' ? 'flash' : 'flash-outline'}
              size={24}
              color={activeTab === 'practice' ? colors.accentGold : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'practice' && styles.tabTextActive,
              ]}
            >
              تمرين سريع
            </Text>
          </TouchableOpacity>

          {/* Profile Tab */}
          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => handleTabPress('profile')}
            activeOpacity={0.7}
          >
            <Ionicons
              name={activeTab === 'profile' ? 'person' : 'person-outline'}
              size={24}
              color={activeTab === 'profile' ? colors.accentCyan : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'profile' && styles.tabTextActive,
              ]}
            >
              حسابي
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenContainer: {
    flex: 1,
  },
  splashContainer: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  splashTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textInverse,
    marginTop: 20,
  },
  splashSubtitle: {
    fontSize: 13,
    color: colors.accentEmerald,
    marginTop: 6,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: colors.cardBg,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 3,
  },
  tabText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
});
