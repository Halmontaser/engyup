"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Save, ArrowLeft, Loader2, Check, X, AlertCircle,
  BookOpen, RefreshCw, Trash2, ChevronRight, Plus,
  ChevronDown, Edit, ArrowUp, ArrowDown, Layers,
} from "lucide-react";
import { activityTypeLabels, getActivityIcon } from "@/lib/activitySchemas";
import { adminFetch } from '@/lib/adminFetch';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Module { id: string; title: string; }
interface FormState {
  title: string;
  description: string;
  module_id: string;
  order_index: number;
  objectives: string;
  language_focus: string;
  vocabulary: string;
  cover_image_src: string;
  passing_score: number;
}
type Toast = { type: "success" | "error"; text: string };

const EMPTY_FORM: FormState = {
  title: "", description: "", module_id: "",
  order_index: 0, objectives: "", language_focus: "",
  vocabulary: "", cover_image_src: "", passing_score: 70,
};

function lessonToForm(l: any): FormState {
  return {
    title: l.title || "",
    description: l.description || "",
    module_id: l.module_id || "",
    order_index: l.order_index ?? 0,
    objectives: l.objectives || "",
    language_focus: l.language_focus || "",
    vocabulary: l.vocabulary || "",
    cover_image_src: l.cover_image_src || "",
    passing_score: l.passing_score ?? 70,
  };
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function LessonEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === "new";
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const presetModuleId = searchParams.get("module_id");

  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const savedRef = useRef<FormState>(EMPTY_FORM);
  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(savedRef.current),
    [form]
  );

  // Activities state
  interface LessonActivity {
    id: string;
    lesson_id: string;
    type: string;
    title: string;
    instruction: string;
    difficulty: string | null;
    sort_order: number;
  }
  const [activities, setActivities] = useState<LessonActivity[]>([]);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [moduleName, setModuleName] = useState("");

  // ─── Toast ────────────────────────────────────────────────────────────────
  const showToast = useCallback((t: Toast) => {
    setToast(t);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const set = <K extends keyof FormState>(key: K) =>
    (val: FormState[K]) => setForm(prev => ({ ...prev, [key]: val }));

  // ─── Load modules ─────────────────────────────────────────────────────────
  useEffect(() => {
    adminFetch("/admin/api/modules")
      .then(r => r.json())
      .then(j => {
        const mods: Module[] = j.modules || [];
        setModules(mods);
        if (isNew && mods.length > 0) {
          const defaultModuleId = presetModuleId && mods.some(m => m.id === presetModuleId)
            ? presetModuleId
            : mods[0].id;
          setForm(prev => ({ ...prev, module_id: defaultModuleId }));
          savedRef.current = { ...savedRef.current, module_id: defaultModuleId };
        }
      })
      .catch(() => {/* non-critical */});
  }, [isNew]);

  // ─── Load lesson ──────────────────────────────────────────────────────────
  const loadLesson = useCallback(async () => {
    if (isNew || !id) return;
    setIsLoading(true);
    setLoadError("");
    try {
      const res = await adminFetch(`/admin/api/lessons/${id}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Not found");
      const f = lessonToForm(json.lesson);
      setForm(f);
      savedRef.current = f;
    } catch (e: any) {
      setLoadError(e.message || "Failed to load lesson");
    } finally {
      setIsLoading(false);
    }
  }, [id, isNew]);

  useEffect(() => { loadLesson(); }, [loadLesson]);

  // ─── Load activities for this lesson ─────────────────────────────────────
  const loadActivities = useCallback(async () => {
    if (isNew || !id) return;
    try {
      const res = await adminFetch(`/admin/api/activities?lesson_id=${id}`);
      const json = await res.json();
      if (json.success) {
        setActivities((json.activities || []).map((a: any) => ({
          id: a.id,
          lesson_id: a.lesson_id,
          type: a.type,
          title: a.title,
          instruction: a.instruction,
          difficulty: a.difficulty,
          sort_order: a.sort_order,
        })));
      }
    } catch {}
  }, [id, isNew]);

  useEffect(() => { loadActivities(); }, [loadActivities]);

  // ─── Resolve module name for breadcrumb ──────────────────────────────────
  useEffect(() => {
    if (form.module_id && modules.length > 0) {
      const mod = modules.find(m => m.id === form.module_id);
      if (mod) setModuleName(mod.title);
    }
  }, [form.module_id, modules]);

  // ─── Activity handlers ───────────────────────────────────────────────────
  const handleDeleteActivity = async (actId: string) => {
    if (!confirm("Delete this activity?")) return;
    try {
      const res = await adminFetch(`/admin/api/activities/${actId}`, { method: "DELETE" });
      if (res.ok) {
        setActivities(prev => prev.filter(a => a.id !== actId));
        showToast({ type: "success", text: "Activity deleted" });
      } else {
        showToast({ type: "error", text: "Failed to delete activity" });
      }
    } catch {
      showToast({ type: "error", text: "Failed to delete activity" });
    }
  };

  const handleReorderActivity = async (actId: string, direction: "up" | "down") => {
    const idx = activities.findIndex(a => a.id === actId);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= activities.length) return;

    const act = activities[idx];
    const swap = activities[swapIdx];

    try {
      await Promise.all([
        adminFetch(`/admin/api/activities/${act.id}/reorder`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_index: swap.sort_order }),
        }),
        adminFetch(`/admin/api/activities/${swap.id}/reorder`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_index: act.sort_order }),
        }),
      ]);

      setActivities(prev =>
        prev.map(a => {
          if (a.id === act.id) return { ...a, sort_order: swap.sort_order };
          if (a.id === swap.id) return { ...a, sort_order: act.sort_order };
          return a;
        })
      );
    } catch {
      showToast({ type: "error", text: "Failed to reorder" });
    }
  };

  const activityTypes = Object.keys(activityTypeLabels);

  // ─── Ctrl+S ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); handleSave(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ─── Save ─────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!form.title || !form.module_id) {
      showToast({ type: "error", text: "Title and Unit are required." });
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        module_id: form.module_id,
        order_index: Number(form.order_index),
        objectives: form.objectives || null,
        language_focus: form.language_focus || null,
        vocabulary: form.vocabulary || null,
        cover_image_src: form.cover_image_src || null,
        passing_score: Number(form.passing_score),
      };
      const url = isNew ? "/admin/api/lessons" : `/admin/api/lessons/${id}`;
      const method = isNew ? "POST" : "PATCH";
      const res = await adminFetch(url, {
        method,
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Save failed");

      const saved = lessonToForm(json.lesson);
      setForm(saved);
      savedRef.current = saved;
      showToast({ type: "success", text: isNew ? "Lesson created!" : "Changes saved!" });

      if (isNew) {
        setTimeout(() => navigate(`/admin/lessons/${json.lesson.id}`), 1200);
      }
    } catch (e: any) {
      showToast({ type: "error", text: e.message || "Failed to save" });
    } finally {
      setIsSaving(false);
    }
  }, [form, id, isNew, navigate, showToast]);

  // ─── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async () => {
    if (!confirm("Delete this lesson? Associated activities will lose their parent lesson.")) return;
    setIsDeleting(true);
    try {
      const res = await adminFetch(`/admin/api/lessons/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Delete failed");
      navigate("/admin/lessons");
    } catch (e: any) {
      showToast({ type: "error", text: e.message || "Failed to delete" });
      setIsDeleting(false);
    }
  }, [id, navigate, showToast]);

  // ─── States: loading / error ───────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="animate-spin text-indigo-500 mx-auto" size={40} />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Loading lesson…</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-sm space-y-4">
          <AlertCircle className="mx-auto text-red-500" size={48} />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Lesson Not Found</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{loadError}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={loadLesson} className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
              <RefreshCw size={15} /> Retry
            </button>
            <button onClick={() => navigate("/admin/lessons")} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all">
              Back to Lessons
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-0">

      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 -mx-6 lg:-mx-8 px-6 lg:px-8 py-4 mb-6">
        <div className="flex items-center justify-between gap-4 max-w-3xl mx-auto">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => navigate("/admin/lessons")} className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-all shrink-0">
              <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-indigo-500 shrink-0" />
                <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200 truncate">
                  {isNew ? "New Lesson" : (form.title || "Edit Lesson")}
                </h1>
                {isDirty && (
                  <span className="shrink-0 px-2 py-0.5 bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-full">
                    Unsaved
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isNew ? "Creating a new lesson" : "Editing lesson details"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isNew && (
              <button onClick={handleDelete} disabled={isDeleting}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl border border-transparent hover:border-red-200 dark:hover:border-red-900 transition-all"
                title="Delete lesson"
              >
                {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving || !form.title || !form.module_id}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-sm transition-all ${
                isSaving || !form.title || !form.module_id
                  ? "opacity-40 cursor-not-allowed bg-slate-300 dark:bg-slate-700 text-slate-500"
                  : isDirty || isNew
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }`}
              title="Save (Ctrl+S)"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              <span>{isSaving ? "Saving…" : isNew ? "Create Lesson" : isDirty ? "Save Changes" : "Saved"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div key="toast" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className={`flex items-center gap-3 p-4 rounded-2xl border mb-4 ${
              toast.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
            }`}
          >
            {toast.type === "success" ? <Check size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
            <span className="flex-1 text-sm font-medium">{toast.text}</span>
            <button onClick={() => setToast(null)} className="p-1 rounded opacity-60 hover:opacity-100"><X size={14} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form Sections */}
      <div className="space-y-6">

        {/* Section 1 — Core Info */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            <h2 className="font-bold text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wide">Core Info</h2>
          </div>
          <div className="p-6 space-y-5">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Lesson Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={e => set("title")(e.target.value)}
                placeholder="e.g. Unit 3 – At the Market"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-200 font-semibold"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Description</label>
              <textarea
                value={form.description}
                onChange={e => set("description")(e.target.value)}
                placeholder="Brief summary of this lesson's content and goals…"
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-200 resize-none"
              />
            </div>

            {/* Module + Order */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Course Unit / Module <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.module_id}
                  onChange={e => set("module_id")(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  {modules.length === 0 && <option value="">Loading modules…</option>}
                  {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Order Index</label>
                <input
                  type="number"
                  min={0}
                  value={form.order_index}
                  onChange={e => set("order_index")(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 2 — Learning Content */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <h2 className="font-bold text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wide">Learning Content</h2>
          </div>
          <div className="p-6 space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Learning Objectives</label>
              <input
                type="text"
                value={form.objectives}
                onChange={e => set("objectives")(e.target.value)}
                placeholder="e.g. Identify market items, ask for prices"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Grammar / Language Focus</label>
              <input
                type="text"
                value={form.language_focus}
                onChange={e => set("language_focus")(e.target.value)}
                placeholder="e.g. How much is…? It costs… / prices + numbers"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Vocabulary Words</label>
              <input
                type="text"
                value={form.vocabulary}
                onChange={e => set("vocabulary")(e.target.value)}
                placeholder="e.g. apple, bread, milk, meat, vegetables, cheap, expensive"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>
        </section>

        {/* Section 3 — Settings */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <h2 className="font-bold text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wide">Settings</h2>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Passing Score (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.passing_score}
                onChange={e => set("passing_score")(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Cover Image URL</label>
              <input
                type="text"
                value={form.cover_image_src}
                onChange={e => set("cover_image_src")(e.target.value)}
                placeholder="/images/lesson_cover.jpg"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-200"
              />
              {form.cover_image_src && (
                <img
                  src={form.cover_image_src}
                  alt="Cover preview"
                  className="mt-2 h-24 w-full object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                  onError={e => (e.currentTarget.style.display = "none")}
                />
              )}
            </div>
          </div>
        </section>

        {/* Section 4 — Activities (only when editing existing lesson) */}
        {!isNew && (
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <h2 className="font-bold text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wide">
                  Activities
                </h2>
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold rounded-full">
                  {activities.length}
                </span>
              </div>

              {/* Add Activity */}
              <div className="relative">
                <button
                  onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all"
                >
                  <Plus size={14} />
                  Add Activity
                  <ChevronDown size={12} className={`transition-transform ${showTypeDropdown ? "rotate-180" : ""}`} />
                </button>
                {showTypeDropdown && (
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 max-h-56 overflow-y-auto w-56">
                    {activityTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setShowTypeDropdown(false);
                          navigate(`/admin/activities/new/${type}?lesson_id=${id}`);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors first:rounded-t-xl last:rounded-b-xl"
                      >
                        <span className="text-base">{getActivityIcon(type)}</span>
                        <span className="text-slate-700 dark:text-slate-300">{activityTypeLabels[type] || type}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 space-y-1.5">
              {activities.map((act, idx) => (
                <div
                  key={act.id}
                  className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg group"
                >
                  {/* Reorder arrows */}
                  <div className="flex flex-col -space-y-1 shrink-0">
                    <button
                      onClick={() => handleReorderActivity(act.id, "up")}
                      disabled={idx === 0}
                      className={`p-0.5 rounded transition-colors ${idx === 0 ? "opacity-20 cursor-not-allowed" : "text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700"}`}
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button
                      onClick={() => handleReorderActivity(act.id, "down")}
                      disabled={idx === activities.length - 1}
                      className={`p-0.5 rounded transition-colors ${idx === activities.length - 1 ? "opacity-20 cursor-not-allowed" : "text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700"}`}
                    >
                      <ArrowDown size={12} />
                    </button>
                  </div>

                  <span className="text-lg shrink-0">{getActivityIcon(act.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{act.title}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 capitalize">
                      {activityTypeLabels[act.type] || act.type}
                      {act.difficulty && ` · ${act.difficulty}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => navigate(`/admin/activities/${act.id}?from=lesson&lesson_id=${id}`)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                      title="Edit activity"
                    >
                      <Edit size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteActivity(act.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all"
                      title="Delete activity"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}

              {activities.length === 0 && (
                <p className="text-sm text-slate-400 dark:text-slate-500 italic py-4 text-center">
                  No activities yet. Click "Add Activity" to create one.
                </p>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Click-outside handler for type dropdown */}
      {showTypeDropdown && (
        <div className="fixed inset-0 z-10" onClick={() => setShowTypeDropdown(false)} />
      )}

      {/* Sticky bottom save bar when dirty */}
      <AnimatePresence>
        {isDirty && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="sticky bottom-4 mt-6"
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-xl shadow-slate-900/10 px-6 py-4 flex items-center justify-between gap-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                You have <span className="font-semibold text-amber-600 dark:text-amber-400">unsaved changes</span>.
                {" "}<kbd className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-0.5 text-xs font-mono">Ctrl+S</kbd> to save.
              </p>
              <button
                onClick={handleSave}
                disabled={isSaving || !form.title || !form.module_id}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isSaving ? "Saving…" : isNew ? "Create Lesson" : "Save Changes"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
