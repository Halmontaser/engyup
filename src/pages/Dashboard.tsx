import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  LayoutDashboard, Users, Settings as SettingsIcon,
  LogOut, GraduationCap, ChevronRight, School, Menu, X,
  ChevronDown, Loader2, Trophy, CheckCircle, Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, getCourseImage } from '@/lib/utils';

export function Dashboard() {
  const { profile, activeTenant, memberships, setActiveTenant, signOut, progress, enrollments } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'leaderboard' | 'settings'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTenantMenuOpen, setIsTenantMenuOpen] = useState(false);
  const activeRole = memberships.find(m => m.tenant_id === activeTenant?.id)?.role;

  const [courses, setCourses] = useState<any[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);

  useEffect(() => {
    if (activeTenant) fetchCourses();
  }, [activeTenant, activeTab]);

  const fetchCourses = async () => {
    setIsLoadingCourses(true);
    try {
      const { data } = await supabase
        .from('courses')
        .select('*, modules(*, lessons(*))')
        .eq('tenant_id', activeTenant!.id)
        .order('created_at', { ascending: true });
      
      // Student filtering: Only show current grade courses
      const grade = profile?.grade;
      const filtered = (data || []).filter(c => {
        if (!grade) return true; // Show all if no grade set
        return c.title.includes(`Grade ${grade}`) || c.course_code === `G${grade}`;
      });

      setCourses(filtered);
    } catch (err) {
      console.error('Error fetching courses:', err);
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const handlePlayLesson = (courseId: string, lessonId: string) => {
    navigate(`/learn/${courseId}/${lessonId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex" style={{ backgroundImage: 'radial-gradient(at 40% 20%, rgba(30, 64, 175, 0.08) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(14, 165, 233, 0.06) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(168, 85, 247, 0.04) 0px, transparent 50%)' }}>
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-xl border-r border-slate-200 flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 shadow-2xl md:shadow-xl",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-8 border-b border-slate-200 flex items-center justify-between bg-gradient-to-br from-blue-50/50 to-cyan-50/50">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Engy Up" className="h-16 w-auto drop-shadow-lg" />
          </div>
          <button className="md:hidden text-slate-500 hover:bg-slate-100 p-2 rounded-lg" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          {/* <SidebarItem icon={Trophy} label="Leaderboard" active={activeTab === 'leaderboard'} onClick={() => setActiveTab('leaderboard')} /> */}
          <SidebarItem icon={SettingsIcon} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>

        <div className="p-6 border-t border-slate-200 bg-gradient-to-t from-slate-50 to-transparent">
          <button onClick={signOut} className="flex items-center gap-3 w-full p-4 text-slate-600 hover:bg-white hover:shadow-md rounded-2xl transition-all duration-300 group">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full">
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 p-4 md:p-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                {activeTab === 'dashboard' ? (
                  <span>
                    Welcome back, <span className="text-gradient">{profile?.full_name?.split(' ')[0] || 'Learner'}</span>!
                  </span>
                ) : (
                  activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('-', ' ')
                )}
              </h2>
              <div className="flex items-center gap-2 text-slate-500 text-xs md:text-sm mt-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                  <School className="w-3 h-3 md:w-4 md:h-4 text-blue-700" />
                </div>
                <span className="font-medium">{activeTenant?.name || 'Engy Up English'}</span>
                {activeRole && <span className="px-3 py-1 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 rounded-full text-xs font-bold uppercase border border-blue-200 shadow-sm">{activeRole}</span>}
              </div>
            </div>
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-200 overflow-hidden border-3 border-white shadow-lg shadow-slate-200/50 shrink-0 cursor-pointer hover:shadow-xl transition-shadow">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-700 to-blue-600 text-white font-bold text-lg">
                {profile?.full_name?.[0] || 'U'}
              </div>
            )}
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">
          {activeTab === 'dashboard' && (
            <>
              {isLoadingCourses ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-12 h-12 text-blue-700 animate-spin" />
                </div>
              ) : courses.length === 0 ? (
                <div className="text-center py-20">
                  <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-900">No Courses Found</h3>
                  <p className="text-slate-500 mt-2">Courses will appear here once the curriculum data is migrated.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course, i) => {
                    const totalLessons = course.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0;
                    const completedLessons = course.modules?.reduce((acc: number, m: any) => 
                      acc + (m.lessons?.filter((l: any) => progress[l.id])?.length || 0), 0) || 0;
                    const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

                    const gradientColors = [
                      'from-sky-500 to-cyan-500', 'from-cyan-500 to-sky-600', 'from-sky-600 to-purple-500',
                      'from-purple-500 to-sky-500', 'from-sky-400 to-cyan-400', 'from-cyan-600 to-sky-700',
                    ];

                    return (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.4 }}
                        whileHover={{ y: -8, scale: 1.02 }}
                        className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-2xl hover:border-blue-400 hover:shadow-blue-500/25 transition-all duration-500 group flex flex-col h-full"
                      >
                        <div className="relative h-48 w-full overflow-hidden">
                          <img
                            src={course.image_url || getCourseImage(course.title, course.course_code)}
                            alt={course.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          <div className={`absolute top-4 right-4 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r ${gradientColors[i % gradientColors.length]} shadow-xl shadow-black/20 backdrop-blur-sm`}>
                            {course.course_code || 'English'}
                          </div>
                        </div>
                        <div className="p-6 flex flex-col flex-1">
                          <h3 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-blue-700 transition-colors line-clamp-1">{course.title}</h3>
                          <p className="text-sm text-slate-500 mb-6 line-clamp-2 leading-relaxed flex-1">{course.description || 'Comprehensive English language curriculum designed for excellence.'}</p>

                          <div className="flex items-center justify-between text-sm mb-4">
                            <span className="text-slate-600 font-medium">{totalLessons} lessons</span>
                            <span className="font-bold text-blue-700 text-lg">{progressPercent}%</span>
                          </div>

                          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-5 shadow-inner">
                            <div className="h-full bg-gradient-to-r from-blue-700 to-blue-600 rounded-full transition-all duration-700 ease-out" style={{ width: `${progressPercent}%` }} />
                          </div>

                          {/* Show first incomplete lesson as quick-start */}
                          {course.modules?.map((mod: any) => mod.lessons)?.[0]?.[0] && (
                            <button
                              onClick={() => {
                                const firstLesson = course.modules.flatMap((m: any) => m.lessons).find((l: any) => !progress[l.id]) || course.modules[0]?.lessons?.[0];
                                if (firstLesson) handlePlayLesson(course.id, firstLesson.id);
                              }}
                              className="w-full py-4 bg-gradient-to-r from-blue-700 to-blue-600 text-white font-bold rounded-2xl hover:from-blue-800 hover:to-blue-700 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:-translate-y-0.5 group-hover:scale-[1.02]"
                            >
                              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                <Play className="w-4 h-4 fill-current" />
                              </div>
                              {completedLessons > 0 ? 'Continue Learning' : 'Start Course'}
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {activeTab === 'leaderboard' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
              <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">Leaderboard</h3>
              <p className="text-slate-500">Coming soon! Complete lessons to earn XP and compete.</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-slate-600">Full Name</label>
                  <p className="text-slate-900">{profile?.full_name || 'Not set'}</p>
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-600">Grade</label>
                  <p className="text-slate-900">{profile?.grade || 'Not set'}</p>
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-600">Role</label>
                  <p className="text-slate-900 capitalize">{activeRole || 'student'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon: Icon, label, active = false, onClick }: { icon: any; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full p-4 rounded-2xl font-semibold transition-all duration-300 relative overflow-hidden group",
        active
          ? "bg-gradient-to-r from-blue-700 to-blue-600 text-white shadow-xl shadow-blue-500/30"
          : "text-slate-600 hover:bg-white hover:shadow-md"
      )}
    >
      {active && <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-600 opacity-100" />}
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 relative z-10",
        active ? "bg-white/20" : "bg-slate-100 group-hover:bg-blue-50"
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="relative z-10">{label}</span>
    </button>
  );
}
