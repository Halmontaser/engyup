
import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, HelpCircle, ChevronRight, ChevronLeft, RotateCcw } from "lucide-react";
import { ActivityMedia } from "./ActivityPlayer";
import { getMediaUrl } from "@/utils/assets";

interface Props {
  data: any;
  media: ActivityMedia;
  onComplete?: (correct?: boolean) => void;
  triggerCheck?: number;
}

export default function GapFillActivity({ data, media, onComplete, triggerCheck }: Props) {
  const sentences = data.sentences || [];
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [isChecked, setIsChecked] = useState(false);
  const [isEasyMode, setIsEasyMode] = useState(false);
  const [completedSentences, setCompletedSentences] = useState<Set<number>>(new Set());

  // Flatten all blanks for global tracking
  const allBlanks = useMemo(() => {
    const arr: { sentenceIndex: number; blankIndex: number; data: any }[] = [];
    sentences.forEach((s: any, sIdx: number) => {
      const blanksList = s.blanks || s.gaps || s.answers || [];
      blanksList.forEach((b: any, bIdx: number) => {
        arr.push({ sentenceIndex: sIdx, blankIndex: bIdx, data: b });
      });
    });
    return arr;
  }, [sentences]);

  // Blanks for the current sentence
  const currentBlanks = useMemo(() => {
    const s = sentences[currentSentenceIndex];
    if (!s) return [];
    return s.blanks || s.gaps || s.answers || [];
  }, [sentences, currentSentenceIndex]);

  const [initialWordBank, setInitialWordBank] = useState<string[]>([]);
  useEffect(() => {
    // Generate word bank only for current sentence or all? 
    // Usually H5P style is per activity, but "many questions" might benefit from per-sentence bank if it's large.
    // Let's do it per sentence to keep it clean, or all if it's small.
    const words = currentBlanks.map((b: any) => b.answer || b.word).filter(Boolean);
    setInitialWordBank(words.sort(() => Math.random() - 0.5));
  }, [currentBlanks]);

  const wordBank = useMemo(() => {
    if (!isEasyMode) return [];
    const usedCounts: Record<string, number> = {};
    Object.keys(inputs).forEach(key => {
      if (key.startsWith(`${currentSentenceIndex}-`)) {
        const val = inputs[key].trim();
        if (val) {
          usedCounts[val] = (usedCounts[val] || 0) + 1;
        }
      }
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
  }, [initialWordBank, inputs, isEasyMode, currentSentenceIndex]);

  const handleInputChange = (sIdx: number, bIdx: number, value: string) => {
    if (isChecked) return;
    setInputs({ ...inputs, [`${sIdx}-${bIdx}`]: value });
  };

  const isBlankCorrect = (sIdx: number, bIdx: number, blankData: any) => {
    if (!blankData) return false;
    const userAnswer = (inputs[`${sIdx}-${bIdx}`] || "").trim().toLowerCase();
    const correctAnswer = (blankData.answer || blankData.word || "").toLowerCase();
    if (userAnswer === correctAnswer) return true;
    if (blankData.alternatives?.some((alt: string) => alt.toLowerCase() === userAnswer)) return true;
    return false;
  };

  const isSentenceComplete = useCallback((sIdx: number) => {
    const blanks = sentences[sIdx]?.blanks || sentences[sIdx]?.gaps || sentences[sIdx]?.answers || [];
    return blanks.every((_: any, bIdx: number) => {
        const val = inputs[`${sIdx}-${bIdx}`];
        return val && val.trim() !== "";
    });
  }, [sentences, inputs]);

  const handleCheck = useCallback(() => {
    const allCurrentCorrect = currentBlanks.every((b: any, bIdx: number) => 
      isBlankCorrect(currentSentenceIndex, bIdx, b)
    );

    if (allCurrentCorrect) {
      setCompletedSentences(prev => new Set([...prev, currentSentenceIndex]));
      if (currentSentenceIndex < sentences.length - 1) {
        // Move to next sentence after a short delay or let user click?
        // User said "many questions", so let's show success state first.
        setIsChecked(true);
      } else {
        setIsChecked(true);
        if (onComplete) onComplete(true);
      }
    } else {
      setIsChecked(true);
    }
  }, [currentBlanks, currentSentenceIndex, sentences.length, inputs, onComplete]);

  // Handle external triggerCheck
  useEffect(() => {
    if (triggerCheck && triggerCheck > 0 && !isChecked) {
      handleCheck();
    } else if (triggerCheck && triggerCheck > 0 && isChecked) {
        // If already checked and we were correct, move next
        handleNext();
    }
  }, [triggerCheck]);

  const handleNext = () => {
    if (currentSentenceIndex < sentences.length - 1) {
      setCurrentSentenceIndex(currentSentenceIndex + 1);
      setIsChecked(false);
    } else {
        if (onComplete) onComplete(true);
    }
  };

  const handlePrev = () => {
    if (currentSentenceIndex > 0) {
      setCurrentSentenceIndex(currentSentenceIndex - 1);
      setIsChecked(false);
    }
  };

  const handleReset = () => {
    setInputs({});
    setIsChecked(false);
    setCompletedSentences(new Set());
    setCurrentSentenceIndex(0);
  };

  if (sentences.length === 0) return <div className="text-muted p-4">No sentences found.</div>;

  const currentSentence = sentences[currentSentenceIndex];
  
  // Robust safety check for missing text
  const textContent = currentSentence?.text || "";
  const textParts = textContent.split(/_{3,}|\\[blank\\]/i);

  return (
    <div className="max-w-4xl mx-auto w-full">
      {!currentSentence?.text && (
        <div className="p-4 mb-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
          Warning: Missing text field for this question. Data might be corrupted.
        </div>
      )}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="text-sm font-semibold text-muted uppercase tracking-widest">
            Question {currentSentenceIndex + 1} of {sentences.length}
          </div>
          <button
            onClick={() => setIsEasyMode(!isEasyMode)}
            className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${
              isEasyMode ? "bg-[var(--accent)] text-white" : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            }`}
          >
            {isEasyMode ? "Easy Mode: ON" : "Easy Mode: OFF"}
          </button>
        </div>
        <div className="text-sm font-bold text-muted">
            Progress: {completedSentences.size} / {sentences.length}
        </div>
      </div>

      <div className="progress-track mb-8">
        <div 
          className="progress-fill" 
          style={{ width: `${((currentSentenceIndex + 1) / sentences.length) * 100}%` }} 
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
           key={currentSentenceIndex}
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           exit={{ opacity: 0, x: -20 }}
           className="bg-[var(--card)] rounded-3xl p-8 md:p-12 border border-[var(--border)] shadow-sm"
        >
          <div className="text-xl md:text-2xl leading-loose font-medium flex flex-wrap items-center gap-y-6">
            {textParts.map((part: string, bIdx: number) => {
              const blankData = currentBlanks[bIdx];
              const hasInput = bIdx < textParts.length - 1 && blankData;

              return (
                <span key={`p-${currentSentenceIndex}-${bIdx}`} className="flex items-center inline-flex">
                  <span>{part}</span>
                  {hasInput && (
                    <div className="inline-flex relative mx-2 align-middle">
                      {isEasyMode ? (
                        <div
                          onDrop={(e) => {
                            e.preventDefault();
                            const droppedWord = e.dataTransfer.getData("text/plain");
                            if (droppedWord && !isChecked) handleInputChange(currentSentenceIndex, bIdx, droppedWord);
                          }}
                          onDragOver={(e) => e.preventDefault()}
                          onClick={() => {
                            if (inputs[`${currentSentenceIndex}-${bIdx}`] && !isChecked) {
                              handleInputChange(currentSentenceIndex, bIdx, "");
                            }
                          }}
                          className={`min-w-32 md:min-w-40 min-h-[44px] flex items-center justify-center rounded-lg transition-all ${
                            !isChecked && "cursor-pointer"
                          } ${
                            isChecked
                              ? isBlankCorrect(currentSentenceIndex, bIdx, blankData)
                                ? "bg-[var(--success-light)] border-2 border-[var(--success)] text-[var(--success)] font-bold shadow-sm"
                                : "bg-red-50 border-2 border-[var(--danger)] text-[var(--danger)] font-bold"
                              : inputs[`${currentSentenceIndex}-${bIdx}`]
                              ? "bg-white border-2 border-[var(--accent)] shadow-md text-[var(--accent)] font-bold"
                              : "bg-slate-100 border-2 border-dashed border-slate-300 hover:bg-slate-200 text-transparent"
                          }`}
                        >
                          {inputs[`${currentSentenceIndex}-${bIdx}`] || "drop"}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={inputs[`${currentSentenceIndex}-${bIdx}`] || ""}
                          onChange={(e) => handleInputChange(currentSentenceIndex, bIdx, e.target.value)}
                          disabled={isChecked}
                          className={`border-b-4 outline-none px-4 py-2 text-center w-32 md:w-44 bg-[var(--background)] rounded-t-lg transition-colors ${
                            isChecked
                              ? isBlankCorrect(currentSentenceIndex, bIdx, blankData)
                                ? "border-[var(--success)] text-[var(--success)] bg-[var(--success-light)]"
                                : "border-[var(--danger)] text-[var(--danger)] bg-red-50 dark:bg-red-950/30"
                              : "border-[var(--border)] focus:border-[var(--accent)] focus:bg-[var(--accent-light)] text-[var(--accent)]"
                          }`}
                          placeholder="type here"
                        />
                      )}

                      {isChecked && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                          {isBlankCorrect(currentSentenceIndex, bIdx, blankData) ? (
                            <div className="bg-[var(--success)] text-white p-1 rounded-full shadow-sm">
                              <Check size={14} />
                            </div>
                          ) : (
                            <div className="bg-[var(--danger)] text-white px-3 py-1 rounded-lg shadow-sm text-xs font-bold whitespace-nowrap">
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

          {/* Word Bank (Easy Mode) */}
          {isEasyMode && wordBank.length > 0 && !isChecked && (
            <div className="mt-12 p-6 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-widest text-center">Word Bank</p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {wordBank.map((word, i) => (
                  <div
                    key={i}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", word)}
                    onClick={() => {
                      for (let b = 0; b < currentBlanks.length; b++) {
                        const key = `${currentSentenceIndex}-${b}`;
                        if (!inputs[key] || inputs[key].trim() === "") {
                          handleInputChange(currentSentenceIndex, b, word);
                          break;
                        }
                      }
                    }}
                    className="px-4 py-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer font-bold text-slate-700 dark:text-slate-300 shadow-sm hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                  >
                    {word}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-12 flex items-center justify-between">
            <button
               onClick={handlePrev}
               disabled={currentSentenceIndex === 0}
               className="btn-ghost flex items-center gap-2 disabled:opacity-30"
            >
              <ChevronLeft size={20} /> Previous
            </button>

            <div className="flex gap-3">
              {isChecked ? (
                <button
                  onClick={handleNext}
                  className="btn-accent flex items-center gap-2"
                >
                  {currentSentenceIndex === sentences.length - 1 ? "Finish" : "Next Question"}
                  <ChevronRight size={20} />
                </button>
              ) : (
                <button
                  onClick={handleCheck}
                  disabled={!isSentenceComplete(currentSentenceIndex)}
                  className="btn-accent"
                >
                  Check Answer
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
