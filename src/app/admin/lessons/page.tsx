"use client";

import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  Loader2,
  AlertCircle,
  BookOpen,
  Layers,
  FileText,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { adminFetch } from "@/lib/adminFetch";
import { activityTypeLabels, getActivityIcon } from "@/lib/activitySchemas";

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description: string;
  order_index: number;
  passing_score: number;
  objectives: string | null;
  cover_image_src: string | null;
}

interface Module {
  id: string;
  title: string;
  course_id: string;
  order_index: number;
}

interface Course {
  id: string;
  title: string;
}

interface Activity {
  id: string;
  lesson_id: string;
  type: string;
  title: string;
  instruction: string;
  difficulty: string | null;
  sort_order: number;
}

export default function LessonsPage() {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [activityTypePicker, setActivityTypePicker] = useState<string | null>(null);
  const [showTypeDropdown, setShowTypeDropdown] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [lessonsRes, modulesRes, activitiesRes] = await Promise.all([
        adminFetch("/admin/api/lessons"),
        adminFetch("/admin/api/modules"),
        adminFetch("/admin/api/activities"),
      ]);

      const lessonsData = await lessonsRes.json();
      const modulesData = await modulesRes.json();
      const activitiesData = await activitiesRes.json();

      const loadedLessons = lessonsData.lessons || [];
      const loadedModules = modulesData.modules || [];
      const loadedActivities = (activitiesData.activities || []).map((a: any) => ({
        id: a.id,
        lesson_id: a.lesson_id,
        type: a.type,
        title: a.title,
        instruction: a.instruction,
        difficulty: a.difficulty,
        sort_order: a.sort_order,
      }));

      setLessons(loadedLessons);
      setModules(loadedModules);
      setActivities(loadedActivities);

      // Auto-expand first module
      if (loadedModules.length > 0 && expandedModules.size === 0) {
        setExpandedModules(new Set([loadedModules[0].id]));
      }

      // Try to load courses
      try {
        const coursesRes = await adminFetch("/admin/api/courses");
        if (coursesRes.ok) {
          const coursesData = await coursesRes.json();
          setCourses(coursesData.courses || []);
        }
      } catch {}
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Group lessons by module, activities by lesson
  const hierarchy = useMemo(() => {
    const filtered = searchQuery
      ? lessons.filter(l => l.title.toLowerCase().includes(searchQuery.toLowerCase()) || l.description.toLowerCase().includes(searchQuery.toLowerCase()))
      : lessons;

    const lessonsByModule = new Map<string, Lesson[]>();
    filtered.forEach(l => {
      if (!lessonsByModule.has(l.module_id)) lessonsByModule.set(l.module_id, []);
      lessonsByModule.get(l.module_id)!.push(l);
    });

    // Sort lessons by order_index within each module
    lessonsByModule.forEach(moduleLessons => {
      moduleLessons.sort((a, b) => a.order_index - b.order_index);
    });

    const activitiesByLesson = new Map<string, Activity[]>();
    activities.forEach(a => {
      if (!activitiesByLesson.has(a.lesson_id)) activitiesByLesson.set(a.lesson_id, []);
      activitiesByLesson.get(a.lesson_id)!.push(a);
    });
    activitiesByLesson.forEach(lessonActivities => {
      lessonActivities.sort((a, b) => a.sort_order - b.sort_order);
    });

    const sortedModules = [...modules].sort((a, b) => a.order_index - b.order_index);

    return { lessonsByModule, activitiesByLesson, sortedModules };
  }, [lessons, modules, activities, searchQuery]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  const toggleLesson = (lessonId: string) => {
    setExpandedLessons(prev => {
      const next = new Set(prev);
      if (next.has(lessonId)) next.delete(lessonId);
      else next.add(lessonId);
      return next;
    });
  };

  const handleDeleteActivity = async (id: string) => {
    if (!confirm("Delete this activity?")) return;
    try {
      const res = await adminFetch(`/admin/api/activities/${id}`, { method: "DELETE" });
      if (res.ok) {
        setActivities(prev => prev.filter(a => a.id !== id));
      } else {
        alert("Failed to delete activity");
      }
    } catch {
      alert("Failed to delete activity");
    }
  };

  const handleDeleteLesson = async (id: string) => {
    if (!confirm("Delete this lesson? All activities in this lesson will lose their parent.")) return;
    try {
      const res = await adminFetch(`/admin/api/lessons/${id}`, { method: "DELETE" });
      if (res.ok) {
        setLessons(prev => prev.filter(l => l.id !== id));
        setActivities(prev => prev.filter(a => a.lesson_id !== id));
      } else {
        alert("Failed to delete lesson");
      }
    } catch {
      alert("Failed to delete lesson");
    }
  };

  const handleReorderActivity = async (activityId: string, direction: "up" | "down") => {
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;

    const lessonActivities = [...(hierarchy.activitiesByLesson.get(activity.lesson_id) || [])];
    const idx = lessonActivities.findIndex(a => a.id === activityId);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= lessonActivities.length) return;

    const swap = lessonActivities[swapIdx];

    // Swap order_index values
    try {
      await Promise.all([
        adminFetch(`/admin/api/activities/${activity.id}/reorder`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_index: swap.sort_order }),
        }),
        adminFetch(`/admin/api/activities/${swap.id}/reorder`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_index: activity.sort_order }),
        }),
      ]);

      // Update local state
      setActivities(prev =>
        prev.map(a => {
          if (a.id === activity.id) return { ...a, sort_order: swap.sort_order };
          if (a.id === swap.id) return { ...a, sort_order: activity.sort_order };
          return a;
        })
      );
    } catch {
      alert("Failed to reorder activity");
    }
  };

  const activityTypes = Object.keys(activityTypeLabels);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 animate-spin text-indigo-600 dark:text-indigo-400" size={40} />
          <p className="text-slate-600 dark:text-slate-400">Loading course structure...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">
            Course Structure
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage modules, lessons, and activities
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search lessons..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-200"
        />
      </div>

      {/* Hierarchy Tree */}
      <div className="space-y-4">
        {hierarchy.sortedModules.map((mod) => {
          const moduleLessons = hierarchy.lessonsByModule.get(mod.id) || [];
          const isModuleExpanded = expandedModules.has(mod.id);
          const totalActivities = moduleLessons.reduce(
            (sum, l) => sum + (hierarchy.activitiesByLesson.get(l.id)?.length || 0), 0
          );

          return (
            <div key={mod.id} className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
              {/* Module Header */}
              <button
                onClick={() => toggleModule(mod.id)}
                className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <ChevronDown
                  size={18}
                  className={`transition-transform text-slate-400 ${isModuleExpanded ? "" : "-rotate-90"}`}
                />
                <Layers size={20} className="text-amber-500" />
                <div className="flex-1 text-left min-w-0">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 truncate">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {moduleLessons.length} lesson{moduleLessons.length !== 1 ? "s" : ""} · {totalActivities} activit{totalActivities !== 1 ? "ies" : "y"}
                  </p>
                </div>
              </button>

              {/* Lessons */}
              <AnimatePresence>
                {isModuleExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-slate-100 dark:border-slate-800 px-4 pb-4 space-y-2 pt-2">
                      {moduleLessons.length === 0 && (
                        <p className="text-sm text-slate-400 dark:text-slate-500 italic py-3 px-2">
                          No lessons in this module
                        </p>
                      )}

                      {moduleLessons.map((lesson) => {
                        const lessonActivities = hierarchy.activitiesByLesson.get(lesson.id) || [];
                        const isLessonExpanded = expandedLessons.has(lesson.id);

                        return (
                          <div key={lesson.id} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800/50">
                            {/* Lesson Header */}
                            <div className="flex items-center gap-2 p-3">
                              <button
                                onClick={() => toggleLesson(lesson.id)}
                                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                              >
                                <ChevronDown
                                  size={16}
                                  className={`transition-transform text-slate-400 ${isLessonExpanded ? "" : "-rotate-90"}`}
                                />
                              </button>
                              <BookOpen size={18} className="text-indigo-500 shrink-0" />
                              <div className="flex-1 min-w-0" onClick={() => toggleLesson(lesson.id)} role="button">
                                <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">
                                  {lesson.title}
                                </h4>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                  Order: {lesson.order_index} · {lessonActivities.length} activit{lessonActivities.length !== 1 ? "ies" : "y"}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => navigate(`/admin/lessons/${lesson.id}`)}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all"
                                  title="Edit lesson"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteLesson(lesson.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all"
                                  title="Delete lesson"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            {/* Activities */}
                            <AnimatePresence>
                              {isLessonExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="border-t border-slate-200 dark:border-slate-700 px-3 pb-3 pt-2 space-y-1">
                                    {lessonActivities.map((activity, idx) => (
                                      <div
                                        key={activity.id}
                                        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg group"
                                      >
                                        {/* Reorder arrows */}
                                        <div className="flex flex-col -space-y-1">
                                          <button
                                            onClick={() => handleReorderActivity(activity.id, "up")}
                                            disabled={idx === 0}
                                            className={`p-0.5 rounded transition-colors ${
                                              idx === 0 ? "opacity-20 cursor-not-allowed" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                                            }`}
                                          >
                                            <ArrowUp size={12} />
                                          </button>
                                          <button
                                            onClick={() => handleReorderActivity(activity.id, "down")}
                                            disabled={idx === lessonActivities.length - 1}
                                            className={`p-0.5 rounded transition-colors ${
                                              idx === lessonActivities.length - 1 ? "opacity-20 cursor-not-allowed" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                                            }`}
                                          >
                                            <ArrowDown size={12} />
                                          </button>
                                        </div>

                                        {/* Activity info */}
                                        <span className="text-lg shrink-0">{getActivityIcon(activity.type)}</span>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                                            {activity.title}
                                          </p>
                                          <p className="text-[11px] text-slate-400 dark:text-slate-500 capitalize">
                                            {activityTypeLabels[activity.type] || activity.type}
                                            {activity.difficulty && ` · ${activity.difficulty}`}
                                          </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                          <button
                                            onClick={() => navigate(`/admin/activities/${activity.id}?from=lesson&lesson_id=${lesson.id}`)}
                                            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                                            title="Edit activity"
                                          >
                                            <Edit size={13} />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteActivity(activity.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all"
                                            title="Delete activity"
                                          >
                                            <Trash2 size={13} />
                                          </button>
                                        </div>
                                      </div>
                                    ))}

                                    {lessonActivities.length === 0 && (
                                      <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2 px-1">
                                        No activities yet
                                      </p>
                                    )}

                                    {/* Add Activity Button with Type Dropdown */}
                                    <div className="relative pt-2">
                                      <button
                                        onClick={() =>
                                          setShowTypeDropdown(showTypeDropdown === lesson.id ? null : lesson.id)
                                        }
                                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 border border-dashed border-indigo-300 dark:border-indigo-700 rounded-lg w-full transition-all"
                                      >
                                        <Plus size={14} />
                                        <span>Add Activity</span>
                                        <ChevronDown size={12} className={`ml-auto transition-transform ${showTypeDropdown === lesson.id ? "rotate-180" : ""}`} />
                                      </button>

                                      <AnimatePresence>
                                        {showTypeDropdown === lesson.id && (
                                          <motion.div
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -4 }}
                                            className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 max-h-64 overflow-y-auto"
                                          >
                                            {activityTypes.map((type) => (
                                              <button
                                                key={type}
                                                onClick={() => {
                                                  setShowTypeDropdown(null);
                                                  navigate(`/admin/activities/new/${type}?lesson_id=${lesson.id}`);
                                                }}
                                                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors first:rounded-t-xl last:rounded-b-xl"
                                              >
                                                <span className="text-base">{getActivityIcon(type)}</span>
                                                <span className="text-slate-700 dark:text-slate-300">
                                                  {activityTypeLabels[type] || type}
                                                </span>
                                              </button>
                                            ))}
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}

                      {/* New Lesson Button */}
                      <Link
                        to={`/admin/lessons/new?module_id=${mod.id}`}
                        className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 border border-dashed border-indigo-300 dark:border-indigo-700 rounded-xl transition-all"
                      >
                        <Plus size={14} />
                        <span>New Lesson in {mod.title}</span>
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {hierarchy.sortedModules.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
            <AlertCircle className="mx-auto mb-3 text-slate-400" size={36} />
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
              No Modules Found
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Create modules and lessons to get started.
            </p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm text-slate-600 dark:text-slate-400">
        <span>
          {hierarchy.sortedModules.length} modules · {lessons.length} lessons · {activities.length} activities
        </span>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Clear search
          </button>
        )}
      </div>

      {/* Click-outside handler for type dropdowns */}
      {showTypeDropdown && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowTypeDropdown(null)}
        />
      )}
    </div>
  );
}
