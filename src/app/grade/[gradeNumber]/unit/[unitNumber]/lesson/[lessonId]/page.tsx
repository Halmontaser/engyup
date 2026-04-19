import Link from "next/link";
import {
  getGradeByNumber,
  getUnitByNumbers,
  getLesson,
  getActivitiesForLesson,
} from "@/lib/db";
import { getMediaForActivities } from "@/lib/mediaIndex";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import LessonPlayer from "@/components/player/LessonPlayer";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{
    gradeNumber: string;
    unitNumber: string;
    lessonId: string;
  }>;
}

export default async function LessonPage({ params }: Props) {
  const { gradeNumber: gRaw, unitNumber: uRaw, lessonId } = await params;
  const gradeNumber = parseInt(gRaw, 10);
  const unitNumber = parseInt(uRaw, 10);

  const grade = getGradeByNumber(gradeNumber);
  if (!grade) return notFound();

  const unit = getUnitByNumbers(gradeNumber, unitNumber);
  if (!unit) return notFound();

  const lesson = getLesson(lessonId);
  if (!lesson) return notFound();

  const rawActivities = getActivitiesForLesson(lessonId);

  // Batch-fetch all media for this lesson's activities
  const activityIds = rawActivities.map((a) => a.id);
  const mediaMap = getMediaForActivities(activityIds);

  // Parse JSON data and attach media for each activity
  const activities = rawActivities.map((a) => ({
    id: a.id,
    type: a.type,
    title: a.title,
    instruction: a.instruction,
    book_type: a.book_type,
    book_page: a.book_page,
    data: a.data ? JSON.parse(a.data) : {},
    compensates: a.compensates,
    media: mediaMap[a.id] || { audio: [], images: [] },
  }));

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Breadcrumb */}
      <nav className="breadcrumb mb-8">
        <Link href="/">Home</Link>
        <ChevronRight size={14} />
        <Link href={`/grade/${gradeNumber}`}>
          {grade.label || `Grade ${gradeNumber}`}
        </Link>
        <ChevronRight size={14} />
        <Link href={`/grade/${gradeNumber}/unit/${unitNumber}`}>
          {unit.title || `Unit ${unitNumber}`}
        </Link>
        <ChevronRight size={14} />
        <span className="text-foreground font-semibold">
          {lesson.title || `Lesson ${lesson.lesson_number}`}
        </span>
      </nav>

      {/* Lesson Player */}
      <LessonPlayer
        lesson={{
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          lessonNumber: lesson.lesson_number,
        }}
        activities={activities}
        backHref={`/grade/${gradeNumber}/unit/${unitNumber}`}
      />
    </div>
  );
}
