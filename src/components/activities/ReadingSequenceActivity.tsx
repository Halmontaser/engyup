"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Check, ArrowUpDown, RotateCcw } from "lucide-react";

import { ActivityMedia } from "./ActivityPlayer";

export default function ReadingSequenceActivity({ data, media, onComplete }: { data: any; media: ActivityMedia; onComplete?: () => void }) {
  const correctOrder: string[] = data.items || data.steps || data.events || [];

  // Create a shuffled version for the user to reorder
  const shuffledItems = useMemo(() => {
    const items = correctOrder.map((text, i) => ({
      text,
      correctIndex: i,
      id: `item-${i}`,
    }));
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [correctOrder]);

  const [userOrder, setUserOrder] = useState(shuffledItems);
  const [isChecked, setIsChecked] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  if (correctOrder.length === 0)
    return <div className="text-muted">No sequence items found.</div>;

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (isChecked) return;
    const updated = [...userOrder];
    const [removed] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, removed);
    setUserOrder(updated);
  };

  const handleCheck = () => {
    setIsChecked(true);
    // Call onComplete when user checks their order
    if (onComplete) {
      onComplete();
    }
  };

  const handleReset = () => {
    setUserOrder(shuffledItems);
    setIsChecked(false);
  };

  const correctCount = userOrder.filter(
    (item, i) => item.correctIndex === i
  ).length;
  const allCorrect = correctCount === correctOrder.length;

  return (
    <div className="max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ArrowUpDown size={18} className="text-[var(--accent)]" />
          <span className="text-sm font-bold text-muted uppercase tracking-widest">
            Put in Order
          </span>
        </div>
        {isChecked && (
          <span className="text-sm font-bold">
            <span className="text-[var(--success)]">{correctCount}</span> /{" "}
            {correctOrder.length} correct
          </span>
        )}
      </div>

      {isChecked && allCorrect ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-10 bg-[var(--success-light)] rounded-2xl text-center"
        >
          <Check size={40} className="mx-auto mb-4 text-[var(--success)]" />
          <h3 className="text-2xl font-bold">Perfect Order!</h3>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {userOrder.map((item, i) => {
            const isCorrectPosition = isChecked && item.correctIndex === i;
            const isWrongPosition = isChecked && item.correctIndex !== i;

            return (
              <motion.div
                key={item.id}
                layout
                className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${
                  isCorrectPosition
                    ? "border-[var(--success)] bg-[var(--success-light)]"
                    : isWrongPosition
                    ? "border-red-400 bg-red-50 dark:bg-red-950/30 dark:border-red-600"
                    : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]"
                }`}
              >
                {/* Position number */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    isCorrectPosition
                      ? "bg-[var(--success)] text-white"
                      : isWrongPosition
                      ? "bg-red-500 text-white"
                      : "bg-[var(--accent-light)] text-[var(--accent)]"
                  }`}
                >
                  {i + 1}
                </div>

                {/* Text */}
                <p className="flex-1 font-medium">{item.text}</p>

                {/* Move buttons */}
                {!isChecked && (
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => i > 0 && moveItem(i, i - 1)}
                      disabled={i === 0}
                      className="w-7 h-7 rounded-lg bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-muted hover:text-[var(--accent)] hover:border-[var(--accent)] disabled:opacity-20 transition-all text-xs"
                    >
                      â–²
                    </button>
                    <button
                      onClick={() =>
                        i < userOrder.length - 1 && moveItem(i, i + 1)
                      }
                      disabled={i === userOrder.length - 1}
                      className="w-7 h-7 rounded-lg bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-muted hover:text-[var(--accent)] hover:border-[var(--accent)] disabled:opacity-20 transition-all text-xs"
                    >
                      â–¼
                    </button>
                  </div>
                )}

                {/* Result */}
                {isChecked && (
                  <div className="shrink-0">
                    {isCorrectPosition ? (
                      <Check size={18} className="text-[var(--success)]" />
                    ) : (
                      <span className="text-xs text-red-500 font-bold">
                        â†’ {item.correctIndex + 1}
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Controls */}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={handleReset}
          className="btn-ghost flex items-center gap-2 text-sm"
        >
          <RotateCcw size={14} /> Reset
        </button>
        {!isChecked && (
          <button onClick={handleCheck} className="btn-accent">
            Check Order
          </button>
        )}
      </div>
    </div>
  );
}
