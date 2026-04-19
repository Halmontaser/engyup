"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import type { Activity } from "@/lib/db";
import { activityTypeLabels, getActivityIcon } from "@/lib/activitySchemas";
import { useRouter } from "next/navigation";

export default function ActivitiesPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedLesson, setSelectedLesson] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "title" | "type">("date");

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/admin/api/activities");
      const data = await response.json();
      setActivities(data.activities || []);
      setFilteredActivities(data.activities || []);
    } catch (error) {
      console.error("Failed to load activities:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...activities];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(query) ||
          a.instruction.toLowerCase().includes(query) ||
          a.type.toLowerCase().includes(query)
      );
    }

    // Filter by type
    if (selectedType !== "all") {
      filtered = filtered.filter((a) => a.type === selectedType);
    }

    // Filter by lesson
    if (selectedLesson !== "all") {
      filtered = filtered.filter((a) => a.lesson_id === selectedLesson);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title);
        case "type":
          return a.type.localeCompare(b.type);
        case "date":
        default:
          return b.id.localeCompare(a.id); // Assuming IDs are chronological
      }
    });

    setFilteredActivities(filtered);
  }, [activities, searchQuery, selectedType, selectedLesson, sortBy]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this activity?")) return;

    try {
      const response = await fetch(`/admin/api/activities/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadActivities();
      } else {
        alert("Failed to delete activity");
      }
    } catch (error) {
      console.error("Failed to delete activity:", error);
      alert("Failed to delete activity");
    }
  };

  const getUniqueLessons = () => {
    const lessons = new Set(activities.map((a) => a.lesson_id));
    return Array.from(lessons).sort();
  };

  const getUniqueTypes = () => {
    const types = new Set(activities.map((a) => a.type));
    return Array.from(types).sort();
  };

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
            Activities
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage your learning activities
          </p>
        </div>
        <Link
          href="/admin/activities/new"
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50"
        >
          <Plus size={20} />
          <span>New Activity</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Type filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
          >
            <option value="all">All Types</option>
            {getUniqueTypes().map((type) => (
              <option key={type} value={type}>
                {activityTypeLabels[type] || type}
              </option>
            ))}
          </select>
        </div>

        {/* Lesson filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <select
            value={selectedLesson}
            onChange={(e) => setSelectedLesson(e.target.value)}
            className="pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
          >
            <option value="all">All Lessons</option>
            {getUniqueLessons().map((lessonId) => (
              <option key={lessonId} value={lessonId}>
                Lesson {lessonId}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
          >
            <option value="date">Sort by Date</option>
            <option value="title">Sort by Title</option>
            <option value="type">Sort by Type</option>
          </select>
        </div>
      </div>

      {/* Activity List */}
      {filteredActivities.length === 0 ? (
        <div className="text-center py-16">
          <AlertCircle className="mx-auto mb-4 text-slate-400 dark:text-slate-600" size={48} />
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            {activities.length === 0
              ? "No activities found. Create your first activity to get started!"
              : "No activities match your filters."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredActivities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Activity info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                      activity.difficulty === "Easy"
                        ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                        : activity.difficulty === "Medium"
                        ? "bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400"
                        : activity.difficulty === "Hard"
                        ? "bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}>
                      {activity.difficulty || "Medium"}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {activity.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {activity.instruction}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium">
                      {activityTypeLabels[activity.type] || activity.type}
                    </span>
                    <span>•</span>
                    <span>Lesson {activity.lesson_id}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/activities/${activity.id}`}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 rounded-xl font-medium transition-all"
                  >
                    <Edit size={16} />
                    <span className="hidden sm:inline">Edit</span>
                  </Link>
                  <button
                    onClick={() => handleDelete(activity.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-xl font-medium transition-all"
                  >
                    <Trash2 size={16} />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                  <Link
                    href={`/admin/activities/${activity.id}`}
                    className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    <ChevronRight size={20} />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
        <span className="text-sm text-slate-600 dark:text-slate-400">
          Showing {filteredActivities.length} of {activities.length} activities
        </span>
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedType("all");
              setSelectedLesson("all");
            }}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
