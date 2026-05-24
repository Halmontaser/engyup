"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Check,
  X,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { Activity, getActivityById, updateActivity, getLesson } from "@/lib/db";
import { activityFormSchemas, getFormSchema, getCompleteSchema, activityTypeLabels } from "@/lib/activitySchemas";
import DynamicForm from "@/components/admin/DynamicForm";
import MediaUploader from "@/components/admin/MediaUploader";
import { ActivityMedia } from "@/components/player/ActivityPlayer";

export default function ActivityEditorPage() {
  const params = useParams();
  const router = useRouter();
  const activityId = params.id as string;

  const [activity, setActivity] = useState<Activity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [activityType, setActivityType] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadActivity();
  }, [activityId]);

  const loadActivity = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/admin/api/activities/${activityId}`);
      if (!response.ok) {
        throw new Error("Failed to load activity");
      }
      const data = await response.json();
      setActivity(data);

      // Parse activity data
      const parsedData = typeof data.data === "string" ? JSON.parse(data.data) : data.data;
      setActivityType(data.type);

      // Combine metadata with activity data
      setFormData({
        title: data.title,
        instruction: data.instruction,
        difficulty: data.difficulty,
        book_type: data.book_type,
        book_page: data.book_page,
        compensates: data.compensates,
        sort_order: data.sort_order || 0,
        data: parsedData
      });
    } catch (error) {
      console.error("Failed to load activity:", error);
      setMessage({ type: "error", text: "Failed to load activity" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/admin/api/activities/${activityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          instruction: formData.instruction,
          difficulty: formData.difficulty,
          book_type: formData.book_type,
          book_page: formData.book_page,
          compensates: formData.compensates,
          sort_order: formData.sort_order,
          data: formData.data,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save activity");
      }

      const data = await response.json();
      setActivity(data);
      setMessage({ type: "success", text: "Activity saved successfully!" });

      // Auto-hide message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Failed to save activity:", error);
      setMessage({ type: "error", text: "Failed to save activity" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/admin/api/activities/${activityId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete activity");
      }

      router.push("/admin/activities");
    } catch (error) {
      console.error("Failed to delete activity:", error);
      setMessage({ type: "error", text: "Failed to delete activity" });
      setShowDeleteConfirm(false);
    }
  };

  const schema = activityType ? getCompleteSchema(activityType) : null;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={40} />
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
            Activity Not Found
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            The activity you're looking for doesn't exist or may have been deleted.
          </p>
          <button
            onClick={() => router.push("/admin/activities")}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl font-semibold transition-all"
          >
            Back to Activities
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
              onClick={() => router.push("/admin/activities")}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
            </button>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">
              Edit Activity
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400">
            Activity ID: {activityId}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPreview(!isPreview)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
              isPreview
                ? "bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {isPreview ? <EyeOff size={18} /> : <Eye size={18} />}
            <span className="hidden sm:inline">{isPreview ? "Edit" : "Preview"}</span>
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-xl font-medium transition-all"
          >
            <Trash2 size={18} />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>

      {/* Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
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
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="text-center mb-6">
                <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                  Delete Activity?
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Are you sure you want to delete "{activity.title || 'this activity'}"? This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white rounded-xl font-semibold transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor Mode */}
      {!isPreview && schema && (
        <div className="space-y-6">
          {/* Activity Type Header */}
          <div className="flex items-center gap-4 px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-2xl border border-indigo-200 dark:border-indigo-800">
            <span className="text-4xl">{getActivityIconEmoji(activity.type)}</span>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                {schema.label}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                {activityTypeLabels[activity.type] || activity.type} activity
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <DynamicForm
              fields={schema.fields}
              data={formData}
              onChange={setFormData}
            />
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
            Preview
          </h2>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-8">
            <div className="text-center mb-6 p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl">
              <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                {formData.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mt-2">{formData.instruction}</p>
            </div>
            {/* Actual ActivityPlayer would go here for true preview */}
            <div className="text-center py-12 text-slate-400">
              <Eye size={48} className="mx-auto mb-4 opacity-50" />
              <p>
                Activity preview will render here using the {schema.label} component.
              </p>
              <p className="text-sm mt-2">
                To test this activity properly, save it first, then visit the lesson page.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Save Button (only in edit mode) */}
      {!isPreview && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all ${
              isSaving
                ? "opacity-50 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white shadow-lg hover:shadow-xl"
            }`}
          >
            {isSaving ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Save size={20} />
            )}
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
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
