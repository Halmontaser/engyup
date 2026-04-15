"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Check } from "lucide-react";
import { activityFormSchemas, allActivityTypes, activityTypeLabels } from "@/lib/activitySchemas";

interface ActivityTypeSelectorProps {
  onSelect: (type: string) => void;
  selectedType?: string;
  className?: string;
}

export default function ActivityTypeSelector({ onSelect, selectedType, className = "" }: ActivityTypeSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTypes = allActivityTypes.filter((schema) => {
    const query = searchQuery.toLowerCase();
    return (
      schema.label.toLowerCase().includes(query) ||
      schema.description.toLowerCase().includes(query) ||
      schema.type.toLowerCase().includes(query)
    );
  });

  const groupedTypes = filteredTypes.reduce((acc, schema) => {
    const firstLetter = schema.label.charAt(0).toUpperCase();
    if (!acc[firstLetter]) acc[firstLetter] = [];
    acc[firstLetter].push(schema);
    return acc;
  }, {} as Record<string, typeof allActivityTypes>);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search activity types..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
        />
      </div>

      {/* Activity Types Grid */}
      {Object.keys(groupedTypes).sort().map((letter) => (
        <div key={letter}>
          <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-3">{letter}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {groupedTypes[letter].map((schema) => {
              const isSelected = selectedType === schema.type;

              return (
                <motion.button
                  key={schema.type}
                  layout
                  onClick={() => onSelect(schema.type)}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 shadow-md"
                      : "border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-white dark:hover:bg-slate-800"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Selection indicator */}
                  {isSelected && (
                    <Check className="absolute top-3 right-3 text-indigo-600 dark:text-indigo-400" size={18} />
                  )}

                  {/* Icon + Label */}
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected
                        ? "bg-indigo-100 dark:bg-indigo-900/50"
                        : "bg-slate-100 dark:bg-slate-800"
                    }`}>
                      <span className="text-lg">{getActivityIconEmoji(schema.type)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {schema.label}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                        {schema.description}
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      ))}

      {/* No results */}
      {filteredTypes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500 dark:text-slate-400">
            No activity types found matching "{searchQuery}"
          </p>
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
    "dictation": "📄",
    "conversation-sim": "🗨️",
    "picture-description": "🖼️",
    "sentence-builder": "🏗️",
    "word-association": "🔗",
  };

  return emojiMap[type] || "📝";
}
