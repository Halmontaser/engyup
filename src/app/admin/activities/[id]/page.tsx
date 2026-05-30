"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Save, ArrowLeft, Loader2, Check, X, AlertCircle,
  Eye, Trash2, Code2, EyeOff, RefreshCw, ChevronRight,
  ChevronLeft, Layers, BookOpen, Home,
} from "lucide-react";
import { Activity } from "@/lib/db";
import {
  getCompleteSchema,
  activityTypeLabels,
  activityFormSchemas,
  getActivityIcon,
} from "@/lib/activitySchemas";
import DynamicForm from "@/components/admin/DynamicForm";
import ActivityPlayer from "@/components/player/ActivityPlayer";
import { adminFetch } from "@/lib/adminFetch";

// ─── Types ───────────────────────────────────────────────────────────────────
interface FormState {
  title: string;
  instruction: string;
  difficulty: string;
  book_type: string;
  book_page: string;
  compensates: string;
  sort_order: number;
  data: Record<string, any>;
}

type Toast = { type: "success" | "error"; text: string };

// ─── Helpers ─────────────────────────────────────────────────────────────────
function activityToForm(act: Activity): FormState {
  return {
    title: act.title || "",
    instruction: act.instruction || "",
    difficulty: act.difficulty || "Medium",
    book_type: act.book_type || "",
    book_page: act.book_page || "",
    compensates: act.compensates || "",
    sort_order: act.sort_order || 0,
    data: act.data || {},
  };
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function ActivityEditorPage() {
  const { id: activityId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // ── Context-aware navigation
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const fromLesson = searchParams.get("from") === "lesson";
  const returnLessonId = searchParams.get("lesson_id");

  // ── Server state
  const [activity, setActivity] = useState<Activity | null>(null);
  const [lessonName, setLessonName] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [moduleName, setModuleName] = useState("");
  const [courseId, setCourseId] = useState("");
  const [courseName, setCourseName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // ── Sibling activities for prev/next nav
  const [siblings, setSiblings] = useState<{ id: string; title: string }[]>([]);
  const currentSiblingIdx = siblings.findIndex(s => s.id === activityId);

  // ── Form state
  const [formData, setFormData] = useState<FormState>({ title: "", instruction: "", difficulty: "Medium", book_type: "", book_page: "", compensates: "", sort_order: 0, data: {} });
  const savedRef = useRef<FormState>(formData); // tracks last-saved version
  const isDirty = useMemo(() => JSON.stringify(formData) !== JSON.stringify(savedRef.current), [formData]);

  // ── UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const [rawJsonText, setRawJsonText] = useState("");
  const [rawJsonError, setRawJsonError] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Schemas
  const schema = useMemo(() => activity ? getCompleteSchema(activity.type) : null, [activity]);
  const dataFieldNames = useMemo(() => {
    if (!activity) return [];
    return (activityFormSchemas[activity.type]?.fields || []).map(f => f.name);
  }, [activity]);

  // ─── Load ─────────────────────────────────────────────────────────────────
  const loadActivity = useCallback(async () => {
    if (!activityId) return;
    setIsLoading(true);
    setLoadError("");
    try {
      const res = await adminFetch(`/admin/api/activities/${activityId}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Not found");

      const act: Activity = json.activity;
      setActivity(act);
      const initialForm = activityToForm(act);
      setFormData(initialForm);
      savedRef.current = initialForm;

      // Parent context from enriched API response
      setLessonId(act.lesson_id || "");
      setLessonName(json.activity.lesson_title || "");
      setModuleId(json.activity.module_id || "");
      setModuleName(json.activity.module_title || "");
      setCourseId(json.activity.course_id || "");
      setCourseName(json.activity.course_title || "");

      // Load sibling activities in the same lesson
      if (act.lesson_id) {
        adminFetch(`/admin/api/activities?lesson_id=${act.lesson_id}`)
          .then(r => r.json())
          .then(j => {
            if (j.success && j.activities) {
              setSiblings(j.activities.map((a: any) => ({ id: a.id, title: a.title })));
            }
          })
          .catch(() => {});
      }
    } catch (err: any) {
      setLoadError(err.message || "Failed to load activity");
    } finally {
      setIsLoading(false);
    }
  }, [activityId]);

  useEffect(() => { loadActivity(); }, [loadActivity]);

  // ─── Toast helper ─────────────────────────────────────────────────────────
  const showToast = useCallback((t: Toast) => {
    setToast(t);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  // ─── Save ─────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!activityId || isSaving) return;
    setIsSaving(true);
    try {
      const res = await adminFetch(`/admin/api/activities/${activityId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: formData.title,
          instruction: formData.instruction,
          difficulty: formData.difficulty,
          book_type: formData.book_type || null,
          book_page: formData.book_page || null,
          compensates: formData.compensates || null,
          sort_order: formData.sort_order,
          data: formData.data,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Save failed");

      const updated = activityToForm(json.activity);
      setActivity(json.activity);
      setFormData(updated);
      savedRef.current = updated;
      showToast({ type: "success", text: "Changes saved successfully!" });
    } catch (err: any) {
      showToast({ type: "error", text: err.message || "Failed to save changes" });
    } finally {
      setIsSaving(false);
    }
  }, [activityId, formData, isSaving, showToast]);

  // Ctrl/Cmd+S shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); handleSave(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSave]);

  // ─── Context-aware navigation helpers ─────────────────────────────────────
  const goBack = () => {
    const target = fromLesson && returnLessonId ? `/admin/lessons/${returnLessonId}` : "/admin/activities";
    navigate(target);
  };

  // ─── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async () => {
    if (!confirm("Delete this activity? This cannot be undone.")) return;
    setIsDeleting(true);
    try {
      const res = await adminFetch(`/admin/api/activities/${activityId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Delete failed");
      goBack();
    } catch (err: any) {
      showToast({ type: "error", text: err.message || "Failed to delete activity" });
      setIsDeleting(false);
    }
  }, [activityId, navigate, showToast, fromLesson, returnLessonId]);

  // ─── Sibling navigation ───────────────────────────────────────────────────
  const goToSibling = (direction: "prev" | "next") => {
    const targetIdx = direction === "prev" ? currentSiblingIdx - 1 : currentSiblingIdx + 1;
    if (targetIdx < 0 || targetIdx >= siblings.length) return;
    const targetId = siblings[targetIdx].id;
    const base = `/admin/activities/${targetId}`;
    navigate(fromLesson && returnLessonId ? `${base}?from=lesson&lesson_id=${returnLessonId}` : base);
  };

  // ─── Raw JSON ─────────────────────────────────────────────────────────────
  const handleOpenRawJson = () => {
    setRawJsonText(JSON.stringify(formData.data, null, 2));
    setRawJsonError("");
    setShowRawJson(true);
  };
  const handleRawJsonChange = (text: string) => {
    setRawJsonText(text);
    try {
      const parsed = JSON.parse(text);
      setRawJsonError("");
      setFormData(prev => ({ ...prev, data: parsed }));
    } catch (e: any) {
      setRawJsonError(e.message);
    }
  };

  // ─── Render: loading / error ───────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="animate-spin text-indigo-500 mx-auto" size={40} />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Loading activity…</p>
        </div>
      </div>
    );
  }

  if (loadError || !activity) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-sm space-y-4">
          <AlertCircle className="mx-auto text-red-500" size={48} />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Activity Not Found</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{loadError || "This activity may have been deleted."}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={loadActivity} className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm">
              <RefreshCw size={15} /> Retry
            </button>
            <button onClick={goBack} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all">
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!schema) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-sm space-y-4">
          <AlertCircle className="mx-auto text-amber-500" size={48} />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Unknown Activity Type</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">No editor schema found for type <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{activity.type}</code>. You can still edit the raw JSON below.</p>
        </div>
      </div>
    );
  }

  // ─── Split schema into metadata vs activity-specific fields ───────────────
  const metaFields = schema.fields.filter(f => !dataFieldNames.includes(f.name));
  const activityFields = schema.fields.filter(f => dataFieldNames.includes(f.name));

  return (
    <div className="max-w-4xl mx-auto space-y-0">

      {/* ── Sticky Header ────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 -mx-6 lg:-mx-8 px-6 lg:px-8 py-4 mb-6">
        <div className="flex items-center justify-between gap-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={goBack} className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-all shrink-0">
              <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
            </button>
            <div className="min-w-0">
              {/* Breadcrumb */}
              <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 mb-1 flex-wrap">
                {courseName && (
                  <>
                    <span className="font-medium text-slate-500 dark:text-slate-400">{courseName}</span>
                    <ChevronRight size={10} />
                  </>
                )}
                {moduleName && (
                  <>
                    <button onClick={() => navigate("/admin/lessons")} className="font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{moduleName}</button>
                    <ChevronRight size={10} />
                  </>
                )}
                {lessonName && (
                  <>
                    <button onClick={() => navigate(`/admin/lessons/${lessonId}`)} className="font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{lessonName}</button>
                    <ChevronRight size={10} />
                  </>
                )}
                <span className="text-slate-600 dark:text-slate-300 font-medium">{activityTypeLabels[activity.type] || activity.type}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200 truncate">
                  {formData.title || "Untitled Activity"}
                </h1>
                {isDirty && (
                  <span className="shrink-0 px-2 py-0.5 bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-full">
                    Unsaved
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Sibling navigation */}
          {siblings.length > 1 && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => goToSibling("prev")}
                disabled={currentSiblingIdx <= 0}
                className={`p-2 rounded-lg transition-all ${currentSiblingIdx <= 0 ? "opacity-30 cursor-not-allowed" : "hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"}`}
                title="Previous activity in lesson"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-xs text-slate-400 dark:text-slate-500 px-1 tabular-nums">
                {currentSiblingIdx + 1}/{siblings.length}
              </span>
              <button
                onClick={() => goToSibling("next")}
                disabled={currentSiblingIdx >= siblings.length - 1}
                className={`p-2 rounded-lg transition-all ${currentSiblingIdx >= siblings.length - 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"}`}
                title="Next activity in lesson"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 shrink-0">
            {/* Preview toggle */}
            <button
              onClick={() => setIsPreview(p => !p)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium transition-all"
            >
              {isPreview ? <EyeOff size={16} /> : <Eye size={16} />}
              <span className="hidden sm:inline">{isPreview ? "Edit" : "Preview"}</span>
            </button>

            {/* Delete */}
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl border border-transparent hover:border-red-200 dark:hover:border-red-900 transition-all"
              title="Delete activity"
            >
              {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
            </button>

            {/* Save */}
            {!isPreview && (
              <button
                onClick={handleSave}
                disabled={isSaving || !formData.title}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-sm transition-all ${
                  isSaving || !formData.title
                    ? "opacity-40 cursor-not-allowed bg-slate-300 dark:bg-slate-700 text-slate-500"
                    : isDirty
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
                title="Save (Ctrl+S)"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span>{isSaving ? "Saving…" : isDirty ? "Save Changes" : "Saved"}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`flex items-center gap-3 p-4 rounded-2xl border mb-4 ${
              toast.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
            }`}
          >
            {toast.type === "success" ? <Check size={18} className="shrink-0" /> : <X size={18} className="shrink-0" />}
            <span className="flex-1 text-sm font-medium">{toast.text}</span>
            <button onClick={() => setToast(null)} className="p-1 rounded-lg opacity-60 hover:opacity-100 transition-opacity">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PREVIEW MODE ──────────────────────────────────────────────────── */}
      {isPreview && (
        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="text-center mb-6 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900">
              <p className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-2">Live Preview</p>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">{formData.title || "Untitled Activity"}</h3>
              {formData.instruction && (
                <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm">{formData.instruction}</p>
              )}
            </div>
            <div className="max-w-3xl mx-auto">
              <ActivityPlayer
                activity={{ id: activityId, type: activity.type, data: formData.data, compensates: formData.compensates || null }}
                onComplete={(correct) => console.log("Preview complete:", correct)}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT MODE ─────────────────────────────────────────────────────── */}
      {!isPreview && (
        <div className="space-y-6">

          {/* Section 1: Metadata */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <h2 className="font-bold text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wide">Activity Info</h2>
              <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">— title, difficulty, book reference</span>
            </div>
            <div className="p-6">
              <DynamicForm
                fields={metaFields}
                data={formData}
                onChange={setFormData}
                dataFieldNames={[]}
              />
            </div>
          </section>

          {/* Section 2: Activity-specific content */}
          {activityFields.length > 0 && (
            <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <h2 className="font-bold text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wide">
                  {activityTypeLabels[activity.type] || activity.type} Content
                </h2>
                <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">— activity-specific data</span>
              </div>
              <div className="p-6">
                <DynamicForm
                  fields={activityFields}
                  data={formData}
                  onChange={setFormData}
                  dataFieldNames={dataFieldNames}
                />
              </div>
            </section>
          )}

          {/* Section 3: Raw JSON editor (collapsible) */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <button
              onClick={showRawJson ? () => setShowRawJson(false) : handleOpenRawJson}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Code2 size={16} className="text-slate-400 dark:text-slate-500" />
                <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Raw JSON Editor</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">Advanced</span>
              </div>
              <ChevronRight size={16} className={`text-slate-400 transition-transform ${showRawJson ? "rotate-90" : ""}`} />
            </button>
            <AnimatePresence>
              {showRawJson && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6 space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Editing the <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">content</code> JSON column directly. Changes sync back to the form in real-time.</p>
                    <textarea
                      value={rawJsonText}
                      onChange={e => handleRawJsonChange(e.target.value)}
                      rows={18}
                      spellCheck={false}
                      className="w-full px-4 py-3 bg-slate-950 text-emerald-400 font-mono text-xs border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-y leading-relaxed"
                    />
                    {rawJsonError && (
                      <div className="flex items-center gap-2 text-red-500 text-xs">
                        <AlertCircle size={13} />
                        <span>JSON parse error: {rawJsonError}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      )}

      {/* ── Bottom save bar ───────────────────────────────────────────────── */}
      {!isPreview && isDirty && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="sticky bottom-4 mt-6"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-xl shadow-slate-900/10 px-6 py-4 flex items-center justify-between gap-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              You have <span className="font-semibold text-amber-600 dark:text-amber-400">unsaved changes</span>. Press <kbd className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-0.5 text-xs font-mono">Ctrl+S</kbd> or click Save.
            </p>
            <button
              onClick={handleSave}
              disabled={isSaving || !formData.title}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isSaving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
