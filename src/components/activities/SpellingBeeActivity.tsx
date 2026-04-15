"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Volume2,
  ChevronRight,
  Check,
  X,
  RotateCcw,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { ActivityMedia } from "./ActivityPlayer";

interface SpellingWord {
  word: string;
  hint?: string;
  scrambled: string[];
  audio?: string;
}

export default function SpellingBeeActivity({ data, media, onComplete }: { data: any; media: ActivityMedia; onComplete?: () => void }) {
  const words: SpellingWord[] = data.words || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (words.length === 0)
    return <div className="text-muted p-4">No words to spell.</div>;

  const current = words[currentIndex];
  const scrambledLetters = current.scrambled || current.word.split("").sort(() => Math.random() - 0.5);

  const builtWord = selected.map((i) => scrambledLetters[i]).join("");
  const availableIndices = scrambledLetters
    .map((_, i) => i)
    .filter((i) => !selected.includes(i));

  const handleSelectLetter = (letterIndex: number) => {
    if (isChecked) return;
    setSelected([...selected, letterIndex]);
  };

  const handleRemoveLetter = (position: number) => {
    if (isChecked) return;
    setSelected(selected.filter((_, i) => i !== position));
  };

  const handleCheck = () => {
    setIsChecked(true);
    const correct = builtWord.toLowerCase() === current.word.toLowerCase();
    setIsCorrect(correct);
    if (correct) setScore(score + 1);
  };

  const handleReset = () => {
    setSelected([]);
    setIsChecked(false);
    setIsCorrect(false);
    setShowHint(false);
  };

  const handleNext = () => {
    handleReset();
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (onComplete) {
      onComplete();
    }
  };

  // Media lookup
  const wordAudios = media.audio.filter((a) => a.audioType === "word");
  const currentAudio = wordAudios.find(
    (a) => a.text?.toLowerCase() === current.word.toLowerCase()
  ) || wordAudios[currentIndex];

  const handleSpeak = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (currentAudio?.url) {
      setIsSpeaking(true);
      const audio = new Audio(currentAudio.url);
      audioRef.current = audio;
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => {
        setIsSpeaking(false);
        if ("speechSynthesis" in window) {
          const u = new SpeechSynthesisUtterance(current.word);
          u.rate = 0.75; u.lang = "en-US";
          u.onend = () => setIsSpeaking(false);
          speechSynthesis.cancel(); speechSynthesis.speak(u);
        }
      };
      audio.play().catch(() => setIsSpeaking(false));
    } else if ("speechSynthesis" in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(current.word);
      utterance.rate = 0.75;
      utterance.lang = "en-US";
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    }
  };

  const progress = ((currentIndex + (isChecked && isCorrect ? 1 : 0)) / words.length) * 100;

  return (
    <div className="max-w-2xl mx-auto w-full">
      {/* Progress */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm font-semibold text-muted uppercase tracking-widest">
          Word {currentIndex + 1} of {words.length}
        </div>
        <div className="text-sm font-bold text-muted">
          Score: <span className="text-[var(--success)]">{score}</span> / {words.length}
        </div>
      </div>
      <div className="progress-track mb-8">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-[var(--card)] rounded-3xl border border-[var(--border)] overflow-hidden"
        >
          <div className="p-8 md:p-12">
            {/* Listen Button */}
            <div className="text-center mb-8">
              <button
                onClick={handleSpeak}
                disabled={isSpeaking}
                className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg transition-all ${
                  isSpeaking
                    ? "bg-[var(--accent)] text-white shadow-xl scale-105"
                    : "bg-[var(--accent-light)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white hover:shadow-lg"
                }`}
              >
                <Volume2 size={24} className={isSpeaking ? "animate-pulse" : ""} />
                {isSpeaking ? "Playing..." : "Listen to the word"}
              </button>
            </div>

            {/* Hint */}
            {current.hint && (
              <div className="text-center mb-6">
                {!showHint ? (
                  <button
                    onClick={() => setShowHint(true)}
                    className="text-sm text-muted flex items-center gap-2 mx-auto hover:text-[var(--accent)] transition-colors"
                  >
                    <HelpCircle size={16} /> Show Hint
                  </button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-4 py-2 rounded-xl inline-block"
                  >
                    💡 {current.hint}
                  </motion.div>
                )}
              </div>
            )}

            {/* Built Word Display */}
            <div className="flex items-center justify-center gap-2 mb-8 min-h-[60px] flex-wrap">
              {current.word.split("").map((_, i) => (
                <motion.div
                  key={i}
                  layout
                  className={`w-12 h-14 md:w-14 md:h-16 rounded-xl border-2 flex items-center justify-center text-2xl font-black transition-all ${
                    selected[i] !== undefined
                      ? isChecked
                        ? isCorrect
                          ? "bg-emerald-100 dark:bg-emerald-950/30 border-emerald-400 text-emerald-600"
                          : builtWord[i]?.toLowerCase() === current.word[i]?.toLowerCase()
                          ? "bg-emerald-100 dark:bg-emerald-950/30 border-emerald-400 text-emerald-600"
                          : "bg-red-100 dark:bg-red-950/30 border-red-400 text-red-600"
                        : "bg-[var(--accent-light)] border-[var(--accent)] text-[var(--accent)] cursor-pointer hover:scale-105"
                      : "bg-[var(--background)] border-dashed border-[var(--border)]"
                  }`}
                  onClick={() => selected[i] !== undefined && handleRemoveLetter(i)}
                >
                  {selected[i] !== undefined ? scrambledLetters[selected[i]] : ""}
                </motion.div>
              ))}
            </div>

            {/* Correct Answer Reveal */}
            {isChecked && !isCorrect && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center mb-6"
              >
                <span className="text-sm text-muted">Correct spelling: </span>
                <span className="font-bold text-[var(--success)] text-lg">{current.word}</span>
              </motion.div>
            )}

            {/* Scrambled Letters */}
            {!isChecked && (
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {scrambledLetters.map((letter, i) => {
                  const isUsed = selected.includes(i);
                  return (
                    <motion.button
                      key={i}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleSelectLetter(i)}
                      disabled={isUsed}
                      className={`w-12 h-14 md:w-14 md:h-16 rounded-xl text-2xl font-black transition-all ${
                        isUsed
                          ? "opacity-20 scale-90 cursor-not-allowed bg-[var(--border)]"
                          : "bg-[var(--background)] border-2 border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-light)] hover:text-[var(--accent)] cursor-pointer shadow-sm hover:shadow-md"
                      }`}
                    >
                      {letter}
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Result Message */}
            <AnimatePresence>
              {isChecked && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-6 p-4 rounded-xl text-center font-bold ${
                    isCorrect
                      ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600"
                      : "bg-red-50 dark:bg-red-950/20 text-red-600"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {isCorrect ? (
                      <>
                        <Sparkles size={20} /> Perfect Spelling!
                      </>
                    ) : (
                      <>
                        <X size={20} /> Not quite right
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between px-8 py-5 border-t border-[var(--border)] bg-[var(--background)]/50">
            <button onClick={handleReset} className="btn-ghost flex items-center gap-2 text-sm">
              <RotateCcw size={16} /> Reset
            </button>
            {!isChecked ? (
              <button
                onClick={handleCheck}
                disabled={selected.length !== current.word.length}
                className="btn-accent"
              >
                Check Spelling
              </button>
            ) : (
              <button onClick={handleNext} className="btn-accent flex items-center gap-2">
                {currentIndex === words.length - 1 ? "Finish" : "Next Word"}
                <ChevronRight size={20} />
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
