"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  FileText,
  PlusCircle,
  Activity as ActivityIcon,
  Loader2,
  TrendingUp,
  FolderKanban,
  Users,
} from "lucide-react";
import { activityTypeLabels } from "@/lib/activitySchemas";

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalActivities: 0,
    totalLessons: 0,
    totalUnits: 0,
    totalGrades: 0,
    activitiesByType: {} as Record<string, number>,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/admin/api/stats");
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      } else {
        console.error("Failed to load stats:", data.error);
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const topActivityTypes = Object.entries(stats.activitiesByType)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">
            Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Overview of your learning content
          </p>
        </div>
        <Link
          href="/admin/activities/new"
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
        >
          <PlusCircle size={20} />
          <span>New Activity</span>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Activities",
            value: stats.totalActivities,
            icon: FileText,
            color: "indigo",
          },
          {
            label: "Total Lessons",
            value: stats.totalLessons,
            icon: BookOpen,
            color: "emerald",
          },
          {
            label: "Total Units",
            value: stats.totalUnits,
            icon: FolderKanban,
            color: "amber",
          },
          {
            label: "Total Grades",
            value: stats.totalGrades,
            icon: ActivityIcon,
            color: "purple",
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600 transition-all"
          >
            <div className={`flex items-center gap-3 mb-2 ${
              stat.color === "indigo"
                ? "text-indigo-600 dark:text-indigo-400"
                : stat.color === "emerald"
                ? "text-emerald-600 dark:text-emerald-400"
                : stat.color === "amber"
                ? "text-amber-600 dark:text-amber-400"
                : "text-purple-600 dark:text-purple-400"
            }`}>
              <stat.icon size={24} />
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-800 dark:text-slate-200">
                {stat.value}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {stat.label}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Activity Types Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <Link
              href="/admin/activities"
              className="flex items-center gap-3 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/50 transition-all"
            >
              <FileText size={20} />
              <div>
                <div className="font-semibold">Manage Activities</div>
                <div className="text-sm opacity-70">View, edit, and create activities</div>
              </div>
            </Link>
            <Link
              href="/admin/lessons"
              className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-all"
            >
              <BookOpen size={20} />
              <div>
                <div className="font-semibold">Manage Lessons</div>
                <div className="text-sm opacity-70">View and organize lessons</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Top Activity Types */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <TrendingUp className="text-amber-600 dark:text-amber-400" size={24} />
            Activity Types
          </h2>
          {Object.keys(stats.activitiesByType).length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              No activities yet. Create your first activity to get started!
            </div>
          ) : (
            <div className="space-y-3">
              {topActivityTypes.map(([type, count], index) => (
                <motion.div
                  key={type}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getActivityEmoji(type)}</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {activityTypeLabels[type] || type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
                      count > 10
                        ? "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400"
                        : count > 5
                        ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                    }`}>
                      {count}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Help Card */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-2xl border border-indigo-200 dark:border-indigo-800 p-6">
        <div className="flex items-start gap-4">
          <Users className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" size={24} />
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">
              Getting Started
            </h3>
            <ul className="space-y-2 text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">1.</span>
                <span>Create a new activity by clicking "New Activity" or choosing from the Activities page</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">2.</span>
                <span>Upload media files (images, audio) for richer activities</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">3.</span>
                <span>Preview activities before saving to ensure they work correctly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">4.</span>
                <span>Organize activities by assigning them to lessons with proper sort order</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function getActivityEmoji(type: string): string {
  const emojiMap: Record<string, string> = {
    "mcq": "❓",
    "flashcard": "🃏",
    "gap-fill": "✏️",
    "match-pairs": "🔗",
    "true-false": "✅",
    "word-order": "📝",
    "reading-passage": "📖",
    "category-sort": "📂",
    "dialogue-read": "💬",
    "transform-sentence": "🔄",
    "image-label": "📍",
    "guessing-game": "🎮",
    "reading-sequence": "📋",
    "pronunciation-practice": "🗣️",
    "listening-comprehension": "🎧",
    "spelling-bee": "🐝",
    "dictation": "📝",
    "conversation-sim": "🗨️",
    "picture-description": "🖼️",
    "sentence-builder": "🏗️",
    "word-association": "🔗",
  };

  return emojiMap[type] || "📝";
}
