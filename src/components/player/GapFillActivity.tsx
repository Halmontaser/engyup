import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, RotateCcw, GripHorizontal, Type } from "lucide-react";
import { ActivityMedia } from "./ActivityPlayer";
import ActionBar from "./ActionBar";

interface Props {
  data: any;
  media: ActivityMedia;
  onComplete?: (correct?: boolean) => void;
}

const CARD_COLORS = [
  "from-indigo-50 to-blue-50 border-indigo-100",
  "from-violet-50 to-purple-50 border-violet-100",
  "from-sky-50 to-cyan-50 border-sky-100",
  "from-rose-50 to-pink-50 border-rose-100",
  "from-amber-50 to-orange-50 border-amber-100",
  "from-emerald-50 to-teal-50 border-emerald-100",
];

const ACCENT_COLORS = [
  "border-indigo-300 bg-indigo-50 text-indigo-700",
  "border-violet-300 bg-violet-50 text-violet-700",
  "border-sky-300 bg-sky-50 text-sky-700",
  "border-rose-300 bg-rose-50 text-rose-700",
  "border-amber-300 bg-amber-50 text-amber-700",
  "border-emerald-300 bg-emerald-50 text-emerald-700",
];

export default function GapFillActivity({ data, media, onComplete }: Props) {
  const sentences = data.sentences || [];
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [isChecked, setIsChecked] = useState(false);
  const [dragOverBlank, setDragOverBlank] = useState<string | null>(null);

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

  const totalBlanks = useMemo(() => {
    let count = 0;
    sentences.forEach((s: any) => { count += (s.blanks || s.gaps || s.answers || []).length; });
    return count;
  }, [sentences]);

  const filledBlanks = useMemo(() => {
    let count = 0;
    Object.values(inputs).forEach(v => { if (v?.trim()) count++; });
    return count;
  }, [inputs]);

  const handleCheck = useCallback(() => setIsChecked(true), []);
  const handleReset = () => { setInputs({}); setIsChecked(false); };

  if (sentences.length === 0) return <div className="text-muted p-4">No sentences found.</div>;

  const allFilled = filledBlanks === totalBlanks;
  const progressPct = totalBlanks > 0 ? (filledBlanks / totalBlanks) * 100 : 0;

  return (
    <div className="max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
              <Type size={16} className="text-white" />
            </div>
            <h3 className="font-black text-lg text-slate-800">Gap Fill</h3>
          </div>
          <p className="text-xs text-slate-400 ml-10">
            Drag words from the bank into the blanks
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-500">
            {filledBlanks}<span className="text-slate-300">/</span>{totalBlanks}
          </span>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-500 hover:bg-slate-100 transition-all"
          >
            <RotateCcw size={13} /> Reset
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-slate-100 rounded-full mb-6 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-400 via-blue-500 to-purple-500 rounded-full"
          animate={{ width: `${progressPct}%` }}
          transition={{ type: "spring", stiffness: 150, damping: 20 }}
        />
      </div>

      {/* Sentences — each as a separated card */}
      <div className="space-y-4">
        {sentences.map((sentence: any, sIdx: number) => {
          const textContent = sentence?.text || "";
          const textParts = textContent.split(/_{3,}|\\[blank\\]/i);
          const blanks = sentence.blanks || sentence.gaps || sentence.answers || [];
          const colorIdx = sIdx % CARD_COLORS.length;
          const blankColor = ACCENT_COLORS[sIdx % ACCENT_COLORS.length];

          // Check if this sentence is fully correct
          const sentenceCorrect = isChecked && blanks.every((b: any, bIdx: number) =>
            isBlankCorrect(sIdx, bIdx, b)
          );

          return (
            <motion.div
              key={sIdx}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: sIdx * 0.08 }}
              className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${CARD_COLORS[colorIdx]} ${isChecked && sentenceCorrect ? "ring-2 ring-emerald-300" : isChecked && !sentenceCorrect ? "ring-2 ring-red-200" : ""} transition-all`}
            >
              {/* Card header */}
              <div className="flex items-center gap-3 px-5 pt-4 pb-2">
                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black ${
                  isChecked
                    ? sentenceCorrect ? "bg-emerald-500 text-white" : "bg-red-400 text-white"
                    : "bg-white/80 text-slate-600 shadow-sm"
                }`}>
                  {isChecked && sentenceCorrect ? <Check size={12} /> : sIdx + 1}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {sentenceCorrect ? "Correct" : isChecked ? "Needs review" : `Sentence ${sIdx + 1}`}
                </span>
              </div>

              {/* Sentence text */}
              <div className="px-5 pb-4 text-lg leading-relaxed font-medium text-slate-700">
                {textParts.map((part: string, bIdx: number) => {
                  const blankData = blanks[bIdx];
                  const hasBlank = bIdx < textParts.length - 1 && blankData;
                  const key = `${sIdx}-${bIdx}`;
                  const filled = inputs[key]?.trim();
                  const isDragOver = dragOverBlank === key;

                  return (
                    <span key={`p-${sIdx}-${bIdx}`}>
                      <span className="leading-loose">{part}</span>
                      {hasBlank && (
                        <span className="inline-flex relative mx-1 align-middle">
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
                            className={`inline-flex items-center justify-center min-w-[80px] px-3 py-0.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                              isChecked
                                ? isBlankCorrect(sIdx, bIdx, blankData)
                                  ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-300"
                                  : "bg-red-100 text-red-700 border-2 border-red-300"
                                : filled
                                ? `${blankColor} border-2 shadow-sm cursor-pointer hover:opacity-80`
                                : isDragOver
                                ? "bg-white border-2 border-dashed border-indigo-400 scale-110 shadow-md"
                                : "bg-white/60 border-2 border-dashed border-slate-300"
                            }`}
                          >
                            {filled ? (
                              <span className="flex items-center gap-1">
                                {filled}
                                {isChecked && !isBlankCorrect(sIdx, bIdx, blankData) && (
                                  <span className="text-[10px] opacity-60 ml-0.5">
                                    → {blankData?.answer || blankData?.word}
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="text-slate-300 text-xs select-none">____</span>
                            )}
                          </span>
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>

              {/* Sentence status footer when checked */}
              {isChecked && (
                <div className={`px-5 py-2 text-xs font-semibold ${
                  sentenceCorrect
                    ? "bg-emerald-100/50 text-emerald-700"
                    : "bg-red-100/50 text-red-700"
                }`}>
                  {sentenceCorrect ? "✓ All blanks correct" : "✗ Some blanks need review"}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Word Bank */}
      <AnimatePresence>
        {wordBank.length > 0 && !isChecked && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="mt-5 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-3">
              <GripHorizontal size={14} className="text-indigo-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Word Bank
              </span>
              <span className="text-[10px] text-slate-300 ml-auto">{wordBank.length} words</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {wordBank.map((word, i) => (
                <motion.span
                  key={i}
                  layout
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
                  whileHover={{ scale: 1.06, y: -2 }}
                  whileTap={{ scale: 0.94 }}
                  className="px-3.5 py-2 bg-gradient-to-br from-white to-slate-50 border-2 border-slate-200 rounded-xl cursor-grab active:cursor-grabbing font-bold text-sm text-slate-700 shadow-sm hover:border-indigo-400 hover:text-indigo-600 hover:shadow-md transition-all select-none"
                >
                  {word}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Check Button */}
      {allFilled && !isChecked && (
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

      {/* Results */}
      {isChecked && (() => {
        let total = 0, correct = 0;
        sentences.forEach((s: any, sIdx: number) => {
          const blanks = s.blanks || s.gaps || s.answers || [];
          blanks.forEach((b: any, bIdx: number) => { total++; if (isBlankCorrect(sIdx, bIdx, b)) correct++; });
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
