import Link from "next/link";
import { getGradeByNumber, getUnitsForGrade } from "@/lib/db";
import { notFound } from "next/navigation";
import { BookOpen, ChevronRight, Layers, Info, HelpCircle, CheckCircle2, Loader2, Lock } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { UnitCard } from "@/components/ui/UnitCard";
import { getUnitImage } from "@/lib/unit-assets";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ gradeNumber: string }>;
}

export default async function GradePage({ params }: Props) {
  const { gradeNumber: raw } = await params;
  const gradeNumber = parseInt(raw, 10);
  const grade = getGradeByNumber(gradeNumber);
  if (!grade) return notFound();

  const units = getUnitsForGrade(gradeNumber);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Breadcrumb */}
      <nav className="breadcrumb mb-8">
        <Tooltip content="Return to grade selection">
          <Link href="/">Home</Link>
        </Tooltip>
        <ChevronRight size={14} />
        <Tooltip content={`View ${grade.label || `Grade ${gradeNumber}`} details`}>
          <span className="text-foreground font-semibold">
            {grade.label || `Grade ${gradeNumber}`}
          </span>
        </Tooltip>
      </nav>

      {/* Header */}
      <div className="mb-12 animate-fade-in">
        <div className="flex items-center gap-4 mb-4">
          <Tooltip content={`Grade ${gradeNumber} - ${units.length} units available`}>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-purple-500 flex items-center justify-center text-white font-extrabold text-lg shadow-lg">
              {gradeNumber}
            </div>
          </Tooltip>
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                {grade.label || `Grade ${gradeNumber}`}
              </h1>
              <p className="text-muted text-sm mt-1">
                {units.length} units available
              </p>
            </div>
            <Tooltip content={`View grade information for ${grade.label || `Grade ${gradeNumber}`} - Units contain multiple lessons with various activities`}>
              <HelpCircle className="text-muted-foreground" size={18} />
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Units Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {units.map((unit, i) => {
          const status = i === 0 ? "in-progress" : (i === 1 ? "completed" : "locked");
          const imageUrl = getUnitImage(unit.title || `Unit ${unit.unit_number}`);

          return (
            <UnitCard
              key={unit.id}
              gradeNumber={gradeNumber}
              unitNumber={unit.unit_number}
              title={unit.title || `Unit ${unit.unit_number}`}
              lessonCount={unit.lesson_count}
              totalActivities={unit.total_lessons || unit.lesson_count}
              status={status}
              imageSrc={imageUrl}
              delay={i * 0.05}
            />
          );
        })}
      </div>
    </div>
  );
}
