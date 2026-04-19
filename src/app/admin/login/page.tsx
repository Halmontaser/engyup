"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Shield, AlertCircle, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { setAdminAuth, hasAdminPassword } from "@/lib/auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/admin";

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if already authenticated
    if (hasAdminPassword()) {
      // Check local storage
      const stored = localStorage.getItem('admin_auth');
      if (stored) {
        router.push(redirect);
      }
    }
  }, [router, redirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Simulate small delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 300));

    const success = setAdminAuth(password);

    if (success) {
      router.push(redirect);
    } else {
      setError("Invalid password");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-950 dark:to-indigo-950 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Back button */}
        <button
          onClick={() => router.push("/")}
          className="mb-6 flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft size={18} />
          <span>Back to Home</span>
        </button>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 md:p-10 border border-slate-200 dark:border-slate-700">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Shield className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
              Admin Login
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Enter your password to access the admin panel
            </p>
          </div>

          {/* Configuration warning */}
          {!hasAdminPassword() && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3"
            >
              <AlertCircle className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-amber-700 dark:text-amber-400">
                <p className="font-semibold mb-1">Admin Password Not Configured</p>
                <p className="opacity-80">
                  Set the <code className="bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded font-mono text-amber-800 dark:text-amber-300">
                    NEXT_PUBLIC_ADMIN_PASSWORD
                  </code> environment variable in your <code className="bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded font-mono text-amber-800 dark:text-amber-300">
                    .env.local
                  </code> file to enable admin access.
                </p>
              </div>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Enter admin password..."
                disabled={isLoading || !hasAdminPassword()}
                className={`w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-lg ${
                  error
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                    : ""
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400"
              >
                <AlertCircle size={20} />
                <span className="font-medium">{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading || !password || !hasAdminPassword()}
              className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-lg transition-all ${
                isLoading || !password || !hasAdminPassword()
                  ? "opacity-50 cursor-not-allowed bg-slate-200 dark:bg-slate-700 text-slate-400"
                  : "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white shadow-lg hover:shadow-xl"
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-transparent rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Shield size={20} />
                  <span>Login to Admin Panel</span>
                </>
              )}
            </button>
          </form>

          {/* Help text */}
          <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            <p>Forgot your password? Check your <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-mono">.env.local</code> file.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
