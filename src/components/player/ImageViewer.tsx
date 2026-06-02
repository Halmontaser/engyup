import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Maximize2, X, ImageIcon } from "lucide-react";
import { getMediaUrl } from "@/utils/assets";

interface ImageViewerProps {
  src?: string | null;
  alt?: string;
  className?: string;
  maxHeight?: string;
  rounded?: string;
}

export default function ImageViewer({
  src,
  alt = "Activity image",
  className = "",
  maxHeight = "max-h-56",
  rounded = "rounded-2xl",
}: ImageViewerProps) {
  const [expanded, setExpanded] = useState(false);
  const [errored, setErrored] = useState(false);

  if (!src || errored) return null;

  const imgUrl = getMediaUrl(src);

  return (
    <>
      {/* Inline image */}
      <div className={`relative group ${className}`}>
        <div className="bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
          <img
            src={imgUrl}
            alt={alt}
            className={`w-full ${maxHeight} object-contain ${rounded}`}
            loading="lazy"
            onError={() => setErrored(true)}
          />
        </div>
        {/* Expand button */}
        <button
          onClick={() => setExpanded(true)}
          className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
        >
          <Maximize2 size={14} />
        </button>
      </div>

      {/* Full-screen lightbox */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setExpanded(false)}
          >
            {/* Close button */}
            <button
              onClick={() => setExpanded(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
            >
              <X size={20} />
            </button>

            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              src={imgUrl}
              alt={alt}
              className="max-w-full max-h-[90vh] object-contain rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
