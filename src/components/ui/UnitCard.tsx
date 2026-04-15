"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, CheckCircle2, Loader2, Lock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip } from "./Tooltip";

interface UnitCardProps {
  gradeNumber: number;
  unitNumber: number;
  title: string;
  lessonCount: number;
  totalActivities: number;
  status: "locked" | "in-progress" | "completed";
  imageSrc?: string;
  delay?: number;
}

export const UnitCard: React.FC<UnitCardProps> = ({
  gradeNumber,
  unitNumber,
  title,
  lessonCount,
  totalActivities,
  status,
  imageSrc = "/media/placeholders/unit-placeholder.png",
  delay = 0,
}) => {
  const isLocked = status === "locked";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="group"
    >
      <Link
        href={isLocked ? "#" : `/grade/${gradeNumber}/unit/${unitNumber}`}
        className={cn(
          "relative block overflow-hidden rounded-3xl border border-border/40 bg-card/40 backdrop-blur-sm transition-all duration-300",
          "hover:border-accent/40 hover:shadow-2xl hover:shadow-accent/10 hover:-translate-y-1",
          isLocked && "opacity-80 grayscale-[0.5] cursor-not-allowed"
        )}
      >
        {/* Top: Image Section */}
        <div className="relative aspect-[16/10] overflow-hidden bg-muted/30">
          <Image
            src={imageSrc}
            alt={title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
          
          {/* Unit Badge (Glassmorphism) */}
          <div className="absolute top-4 left-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 text-xs font-bold text-white shadow-xl">
            Unit {unitNumber}
          </div>

          {/* Status Overlay for Locked */}
          {isLocked && (
            <div className="absolute inset-0 bg-secondary/40 backdrop-blur-[2px] flex items-center justify-center">
              <Lock className="text-white/60" size={32} strokeWidth={1.5} />
            </div>
          )}

          {/* Progress Indicator gradient bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
             <div 
               className={cn(
                 "h-full transition-all duration-1000",
                 status === "completed" ? "bg-emerald-400 w-full" : 
                 status === "in-progress" ? "bg-accent w-1/2" : "w-0"
               )} 
             />
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-foreground group-hover:text-accent transition-colors">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                Explore lessons and interactive activities.
              </p>
            </div>
            
            <div className={cn(
               "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm",
               status === "completed" ? "bg-emerald-500/10 text-emerald-500" :
               status === "in-progress" ? "bg-accent/10 text-accent" :
               "bg-muted text-muted-foreground"
            )}>
               {status === "completed" ? <CheckCircle2 size={18} /> : 
                status === "in-progress" ? <Loader2 size={18} className="animate-spin" /> : 
                <Lock size={18} />}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground/80">
            <span className="flex items-center gap-1.5">
              <BookOpen size={14} className="text-accent/60" />
              {lessonCount} Lessons
            </span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              {totalActivities} Activities
            </span>
          </div>
          
          <div className="mt-6 flex items-center justify-between">
             <span className="text-[10px] uppercase tracking-widest font-bold opacity-60">
                {status.replace('-', ' ')}
             </span>
             <div className="flex items-center gap-1 text-accent font-bold text-sm opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                <span>Start Unit</span>
                <ArrowRight size={14} />
             </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
