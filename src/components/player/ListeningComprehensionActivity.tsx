
import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Volume2,
  ChevronRight,
  Check,
  X,
  Eye,
  EyeOff,
  Headphones,
} from "lucide-react";
import { ActivityMedia } from "./ActivityPlayer";
import { getMediaUrl } from "@/utils/assets";

interface Option {
  text: string;
  isCorrect: boolean;
}

interface Question {
  question: string;
  options: Option[];
}

interface Props {
  data: any;
  media: ActivityMedia;
  onComplete?: (correct?: boolean) => void;
  triggerCheck?: number;
}

export default function ListeningComprehensionActivity({ data, media, onComplete, triggerCheck }: Props) {
  const transcript: string = data.transcript || "";
  const questions: Question[] = data.questions || [];

  const [phase, setPhase] = useState<"listen" | "quiz" | "results">("listen");
  const [showTranscript, setShowTranscript] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<(boolean | null)[]>(
    new Array(questions.length).fill(null)
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ── Media: pick the first audio as the main passage audio ──
  const passageAudio = media.audio.length > 0 ? media.audio[0] : null;
  const passageImage = media.images.length > 0 ? media.images[0] : null;

  const handlePlayAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (passageAudio) {
      setIsSpeaking(true);
      const audio = new Audio(getMediaUrl(passageAudio.url));
      audioRef.current = audio;
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => {
        setIsSpeaking(false);
        // fallback to speechSynthesis
        if (transcript && "speechSynthesis" in window) {
          const u = new SpeechSynthesisUtterance(transcript);
          u.rate = 0.85;
          u.lang = "en-US";
          u.onend = () => setIsSpeaking(false);
          speechSynthesis.cancel();
          speechSynthesis.speak(u);
        }
      };
      audio.play().catch(() => setIsSpeaking(false));
    } else if ("speechSynthesis" in window && transcript) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(transcript);
      utterance.rate = 0.85;
      utterance.lang = "en-US";
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    }
  }, [passageAudio, transcript]);

  // ── Auto-play on mount ──
  useEffect(() => {
    if (phase === "listen") {
      const timer = setTimeout(() => {
        handlePlayAudio();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [phase, handlePlayAudio]);


  const handleSelect = (optIndex: number) => {
    if (isChecked) return;
    setSelected(optIndex);
  };

  const handleCheck = () => {
    if (selected === null) return;
    setIsChecked(true);
    const correct = questions[currentQ].options[selected]?.isCorrect || false;
    if (correct) setScore(score + 1);
    const newAnswers = [...answers];
    newAnswers[currentQ] = correct;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    setSelected(null);
    setIsChecked(false);
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setPhase("results");
      // Call onComplete when showing results
      if (onComplete) {
        onComplete();
      }
    }
  };

  const handleFinishOnly = useCallback(() => {
    if (onComplete) {
      onComplete(true);
    }
  }, [onComplete]);

  // Handle external triggerCheck from LessonPlayer footer
  useEffect(() => {
    if (triggerCheck && triggerCheck > 0) {
      if (phase === "listen") {
        if (questions.length > 0) {
          setPhase("quiz");
        } else {
          handleFinishOnly();
        }
      } else if (phase === "quiz") {
        if (isChecked) {
          handleNext();
        } else if (selected !== null) {
          handleCheck();
        }
      } else if (phase === "results") {
        handleFinishOnly();
      }
    }
  }, [triggerCheck, phase, questions.length, isChecked, selected]);

  // ── LISTEN PHASE ──
  if (phase === "listen") {
    return (
      <div className="max-w-3xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--card)] rounded-3xl border border-[var(--border)] overflow-hidden"
        >
          <div className="p-10 md:p-14 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[var(--accent)] to-purple-500 flex items-center justify-center shadow-lg">
              <Headphones size={36} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-2">
              Listen to the Audio
            </h3>
            <p className="text-muted text-sm mb-8">
              {questions.length > 0 
                ? "Listen carefully, then answer the questions. You can replay and toggle the transcript."
                : "Listen to the course audio for this lesson. Replay as needed."
              }
            </p>

            {/* Image for the listening passage */}
            {passageImage && (
              <div className="mb-8 mx-auto max-w-[320px] rounded-2xl overflow-hidden border border-[var(--border)] shadow-md">
                <img
                  src={getMediaUrl(passageImage.url)}
                  alt="Listening passage illustration"
                  className="w-full h-auto object-contain"
                  onError={(e) => {
/* eslint-disable-next-line */

/* eslint-disable-next-line */

/* eslint-disable-next-line */

                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}

            {/* Audio badge */}
            {passageAudio && (
              <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                <Volume2 size={12} />
                Real audio available
              </div>
            )}

            <div>
              <button
                onClick={handlePlayAudio}
                disabled={isSpeaking}
                className={`mx-auto flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg transition-all ${
                  isSpeaking
                    ? "bg-[var(--accent)] text-white shadow-xl scale-105"
                    : "bg-[var(--accent-light)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white hover:shadow-lg"
                }`}
              >
                <Volume2
                  size={24}
                  className={isSpeaking ? "animate-pulse" : ""}
                />
                {isSpeaking ? "Playing..." : "Play Audio"}
              </button>
            </div>

            {/* Transcript Toggle */}
            <div className="mt-8">
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className="text-sm font-semibold text-muted flex items-center gap-2 mx-auto hover:text-[var(--accent)] transition-colors"
              >
                {showTranscript ? (
                  <EyeOff size={16} />
                ) : (
                  <Eye size={16} />
                )}
                {showTranscript ? "Hide Transcript" : "Show Transcript"}
              </button>

              <AnimatePresence>
                {showTranscript && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 p-6 bg-[var(--background)] rounded-2xl border border-[var(--border)] text-left"
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-line">
                      {transcript}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="px-8 py-5 border-t border-[var(--border)] bg-[var(--background)]/50 flex justify-end">
            {questions.length > 0 ? (
              <button
                onClick={() => setPhase("quiz")}
                className="btn-accent flex items-center gap-2"
              >
                Start Questions
                <ChevronRight size={20} />
              </button>
            ) : (
              <button
                onClick={handleFinishOnly}
                className="btn-accent flex items-center gap-2"
              >
                Complete Activity
                <ChevronRight size={20} />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // ── RESULTS PHASE ──
  if (phase === "results") {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="max-w-3xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[var(--card)] rounded-3xl border border-[var(--border)] p-10 md:p-14 text-center"
        >
          <div
            className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center text-3xl font-black text-white ${
              pct >= 70
                ? "bg-gradient-to-br from-emerald-400 to-emerald-600"
                : "bg-gradient-to-br from-amber-400 to-orange-500"
            }`}
          >
            {pct}%
          </div>
          <h3 className="text-2xl font-bold mb-2">
            {pct >= 70 ? "Great Listening!" : "Keep Practicing!"}
          </h3>
          <p className="text-muted">
            You got <span className="font-bold text-[var(--success)]">{score}</span> out of{" "}
            <span className="font-bold">{questions.length}</span> questions correct.
          </p>

          <div className="mt-8 space-y-3 text-left">
            {questions.map((q, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  answers[i]
                    ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20"
                    : "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20"
                }`}
              >
                {answers[i] ? (
                  <Check size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                ) : (
                  <X size={18} className="text-red-500 mt-0.5 shrink-0" />
                )}
                <div>
                  <p className="text-sm font-semibold">{q.question}</p>
                  <p className="text-xs text-muted mt-1">
                    Answer: {q.options.find((o) => o.isCorrect)?.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // ── QUIZ PHASE ──
  const currentQuestion = questions[currentQ];
  return (
    <div className="max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm font-semibold text-muted uppercase tracking-widest">
          Question {currentQ + 1} of {questions.length}
        </div>
        <button
          onClick={handlePlayAudio}
          disabled={isSpeaking}
          className="text-sm flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent-light)] text-[var(--accent)] font-semibold hover:bg-[var(--accent)] hover:text-white transition-all"
        >
          <Volume2 size={16} className={isSpeaking ? "animate-pulse" : ""} />
          Replay
        </button>
      </div>
      <div className="progress-track mb-8">
        <div
          className="progress-fill"
          style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          className="bg-[var(--card)] rounded-3xl border border-[var(--border)] p-8 md:p-12"
        >
          <h4 className="text-xl md:text-2xl font-bold mb-8">
            {currentQuestion.question}
          </h4>

          <div className="space-y-3">
            {currentQuestion.options.map((opt, i) => {
              let style =
                "border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-light)]";
              if (selected === i && !isChecked)
                style =
                  "border-[var(--accent)] bg-[var(--accent-light)] ring-2 ring-[var(--accent)]/30";
              if (isChecked && opt.isCorrect)
                style =
                  "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30";
              if (isChecked && selected === i && !opt.isCorrect)
                style = "border-red-400 bg-red-50 dark:bg-red-950/30";

              return (
                <motion.button
                  key={i}
                  whileTap={!isChecked ? { scale: 0.98 } : {}}
                  onClick={() => handleSelect(i)}
                  disabled={isChecked}
                  className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center gap-4 ${style}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      selected === i
                        ? "bg-[var(--accent)] text-white"
                        : "bg-[var(--background)] text-muted"
                    }`}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span className="font-medium">{opt.text}</span>
                  {isChecked && opt.isCorrect && (
                    <Check size={20} className="ml-auto text-emerald-500" />
                  )}
                  {isChecked && selected === i && !opt.isCorrect && (
                    <X size={20} className="ml-auto text-red-500" />
                  )}
                </motion.button>
              );
            })}
          </div>

          <div className="mt-10 flex justify-end">
            {!isChecked ? (
              <button
                onClick={handleCheck}
                disabled={selected === null}
                className="btn-accent"
              >
                Check Answer
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="btn-accent flex items-center gap-2"
              >
                {currentQ === questions.length - 1 ? "See Results" : "Next Question"}
                <ChevronRight size={20} />
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
