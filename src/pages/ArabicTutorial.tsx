import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight, Play, BookOpen, CheckCircle,
  Clock, Trophy, Zap, Layers, HelpCircle,
  Settings
} from 'lucide-react';

interface TutorialStep {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  icon: React.ReactNode;
  steps: string[];
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'getting-started',
    titleAr: 'كيفية البدء',
    titleEn: 'Getting Started',
    descriptionAr: 'تعلم كيفية الدخول إلى حسابك باستخدام البريد الإلكتروني وكلمة المرور',
    descriptionEn: 'Learn how to sign in to your account using your email and password',
    icon: <Play size={24} />,
    steps: [
      'أدخل عنوان البريد الإلكتروني الخاص بك',
      'أدخل كلمة المرور',
      'اضغط على زر الدخول',
      'انتظر تحميل لوحة التحكم',
    ]
  },
  {
    id: 'dashboard-overview',
    titleAr: 'لوحة التحكم',
    titleEn: 'Your Dashboard',
    descriptionAr: 'استعرض جميع الدورات المتاحة لمستواك التعليمي وتتبع تقدمك',
    descriptionEn: 'View all enrolled courses for your grade level and track your progress',
    icon: <Layers size={24} />,
    steps: [
      'تصفح جميع الدورات المتاحة',
      'تابع نسبة الإنجاز في كل دورة',
      'ادخل إلى الدروس والوحدات',
      'شاهد إحصائياتك العامة',
    ]
  },
  {
    id: 'learning-path',
    titleAr: 'مسار التعلم',
    titleEn: 'Your Learning Path',
    descriptionAr: 'اتبع خريطة الدروس التفاعلية لمتابعة تقدمك بأسلوب جذاب',
    descriptionEn: 'Follow the zigzag lesson map to track your progress with Duolingo-style navigation',
    icon: <BookOpen size={24} />,
    steps: [
      'افتح خريطة الدروس',
      'الأخضر = دروس مكتملة',
      'البرتقالي = دروس متاحة حالياً',
      'الرمادي = دروس مغلقة',
      'اضغط على الدائرة لبدء الدرس',
    ]
  },
  {
    id: 'taking-lessons',
    titleAr: 'إكمال الأنشطة',
    titleEn: 'Taking Lessons',
    descriptionAr: 'تعلم كيفية التفاعل مع الأنشطة التعليمية المختلفة وإنهائها',
    descriptionEn: 'Learn how to navigate through lesson activities and complete them successfully',
    icon: <Clock size={24} />,
    steps: [
      'اقرأ التعليمات في أعلى الصفحة',
      'قم بحل التمرين الموضح',
      'اضغط "تحقق" لمعرفة النتيجة',
      'اضغط "متابعة" للنشاط التالي',
      'اجمع نقاط الخبرة XP عند النهاية',
    ]
  },
  {
    id: 'tracking-progress',
    titleAr: 'متابعة الإنجاز',
    titleEn: 'Tracking Your Progress',
    descriptionAr: 'رصد إنجازاتك ونقاط الخبرة وتصفح الإحصائيات الكاملة',
    descriptionEn: 'Track your achievements, XP earned, and view comprehensive statistics',
    icon: <Trophy size={24} />,
    steps: [
      'شاهد تقدمك في كل مادة',
      'افتح صفحة الإحصائيات التفصيلية',
      'تتبع مجموع نقاط الخبرة',
      'قارن مستواك مع بقية الطلاب',
    ]
  }
];

