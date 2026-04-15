
import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";

import { ActivityMedia } from "./ActivityPlayer";

export default function ReadingPassageActivity({ data, media, onComplete }: { data: any; media: ActivityMedia; onComplete?: () => void }) {
  const passage = data.passage || data.text || "";
  const title = data.title || "";
  const highlightWords: string[] = data.highlightWords || [];
  const questions = data.questions || [];
  const [showQuestions, setShowQuestions] = useState(false);

  if (!passage) return <div className="text-muted">No reading passage found.</div>;

  // Highlight specified words in the passage
  const renderPassage = () => {
    if (highlightWords.length === 0) {
      return passage.split("\n").map((line: string, i: number) => (
        <p key={i} className={`${line.trim() === "" ? "h-4" : "mb-3 leading-relaxed"}`}>
          {line}
        </p>
      ));
    }

    const regex = new RegExp(`(${highlightWords.map((w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join("|")})`, "gi");

    return passage.split("\n").map((line: string, i: number) => {
      if (line.trim() === "") return <div key={i} className="h-4" />;
      
      const parts = line.split(regex);
      return (
        <p key={i} className="mb-3 leading-relaxed">
          {parts.map((part: string, j: number) => {
            const isHighlight = highlightWords.some(
              (w: string) => w.toLowerCase() === part.toLowerCase()
            );
            return isHighlight ? (
              <mark
                key={j}
                className="bg-yellow-200 dark:bg-yellow-800/40 text-inherit px-1 rounded font-semibold"
              >
                {part}
              </mark>
            ) : (
              <span key={j}>{part}</span>
            );
          })}
        </p>
      );
    });
  };

  return (
    <div className="max-w-3xl mx-auto w-full">
      {/* Reading area */}
      <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 rounded-2xl p-8 md:p-10">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen size={20} className="text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
            Reading Passage
          </span>
        </div>

        {title && (
          <h3 className="text-xl font-bold mb-4">{title}</h3>
        )}

        <div className="text-lg text-slate-800 dark:text-slate-200 font-[serif]">
          {renderPassage()}
        </div>
      </div>

      {/* Comprehension questions if available */}
      {questions.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setShowQuestions(!showQuestions)}
            className="flex items-center gap-2 text-sm font-bold text-muted hover:text-foreground transition-colors"
          >
            {showQuestions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {questions.length} Comprehension Questions
          </button>

          {showQuestions && (
            <div className="mt-4 space-y-4">
              {questions.map((q: any, i: number) => (
                <div
                  key={i}
                  className="p-5 bg-[var(--card)] border border-[var(--border)] rounded-xl"
                >
                  <p className="font-medium">
                    {i + 1}. {q.question || q.text || q}
                  </p>
                </div>
              ))}
              {questions.length > 0 && onComplete && (
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={onComplete}
                    className="btn-accent"
                  >
                    Finish Reading
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
