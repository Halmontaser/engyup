
import { useState, useMemo, useEffect } from "react";
import { motion } from "motion/react";
import { Check, X, RotateCcw } from "lucide-react";
import { ActivityMedia } from "./ActivityPlayer";

export default function MatchPairsActivity({ data, media, onComplete }: { data: any; media: ActivityMedia; onComplete?: () => void }) {
  const pairs = data.pairs || [];
  
  // Create shuffled columns independently
  const leftItems = useMemo(
    () => pairs.map((p: any, i: number) => ({ text: p.left, pairIndex: i })),
    [pairs]
  );

  const [rightItems, setRightItems] = useState(pairs.map((p: any, i: number) => ({ text: p.right, pairIndex: i })));
  
  useEffect(() => {
    const items = pairs.map((p: any, i: number) => ({ text: p.right, pairIndex: i }));
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setRightItems(shuffled);
  }, [pairs]);

  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [wrongPair, setWrongPair] = useState<{left: number; right: number} | null>(null);

  if (pairs.length === 0) return <div className="text-muted">No pairs found.</div>;

  const handleLeftClick = (index: number) => {
    if (matched.has(leftItems[index].pairIndex)) return;
    setSelectedLeft(index);
    setWrongPair(null);

    if (selectedRight !== null) {
      checkMatch(index, selectedRight);
    }
  };

  const handleRightClick = (index: number) => {
    if (matched.has(rightItems[index].pairIndex)) return;
    setSelectedRight(index);
    setWrongPair(null);

    if (selectedLeft !== null) {
      checkMatch(selectedLeft, index);
    }
  };

  const checkMatch = (leftIdx: number, rightIdx: number) => {
    if (leftItems[leftIdx].pairIndex === rightItems[rightIdx].pairIndex) {
      setMatched((prev) => {
        const newMatched = new Set(prev).add(leftItems[leftIdx].pairIndex);
        // Check if all pairs are matched and call onComplete
        if (newMatched.size === pairs.length && onComplete) {
          onComplete();
        }
        return newMatched;
      });
      setSelectedLeft(null);
      setSelectedRight(null);
    } else {
      setWrongPair({ left: leftIdx, right: rightIdx });
      setTimeout(() => {
        setSelectedLeft(null);
        setSelectedRight(null);
        setWrongPair(null);
      }, 800);
    }
  };

  const handleReset = () => {
    setMatched(new Set());
    setSelectedLeft(null);
    setSelectedRight(null);
    setWrongPair(null);
  };

  const allMatched = matched.size === pairs.length;

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm font-semibold text-muted">
          Matched: <span className="text-[var(--success)]">{matched.size}</span> / {pairs.length}
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
        >
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      {allMatched ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-10 bg-[var(--success-light)] rounded-2xl text-center"
        >
          <Check size={40} className="mx-auto mb-4 text-[var(--success)]" />
          <h3 className="text-2xl font-bold">All Pairs Matched!</h3>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-3">
            {leftItems.map((item: any, i: number) => {
              if (!item) return null;
              const isMatched = matched.has(item.pairIndex);
              const isSelected = selectedLeft === i;
              const isWrong = wrongPair?.left === i;

              return (
                <motion.button
                  key={`l-${i}`}
                  onClick={() => handleLeftClick(i)}
                  disabled={isMatched}
                  className={`w-full text-left p-5 rounded-2xl border-2 font-medium transition-all ${
                    isMatched
                      ? "bg-[var(--success-light)] border-[var(--success)] text-[var(--success)] opacity-70"
                      : isWrong
                      ? "bg-red-50 border-red-400 text-red-700 dark:bg-red-950 dark:border-red-500 dark:text-red-300"
                      : isSelected
                      ? "bg-[var(--accent-light)] border-[var(--accent)] text-[var(--accent)] shadow-md"
                      : "bg-[var(--card)] border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-light)]"
                  }`}
                  layout
                >
                  {item.text}
                  {isMatched && <Check size={16} className="inline ml-2" />}
                  {isWrong && <X size={16} className="inline ml-2" />}
                </motion.button>
              );
            })}
          </div>

          {/* Right column */}
          <div className="space-y-3">
            {rightItems.map((item: any, i: number) => {
              if (!item) return null;
              const isMatched = matched.has(item.pairIndex);
              const isSelected = selectedRight === i;
              const isWrong = wrongPair?.right === i;

              return (
                <motion.button
                  key={`r-${i}`}
                  onClick={() => handleRightClick(i)}
                  disabled={isMatched}
                  className={`w-full text-left p-5 rounded-2xl border-2 font-medium transition-all ${
                    isMatched
                      ? "bg-[var(--success-light)] border-[var(--success)] text-[var(--success)] opacity-70"
                      : isWrong
                      ? "bg-red-50 border-red-400 text-red-700 dark:bg-red-950 dark:border-red-500 dark:text-red-300"
                      : isSelected
                      ? "bg-[var(--accent-light)] border-[var(--accent)] text-[var(--accent)] shadow-md"
                      : "bg-[var(--card)] border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-light)]"
                  }`}
                  layout
                >
                  {item.text}
                  {isMatched && <Check size={16} className="inline ml-2" />}
                  {isWrong && <X size={16} className="inline ml-2" />}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
