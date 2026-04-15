"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, RotateCcw } from "lucide-react";

import { ActivityMedia } from "./ActivityPlayer";

export default function CategorySortActivity({ data, media, onComplete }: { data: any; media: ActivityMedia; onComplete?: () => void }) {
  const categories: { name: string; items: string[] }[] = data.categories || [];

  // Build a flat pool of items
  const allItems = categories.flatMap((cat) =>
    (cat.items || []).map((item: string) => ({ text: item, category: cat.name }))
  );

  // Shuffle items
  const [pool, setPool] = useState(() => {
    const shuffled = [...allItems];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  });

  const [buckets, setBuckets] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(categories.map((c) => [c.name, []]))
  );
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [isChecked, setIsChecked] = useState(false);

  if (categories.length === 0)
    return <div className="text-muted">No categories found.</div>;

  const handleDrop = (item: string, targetCategory: string) => {
    if (isChecked) return;
    setPool((prev) => prev.filter((p) => p.text !== item));
    setBuckets((prev) => ({
      ...prev,
      [targetCategory]: [...prev[targetCategory], item],
    }));
  };

  const handleRemove = (item: string, category: string) => {
    if (isChecked) return;
    setBuckets((prev) => ({
      ...prev,
      [category]: prev[category].filter((i) => i !== item),
    }));
    const original = allItems.find((a) => a.text === item);
    if (original) {
      setPool((prev) => [...prev, original]);
    }
  };

  const handleCheck = () => {
    setIsChecked(true);
    const res: Record<string, boolean> = {};
    for (const cat of categories) {
      for (const item of buckets[cat.name]) {
        const correct = (cat.items || []).includes(item);
        res[item] = correct;
      }
    }
    setResults(res);
    // Call onComplete when user checks answers
    if (onComplete) {
      onComplete();
    }
  };

  const handleReset = () => {
    const shuffled = [...allItems];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setPool(shuffled);
    setBuckets(Object.fromEntries(categories.map((c) => [c.name, []])));
    setResults({});
    setIsChecked(false);
  };

  const allSorted = pool.length === 0;
  const correctCount = Object.values(results).filter(Boolean).length;

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm font-semibold text-muted">
          {isChecked
            ? `${correctCount} / ${allItems.length} correct`
            : `${pool.length} items remaining`}
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
        >
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      {/* Item pool */}
      {pool.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-8 p-6 bg-[var(--card)] border border-[var(--border)] rounded-2xl">
          {pool.map((item, i) => (
            <motion.span
              key={`pool-${item.text}`}
              layout
              className="px-4 py-2.5 bg-[var(--accent-light)] text-[var(--accent)] rounded-xl font-medium text-sm cursor-pointer hover:shadow-md transition-shadow"
            >
              {item.text}
            </motion.span>
          ))}
        </div>
      )}

      {/* Category buckets */}
      <div className={`grid gap-6 ${categories.length <= 2 ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-3"}`}>
        {categories.map((cat, i) => (
          <div
            key={cat.name || `cat-${i}`}
            className="bg-[var(--card)] border-2 border-dashed border-[var(--border)] rounded-2xl p-5 min-h-[140px]"
          >
            <h4 className="text-sm font-bold uppercase tracking-widest text-muted mb-4">
              {cat.name}
            </h4>

            <div className="flex flex-wrap gap-2">
              {buckets[cat.name].map((item) => (
                <motion.button
                  key={`b-${item}`}
                  layout
                  onClick={() => handleRemove(item, cat.name)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-colors ${
                    isChecked
                      ? results[item]
                        ? "bg-[var(--success-light)] text-[var(--success)]"
                        : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                      : "bg-[var(--accent-light)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white"
                  }`}
                >
                  {item}
                  {isChecked && (results[item] ? <Check size={14} /> : <X size={14} />)}
                </motion.button>
              ))}
            </div>

            {/* Drop target hint */}
            {!isChecked && pool.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5 opacity-0 hover:opacity-100 transition-opacity duration-300">
                {pool.map((item, j) => (
                  <button
                    key={`target-${cat.name || i}-${item.text}-${j}`}
                    onClick={() => handleDrop(item.text, cat.name)}
                    className="px-2 py-1 text-xs text-muted-foreground hover:text-[var(--accent)] hover:bg-[var(--accent-light)] rounded-lg border border-transparent hover:border-[var(--accent)] transition-all"
                  >
                    + {item.text}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Check button */}
      {allSorted && !isChecked && (
        <div className="mt-8 flex justify-end">
          <button onClick={handleCheck} className="btn-accent">
            Check Answers
          </button>
        </div>
      )}
    </div>
  );
}
