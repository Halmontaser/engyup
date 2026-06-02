
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
import { STOP_AUDIO_EVENT } from "@/utils/audio";
import { Tooltip } from "@/components/ui/Tooltip";
import ActionBar from "./ActionBar";
import ImageViewer from "./ImageViewer";

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
}

export default function ListeningComprehensionActivity({ data, media, onComplete }: Props) {
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

  // Stop audio on global stop-audio event
  useEffect(() => {
    const handler = () => {
      audioRef.current?.pause();
      speechSynthesis.cancel();
      setIsSpeaking(false);
    };
    window.addEventListener(STOP_AUDIO_EVENT, handler);
    return () => window.removeEventListener(STOP_AUDIO_EVENT, handler);
  }, []);

  // ── Media: pick the first audio as the main passage audio ──
  const passageAudio = media.audio.length > 0 ? media.audio[0] : null;
  const passageImage = media.images.length > 0 ? media.images[0] : null;
  // Fallback: check imageUrl on activity data
  const passageImageUrl = passageImage?.url || (data as any).imageUrl;

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

  // ── LISTEN PHASE ──
  if (phase === "listen") {
    return (
      <div className="max-w-3xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-slate-200 overflow-hidden"
        >
          <div className="p-10 md:p-14 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[indigo-600] to-purple-500 flex items-center justify-center shadow-lg">
              <Headphones size={36} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-2">
              Listen to the Audio
            </h3>
            <p className="text-slate-400 text-sm mb-8">
              {questions.length > 0 
                ? "Listen carefully, then answer the questions. You can replay and toggle the transcript."
                : "Listen to the course audio for this lesson. Replay as needed."
              }
            </p>

            {/* Image for the listening passage */}
            <ImageViewer src={passageImageUrl} alt="Listening passage illustration" maxHeight="max-h-48" className="mb-8 mx-auto max-w-[320px]" />

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
                    ? "bg-indigo-500 text-white shadow-xl scale-105"
                    : "bg-indigo-50 text-indigo-600 hover:bg-indigo-500 hover:text-white hover:shadow-lg"
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
                className="text-sm font-semibold text-slate-400 flex items-center gap-2 mx-auto hover:text-indigo-600 transition-colors"
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
                    className="mt-4 p-6 bg-slate-50 rounded-2xl border border-slate-200 text-left"
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-line">
                      {transcript}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="px-8 py-5 border-t border-slate-200 bg-slate-50/50 flex justify-end">
            {questions.length > 0 ? (
              <button
                onClick={() => setPhase("quiz")}
                className="px-5 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white shadow-lg shadow-indigo-200 transition-all"
              >
                Start Questions
                <ChevronRight size={18} className="inline ml-1" />
              </button>
            ) : (
              <button
                onClick={handleFinishOnly}
                className="px-5 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-200 transition-all"
              >
                Complete Activity
                <ChevronRight size={18} className="inline ml-1" />
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
          className="bg-white rounded-3xl border border-slate-200 p-10 md:p-14 text-center"
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
          <p className="text-slate-400">
            You got <span className="font-bold text-emerald-600">{score}</span> out of{" "}
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
                  <p className="text-xs text-slate-400 mt-1">
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
        <div className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
          Question {currentQ + 1} of {questions.length}
        </div>
        <button
          onClick={handlePlayAudio}
          disabled={isSpeaking}
          className="text-sm flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 font-semibold hover:bg-indigo-500 hover:text-white transition-all"
        >
          <Volume2 size={16} className={isSpeaking ? "animate-pulse" : ""} />
          Replay
        </button>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-8">
        <div
          className="h-full bg-gradient-to-r from-indigo-400 to-blue-500 rounded-full"
          style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          className="bg-white rounded-3xl border border-slate-200 p-8 md:p-12"
        >
          <h4 className="text-xl md:text-2xl font-bold mb-8">
            {currentQuestion.question}
          </h4>

          <div className="space-y-3">
            {currentQuestion.options.map((opt, i) => {
              let style =
                "border-slate-200 hover:border-indigo-500 hover:bg-indigo-50";
              if (selected === i && !isChecked)
                style =
                  "border-indigo-500 bg-indigo-50 ring-2 ring-[indigo-600]/30";
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
                        ? "bg-indigo-500 text-white"
                        : "bg-slate-50 text-slate-400"
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

          <div className="mt-8">
            {!isChecked ? (
              <button
                onClick={handleCheck}
                disabled={selected === null}
                className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white shadow-lg shadow-indigo-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Check Answer
              </button>
            ) : (
              <ActionBar
                correct={answers[currentQ]}
                message={answers[currentQ] ? "Correct!" : "Not quite"}
                onNext={handleNext}
                label={currentQ === questions.length - 1 ? "See Results" : "Next Question"}
              />
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
