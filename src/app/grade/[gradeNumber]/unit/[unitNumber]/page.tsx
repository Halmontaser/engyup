import Link from "next/link";
import {
  getGradeByNumber,
  getUnitByNumbers,
  getLessonsForUnit,
  getActivityCountForLesson,
} from "@/lib/db";
import { notFound } from "next/navigation";
import { ChevronRight, Puzzle, Clock, HelpCircle, PlayCircle, CheckCircle2, Sparkles } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ gradeNumber: string; unitNumber: string }>;
}

export default async function UnitPage({ params }: Props) {
  const { gradeNumber: gRaw, unitNumber: uRaw } = await params;
  const gradeNumber = parseInt(gRaw, 10);
  const unitNumber = parseInt(uRaw, 10);

  const grade = getGradeByNumber(gradeNumber);
  if (!grade) return notFound();

  const unit = getUnitByNumbers(gradeNumber, unitNumber);
  if (!unit) return notFound();

  const lessons = getLessonsForUnit(gradeNumber, unitNumber);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Breadcrumb */}
      <nav className="breadcrumb mb-8">
        <Tooltip content="Return to grade selection">
          <Link href="/">Home</Link>
        </Tooltip>
        <ChevronRight size={14} />
        <Tooltip content={`Back to ${grade.label || `Grade ${gradeNumber}`} units`}>
          <Link href={`/grade/${gradeNumber}`}>
            {grade.label || `Grade ${gradeNumber}`}
          </Link>
        </Tooltip>
        <ChevronRight size={14} />
        <Tooltip content={`View all lessons for ${unit.title || `Unit ${unitNumber}`} - ${lessons.length} lessons available`}>
          <span className="text-foreground font-semibold">
            {unit.title || `Unit ${unitNumber}`}
          </span>
        </Tooltip>
      </nav>

      {/* Header */}
      <div className="mb-12 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <Tooltip content={`Unit ${unitNumber} - ${lessons.length} lessons with various activities`}>
            <span className="activity-type-badge">Unit {unitNumber}</span>
          </Tooltip>
        </div>
        <div className="flex items-center gap-3">
          <Tooltip content={`${unit.title || `Unit ${unitNumber}`} - Contains ${lessons.length} lessons covering vocabulary, grammar, and interactive exercises`}>
            <h1 className="text-3xl font-extrabold tracking-tight">
              {unit.title || `Unit ${unitNumber}`}
            </h1>
          </Tooltip>
          <Tooltip content="Click for lesson help and activity descriptions">
            <HelpCircle className="text-muted-foreground" size={20} />
          </Tooltip>
        </div>
        <p className="text-muted mt-2">
          {lessons.length} lessons in this unit
        </p>
      </div>

      {/* Lessons List */}
      <div className="space-y-4">
        {lessons.map((lesson, i) => {
          const activityCount = getActivityCountForLesson(lesson.id);
          const isNew = i === 0;

          return (
            <Link
              key={lesson.id}
              href={`/grade/${gradeNumber}/unit/${unitNumber}/lesson/${lesson.id}`}
              className="card group flex items-center gap-6 p-6 animate-fade-in"
              style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}
            >
              {/* Lesson number with icon */}
              <Tooltip content={`Lesson ${lesson.lesson_number ?? i + 1} - ${lesson.title || 'English Lesson'}`}>
                <div className="relative flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-accent-light text-accent flex items-center justify-center font-extrabold text-sm shrink-0">
                    {lesson.lesson_number ?? i + 1}
                  </div>
                  {isNew && (
                    <Tooltip content="New lesson - Start learning today!">
                      <PlayCircle className="absolute -bottom-1 -right-1 w-5 h-5 text-[var(--accent)] bg-background rounded-full" size={18} />
                    </Tooltip>
                  )}
                  {!isNew && i > 0 && (
                    <Tooltip content="Completed lesson">
                      <CheckCircle2 className="absolute -bottom-1 -right-1 w-5 h-5 text-[var(--success)] bg-background rounded-full" size={18} />
                    </Tooltip>
                  )}
                </div>
              </Tooltip>

              {/* Info */}
              <Tooltip content={`${lesson.title || `Lesson ${lesson.lesson_number}`} - ${activityCount} interactive activities including quizzes, flashcards, and exercises`}>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg group-hover:text-accent transition-colors truncate">
                    {lesson.title || `Lesson ${lesson.lesson_number}`}
                  </h3>
                  {lesson.description && (
                    <p className="text-sm text-muted mt-1 line-clamp-1">
                      {lesson.description}
                    </p>
                  )}
                </div>
              </Tooltip>

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs text-muted shrink-0">
                <Tooltip content={`${activityCount} activities - Estimated ~${activityCount * 5} minutes`}>
                  <span className="flex items-center gap-1.5">
                    <Puzzle size={14} />
                    {activityCount}
                  </span>
                </Tooltip>
                <Tooltip content="Start this activity">
                  <ChevronRight
                    size={18}
                    className="group-hover:text-accent group-hover:translate-x-1 transition-all"
                  />
                </Tooltip>
              </div>
            </Link>
          );
        })}

        {lessons.length === 0 && (
          <div className="card-static p-12 text-center text-muted">
            <Tooltip content="No lessons available. Lessons are being prepared. Check back soon!">
              <Clock size={32} className="mx-auto mb-4 opacity-50" />
            </Tooltip>
            <p className="font-medium">No lessons available yet</p>
            <p className="text-sm mt-1 flex items-center justify-center gap-2">
              Lessons for this unit are coming soon.
              <Tooltip content="New lessons coming soon - Refresh to check for updates">
                <Sparkles size={14} className="text-[var(--accent)]" />
              </Tooltip>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
