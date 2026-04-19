import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'motion/react';
import { Loader2, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

export function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, role }
          }
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    await supabase.auth.signInWithOAuth({ provider });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-64 sm:w-80 h-64 sm:h-80 bg-blue-400/20 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute -bottom-40 -left-40 w-64 sm:w-80 h-64 sm:h-80 bg-cyan-400/20 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm sm:max-w-md"
      >
        <div className="text-center mb-6 sm:mb-8">
          <img src="/logo.png" alt="Engy Up" className="h-20 sm:h-28 w-auto mx-auto drop-shadow-2xl" />
          <p className="text-slate-500 mt-4 sm:mt-6 font-medium text-sm sm:text-base">Interactive English Learning Platform</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xl p-5 sm:p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-700 via-cyan-500 to-purple-500" />
          <div className="flex items-center gap-2 mb-6 sm:mb-8">
            <button
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${!isSignUp ? 'bg-gradient-to-r from-blue-700 to-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${isSignUp ? 'bg-gradient-to-r from-blue-700 to-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs sm:text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {isSignUp && (
              <>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required
                    className="w-full pl-11 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent transition-all text-sm sm:text-base"
                  />
                </div>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full px-3 sm:px-4 py-3 sm:py-4 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-700 transition-all text-sm sm:text-base cursor-pointer"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="parent">Parent</option>
                </select>
              </>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full pl-11 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent transition-all text-sm sm:text-base"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-11 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent transition-all text-sm sm:text-base"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 sm:py-4 bg-gradient-to-r from-blue-700 to-blue-600 text-white font-bold rounded-xl hover:from-blue-800 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs font-bold text-slate-400 uppercase">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
            <button
              onClick={() => handleOAuth('google')}
              className="w-full py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-100 transition-all flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
