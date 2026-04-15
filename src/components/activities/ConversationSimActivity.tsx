"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  User,
  ChevronRight,
  Check,
  X,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { ActivityMedia } from "./ActivityPlayer";

interface StudentOption {
  text: string;
  isCorrect: boolean;
  nextTurn?: number;
  feedback?: string;
}

interface Turn {
  speaker: string;
  text: string;
  studentOptions?: StudentOption[];
}

export default function ConversationSimActivity({ data, media, onComplete }: { data: any; media: ActivityMedia; onComplete?: () => void }) {
  const scenario: string = data.scenario || "";
  const turns: Turn[] = data.turns || [];

  const [currentTurn, setCurrentTurn] = useState(0);
  const [chatHistory, setChatHistory] = useState<
    { speaker: string; text: string; isUser?: boolean; isCorrect?: boolean }[]
  >([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(0);
  const [totalChoices, setTotalChoices] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  if (turns.length === 0)
    return <div className="text-muted p-4">No conversation data.</div>;

  const turn = turns[currentTurn];
  const hasOptions = turn?.studentOptions && turn.studentOptions.length > 0;

  const handleSelect = (optIndex: number) => {
    if (isChecked) return;
    setSelectedOption(optIndex);
  };

  const handleSubmit = () => {
    if (selectedOption === null || !turn?.studentOptions) return;
    setIsChecked(true);
    setTotalChoices(totalChoices + 1);

    const option = turn.studentOptions[selectedOption];
    const correct = option.isCorrect;

    if (correct) setScore(score + 1);
    if (option.feedback) setFeedback(option.feedback);

    // Add the NPC line first (the prompt text from the turn)
    setChatHistory((prev) => [
      ...prev,
      { speaker: turn.speaker, text: turn.text },
      { speaker: "You", text: option.text, isUser: true, isCorrect: correct },
    ]);
  };

  const handleContinue = () => {
    if (!turn?.studentOptions) return;
    const option = turn.studentOptions[selectedOption!];

    setSelectedOption(null);
    setIsChecked(false);
    setFeedback("");

    if (option.nextTurn !== undefined && option.nextTurn < turns.length) {
      setCurrentTurn(option.nextTurn);
    } else if (currentTurn + 1 < turns.length) {
      setCurrentTurn(currentTurn + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handleRestart = () => {
    setCurrentTurn(0);
    setChatHistory([]);
    setSelectedOption(null);
    setIsChecked(false);
    setFeedback("");
    setScore(0);
    setTotalChoices(0);
    setIsComplete(false);
  };

  // ── COMPLETION SCREEN ──
  if (isComplete) {
    const pct = totalChoices > 0 ? Math.round((score / totalChoices) * 100) : 0;
    return (
      <div className="max-w-2xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[var(--card)] rounded-3xl border border-[var(--border)] overflow-hidden"
        >
          <div className="p-10 md:p-14 text-center">
            <div
              className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
                pct >= 70
                  ? "bg-gradient-to-br from-emerald-400 to-emerald-600"
                  : "bg-gradient-to-br from-amber-400 to-orange-500"
              }`}
            >
              <Sparkles size={36} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Conversation Complete!</h3>
            <p className="text-muted mb-6">
              You made{" "}
              <span className="font-bold text-[var(--success)]">{score}</span>{" "}
              correct choices out of{" "}
              <span className="font-bold">{totalChoices}</span>.
            </p>

            {/* Chat Replay */}
            <div className="mt-6 space-y-3 text-left max-h-60 overflow-y-auto px-2">
              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                      msg.isUser
                        ? msg.isCorrect
                          ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 rounded-br-md"
                          : "bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-300 rounded-br-md"
                        : "bg-[var(--background)] border border-[var(--border)] rounded-bl-md"
                    }`}
                  >
                    <div className="text-xs font-bold mb-1 opacity-60">
                      {msg.speaker}
                    </div>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-4 mt-8">
              <button
                onClick={handleRestart}
                className="btn-ghost flex items-center gap-2"
              >
                <RotateCcw size={18} /> Try Again
              </button>
              {onComplete && (
                <button
                  onClick={onComplete}
                  className="btn-accent flex items-center gap-2"
                >
                  Finish Activity <ChevronRight size={18} />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── CONVERSATION UI ──
  return (
    <div className="max-w-2xl mx-auto w-full">
      {/* Scenario */}
      {scenario && (
        <div className="mb-6 p-4 bg-[var(--accent-light)] border border-[var(--accent)]/20 rounded-2xl">
          <div className="flex items-start gap-3">
            <MessageCircle
              size={18}
              className="text-[var(--accent)] mt-0.5 shrink-0"
            />
            <p className="text-sm font-medium text-[var(--accent)]">
              {scenario}
            </p>
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="progress-track mb-6">
        <div
          className="progress-fill"
          style={{
            width: `${((currentTurn + 1) / turns.length) * 100}%`,
          }}
        />
      </div>

      <div className="bg-[var(--card)] rounded-3xl border border-[var(--border)] overflow-hidden">
        {/* Chat History */}
        {chatHistory.length > 0 && (
          <div className="p-6 space-y-3 max-h-64 overflow-y-auto border-b border-[var(--border)]">
            {chatHistory.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                    msg.isUser
                      ? msg.isCorrect
                        ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 rounded-br-md"
                        : "bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-300 rounded-br-md"
                      : "bg-[var(--background)] border border-[var(--border)] rounded-bl-md"
                  }`}
                >
                  <div className="text-xs font-bold mb-1 opacity-60">
                    {msg.speaker}
                  </div>
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Current Turn */}
        <div className="p-6 md:p-8">
          {/* NPC Message */}
          <motion.div
            key={`turn-${currentTurn}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start gap-3 mb-6"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent)] to-purple-500 flex items-center justify-center shrink-0">
              <User size={20} className="text-white" />
            </div>
            <div>
              <div className="text-xs font-bold text-muted mb-1">
                {turn.speaker}
              </div>
              <div className="bg-[var(--background)] px-5 py-3 rounded-2xl rounded-tl-md border border-[var(--border)] font-medium">
                {turn.text}
              </div>
            </div>
          </motion.div>

          {/* Student Options */}
          {hasOptions && (
            <div className="space-y-2 ml-13">
              <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
                Choose your response:
              </div>
              {turn.studentOptions!.map((opt, i) => {
                let style =
                  "border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-light)]";
                if (selectedOption === i && !isChecked)
                  style =
                    "border-[var(--accent)] bg-[var(--accent-light)] ring-2 ring-[var(--accent)]/30";
                if (isChecked && opt.isCorrect)
                  style =
                    "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30";
                if (isChecked && selectedOption === i && !opt.isCorrect)
                  style =
                    "border-red-400 bg-red-50 dark:bg-red-950/30";

                return (
                  <motion.button
                    key={i}
                    whileTap={!isChecked ? { scale: 0.98 } : {}}
                    onClick={() => handleSelect(i)}
                    disabled={isChecked}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${style}`}
                  >
                    <span className="text-sm font-medium">{opt.text}</span>
                    {isChecked && opt.isCorrect && (
                      <Check
                        size={18}
                        className="ml-auto text-emerald-500 shrink-0"
                      />
                    )}
                    {isChecked && selectedOption === i && !opt.isCorrect && (
                      <X size={18} className="ml-auto text-red-500 shrink-0" />
                    )}
                  </motion.button>
                );
              })}

              {/* Feedback */}
              <AnimatePresence>
                {isChecked && feedback && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-700 dark:text-amber-400"
                  >
                    {feedback}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="flex justify-end px-6 py-4 border-t border-[var(--border)] bg-[var(--background)]/50">
          {!isChecked ? (
            <button
              onClick={handleSubmit}
              disabled={selectedOption === null}
              className="btn-accent"
            >
              Submit
            </button>
          ) : (
            <button
              onClick={handleContinue}
              className="btn-accent flex items-center gap-2"
            >
              Continue
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
