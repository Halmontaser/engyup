
import { useState } from "react";
import { motion } from "motion/react";
import { MapPin, Check, Eye } from "lucide-react";

import { ActivityMedia } from "./ActivityPlayer";

export default function ImageLabelActivity({ data, media, onComplete }: { data: any; media: ActivityMedia; onComplete?: () => void }) {
  const imageSrc = data.image?.src || "";
  const imageAlt = data.image?.alt || "Label this image";
  const hotspots: {
    id: string;
    x: number;
    y: number;
    label: string;
    width?: number;
    height?: number;
  }[] = data.hotspots || [];

  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [isChecked, setIsChecked] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);

  if (hotspots.length === 0)
    return <div className="text-muted">No image labels found.</div>;

  const handleChange = (id: string, value: string) => {
    if (isChecked) return;
    setInputs((prev) => ({ ...prev, [id]: value }));
  };

  const handleCheck = () => {
    setIsChecked(true);
    // Call onComplete when user checks answers
    if (onComplete) {
      onComplete();
    }
  };

  const correctCount = hotspots.filter(
    (h) => inputs[h.id]?.trim().toLowerCase() === h.label.toLowerCase()
  ).length;

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-[var(--accent)]" />
          <span className="text-sm font-bold text-muted uppercase tracking-widest">
            Label the Image
          </span>
        </div>
        {isChecked && (
          <span className="text-sm font-bold">
            <span className="text-[var(--success)]">{correctCount}</span> /{" "}
            {hotspots.length} correct
          </span>
        )}
      </div>

      {/* Image with hotspots - fallback to list mode since images may not be available */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
        {imageSrc ? (
          <div className="relative mb-6">
            <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4 text-center text-muted text-sm">
              <MapPin size={32} className="mx-auto mb-2 opacity-40" />
              Image: {imageAlt}
            </div>
          </div>
        ) : null}

        {/* Label inputs as a grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hotspots.map((spot, i) => {
            const userVal = inputs[spot.id] || "";
            const isCorrect =
              userVal.trim().toLowerCase() === spot.label.toLowerCase();

            return (
              <div
                key={spot.id}
                className={`p-4 rounded-xl border-2 transition-colors ${
                  isChecked
                    ? isCorrect
                      ? "border-[var(--success)] bg-[var(--success-light)]"
                      : "border-red-400 bg-red-50 dark:bg-red-950/30"
                    : "border-[var(--border)]"
                }`}
              >
                <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-2">
                  Label {i + 1}
                </label>
                <input
                  type="text"
                  value={userVal}
                  onChange={(e) => handleChange(spot.id, e.target.value)}
                  disabled={isChecked}
                  placeholder="Type the label..."
                  className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-glow)] transition-all text-base"
                />
                {isChecked && !isCorrect && (
                  <div className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">
                    Answer: {spot.label}
                  </div>
                )}
                {isChecked && isCorrect && (
                  <div className="mt-2 flex items-center gap-1.5 text-sm text-[var(--success)] font-medium">
                    <Check size={14} /> Correct!
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-between items-center">
        {!isChecked ? (
          <>
            <button
              onClick={() => setShowAnswers(!showAnswers)}
              className="btn-ghost flex items-center gap-2 text-sm"
            >
              <Eye size={14} />
              {showAnswers ? "Hide Hints" : "Show Hints"}
            </button>
            <button
              onClick={handleCheck}
              disabled={Object.keys(inputs).length < hotspots.length}
              className="btn-accent"
            >
              Check Answers
            </button>
          </>
        ) : (
          <div className="w-full text-center text-muted text-sm">
            {correctCount === hotspots.length
              ? "ًںژ‰ Perfect score!"
              : "Review the correct answers above."}
          </div>
        )}
      </div>

      {/* Hints */}
      {showAnswers && !isChecked && (
        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-2">
            Available Labels
          </div>
          <div className="flex flex-wrap gap-2">
            {hotspots
              .map((h) => h.label)
              .sort()
              .map((label, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded-lg text-sm font-medium"
                >
                  {label}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
