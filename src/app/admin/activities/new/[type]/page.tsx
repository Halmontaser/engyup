"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Save,
  ArrowLeft,
  Loader2,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import { createActivity, getLessonsForUnit, Lesson } from "@/lib/db";
import { activityFormSchemas, getFormSchema, getCompleteSchema, activityTypeLabels } from "@/lib/activitySchemas";
import DynamicForm from "@/components/admin/DynamicForm";
import MediaUploader from "@/components/admin/MediaUploader";

export default function NewActivityPage() {
  const params = useParams();
  const router = useRouter();
  const activityType = params.type as string;

  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [lessonId, setLessonId] = useState("");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [gradeNumber, setGradeNumber] = useState<number | null>(null);
  const [unitNumber, setUnitNumber] = useState<number | null>(null);

  useEffect(() => {
    loadLessons();
  }, []);

  const loadLessons = async () => {
    try {
      // For now, just show first few lessons as options
      // In a real app, you'd filter by grade/unit
      const allLessons: Lesson[] = [];

      // Try to load lessons from grade 1, unit 1
      const unit1Lessons = await getLessonsForUnit(1, 1);
      allLessons.push(...unit1Lessons);

      setLessons(allLessons);

      if (allLessons.length > 0) {
        setLessonId(allLessons[0].id);
      }
    } catch (error) {
      console.error("Failed to load lessons:", error);
    }
  };

  const handleSave = async () => {
    if (!lessonId) {
      setMessage({ type: "error", text: "Please select a lesson" });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const newActivity = await createActivity({
        lesson_id: lessonId,
        type: activityType,
        title: formData.title,
        instruction: formData.instruction,
        difficulty: formData.difficulty || undefined,
        book_type: formData.book_type || undefined,
        book_page: formData.book_page || undefined,
        compensates: formData.compensates || undefined,
        data: formData.data,
        sort_order: formData.sort_order || 0,
      });

      setMessage({ type: "success", text: "Activity created successfully!" });

      // Redirect to edit page after 2 seconds
      setTimeout(() => {
        router.push(`/admin/activities/${newActivity.id}`);
      }, 2000);
    } catch (error) {
      console.error("Failed to create activity:", error);
      setMessage({ type: "error", text: "Failed to create activity" });
    } finally {
      setIsSaving(false);
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
            onClick={() => router.push("/admin/activities/new")}
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
              onClick={() => router.push("/admin/activities")}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
            </button>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">
              New {schema.label}
            </h1>
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
              Lesson *
            </label>
            <select
              value={lessonId}
              onChange={(e) => setLessonId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
            >
              <option value="">-- Select a lesson --</option>
              {lessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  Grade {lesson.unit_id}/Unit {lesson.unit_id} - Lesson {lesson.lesson_number}: {lesson.title}
                </option>
              ))}
            </select>
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
                {formData.title || "Untitled Activity"}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                {formData.instruction || "No instruction provided"}
              </p>
            </div>
            <div className="text-center py-12 text-slate-400">
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

      {/* Save Button */}
      {!isPreview && (
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setIsPreview(true)}
            className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition-all"
          >
            Preview
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !formData.title || !lessonId}
            className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all ${
              isSaving || !formData.title || !lessonId
                ? "opacity-50 cursor-not-allowed"
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
