
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HelpCircle, Eye, ChevronRight, Lightbulb } from "lucide-react";

import { ActivityMedia } from "./ActivityPlayer";

export default function GuessingGameActivity({ data, media, onComplete }: { data: any; media: ActivityMedia; onComplete?: () => void }) {
  const puzzles: {
    clues: string[];
    answer: string;
    hint?: string;
    image?: { src: string; alt: string };
  }[] = data.puzzles || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealedClues, setRevealedClues] = useState(1);
  const [guess, setGuess] = useState("");
  const [isRevealed, setIsRevealed] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);

  if (puzzles.length === 0)
    return <div className="text-muted">No puzzles found.</div>;

  const current = puzzles[currentIndex];

  const handleRevealClue = () => {
    if (revealedClues < current.clues.length) {
      setRevealedClues(revealedClues + 1);
    }
  };

  const handleGuess = () => {
    setIsRevealed(true);
    const correct =
      guess.trim().toLowerCase() === current.answer.toLowerCase();
    setIsCorrect(correct);
    if (correct) setScore(score + 1);
  };

  const handleNext = () => {
    setRevealedClues(1);
    setGuess("");
    setIsRevealed(false);
    setIsCorrect(false);
    if (currentIndex < puzzles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm font-semibold text-muted uppercase tracking-widest">
          Puzzle {currentIndex + 1} of {puzzles.length}
        </div>
        <div className="text-sm font-bold text-muted">
          Score: <span className="text-[var(--success)]">{score}</span> /{" "}
          {puzzles.length}
        </div>
      </div>

      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-8 md:p-10"
      >
        {/* Mystery icon */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg mb-4">
            <HelpCircle size={32} />
          </div>
          <h3 className="text-lg font-bold text-muted">What am I?</h3>
        </div>

        {/* Clues */}
        <div className="space-y-3 mb-8">
          {current.clues.slice(0, revealedClues).map((clue, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-3 p-4 bg-[var(--background)] border border-[var(--border)] rounded-xl"
            >
              <span className="w-7 h-7 rounded-full bg-[var(--accent-light)] text-[var(--accent)] flex items-center justify-center text-xs font-bold shrink-0">
                {i + 1}
              </span>
              <p className="text-base leading-relaxed">{clue}</p>
            </motion.div>
          ))}
        </div>

        {/* Reveal more clues */}
        {!isRevealed && revealedClues < current.clues.length && (
          <button
            onClick={handleRevealClue}
            className="btn-ghost flex items-center gap-2 text-sm mb-6 mx-auto"
          >
            <Eye size={14} />
            Reveal clue {revealedClues + 1} of {current.clues.length}
          </button>
        )}

        {/* Hint */}
        {current.hint && !isRevealed && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
            <Lightbulb size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
              {current.hint}
            </p>
          </div>
        )}

        {/* Guess input */}
        {!isRevealed ? (
          <div className="flex gap-3">
            <input
              type="text"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && guess.trim() && handleGuess()}
              placeholder="Type your guess..."
              className="flex-1 px-5 py-4 bg-[var(--background)] border-2 border-[var(--border)] rounded-xl outline-none focus:border-[var(--accent)] text-lg font-medium transition-colors"
            />
            <button
              onClick={handleGuess}
              disabled={!guess.trim()}
              className="btn-accent px-8"
            >
              Guess
            </button>
          </div>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div
                className={`p-6 rounded-2xl border text-center ${
                  isCorrect
                    ? "bg-[var(--success-light)] border-[var(--success)]"
                    : "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800"
                }`}
              >
                <div className="text-3xl mb-2">{isCorrect ? "ًںژ‰" : "ًں¤”"}</div>
                <h4 className="text-xl font-bold mb-1">
                  {isCorrect ? "Correct!" : "Not quite!"}
                </h4>
                <p className="text-lg">
                  The answer is:{" "}
                  <strong className="text-[var(--accent)]">
                    {current.answer}
                  </strong>
                </p>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleNext}
                  disabled={currentIndex === puzzles.length - 1}
                  className="btn-accent flex items-center gap-2"
                >
                  {currentIndex === puzzles.length - 1
                    ? "Finish"
                    : "Next Puzzle"}
                  <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
}
