import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './pages/Dashboard';
import { CrescentLessonView } from './pages/CrescentLessonView';
import { EmbedLessonView } from './pages/EmbedLessonView';
import { CourseLessonsView } from './pages/CourseLessonsView';
import { CourseStatsView } from './pages/CourseStatsView';
import { GradeOverviewView } from './pages/GradeOverviewView';
import { TutorialView } from './pages/TutorialView';
import { ArabicTutorialView } from './pages/ArabicTutorial';
// import { UnitOfflineView } from './pages/UnitOfflineView'; // disabled until future fix
import { FacebookPage } from './pages/FacebookPage';
import { StudentOnboarding } from './components/StudentOnboarding';
import { GamificationOverlay } from './components/GamificationOverlay';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

// Admin imports
import AdminLayout from './app/admin/layout';
import AdminLoginPage from './app/admin/login/page';
import AdminDashboard from './app/admin/page';
import ActivitiesPage from './app/admin/activities/page';
import NewActivityTypePage from './app/admin/activities/new/page';
import NewActivityPage from './app/admin/activities/new/[type]/page';
import ActivityEditorPage from './app/admin/activities/[id]/page';
import LessonsPage from './app/admin/lessons/page';
import LessonEditorPage from './app/admin/lessons/[id]/page';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-blue-700 animate-spin" />
      </div>
    );
  }

  const isAdminRoute = window.location.pathname.startsWith('/admin');
  const isUnitRoute = window.location.pathname.startsWith('/unit');
  const isEmbedRoute = window.location.pathname.startsWith('/embed');

  if (!user && !isAdminRoute && !isUnitRoute && !isEmbedRoute) {
    return <AuthPage />;
  }

  // Check if student needs onboarding
  const isStudentOrNew = !profile?.role || profile?.role === 'student';
  const needsOnboarding = isStudentOrNew && !profile?.grade && !onboardingComplete && !isAdminRoute && !isUnitRoute && !isEmbedRoute;

  if (needsOnboarding) {
    return (
      <div className="min-h-screen bg-slate-50">
        <StudentOnboarding onComplete={() => setOnboardingComplete(true)} />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/embed" element={<EmbedLessonView />} />
        <Route path="/learn/:courseId/:lessonId" element={<CrescentLessonView />} />
        {/* UnitOfflineView disabled until future fix
        <Route path="/unit/:unitId" element={<UnitOfflineView />} />
        */}
        <Route path="/course/:courseId" element={<CourseLessonsView />} />
        <Route path="/course/:courseId/stats" element={<CourseStatsView />} />
        <Route path="/grades" element={<GradeOverviewView />} />
        <Route path="/tutorial" element={<TutorialView />} />
        <Route path="/tutorial-ar" element={<ArabicTutorialView />} />
        <Route path="/toturial" element={<ArabicTutorialView />} />
        <Route path="/facebook" element={<FacebookPage />} />
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/activities" element={<ActivitiesPage />} />
          <Route path="/admin/activities/new" element={<NewActivityTypePage />} />
          <Route path="/admin/activities/new/:type" element={<NewActivityPage />} />
          <Route path="/admin/activities/:id" element={<ActivityEditorPage />} />
          <Route path="/admin/lessons" element={<LessonsPage />} />
          <Route path="/admin/lessons/new" element={<LessonEditorPage />} />
          <Route path="/admin/lessons/:id" element={<LessonEditorPage />} />
        </Route>

        <Route path="/*" element={<Dashboard />} />
      </Routes>
      <GamificationOverlay />
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