export function ArabicTutorialView() {
  const navigate = useNavigate();
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [isRtl, setIsRtl] = useState(true);

  const handleStepClick = (stepId: string) => {
    setSelectedStep(selectedStep === stepId ? null : stepId);
  };

  const handleStartLearning = () => {
    navigate('/');
  };

  return (
    <div 
      className="min-h-screen bg-slate-50 font-sans pb-20" 
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200 p-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowRight size={20} className={isRtl ? 'rotate-180' : ''} />
            <span className="font-semibold hidden md:inline">العودة للرئيسية</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <Play size={24} fill="currentColor" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">إنجي أب</h1>
              <p className="text-[10px] uppercase tracking-tighter text-blue-600 font-bold">Interactive Learning</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRtl(!isRtl)}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-200 transition-colors"
            >
              {isRtl ? 'English' : 'عربي'}
            </button>
            <button
              onClick={() => navigate('/')}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md"
            >
              <Zap size={18} />
              <span>ابدأ الآن</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-[2rem] p-8 md:p-12 mb-12 text-white shadow-2xl relative overflow-hidden"
        >
          <div className="relative z-10">
            <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
              أهلاً بك في <span className="text-cyan-300">إنجي أب</span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl leading-relaxed">
              اكتشف مهاراتك في اللغة الإنجليزية من خلال منصتنا التفاعلية. 
              هذا الدليل سيساعدك على فهم كيفية استخدام التطبيق بفعالية.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleStartLearning}
                className="bg-white text-blue-700 hover:bg-blue-50 font-black py-4 px-10 rounded-2xl shadow-xl transition-all scale-100 hover:scale-105 active:scale-95"
              >
                ابدأ رحلة التعلم
              </button>
              <button 
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold py-4 px-8 rounded-2xl transition-all"
                onClick={() => document.getElementById('steps')?.scrollIntoView({ behavior: 'smooth' })}
              >
                شرح الميزات
              </button>
            </div>
          </div>
          <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -top-10 -left-10 w-48 h-48 bg-blue-400/20 rounded-full blur-2xl" />
        </motion.div>

        {/* Tutorial Steps Grid */}
        <div id="steps" className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {tutorialSteps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white border-2 rounded-[2rem] p-8 transition-all cursor-pointer group ${
                selectedStep === step.id ? 'border-blue-500 shadow-xl' : 'border-slate-100 hover:border-blue-200 hover:shadow-lg'
              }`}
              onClick={() => handleStepClick(step.id)}
            >
              <div className="flex gap-6">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
                  {step.icon}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">{step.titleAr}</h3>
                  <p className="text-slate-500 text-sm md:text-base leading-relaxed mb-4">{step.descriptionAr}</p>
                  
                  <AnimatePresence>
                    {selectedStep === step.id && (
                      <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-3 overflow-hidden"
                      >
                        {step.steps.map((s, i) => (
                          <li key={i} className="flex items-center gap-3 text-slate-700 font-bold text-sm bg-slate-50 p-3 rounded-xl">
                            <CheckCircle size={16} className="text-green-500" />
                            {s}
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Features Summary */}
        <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 p-8 md:p-12 shadow-sm mb-12">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">مميزات المنصة</h2>
            <p className="text-slate-500">كل ما تحتاجه لتطوير لغتك الإنجليزية في مكان واحد</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-blue-50 border border-blue-100 text-center hover:scale-105 transition-transform">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
                <Layers size={24} />
              </div>
              <h4 className="font-black text-slate-900 mb-2">21 نوع نشاط</h4>
              <p className="text-xs text-slate-500">تنوع كبير في التمارين التفاعلية</p>
            </div>

            <div className="p-6 rounded-3xl bg-purple-50 border border-purple-100 text-center hover:scale-105 transition-transform">
              <div className="w-12 h-12 bg-purple-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-200">
                <Play size={24} />
              </div>
              <h4 className="font-black text-slate-900 mb-2">وسائط متعددة</h4>
              <p className="text-xs text-slate-500">دعم كامل للصوت والصور والفيديو</p>
            </div>

            <div className="p-6 rounded-3xl bg-amber-50 border border-amber-100 text-center hover:scale-105 transition-transform">
              <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-200">
                <Trophy size={24} />
              </div>
              <h4 className="font-black text-slate-900 mb-2">نظام مكافآت</h4>
              <p className="text-xs text-slate-500">ترقيات ومستويات ونقاط خبرة</p>
            </div>

            <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-100 text-center hover:scale-105 transition-transform">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
                <Zap size={24} />
              </div>
              <h4 className="font-black text-slate-900 mb-2">أداء سريع</h4>
              <p className="text-xs text-slate-500">تجربة سلسة على الجوال والحاسوب</p>
            </div>
          </div>
        </div>

        {/* Support Footer */}
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between p-8 bg-slate-900 rounded-[2rem] text-white">
          <div>
            <h3 className="text-2xl font-black mb-2">هل تحتاج لمساعدة إضافية؟</h3>
            <p className="text-slate-400">فريق الدعم جاهز للإجابة على استفساراتكم</p>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="w-full md:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 font-bold rounded-2xl transition-all"
          >
            تواصل معنا
          </button>
        </div>
      </div>
    </div>
  );
}
