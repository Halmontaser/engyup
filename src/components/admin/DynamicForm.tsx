"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  ChevronUp,
  ChevronDown,
  Trash2,
  Image as ImageIcon,
  FileAudio,
  AlertCircle,
  Info,
  Check,
} from "lucide-react";
import type { FormField } from "@/lib/activitySchemas";

interface DynamicFormProps {
  fields: FormField[];
  data: any;
  onChange: (data: any) => void;
  className?: string;
}

interface FormFieldProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  path?: string;
  depth?: number;
}

export default function DynamicForm({ fields, data, onChange, className = "" }: DynamicFormProps) {
  const handleChange = (fieldName: string, value: any) => {
    onChange({
      ...data,
      [fieldName]: value,
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {fields.map((field, index) => (
        <FormFieldComponent
          key={field.name}
          field={field}
          value={data[field.name]}
          onChange={(value) => handleChange(field.name, value)}
          depth={0}
        />
      ))}
    </div>
  );
}

function FormFieldComponent({ field, value, onChange, path = "", depth = 0 }: FormFieldProps) {
  const currentPath = path ? `${path}.${field.name}` : field.name;

  const renderField = () => {
    switch (field.type) {
      case "text":
        return (
          <input
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        );

      case "textarea":
        return (
          <textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={4}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
          />
        );

      case "number":
        return (
          <input
            type="number"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
            placeholder={field.placeholder}
            required={field.required}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        );

      case "select":
        return (
          <select
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
          >
            {!value && !field.required && (
              <option value="">-- Select an option --</option>
            )}
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case "boolean":
        return (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onChange(true)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                value === true
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <Check size={18} />
              <span>Yes</span>
            </button>
            <button
              type="button"
              onClick={() => onChange(false)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                value === false
                  ? "bg-red-600 text-white shadow-lg"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <X size={18} />
              <span>No</span>
            </button>
          </div>
        );

      case "media":
        return (
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                placeholder={field.placeholder || "Enter media URL..."}
                required={field.required}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <ImageIcon size={16} />
              <span>/images/</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <FileAudio size={16} />
              <span>/audio/</span>
            </div>
          </div>
        );

      case "array":
        const arrayValue = Array.isArray(value) ? value : [];
        const minItems = field.arrayConfig?.minItems || 0;
        const maxItems = field.arrayConfig?.maxItems;
        const canAdd = !maxItems || arrayValue.length < maxItems;

        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className={`text-sm font-semibold ${field.required ? "text-foreground" : "text-slate-600 dark:text-slate-400"}`}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <button
                type="button"
                onClick={() => {
                  const newItem = {};
                  // Initialize nested fields with empty values
                  if (field.fields) {
                    field.fields.forEach((f) => {
                      if (f.type === "boolean") newItem[f.name] = false;
                      else if (f.type === "number") newItem[f.name] = null;
                      else if (f.type === "array") newItem[f.name] = [];
                      else newItem[f.name] = "";
                    });
                  }
                  onChange([...arrayValue, newItem]);
                }}
                disabled={!canAdd}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  canAdd
                    ? "bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50"
                    : "opacity-30 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400"
                }`}
              >
                <Plus size={14} />
                <span>{field.arrayConfig?.addItemLabel || "Add Item"}</span>
              </button>
            </div>

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {arrayValue.map((item, index) => (
                  <motion.div
                    key={`${currentPath}.${index}`}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`relative bg-white dark:bg-slate-900 rounded-2xl border ${
                      depth > 0 ? "border-slate-200 dark:border-slate-700" : "border-slate-300 dark:border-slate-600 shadow-sm"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                      <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                        {field.arrayConfig?.itemLabel || "Item"} {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const newValue = arrayValue.filter((_, i) => i !== index);
                          if (newValue.length >= minItems) {
                            onChange(newValue);
                          }
                        }}
                        disabled={arrayValue.length <= minItems}
                        className={`p-1.5 rounded-lg transition-all ${
                          arrayValue.length <= minItems
                            ? "opacity-30 cursor-not-allowed"
                            : "text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                        }`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Nested fields */}
                    {field.fields && (
                      <div className="p-4 space-y-4">
                        {field.fields.map((nestedField) => (
                          <FormFieldComponent
                            key={nestedField.name}
                            field={nestedField}
                            value={item?.[nestedField.name]}
                            onChange={(val) => {
                              const newValue = arrayValue.map((v, i) =>
                                i === index ? { ...v, [nestedField.name]: val } : v
                              );
                              onChange(newValue);
                            }}
                            path={`${currentPath}.${index}`}
                            depth={depth + 1}
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {arrayValue.length < minItems && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-700 dark:text-amber-400 text-sm">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>
                  Minimum {minItems} {minItems === 1 ? "item is" : "items are"} required.{" "}
                  ({arrayValue.length} / {minItems})
                </span>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="flex items-center gap-2 text-red-500 dark:text-red-400 text-sm">
            <AlertCircle size={16} />
            <span>Unknown field type: {field.type}</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-2">
      {field.type !== "array" && (
        <label className={`block text-sm font-semibold ${field.required ? "text-foreground" : "text-slate-600 dark:text-slate-400"}`}>
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {field.helpText && (
        <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-700 dark:text-blue-300">
          <Info size={14} className="shrink-0 mt-0.5" />
          <span>{field.helpText}</span>
        </div>
      )}

      <div className={field.type !== "array" ? "mt-1" : ""}>
        {renderField()}
      </div>
    </div>
  );
}
