import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { GraduationCap, ChevronRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface StudentOnboardingProps {
  onComplete: () => void;
}

export function StudentOnboarding({ onComplete }: StudentOnboardingProps) {
  const { user, refreshData } = useAuth();
  const [grade, setGrade] = useState('');
  const [saving, setSaving] = useState(false);

  const grades = [
    { value: '7', label: 'Grade 7' },
    { value: '8', label: 'Grade 8' },
    { value: '9', label: 'Grade 9' },
    { value: '10', label: 'Grade 10' },
    { value: '11', label: 'Grade 11' },
    { value: '12', label: 'Grade 12' },
  ];

  const handleSave = async () => {
    if (!grade || !user) return;
    setSaving(true);

    const { refreshData } = (window as any).authContext || {}; // We'll expose this in context or just rely on state

    try {
      const { error } = await supabase.from('profiles').update({ grade, role: 'student' }).eq('id', user.id);
      if (error) throw error;
      
      onComplete();
    } catch (err) {
      console.error('Error saving grade:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-8 sm:mb-12">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-700 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-xl shadow-blue-500/30">
            <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Welcome to Engy Up!</h1>
          <p className="text-slate-500 text-sm sm:text-base">Select your grade to get started with personalized English lessons.</p>
        </div>

        <div className="space-y-2 sm:space-y-3">
          {grades.map(g => (
            <button
              key={g.value}
              onClick={() => setGrade(g.value)}
              className={`w-full p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 text-left font-bold text-base sm:text-lg transition-all flex items-center justify-between ${
                grade === g.value
                  ? 'bg-blue-50 border-blue-700 text-blue-700 shadow-lg'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {g.label}
              {grade === g.value && <ChevronRight className="w-5 h-5" />}
            </button>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={!grade || saving}
          className="w-full mt-6 sm:mt-8 py-3 sm:py-4 bg-gradient-to-r from-blue-700 to-blue-600 text-white font-bold rounded-xl hover:from-blue-800 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          {saving && <Loader2 className="w-5 h-5 animate-spin" />}
          Continue
        </button>
      </motion.div>
    </div>
  );
}
