"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Image as ImageIcon, FileAudio, Loader2, Check, Trash2 } from "lucide-react";

interface MediaFile {
  id: string;
  file: File;
  preview?: string;
  type: "image" | "audio";
  url?: string;
}

interface MediaUploaderProps {
  onUpload?: (files: MediaFile[]) => void;
  maxFiles?: number;
  accept?: "image" | "audio" | "both";
  className?: string;
}

export default function MediaUploader({
  onUpload,
  maxFiles = 10,
  accept = "both",
  className = "",
}: MediaUploaderProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptTypes = {
    image: "image/*",
    audio: "audio/*",
    both: "image/*,audio/*",
  };

  const getMediaType = (file: File): "image" | "audio" => {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("audio/")) return "audio";
    return "image"; // Default
  };

  const createPreview = async (file: File): Promise<string | undefined> => {
    if (file.type.startsWith("image/")) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
    }
    return Promise.resolve(undefined);
  };

  const handleFileSelect = async (selectedFiles: FileList) => {
    if (files.length + selectedFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const newFiles: MediaFile[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const preview = await createPreview(file);

      newFiles.push({
        id: `${Date.now()}-${i}`,
        file,
        preview,
        type: getMediaType(file),
      });

      setUploadProgress(((i + 1) / selectedFiles.length) * 100);
    }

    // Simulate API upload delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    setFiles([...files, ...newFiles]);
    setIsUploading(false);
    setUploadProgress(0);

    if (onUpload) {
      onUpload([...files, ...newFiles]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeFile = (id: string) => {
    const newFiles = files.filter((f) => f.id !== id);
    setFiles(newFiles);
    if (onUpload) {
      onUpload(newFiles);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          isUploading
            ? "border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50"
            : "border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptTypes[accept]}
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          className="hidden"
        />

        <AnimatePresence mode="wait">
          {isUploading ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-3"
            >
              <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={32} />
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Uploading... {Math.round(uploadProgress)}%
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-950/30 flex items-center justify-center">
                <Upload className="text-indigo-600 dark:text-indigo-400" size={28} />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                  {files.length > 0 ? "Add more files" : "Drop files here or click to browse"}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {accept === "image" ? "Images only" : accept === "audio" ? "Audio files only" : "Images and audio files"}
                  {" • "}
                  Max {maxFiles} files
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between px-2">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                {files.length} file{files.length !== 1 ? "s" : ""} selected
              </span>
              <button
                onClick={() => {
                  setFiles([]);
                  if (onUpload) onUpload([]);
                }}
                className="text-sm text-red-500 dark:text-red-400 hover:underline"
              >
                Clear all
              </button>
            </div>
            {files.map((file) => (
              <motion.div
                key={file.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`flex items-center gap-3 p-3 rounded-xl border bg-white dark:bg-slate-900 ${
                  file.type === "image"
                    ? "border-slate-200 dark:border-slate-700"
                    : "border-purple-200 dark:border-purple-800"
                }`}
              >
                {/* Preview */}
                {file.type === "image" && file.preview ? (
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <img src={file.preview} alt={file.file.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                    file.type === "image"
                      ? "bg-slate-100 dark:bg-slate-800"
                      : "bg-purple-100 dark:bg-purple-950/30"
                  }`}>
                    {file.type === "image" ? (
                      <ImageIcon className="text-slate-500 dark:text-slate-400" size={20} />
                    ) : (
                      <FileAudio className="text-purple-500 dark:text-purple-400" size={20} />
                    )}
                  </div>
                )}

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-slate-800 dark:text-slate-200">
                    {file.file.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatFileSize(file.file.size)} • {file.type === "image" ? "Image" : "Audio"}
                  </p>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => removeFile(file.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload instructions */}
      <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-700 dark:text-amber-400">
        <Check size={14} className="shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Files will be uploaded to the <code className="bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded">/public/media/</code> directory. Use relative paths like <code className="bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded">/media/images/filename.jpg</code> in your activity data.
        </p>
      </div>
    </div>
  );
}
