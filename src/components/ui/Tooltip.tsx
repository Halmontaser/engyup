"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface TooltipProps {
  children: React.ReactNode;
  content: string | React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  delay?: number;
  className?: string;
}

export function Tooltip({ children, content, side = "top", delay = 200, className }: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current!);
    timeoutRef.current = setTimeout(() => setIsOpen(true), delay);
  };

  const handleMouseLeave = () => {
    clearTimeout(timeoutRef.current!);
    timeoutRef.current = setTimeout(() => setIsOpen(false), 100);
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute z-50 px-3 py-2 rounded-lg bg-slate-900 dark:bg-slate-800 text-white text-sm font-medium shadow-xl max-w-xs pointer-events-none",
              side === "top" && "-top-2 left-1/2 -translate-x-1/2 -translate-y-full",
              side === "bottom" && "-bottom-2 left-1/2 -translate-x-1/2 -translate-y-full",
              side === "left" && "left-full top-1/2 -translate-y-1/2 -translate-x-full",
              side === "right" && "right-full top-1/2 -translate-y-1/2 -translate-x-1/2",
              className
            )}
            role="tooltip"
          >
            {typeof content === "string" ? content : content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
