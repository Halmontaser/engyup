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
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">E</div>
            <span className="font-bold text-xl text-slate-900">Engy Up</span>
          </div>
          <button className="md:hidden text-slate-500 hover:bg-slate-100 p-2 rounded-lg" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          {/* <SidebarItem icon={Trophy} label="Leaderboard" active={activeTab === 'leaderboard'} onClick={() => setActiveTab('leaderboard')} /> */}
          <SidebarItem icon={SettingsIcon} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>

        <div className="p-4 border-t border-slate-200">
          <button onClick={signOut} className="flex items-center gap-3 w-full p-3 text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full">
        <header className="bg-white border-b border-slate-200 p-4 md:p-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900">
                {activeTab === 'dashboard' ? `Welcome back, ${profile?.full_name?.split(' ')[0] || 'Learner'}!` : activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('-', ' ')}
              </h2>
              <div className="flex items-center gap-2 text-slate-500 text-xs md:text-sm mt-1">
                <School className="w-3 h-3 md:w-4 md:h-4" />
                <span>{activeTenant?.name || 'Engy Up English'}</span>
                {activeRole && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase">{activeRole}</span>}
              </div>
            </div>
          </div>
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm shrink-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold">
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
                  <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
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
                      'from-blue-500 to-cyan-500', 'from-cyan-500 to-teal-500', 'from-teal-500 to-emerald-500',
                      'from-sky-500 to-blue-500', 'from-indigo-500 to-blue-500', 'from-blue-600 to-cyan-600',
                    ];

                    return (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl hover:border-blue-300 transition-all group flex flex-col h-full"
                      >
                        <div className="relative h-40 w-full overflow-hidden">
                          <img 
                            src={course.image_url || getCourseImage(course.title, course.course_code)} 
                            alt={course.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className={`absolute top-0 right-0 m-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white bg-gradient-to-r ${gradientColors[i % gradientColors.length]} shadow-lg`}>
                            {course.course_code || 'English'}
                          </div>
                        </div>
                        <div className="p-6 flex flex-col flex-1">
                          <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">{course.title}</h3>
                          <p className="text-sm text-slate-500 mb-6 line-clamp-2 leading-relaxed flex-1">{course.description || 'Comprehensive English language curriculum designed for excellence.'}</p>

                          <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                            <span>{totalLessons} lessons</span>
                            <span className="font-bold text-blue-600">{progressPercent}%</span>
                          </div>

                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                            <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
                          </div>

                          {/* Show first incomplete lesson as quick-start */}
                          {course.modules?.map((mod: any) => mod.lessons)?.[0]?.[0] && (
                            <button
                              onClick={() => {
                                const firstLesson = course.modules.flatMap((m: any) => m.lessons).find((l: any) => !progress[l.id]) || course.modules[0]?.lessons?.[0];
                                if (firstLesson) handlePlayLesson(course.id, firstLesson.id);
                              }}
                              className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 group-hover:shadow-lg"
                            >
                              <Play className="w-4 h-4" />
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
        "flex items-center gap-3 w-full p-3 rounded-xl font-medium transition-all",
        active ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"
      )}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );
}
