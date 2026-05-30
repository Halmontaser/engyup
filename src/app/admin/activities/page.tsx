"use client";

import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  Loader2,
  AlertCircle,
  BookOpen,
  Layers,
  GraduationCap,
} from "lucide-react";
import { activityTypeLabels, getActivityIcon } from "@/lib/activitySchemas";
import { adminFetch } from "@/lib/adminFetch";

interface Activity {
  id: string;
  lesson_id: string;
  type: string;
  title: string;
  instruction: string;
  difficulty: string | null;
  sort_order: number;
  created_at: string;
}

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  order_index: number;
}

interface Module {
  id: string;
  title: string;
  course_id: string;
  order_index: number;
  course_title?: string;
}

interface Course {
  id: string;
  title: string;
}

export default function ActivitiesPage() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [showTypeDropdown, setShowTypeDropdown] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [actRes, lessonRes, moduleRes, courseRes] = await Promise.all([
        adminFetch("/admin/api/activities"),
        adminFetch("/admin/api/lessons"),
        adminFetch("/admin/api/modules"),
        adminFetch("/admin/api/courses"),
      ]);
      const [actData, lessonData, moduleData, courseData] = await Promise.all([
        actRes.json(),
        lessonRes.json(),
        moduleRes.json(),
        courseRes.json(),
      ]);

      setActivities(actData.activities || []);
      setLessons(lessonData.lessons || []);
      setModules(moduleData.modules || []);
      setCourses(courseData.courses || []);

      // Auto-expand first module
      const mods = moduleData.modules || [];
      if (mods.length > 0) {
        setExpandedModules(new Set([mods[0].id]));
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Build hierarchy tree
  const hierarchy = useMemo(() => {
    let filtered = [...activities];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        a => a.title.toLowerCase().includes(q) || a.instruction.toLowerCase().includes(q) || a.type.toLowerCase().includes(q)
      );
    }
    if (selectedType !== "all") {
      filtered = filtered.filter(a => a.type === selectedType);
    }

    const activitiesByLesson = new Map<string, Activity[]>();
    filtered.forEach(a => {
      if (!activitiesByLesson.has(a.lesson_id)) activitiesByLesson.set(a.lesson_id, []);
      activitiesByLesson.get(a.lesson_id)!.push(a);
    });
    activitiesByLesson.forEach(arr => arr.sort((a, b) => a.sort_order - b.sort_order));

    const lessonsByModule = new Map<string, Lesson[]>();
    lessons.forEach(l => {
      if (!lessonsByModule.has(l.module_id)) lessonsByModule.set(l.module_id, []);
      lessonsByModule.get(l.module_id)!.push(l);
    });
    lessonsByModule.forEach(arr => arr.sort((a, b) => a.order_index - b.order_index));

    const modulesByCourse = new Map<string, Module[]>();
    const sortedModules = [...modules].sort((a, b) => a.order_index - b.order_index);
    sortedModules.forEach(m => {
      const cid = m.course_id || "unassigned";
      if (!modulesByCourse.has(cid)) modulesByCourse.set(cid, []);
      modulesByCourse.get(cid)!.push(m);
    });

    return { activitiesByLesson, lessonsByModule, modulesByCourse };
  }, [activities, lessons, modules, searchQuery, selectedType]);

  const toggleModule = (id: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleLesson = (id: string) => {
    setExpandedLessons(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDelete = async (id: string) => {
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

  const activityTypes = Object.keys(activityTypeLabels);
  const totalFiltered = useMemo(() => {
    let count = 0;
    hierarchy.activitiesByLesson.forEach(arr => { count += arr.length; });
    return count;
  }, [hierarchy.activitiesByLesson]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 animate-spin text-indigo-600 dark:text-indigo-400" size={40} />
          <p className="text-slate-600 dark:text-slate-400">Loading activities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">Activities</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Browse and manage activities organized by course hierarchy
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search activities..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-200"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="pl-10 pr-8 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-800 dark:text-slate-200"
          >
            <option value="all">All Types</option>
            {activityTypes.map(type => (
              <option key={type} value={type}>{activityTypeLabels[type] || type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Hierarchy Tree */}
      <div className="space-y-4">
        {courses.map(course => {
          const courseModules = hierarchy.modulesByCourse.get(course.id) || [];
          if (courseModules.length === 0) return null;

          return (
            <div key={course.id} className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
              {/* Course Header */}
              <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <GraduationCap size={20} className="text-purple-500" />
                <h3 className="font-bold text-slate-800 dark:text-slate-200">{course.title}</h3>
              </div>

              <div className="p-3 space-y-2">
                {courseModules.map(mod => {
                  const moduleLessons = hierarchy.lessonsByModule.get(mod.id) || [];
                  const isModuleExpanded = expandedModules.has(mod.id);
                  const moduleActCount = moduleLessons.reduce(
                    (sum, l) => sum + (hierarchy.activitiesByLesson.get(l.id)?.length || 0), 0
                  );

                  return (
                    <div key={mod.id} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                      {/* Module Header */}
                      <button
                        onClick={() => toggleModule(mod.id)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <ChevronDown
                          size={16}
                          className={`transition-transform text-slate-400 ${isModuleExpanded ? "" : "-rotate-90"}`}
                        />
                        <Layers size={16} className="text-amber-500" />
                        <div className="flex-1 text-left min-w-0">
                          <h4 className="font-semibold text-slate-700 dark:text-slate-300 text-sm truncate">{mod.title}</h4>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">
                            {moduleLessons.length} lesson{moduleLessons.length !== 1 ? "s" : ""} · {moduleActCount} activit{moduleActCount !== 1 ? "ies" : "y"}
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
                            <div className="border-t border-slate-100 dark:border-slate-800 px-3 pb-3 pt-2 space-y-1.5">
                              {moduleLessons.map(lesson => {
                                const lessonActivities = hierarchy.activitiesByLesson.get(lesson.id) || [];
                                const isLessonExpanded = expandedLessons.has(lesson.id);

                                return (
                                  <div key={lesson.id} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800/30">
                                    {/* Lesson Header */}
                                    <div className="flex items-center gap-2 p-2.5">
                                      <button
                                        onClick={() => toggleLesson(lesson.id)}
                                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                                      >
                                        <ChevronDown
                                          size={14}
                                          className={`transition-transform text-slate-400 ${isLessonExpanded ? "" : "-rotate-90"}`}
                                        />
                                      </button>
                                      <BookOpen size={14} className="text-indigo-500 shrink-0" />
                                      <div className="flex-1 min-w-0" onClick={() => toggleLesson(lesson.id)} role="button">
                                        <h5 className="font-medium text-slate-700 dark:text-slate-300 text-xs truncate">
                                          {lesson.title}
                                        </h5>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                          {lessonActivities.length} activit{lessonActivities.length !== 1 ? "ies" : "y"}
                                        </p>
                                      </div>
                                      <button
                                        onClick={() => navigate(`/admin/lessons/${lesson.id}`)}
                                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-all"
                                        title="Edit lesson"
                                      >
                                        <Edit size={12} />
                                      </button>
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
                                          <div className="border-t border-slate-200 dark:border-slate-700 px-2.5 pb-2.5 pt-1.5 space-y-1">
                                            {lessonActivities.map(activity => (
                                              <div
                                                key={activity.id}
                                                className="flex items-center gap-2 px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg group"
                                              >
                                                <span className="text-base shrink-0">{getActivityIcon(activity.type)}</span>
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                                                    {activity.title}
                                                  </p>
                                                  <p className="text-[10px] text-slate-400 dark:text-slate-500 capitalize">
                                                    {activityTypeLabels[activity.type] || activity.type}
                                                    {activity.difficulty && ` · ${activity.difficulty}`}
                                                  </p>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                  <button
                                                    onClick={() => navigate(`/admin/activities/${activity.id}?from=lesson&lesson_id=${lesson.id}`)}
                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-all"
                                                    title="Edit activity"
                                                  >
                                                    <Edit size={12} />
                                                  </button>
                                                  <button
                                                    onClick={() => handleDelete(activity.id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition-all"
                                                    title="Delete activity"
                                                  >
                                                    <Trash2 size={12} />
                                                  </button>
                                                </div>
                                              </div>
                                            ))}

                                            {lessonActivities.length === 0 && (
                                              <p className="text-[10px] text-slate-400 dark:text-slate-500 italic py-1 px-1">
                                                No matching activities
                                              </p>
                                            )}

                                            {/* Add Activity */}
                                            <div className="relative pt-1.5">
                                              <button
                                                onClick={() => setShowTypeDropdown(showTypeDropdown === lesson.id ? null : lesson.id)}
                                                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 border border-dashed border-indigo-300 dark:border-indigo-700 rounded-lg w-full transition-all"
                                              >
                                                <Plus size={12} />
                                                <span>Add Activity</span>
                                                <ChevronDown size={10} className={`ml-auto transition-transform ${showTypeDropdown === lesson.id ? "rotate-180" : ""}`} />
                                              </button>

                                              <AnimatePresence>
                                                {showTypeDropdown === lesson.id && (
                                                  <motion.div
                                                    initial={{ opacity: 0, y: -4 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -4 }}
                                                    className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 max-h-56 overflow-y-auto"
                                                  >
                                                    {activityTypes.map(type => (
                                                      <button
                                                        key={type}
                                                        onClick={() => {
                                                          setShowTypeDropdown(null);
                                                          navigate(`/admin/activities/new/${type}?lesson_id=${lesson.id}&from=lesson`);
                                                        }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors first:rounded-t-xl last:rounded-b-xl"
                                                      >
                                                        <span className="text-sm">{getActivityIcon(type)}</span>
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

                              {moduleLessons.length === 0 && (
                                <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2 px-1">
                                  No lessons in this module
                                </p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {courses.length === 0 && modules.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
            <AlertCircle className="mx-auto mb-3 text-slate-400" size={36} />
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No Courses Found</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Create courses, modules, and lessons to organize activities.
            </p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm text-slate-600 dark:text-slate-400">
        <span>
          {totalFiltered} of {activities.length} activities
          {selectedType !== "all" && ` (${activityTypeLabels[selectedType] || selectedType})`}
          {searchQuery && ` matching "${searchQuery}"`}
        </span>
        {(searchQuery || selectedType !== "all") && (
          <button
            onClick={() => { setSearchQuery(""); setSelectedType("all"); }}
            className="text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Click-outside handler for type dropdowns */}
      {showTypeDropdown && (
        <div className="fixed inset-0 z-10" onClick={() => setShowTypeDropdown(null)} />
      )}
    </div>
  );
}
