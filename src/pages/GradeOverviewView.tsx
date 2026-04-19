import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { getCourseImage } from '@/lib/utils';
import { Loader2, ArrowLeft, BookOpen, Clock, Target, Trophy, TrendingUp, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface GradeStats {
  grade: string;
  totalCourses: number;
  completedCourses: number;
  totalLessons: number;
  completedLessons: number;
  totalActivities: number;
  completedActivities: number;
  totalHours: number;
  progressPercent: number;
}

interface CourseData {
  id: string;
  title: string;
  description: string;
  course_code: string;
  image_url: string;
  modules: any[];
}

const grades = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

export function GradeOverviewView() {
  const { user, profile, progress, activeTenant } = useAuth();
  const navigate = useNavigate();

  const [allCourses, setAllCourses] = useState<CourseData[]>([]);
  const [gradeStats, setGradeStats] = useState<GradeStats[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllCourses();
  }, [activeTenant]);

  const fetchAllCourses = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('courses')
        .select('*, modules(*, lessons(*, activities(*))')
        .eq('tenant_id', activeTenant!.id)
        .order('course_code');

      console.log('All courses data:', data);

      if (data) {
        setAllCourses(data);
        calculateGradeStats(data);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateGradeStats = (courses: CourseData[]) => {
    const statsByGrade = grades.map(grade => {
      const gradeCourses = courses.filter(c => {
        const courseCode = c.course_code?.toUpperCase() || '';
        const gradeNum = grade.replace('Grade ', '');
        return courseCode.includes(`G${gradeNum}`) || c.title.includes(grade);
      });

      const totalCourses = gradeCourses.length;
      const totalLessons = gradeCourses.reduce((acc, c) =>
        acc + (c.modules?.reduce((modAcc: number, m: any) =>
          modAcc + (m.lessons?.length || 0), 0) || 0)
      , 0);

      const completedLessons = gradeCourses.reduce((acc, c) =>
        acc + (c.modules?.reduce((modAcc: number, m: any) =>
          modAcc + (m.lessons?.filter((l: any) => progress[l.id]).length || 0), 0) || 0)
      , 0);

      const totalActivities = gradeCourses.reduce((acc, c) =>
        acc + (c.modules?.reduce((modAcc: number, m: any) =>
          modAcc + (m.lessons?.reduce((lessonAcc: number, l: any) =>
            lessonAcc + (l.activities?.length || 0), 0) || 0), 0) || 0)
      , 0);

      const completedActivities = gradeCourses.reduce((acc, c) =>
        acc + (c.modules?.reduce((modAcc: number, m: any) =>
          modAcc + (m.lessons?.reduce((lessonAcc: number, l: any) =>
            lessonAcc + (l.activities?.filter((a: any) => progress[a.lesson_id]).length || 0), 0) || 0), 0) || 0)
      , 0);

      const completedCourses = gradeCourses.filter(c => {
        const courseLessons = c.modules?.flatMap((m: any) => m.lessons || []) || [];
        const completedCount = courseLessons.filter((l: any) => progress[l.id]).length;
        return completedCount === courseLessons.length && completedCount > 0;
      }).length;

      // Estimate hours: ~15 minutes per activity
      const totalHours = Math.round((totalActivities * 15) / 60 * 10) / 10;
      const progressPercent = totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

      return {
        grade,
        totalCourses,
        completedCourses,
        totalLessons,
        completedLessons,
        totalActivities,
        completedActivities,
        totalHours,
        progressPercent,
      };
    });

    setGradeStats(statsByGrade);
  };

  const getCoursesForGrade = (grade: string) => {
    return allCourses.filter(c => {
      const courseCode = c.course_code?.toUpperCase() || '';
      const gradeNum = grade.replace('Grade ', '');
      return courseCode.includes(`G${gradeNum}`) || c.title.includes(grade);
    });
  };

  const handleGradeClick = (grade: string) => {
    setSelectedGrade(selectedGrade === grade ? null : grade);
  };

  const handleCourseClick = (courseId: string) => {
    navigate(`/course/${courseId}/stats`);
  };

  const getTotalStats = () => {
    return {
      totalCourses: gradeStats.reduce((acc, g) => acc + g.totalCourses, 0),
      totalLessons: gradeStats.reduce((acc, g) => acc + g.totalLessons, 0),
      completedLessons: gradeStats.reduce((acc, g) => acc + g.completedLessons, 0),
      totalHours: gradeStats.reduce((acc, g) => acc + g.totalHours, 0),
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Loader2 className="w-12 h-12 text-blue-700 animate-spin" />
      </div>
    );
  }

  const total = getTotalStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200 p-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-semibold">Back to Dashboard</span>
          </button>

          <div className="flex items-center gap-4">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">
              All Grades Overview
            </h1>
            {profile?.grade && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                Grade {profile.grade}
              </span>
            )}
          </div>

          {/* Overall Stats */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
              <BookOpen size={18} className="text-blue-700" />
              <span className="text-sm font-bold text-blue-700">{total.totalCourses} courses</span>
            </div>
            <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full">
              <Clock size={18} className="text-green-700" />
              <span className="text-sm font-bold text-green-700">{total.totalHours}h</span>
            </div>
          </div>
        </div>
      </header>

      {/* Overall Stats Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-600 p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
          >
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
              <Trophy size={32} className="text-white mx-auto mb-2" />
              <p className="text-white/80 text-sm mb-1">Lessons Completed</p>
              <p className="text-white text-2xl md:text-3xl font-black">
                {total.completedLessons}
              </p>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
              <BookOpen size={32} className="text-white mx-auto mb-2" />
              <p className="text-white/80 text-sm mb-1">Total Lessons</p>
              <p className="text-white text-2xl md:text-3xl font-black">
                {total.totalLessons}
              </p>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
              <Clock size={32} className="text-white mx-auto mb-2" />
              <p className="text-white/80 text-sm mb-1">Total Hours</p>
              <p className="text-white text-2xl md:text-3xl font-black">
                {total.totalHours}h
              </p>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
              <Target size={32} className="text-white mx-auto mb-2" />
              <p className="text-white/80 text-sm mb-1">Active Courses</p>
              <p className="text-white text-2xl md:text-3xl font-black">
                {total.totalCourses}
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Grades Grid */}
      <div className="bg-white border-t border-slate-200 shadow-inner">
        <div className="max-w-7xl mx-auto py-8 px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gradeStats.map((stats, index) => {
              const gradeCourses = getCoursesForGrade(stats.grade);
              const isExpanded = selectedGrade === stats.grade;

              return (
                <motion.div
                  key={stats.grade}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-br from-slate-50 to-white border-2 border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  {/* Grade Header */}
                  <button
                    onClick={() => handleGradeClick(stats.grade)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 bg-gradient-to-r transition-colors",
                      stats.progressPercent === 100
                        ? "from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
                        : stats.progressPercent >= 50
                        ? "from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
                        : "from-amber-500 to-orange-400 hover:from-amber-600 hover:to-orange-500"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl md:text-3xl font-black text-white">
                        {stats.grade}
                      </span>
                      {stats.progressPercent === 100 && (
                        <Trophy size={24} className="text-white" />
                      )}
                    </div>
                    <ChevronRight
                      size={20}
                      className={cn(
                        "text-white transition-transform duration-300",
                        isExpanded ? "rotate-90" : ""
                      )}
                    />
                  </button>

                  {/* Grade Stats */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-500 text-sm">Progress</span>
                      <span className="text-lg font-black">
                        {stats.progressPercent}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stats.progressPercent}%` }}
                        transition={{ delay: index * 0.1 + 0.2 }}
                        className={`h-full rounded-full ${
                          stats.progressPercent === 100
                            ? 'bg-green-500'
                            : stats.progressPercent >= 50
                            ? 'bg-blue-500'
                            : 'bg-amber-500'
                        }`}
                      />
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="bg-white rounded-lg p-3 border border-slate-200">
                        <BookOpen size={16} className="text-blue-600 mb-1" />
                        <p className="text-xs text-slate-500 mb-1">Courses</p>
                        <p className="text-xl font-black text-slate-900">
                          {stats.completedCourses}/{stats.totalCourses}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-slate-200">
                        <Clock size={16} className="text-green-600 mb-1" />
                        <p className="text-xs text-slate-500 mb-1">Hours</p>
                        <p className="text-xl font-black text-slate-900">
                          {stats.totalHours}h
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-slate-200">
                        <Target size={16} className="text-purple-600 mb-1" />
                        <p className="text-xs text-slate-500 mb-1">Lessons</p>
                        <p className="text-xl font-black text-slate-900">
                          {stats.completedLessons}/{stats.totalLessons}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-slate-200">
                        <TrendingUp size={16} className="text-amber-600 mb-1" />
                        <p className="text-xs text-slate-500 mb-1">Activities</p>
                        <p className="text-xl font-black text-slate-900">
                          {stats.completedActivities}/{stats.totalActivities}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Courses */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-slate-200 bg-slate-50/50 p-4"
                      >
                        {gradeCourses.length === 0 ? (
                          <p className="text-slate-500 text-center py-4">
                            No courses available for this grade level.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {gradeCourses.map((course) => {
                              const courseLessons = course.modules?.flatMap((m: any) => m.lessons || []) || [];
                              const completedLessons = courseLessons.filter((l: any) => progress[l.id]).length;
                              const courseProgress = courseLessons.length > 0
                                ? Math.round((completedLessons / courseLessons.length) * 100)
                                : 0;

                              return (
                                <motion.button
                                  key={course.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  onClick={() => handleCourseClick(course.id)}
                                  className="w-full bg-white border-2 border-slate-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-lg transition-all duration-300 flex items-center gap-4 group"
                                >
                                  <img
                                    src={course.image_url || getCourseImage(course.title, course.course_code)}
                                    alt={course.title}
                                    className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover shadow-md"
                                  />
                                  <div className="flex-1 text-left">
                                    <h4 className="font-bold text-slate-900 mb-1 group-hover:text-blue-700 transition-colors">
                                      {course.title}
                                    </h4>
                                    <p className="text-xs text-slate-500 line-clamp-1">
                                      {course.description || 'Click to view course details'}
                                    </p>
                                    <div className="flex items-center gap-3 mt-2">
                                      <span className="text-xs text-slate-600">
                                        {courseLessons.length} lessons
                                      </span>
                                      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden max-w-32">
                                        <motion.div
                                          initial={{ width: 0 }}
                                          animate={{ width: `${courseProgress}%` }}
                                          className={`h-full rounded-full ${
                                            courseProgress === 100
                                              ? 'bg-green-500'
                                              : courseProgress >= 50
                                              ? 'bg-blue-500'
                                              : 'bg-amber-500'
                                          }`}
                                        />
                                      </div>
                                      <span className={`text-xs font-bold ${
                                        courseProgress === 100
                                          ? 'text-green-600'
                                          : courseProgress >= 50
                                          ? 'text-blue-600'
                                          : 'text-amber-600'
                                      }`}>
                                        {courseProgress}%
                                      </span>
                                    </div>
                                  </div>
                                  <ChevronRight size={20} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                                </motion.button>
                              );
                            })}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
