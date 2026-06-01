
import { useState, useMemo, useCallback } from "react";
import { motion } from "motion/react";
import { Check, RotateCcw } from "lucide-react";
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
      if (usedCounts[w] > 0) {
        usedCounts[w]--;
      } else {
        result.push(w);
      }
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

  const allBlanksFilled = useMemo(() => {
    return sentences.every((s: any, sIdx: number) => {
      const blanks = s.blanks || s.gaps || s.answers || [];
      return blanks.every((_: any, bIdx: number) => {
        const val = inputs[`${sIdx}-${bIdx}`];
        return val && val.trim() !== "";
      });
    });
  }, [sentences, inputs]);

  const handleCheck = useCallback(() => {
    let allCorrect = true;
    sentences.forEach((s: any, sIdx: number) => {
      const blanks = s.blanks || s.gaps || s.answers || [];
      blanks.forEach((b: any, bIdx: number) => {
        if (!isBlankCorrect(sIdx, bIdx, b)) allCorrect = false;
      });
    });
    setIsChecked(true);
    if (allCorrect && onComplete) onComplete(true);
  }, [sentences, inputs, onComplete]);

  const handleReset = () => {
    setInputs({});
    setIsChecked(false);
  };

  if (sentences.length === 0) return <div className="text-muted p-4">No sentences found.</div>;

  return (
    <div className="max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm font-semibold text-muted uppercase tracking-widest">
          Fill in the gaps
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
        >
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      {/* All sentences rendered together */}
      <div className="space-y-6">
        {sentences.map((sentence: any, sIdx: number) => {
          const textContent = sentence?.text || "";
          const textParts = textContent.split(/_{3,}|\\[blank\\]/i);
          const blanks = sentence.blanks || sentence.gaps || sentence.answers || [];

          return (
            <motion.div
              key={sIdx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sIdx * 0.05 }}
              className="bg-[var(--card)] rounded-2xl p-5 md:p-6 border border-[var(--border)] shadow-sm"
            >
              <div className="text-lg md:text-xl leading-loose font-medium flex flex-wrap items-center gap-y-4">
                {textParts.map((part: string, bIdx: number) => {
                  const blankData = blanks[bIdx];
                  const hasInput = bIdx < textParts.length - 1 && blankData;

                  return (
                    <span key={`p-${sIdx}-${bIdx}`} className="inline-flex items-center">
                      <span>{part}</span>
                      {hasInput && (
                        <div className="inline-flex relative mx-1.5 align-middle">
                          <div
                            onDrop={(e) => {
                              e.preventDefault();
                              const droppedWord = e.dataTransfer.getData("text/plain");
                              if (droppedWord && !isChecked) handleInputChange(sIdx, bIdx, droppedWord);
                            }}
                            onDragOver={(e) => e.preventDefault()}
                            onClick={() => {
                              if (inputs[`${sIdx}-${bIdx}`] && !isChecked) {
                                handleInputChange(sIdx, bIdx, "");
                              }
                            }}
                            className={`min-w-28 md:min-w-36 min-h-[40px] flex items-center justify-center rounded-lg transition-all text-sm ${
                              !isChecked && "cursor-pointer"
                            } ${
                              isChecked
                                ? isBlankCorrect(sIdx, bIdx, blankData)
                                  ? "bg-[var(--success-light)] border-2 border-[var(--success)] text-[var(--success)] font-bold shadow-sm"
                                  : "bg-red-50 border-2 border-[var(--danger)] text-[var(--danger)] font-bold"
                                : inputs[`${sIdx}-${bIdx}`]
                                ? "bg-white border-2 border-[var(--accent)] shadow-md text-[var(--accent)] font-bold"
                                : "bg-slate-100 border-2 border-dashed border-slate-300 hover:bg-slate-200 text-transparent"
                            }`}
                          >
                            {inputs[`${sIdx}-${bIdx}`] || "drop"}
                          </div>

                          {isChecked && (
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                              {isBlankCorrect(sIdx, bIdx, blankData) ? (
                                <div className="bg-[var(--success)] text-white p-1 rounded-full shadow-sm">
                                  <Check size={12} />
                                </div>
                              ) : (
                                <div className="bg-[var(--danger)] text-white px-2 py-0.5 rounded-md shadow-sm text-[10px] font-bold whitespace-nowrap">
                                  {blankData?.answer || blankData?.word || "?"}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </span>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Word Bank - always visible */}
      {wordBank.length > 0 && !isChecked && (
        <div className="mt-6 p-5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-widest text-center">
            Drag words to fill the gaps
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {wordBank.map((word, i) => (
              <div
                key={i}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", word)}
                onClick={() => {
                  // Find first empty blank and fill it
                  for (let s = 0; s < sentences.length; s++) {
                    const blanks = sentences[s].blanks || sentences[s].gaps || sentences[s].answers || [];
                    for (let b = 0; b < blanks.length; b++) {
                      const key = `${s}-${b}`;
                      if (!inputs[key] || inputs[key].trim() === "") {
                        handleInputChange(s, b, word);
                        return;
                      }
                    }
                  }
                }}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl cursor-grab active:cursor-grabbing font-bold text-sm text-slate-700 dark:text-slate-300 shadow-sm hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors select-none"
              >
                {word}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Auto-check when all blanks filled */}
      {allBlanksFilled && !isChecked && (
        <div className="mt-6">
          <button
            onClick={handleCheck}
            className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white shadow-lg shadow-indigo-200 transition-all"
          >
            Submit Answers
          </button>
        </div>
      )}

      {isChecked && (
        <div className="mt-6">
          <ActionBar
            correct={score === sentences.length}
            message={`${score} of ${sentences.length} correct`}
            onNext={handleReset}
            label="Try Again"
          />
        </div>
      )}
    </div>
  );
}
