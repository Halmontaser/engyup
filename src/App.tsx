import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './pages/Dashboard';
import { CrescentLessonView } from './pages/CrescentLessonView';
import { StudentOnboarding } from './components/StudentOnboarding';
import { GamificationOverlay } from './components/GamificationOverlay';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

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

  if (!user) {
    return <AuthPage />;
  }

  // Check if student needs onboarding
  const isStudentOrNew = !profile?.role || profile?.role === 'student';
  const needsOnboarding = isStudentOrNew && !profile?.grade && !onboardingComplete;

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
        <Route path="/learn/:courseId/:lessonId" element={<CrescentLessonView />} />
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
