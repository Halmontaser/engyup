import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen, Play, ChevronRight, CheckCircle,
  ArrowLeft, Layers, Trophy, Zap, BarChart,
  Menu, Home, HelpCircle, Settings, LogOut
} from 'lucide-react';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  steps: string[];
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Learn how to navigate the platform and access your courses',
    icon: <Play size={32} />,
    steps: [
      'Sign in to your account using your email and password',
      'The Dashboard will show all available courses for your grade level',
      'Click on a course card to see more details',
      'Use the "All Grades" button to view all grade levels',
    ]
  },
  {
    id: 'learning-path',
    title: 'Your Learning Path',
    description: 'Follow the Duolingo-style lesson map to track progress',
    icon: <Layers size={32} />,
    steps: [
      'Navigate to your course and click "Lessons" or "Info"',
      'See the zigzag map showing all lessons',
      'Green circles = Completed, Orange = Available, Locked = Upcoming',
      'Complete lessons to unlock new ones',
    ]
  },
  {
    id: 'taking-lessons',
    title: 'Taking Lessons',
    description: 'Learn how to navigate through lesson activities',
    icon: <BookOpen size={32} />,
    steps: [
      'Select a lesson and start learning',
      'Complete activities in order',
      'Click "Check" to submit your answer',
      'Click "Continue" when you get it right!',
      'Earn XP for each completed activity',
    ]
  },
  {
    id: 'tracking-progress',
    title: 'Tracking Your Progress',
    description: 'Monitor your learning achievements and statistics',
    icon: <Trophy size={32} />,
    steps: [
      'View your progress on the course card',
      'Check the sidebar for unit-by-unit progress',
      'See detailed statistics on the Info page',
      'Compete with friends on the leaderboard',
    ]
  },
  {
    id: 'features',
    title: 'Key Features',
    description: 'Explore the powerful features of the platform',
    icon: <Zap size={32} />,
    steps: [
      '21 different activity types for varied learning',
      'Interactive audio and visual content',
      'Gamified learning with XP and achievements',
      'Responsive design for mobile and desktop',
    ]
  },
];

const featureCards = [
  {
    icon: <Menu size={28} />,
    title: 'Dashboard',
    description: 'View your enrolled courses, track progress, and access learning materials.',
    path: '/',
  },
  {
    icon: <BookOpen size={28} />,
    title: 'Lesson Player',
    description: 'Complete interactive activities with real-time feedback and progress tracking.',
    path: '/course/:id',
  },
  {
    icon: <BarChart size={28} />,
    title: 'Course Stats',
    description: 'View detailed statistics about hours, vocabulary, and activities.',
    path: '/course/:id/stats',
  },
  {
    icon: <Layers size={28} />,
    title: 'Lesson Map',
    description: 'See your learning path with the Duolingo-style zigzag navigation.',
    path: '/course/:id',
  },
  {
    icon: <Home size={28} />,
    title: 'All Grades',
    description: 'Browse all courses organized by grade level with comprehensive statistics.',
    path: '/grades',
  },
  {
    icon: <Settings size={28} />,
    title: 'Settings',
    description: 'Manage your profile, preferences, and account settings.',
    path: '/',
  },
];

export function TutorialView() {
  const navigate = useNavigate();
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [showFeatures, setShowFeatures] = useState(false);

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
              How to Use Engy Up
            </h1>
            <div className="flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-full">
              <HelpCircle size={18} className="text-blue-700" />
              <span className="text-sm font-bold text-blue-700">Tutorial</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-600 rounded-2xl p-8 mb-8 text-white"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-black mb-4">
                Welcome to Engy Up! 🎉
              </h2>
              <p className="text-lg md:text-xl opacity-90 mb-6">
                Your interactive English learning platform. Follow this guide to get started and make the most of all features.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
                  <BookOpen size={20} />
                  <span className="font-semibold">Interactive Lessons</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
                  <Trophy size={20} />
                  <span className="font-semibold">Track Progress</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
                  <Zap size={20} />
                  <span className="font-semibold">Earn XP</span>
                </div>
              </div>
            </div>
            <div className="w-32 h-32 md:w-40 md:h-40">
              <img src="/logo.png" alt="Engy Up Logo" className="w-full h-full object-contain drop-shadow-2xl" />
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Tutorial Steps */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-2xl font-black text-slate-900 mb-6">
              Getting Started Guide
            </h3>

            {tutorialSteps.map((step, index) => {
              const isExpanded = selectedStep === step.id;

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden"
                >
                  <button
                    onClick={() => setSelectedStep(isExpanded ? null : step.id)}
                    className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center">
                        {step.icon}
                      </div>
                      <div className="text-left">
                        <h4 className="text-lg font-bold text-slate-900 mb-1">
                          {step.title}
                        </h4>
                        <p className="text-sm text-slate-600">
                          {step.description}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      size={20}
                      className={`text-slate-600 transition-transform duration-300 ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-200 p-6 bg-blue-50"
                      >
                        <h5 className="font-bold text-slate-900 mb-4">Steps to follow:</h5>
                        <div className="space-y-3">
                          {step.steps.map((s, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                              className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all"
                            >
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center font-bold text-lg">
                                {i + 1}
                              </div>
                              <div className="flex-1">
                                <p className="text-slate-700 font-medium">{s}</p>
                              </div>
                              <CheckCircle size={20} className="flex-shrink-0 text-green-500" />
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* Right: Quick Access */}
          <div className="space-y-4">
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Zap size={24} />
                Quick Access
              </h3>

              <div className="space-y-3">
                {featureCards.map((feature, index) => (
                  <motion.button
                    key={feature.title}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => {
                      if (feature.path === '/') {
                        navigate('/');
                      } else if (feature.path.includes(':id')) {
                        // Navigate to first available course
                        navigate('/');
                      } else if (feature.path === '/grades') {
                        navigate('/grades');
                      }
                    }}
                    className="w-full flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 hover:shadow-md transition-all text-left group"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center">
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors mb-1">
                        {feature.title}
                      </h4>
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {feature.description}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Tips Section */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Trophy size={24} />
                Pro Tips 💡
              </h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm">1</div>
                  <p className="text-sm text-slate-700">Complete lessons daily to build consistent learning habits</p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm">2</div>
                  <p className="text-sm text-slate-700">Use the sidebar to review completed activities and track progress</p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm">3</div>
                  <p className="text-sm text-slate-700">Don't skip ahead - follow the lesson path for best results</p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm">4</div>
                  <p className="text-sm text-slate-700">Check the Info page to see course statistics and plan your learning</p>
                </div>
              </div>
            </div>

            {/* Support Section */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <HelpCircle size={24} />
                Need Help?
              </h3>

              <div className="space-y-3">
                <p className="text-slate-600 text-sm">
                  Can't find what you're looking for? Check these resources:
                </p>

                <button
                  onClick={() => setShowFeatures(!showFeatures)}
                  className="w-full flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <BarChart size={18} className="text-blue-700" />
                    <span className="font-semibold text-blue-700">View Feature Documentation</span>
                  </div>
                  <ChevronRight size={18} className={`text-blue-700 transition-transform duration-300 ${showFeatures ? 'rotate-90' : ''}`} />
                </button>

                <a
                  href="#"
                  className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle size={18} className="text-slate-600" />
                    <span className="font-semibold text-slate-600">Contact Support</span>
                  </div>
                  <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
