import Link from "next/link";
import { getGrades, getUnitsForGrade } from "@/lib/db";
import { BookOpen, ChevronRight, GraduationCap, Sparkles, Info, Clock, Lightbulb } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const grades = getGrades();

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      {/* Hero */}
      <section className="text-center mb-20 animate-fade-in">
        <Tooltip content="Interactive learning with quizzes, games, and exercises">
          <div className="inline-flex items-center gap-2 bg-accent-light text-accent px-4 py-2 rounded-full text-sm font-bold mb-6">
            <Sparkles size={16} />
            Interactive English Learning
          </div>
        </Tooltip>
        <div className="flex items-center justify-center gap-3 mb-6">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
            Welcome to{" "}
            <span className="hero-gradient">Crescent</span>
          </h1>
          <Tooltip content="Click to explore English lessons">
            <Lightbulb className="text-amber-500 size-6 animate-pulse" />
          </Tooltip>
        </div>
        <p className="text-lg text-muted max-w-2xl mx-auto leading-relaxed">
          Master English through interactive activities, quizzes, and engaging exercises.
          Choose your grade to get started.
        </p>
      </section>

      {/* Grade Cards */}
      <section>
        <div className="flex items-center gap-3 mb-8">
          <Tooltip content="Select your proficiency level">
            <GraduationCap className="text-accent" size={24} />
          </Tooltip>
          <h2 className="text-2xl font-bold">Select Your Grade</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {grades.map((grade, i) => {
            const units = getUnitsForGrade(grade.grade_number);
            const totalLessons = units.reduce((sum, u) => sum + u.lesson_count, 0);
            const totalTime = Math.round(totalLessons * 45); // ~45 min per lesson

            // Grade level descriptions
            const getGradeLevel = (n: number) => {
              if (n <= 2) return { level: "Beginner", desc: "Start your English journey with basic vocabulary and grammar" };
              if (n <= 4) return { level: "Intermediate", desc: "Build upon your foundation with more complex topics" };
              return { level: "Advanced", desc: "Master advanced concepts and fluency" };
            };
            const gradeInfo = getGradeLevel(grade.grade_number);

            const gradientColors = [
              "from-indigo-500 to-purple-600",
              "from-blue-500 to-cyan-500",
              "from-emerald-500 to-teal-500",
              "from-amber-500 to-orange-500",
              "from-pink-500 to-rose-500",
              "from-violet-500 to-fuchsia-500",
            ];

            return (
              <Link
                key={grade.id}
                href={`/grade/${grade.grade_number}`}
                className={`card group p-8 block animate-fade-in`}
                style={{ animationDelay: `${i * 0.08}s`, opacity: 0 }}
              >
                <div className="flex items-start justify-between mb-6">
                  <Tooltip content={`${gradeInfo.level} Level - ${gradeInfo.desc}`}>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradientColors[i % gradientColors.length]} flex items-center justify-center text-white font-extrabold text-xl shadow-lg`}
                      >
                        {grade.grade_number}
                      </div>
                      <Info className="text-muted-foreground size-4" />
                    </div>
                  </Tooltip>
                  <Tooltip content="Navigate to lessons">
                    <ChevronRight
                      size={20}
                      className="text-muted group-hover:text-accent group-hover:translate-x-1 transition-all"
                    />
                  </Tooltip>
                </div>

                <h3 className="text-xl font-bold mb-2">
                  {grade.label || `Grade ${grade.grade_number}`}
                </h3>

                <div className="flex items-center gap-4 text-sm text-muted">
                  <Tooltip content={`${units.length} units with multiple lessons each`}>
                    <span className="flex items-center gap-1.5">
                      <BookOpen size={14} />
                      {units.length} units
                    </span>
                  </Tooltip>
                  <span>·</span>
                  <Tooltip content={`Approximately ${totalTime} minutes of learning`}>
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} />
                      ~{totalTime} min
                    </span>
                  </Tooltip>
                  <span>·</span>
                  <span>{totalLessons} lessons</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
