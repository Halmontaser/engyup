"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import ActivityTypeSelector from "@/components/admin/ActivityTypeSelector";

export default function NewActivityTypePage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const handleSelect = (type: string) => {
    setSelectedType(type);
    // Short delay for visual feedback
    setTimeout(() => {
      router.push(`/admin/activities/new/${type}`);
    }, 150);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.push("/admin/activities")}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">
            Create New Activity
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Choose an activity type to get started
          </p>
        </div>
      </div>

      {/* Type Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6"
      >
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="text-indigo-600 dark:text-indigo-400" size={24} />
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            Select Activity Type
          </h2>
        </div>
        <ActivityTypeSelector onSelect={handleSelect} selectedType={selectedType} />
      </motion.div>
    </div>
  );
}
