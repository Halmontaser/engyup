"use client";

import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { LayoutDashboard, BookOpen, FileText, LogOut, Menu, ChevronLeft, Loader2 } from "lucide-react";
import { isAdmin, clearAdminAuth } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import { canEditActivities } from "@/lib/permissions";

export default function AdminLayout({ children }: { children?: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const { memberships, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    // Check authentication
    const hasPasswordAuth = isAdmin();
    const hasRoleAuth = canEditActivities(memberships, profile);
    const authed = hasPasswordAuth || hasRoleAuth;
    setIsAuthenticated(authed);
    setIsChecking(false);

    // If not authenticated and not on login page, redirect to login
    if (!authed && pathname !== '/admin/login') {
      navigate('/admin/login');
    }
  }, [pathname, navigate, memberships, profile, loading]);

  const handleLogout = () => {
    clearAdminAuth();
    // Remove cookie
    document.cookie = 'admin_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    navigate('/admin/login');
  };

  const navigation = [
    { name: 'Dashboard', to: '/admin', icon: LayoutDashboard },
    { name: 'Lessons', to: '/admin/lessons', icon: BookOpen },
    { name: 'Activities', to: '/admin/activities', icon: FileText },
  ];

  // Loading state
  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 animate-spin text-indigo-600" size={40} />
          <p className="text-slate-600 dark:text-slate-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Login page doesn't need sidebar
  if (pathname === '/admin/login') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        {children || <Outlet />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      <aside className={`fixed left-0 top-0 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all z-50 w-64 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Admin Panel
          </h1>
        </div>
        <nav className="p-4">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1.5 font-medium transition-all ${
                pathname === item.to || (item.to !== '/admin' && pathname.startsWith(item.to))
                  ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <item.icon size={18} />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 font-medium transition-all"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile menu toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-40 p-2 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-800 lg:hidden"
      >
        {sidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
      </button>

      {/* Main content */}
      <main className={`flex-1 transition-all ${sidebarOpen ? 'ml-64' : 'ml-0'} lg:ml-64`}>
        <div className="p-6 lg:p-8">{children || <Outlet />}</div>
      </main>
    </div>
  );
}