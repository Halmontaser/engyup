"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Save,
  ArrowLeft,
  Loader2,
  Check,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  Code2,
  ChevronRight,
} from "lucide-react";
import { getCompleteSchema, activityTypeLabels, activityFormSchemas, getActivityIcon } from "@/lib/activitySchemas";
import DynamicForm from "@/components/admin/DynamicForm";
import MediaUploader from "@/components/admin/MediaUploader";
import ActivityPlayer from "@/components/player/ActivityPlayer";
import { adminFetch } from '@/lib/adminFetch';

interface LessonOption {
  id: string;
  title: string;
  module_id?: string;
}

export default function NewActivityPage() {
  const params = useParams();
  const navigate = useNavigate();
  const activityType = params.type as string;

  const [isSaving, setIsSaving] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const [rawJsonText, setRawJsonText] = useState("");
  const [rawJsonError, setRawJsonError] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [formData, setFormData] = useState<any>({ data: {} });
  const [lessonId, setLessonId] = useState("");
  const [lessons, setLessons] = useState<LessonOption[]>([]);
  const [isLoadingLessons, setIsLoadingLessons] = useState(true);
  const [hasPresetLesson, setHasPresetLesson] = useState(false);

  // Check for preset lesson_id and context from URL
  const searchParamsStr = typeof window !== "undefined" ? window.location.search : "";
  const presetLessonId = new URLSearchParams(searchParamsStr).get("lesson_id");
  const fromLesson = new URLSearchParams(searchParamsStr).get("from") === "lesson";

  // Derive lesson name from loaded lessons list
  const lessonName = useMemo(() => {
    const found = lessons.find(l => l.id === lessonId);
    return found?.title || null;
  }, [lessons, lessonId]);

  useEffect(() => {
    loadLessons();
  }, []);

  const loadLessons = async () => {
    setIsLoadingLessons(true);
    try {
      const response = await adminFetch("/admin/api/lessons");
      const data = await response.json();
      if (data.success && data.lessons) {
        setLessons(data.lessons);
        // Use preset lesson_id if provided and valid
        if (presetLessonId && data.lessons.some((l: LessonOption) => l.id === presetLessonId)) {
          setLessonId(presetLessonId);
          setHasPresetLesson(true);
        } else if (data.lessons.length > 0) {
          setLessonId(data.lessons[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to load lessons:", error);
    } finally {
      setIsLoadingLessons(false);
    }
  };

  // Get the activity-specific field names (those that go under formData.data)
  const activitySchema = activityType ? activityFormSchemas[activityType] : null;
  const dataFieldNames = useMemo(() => {
    if (!activitySchema) return [];
    return activitySchema.fields.map(f => f.name);
  }, [activitySchema]);

  const handleSave = async () => {
    if (!lessonId) {
      setMessage({ type: "error", text: "Please select a lesson" });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const response = await adminFetch("/admin/api/activities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lesson_id: lessonId,
          type: activityType,
          title: formData.title,
          instruction: formData.instruction || "",
          difficulty: formData.difficulty || "Medium",
          book_type: formData.book_type || null,
          book_page: formData.book_page || null,
          compensates: formData.compensates || null,
          data: formData.data || {},
          sort_order: formData.sort_order || 0,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: "success", text: "Activity created successfully!" });

        // Context-aware redirect after 1.5 seconds
        setTimeout(() => {
          if (fromLesson && presetLessonId) {
            navigate(`/admin/lessons/${presetLessonId}`);
          } else {
            navigate(`/admin/activities/${result.activity.id}`);
          }
        }, 1500);
      } else {
        setMessage({ type: "error", text: result.error || "Failed to create activity" });
      }
    } catch (error) {
      console.error("Failed to create activity:", error);
      setMessage({ type: "error", text: "Failed to create activity due to network error" });
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle raw JSON editor
  const handleToggleRawJson = () => {
    if (!showRawJson) {
      setRawJsonText(JSON.stringify(formData.data || {}, null, 2));
      setRawJsonError("");
    }
    setShowRawJson(!showRawJson);
  };

  const handleRawJsonChange = (text: string) => {
    setRawJsonText(text);
    try {
      const parsed = JSON.parse(text);
      setRawJsonError("");
      setFormData((prev: any) => ({ ...prev, data: parsed }));
    } catch (e: any) {
      setRawJsonError(e.message);
    }
  };

  const schema = activityType ? getCompleteSchema(activityType) : null;

  if (!schema) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
            Invalid Activity Type
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            "{activityType}" is not a valid activity type.
          </p>
          <button
            onClick={() => navigate("/admin/activities/new")}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl font-semibold transition-all"
          >
            Choose Activity Type
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => {
                if (fromLesson && presetLessonId) {
                  navigate(`/admin/lessons/${presetLessonId}`);
                } else {
                  navigate("/admin/activities");
                }
              }}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
            </button>
            <div>
              {/* Breadcrumb */}
              {fromLesson && lessonName && (
                <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">
                  <button onClick={() => navigate(`/admin/lessons/${presetLessonId}`)} className="font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    {lessonName}
                  </button>
                  <ChevronRight size={10} />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">
                    New {activityTypeLabels[activityType] || activityType}
                  </span>
                </div>
              )}
              <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">
                New {schema.label}
              </h1>
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400">
            Create a new {activityTypeLabels[activityType] || activityType} activity
          </p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border flex items-center gap-3 ${
            message.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
              : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
          }`}
        >
          {message.type === "success" ? (
            <Check className="shrink-0" size={20} />
          ) : (
            <X className="shrink-0" size={20} />
          )}
          <span className="font-medium">{message.text}</span>
        </motion.div>
      )}

      {/* Editor Mode */}
      {!isPreview && (
        <div className="space-y-6">
          {/* Activity Type Header */}
          <div className="flex items-center gap-4 px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-2xl border border-indigo-200 dark:border-indigo-800">
            <span className="text-4xl">{getActivityIconEmoji(activityType)}</span>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                New {schema.label}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                {activityTypeLabels[activityType] || activityType} activity
              </p>
            </div>
          </div>

          {/* Lesson Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Lesson <span className="text-red-500">*</span>
              {hasPresetLesson && (
                <span className="ml-2 text-xs font-normal text-indigo-600 dark:text-indigo-400">
                  (pre-selected from lesson context)
                </span>
              )}
            </label>
            {isLoadingLessons ? (
              <div className="flex items-center gap-2 text-slate-400">
                <Loader2 className="animate-spin" size={16} />
                <span className="text-sm">Loading lessons...</span>
              </div>
            ) : (
              <select
                value={lessonId}
                onChange={(e) => setLessonId(e.target.value)}
                disabled={hasPresetLesson}
                className={`w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none text-slate-800 dark:text-slate-200 ${
                  hasPresetLesson
                    ? "bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed opacity-70"
                    : "bg-slate-50 dark:bg-slate-800 cursor-pointer"
                }`}
              >
                <option value="">-- Select a lesson --</option>
                {lessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Form */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <DynamicForm
              fields={schema.fields}
              data={formData}
              onChange={setFormData}
              dataFieldNames={dataFieldNames}
            />
          </div>

          {/* Raw JSON Editor */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={handleToggleRawJson}
              className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors rounded-t-2xl"
            >
              <div className="flex items-center gap-2">
                <Code2 size={18} className="text-slate-500 dark:text-slate-400" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">Raw JSON Editor</span>
                <span className="text-xs text-slate-400 dark:text-slate-500">(Advanced)</span>
              </div>
              <span className="text-xs text-slate-400">{showRawJson ? "Close" : "Open"}</span>
            </button>
            {showRawJson && (
              <div className="px-6 pb-6 space-y-2">
                <textarea
                  value={rawJsonText}
                  onChange={(e) => handleRawJsonChange(e.target.value)}
                  rows={16}
                  className="w-full px-4 py-3 bg-slate-900 dark:bg-slate-950 text-green-400 font-mono text-sm border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-y"
                  spellCheck={false}
                />
                {rawJsonError && (
                  <div className="flex items-center gap-2 text-red-500 text-xs">
                    <AlertCircle size={14} />
                    <span>JSON Error: {rawJsonError}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Media Upload */}
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">
              Media Upload
            </h2>
            <MediaUploader
              accept="both"
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6"
            />
          </div>
        </div>
      )}

      {/* Preview Mode */}
      {isPreview && (
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">
            Live Preview
          </h2>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 overflow-hidden">
            {/* Activity info header */}
            <div className="text-center mb-6 p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl">
              <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                {formData.title || "Untitled Activity"}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                {formData.instruction || "No instruction provided"}
              </p>
            </div>
            {/* Live activity player */}
            <div className="max-w-3xl mx-auto">
              <ActivityPlayer
                activity={{
                  id: `preview-${Date.now()}`,
                  type: activityType,
                  data: formData.data || {},
                  compensates: formData.compensates || null,
                }}
                onComplete={(correct) => {
                  console.log("Preview activity completed:", correct);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-800 pt-6">
        <button
          onClick={() => setIsPreview(!isPreview)}
          className="flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition-all"
        >
          {isPreview ? <EyeOff size={20} /> : <Eye size={20} />}
          <span>{isPreview ? "Edit Content" : "Preview"}</span>
        </button>

        {!isPreview && (
          <button
            onClick={handleSave}
            disabled={isSaving || !formData.title || !lessonId}
            className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all ${
              isSaving || !formData.title || !lessonId
                ? "opacity-50 cursor-not-allowed bg-slate-300 dark:bg-slate-700 text-slate-500"
                : "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white shadow-lg hover:shadow-xl"
            }`}
          >
            {isSaving ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Save size={20} />
            )}
            {isSaving ? "Saving..." : "Create Activity"}
          </button>
        )}
      </div>
    </div>
  );
}

function getActivityIconEmoji(type: string): string {
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
