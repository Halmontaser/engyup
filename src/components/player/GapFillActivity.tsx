import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, RotateCcw, GripHorizontal, ArrowDown } from "lucide-react";
import { ActivityMedia } from "./ActivityPlayer";
import ActionBar from "./ActionBar";

interface Props {
  data: any;
  media: ActivityMedia;
  onComplete?: (correct?: boolean) => void;
}

export default function GapFillActivity({ data, media, onComplete }: Props) {
  const sentences = data.sentences || [];
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [isChecked, setIsChecked] = useState(false);
  const [dragOverBlank, setDragOverBlank] = useState<string | null>(null);

  // Build word bank from all blanks across all sentences
  const initialWordBank = useMemo(() => {
    const words: string[] = [];
    sentences.forEach((s: any) => {
      const blanks = s.blanks || s.gaps || s.answers || [];
      blanks.forEach((b: any) => {
        const word = b.answer || b.word;
        if (word) words.push(word);
      });
    });
    return words.sort(() => Math.random() - 0.5);
  }, [sentences]);

  // Track used words to remove from word bank
  const wordBank = useMemo(() => {
    const usedCounts: Record<string, number> = {};
    Object.values(inputs).forEach(val => {
      const trimmed = val.trim();
      if (trimmed) usedCounts[trimmed] = (usedCounts[trimmed] || 0) + 1;
    });
    const result: string[] = [];
    for (const w of initialWordBank) {
      if (usedCounts[w] > 0) { usedCounts[w]--; }
      else { result.push(w); }
    }
    return result;
  }, [initialWordBank, inputs]);

  const handleInputChange = (sIdx: number, bIdx: number, value: string) => {
    if (isChecked) return;
    setInputs(prev => ({ ...prev, [`${sIdx}-${bIdx}`]: value }));
  };

  const isBlankCorrect = (sIdx: number, bIdx: number, blankData: any) => {
    if (!blankData) return false;
    const userAnswer = (inputs[`${sIdx}-${bIdx}`] || "").trim().toLowerCase();
    const correctAnswer = (blankData.answer || blankData.word || "").toLowerCase();
    if (userAnswer === correctAnswer) return true;
    if (blankData.alternatives?.some((alt: string) => alt.toLowerCase() === userAnswer)) return true;
    return false;
  };

  // Compute progress
  const totalBlanks = useMemo(() => {
    let count = 0;
    sentences.forEach((s: any) => {
      count += (s.blanks || s.gaps || s.answers || []).length;
    });
    return count;
  }, [sentences]);

  const filledBlanks = useMemo(() => {
    let count = 0;
    Object.values(inputs).forEach(v => { if (v?.trim()) count++; });
    return count;
  }, [inputs]);

  const handleCheck = useCallback(() => {
    setIsChecked(true);
  }, []);

  const handleReset = () => {
    setInputs({});
    setIsChecked(false);
  };

  if (sentences.length === 0) return <div className="text-muted p-4">No sentences found.</div>;

  return (
    <div className="max-w-3xl mx-auto w-full">
      {/* Header with progress */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wider">
            Gap Fill
          </span>
          <span className="text-xs text-slate-400 font-medium">
            {filledBlanks} / {totalBlanks} filled
          </span>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-500 hover:bg-slate-100 transition-all"
        >
          <RotateCcw size={13} /> Reset
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-slate-100 rounded-full mb-6 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-400 to-blue-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${totalBlanks > 0 ? (filledBlanks / totalBlanks) * 100 : 0}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
        />
      </div>

      {/* Sentences */}
      <div className="space-y-4">
        {sentences.map((sentence: any, sIdx: number) => {
          const textContent = sentence?.text || "";
          const textParts = textContent.split(/_{3,}|\\[blank\\]/i);
          const blanks = sentence.blanks || sentence.gaps || sentence.answers || [];

          return (
            <motion.div
              key={sIdx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sIdx * 0.06 }}
              className="group bg-white rounded-2xl p-5 border border-slate-200 hover:border-slate-300 shadow-sm transition-all"
            >
              {/* Sentence number */}
              <span className="inline-block mb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Sentence {sIdx + 1}
              </span>

              <div className="text-lg leading-relaxed font-medium text-slate-700">
                {textParts.map((part: string, bIdx: number) => {
                  const blankData = blanks[bIdx];
                  const hasBlank = bIdx < textParts.length - 1 && blankData;
                  const key = `${sIdx}-${bIdx}`;
                  const filled = inputs[key]?.trim();
                  const isDragOver = dragOverBlank === key;

                  return (
                    <span key={`p-${sIdx}-${bIdx}`}>
                      <span>{part}</span>
                      {hasBlank && (
                        <span className="inline-flex relative mx-1 align-middle">
                          {/* Blank slot */}
                          <span
                            onDrop={(e) => {
                              e.preventDefault();
                              setDragOverBlank(null);
                              const word = e.dataTransfer.getData("text/plain");
                              if (word && !isChecked) handleInputChange(sIdx, bIdx, word);
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              if (!isChecked) setDragOverBlank(key);
                            }}
                            onDragLeave={() => setDragOverBlank(null)}
                            onClick={() => {
                              if (filled && !isChecked) handleInputChange(sIdx, bIdx, "");
                            }}
                            className={`inline-flex items-center justify-center min-w-[90px] px-3 py-1 rounded-lg text-sm font-bold transition-all duration-200 ${
                              isChecked
                                ? isBlankCorrect(sIdx, bIdx, blankData)
                                  ? "bg-emerald-50 text-emerald-700 border-2 border-emerald-300"
                                  : "bg-red-50 text-red-700 border-2 border-red-300"
                                : filled
                                ? "bg-indigo-50 text-indigo-700 border-2 border-indigo-300 shadow-sm cursor-pointer hover:bg-indigo-100"
                                : isDragOver
                                ? "bg-indigo-100 border-2 border-dashed border-indigo-400 scale-105"
                                : "bg-slate-50 border-2 border-dashed border-slate-300"
                            }`}
                          >
                            {filled ? (
                              <span className="flex items-center gap-1">
                                {filled}
                                {isChecked && (
                                  isBlankCorrect(sIdx, bIdx, blankData)
                                    ? <Check size={12} className="text-emerald-500" />
                                    : <span className="text-[10px] text-red-400 ml-0.5">({blankData?.answer || blankData?.word})</span>
                                )}
                              </span>
                            ) : (
                              <span className="text-slate-300 text-xs">____</span>
                            )}
                          </span>
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Word Bank */}
      <AnimatePresence>
        {wordBank.length > 0 && !isChecked && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="mt-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <GripHorizontal size={14} className="text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Word Bank — drag or click to fill
              </span>
              {wordBank.length > 0 && (
                <span className="text-[10px] text-slate-300">({wordBank.length} remaining)</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {wordBank.map((word, i) => (
                <motion.span
                  key={i}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", word)}
                  onClick={() => {
                    for (let s = 0; s < sentences.length; s++) {
                      const blanks = sentences[s].blanks || sentences[s].gaps || sentences[s].answers || [];
                      for (let b = 0; b < blanks.length; b++) {
                        if (!inputs[`${s}-${b}`]?.trim()) {
                          handleInputChange(s, b, word);
                          return;
                        }
                      }
                    }
                  }}
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-3.5 py-2 bg-white border-2 border-slate-200 rounded-xl cursor-grab active:cursor-grabbing font-bold text-sm text-slate-700 shadow-sm hover:border-indigo-400 hover:text-indigo-600 hover:shadow-md transition-all select-none"
                >
                  {word}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit / Action Bar */}
      {filledBlanks === totalBlanks && !isChecked && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <button
            onClick={handleCheck}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white shadow-lg shadow-indigo-200 transition-all"
          >
            <Check size={16} />
            Check Answers
          </button>
        </motion.div>
      )}

      {isChecked && (() => {
        let total = 0, correct = 0;
        sentences.forEach((s: any, sIdx: number) => {
          const blanks = s.blanks || s.gaps || s.answers || [];
          blanks.forEach((b: any, bIdx: number) => {
            total++;
            if (isBlankCorrect(sIdx, bIdx, b)) correct++;
          });
        });
        return (
          <div className="mt-6">
            <ActionBar
              correct={correct === total}
              message={correct === total ? "🎉 Perfect!" : `${correct} of ${total} correct`}
              onNext={handleReset}
              label="Try Again"
            />
          </div>
        );
      })()}
    </div>
  );
}
