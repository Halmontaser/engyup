
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, X, ChevronRight, HelpCircle, Volume2 } from "lucide-react";

import { ActivityMedia } from "./ActivityPlayer";
import { getMediaUrl } from "@/utils/assets";
import { STOP_AUDIO_EVENT } from "@/utils/audio";
import ActionBar from "./ActionBar";

interface Props {
  data: any;
  media: ActivityMedia;
  onComplete?: (correct?: boolean) => void;
}

export default function TrueFalseActivity({ data, media, onComplete }: Props) {
  const statements = data.statements || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
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

  if (statements.length === 0) return <div>No true/false statements found.</div>;

  const currentStatement = statements[currentIndex];

  // Media lookup
  const statementImage = media.images.find((img: any) => img.idx === currentIndex) || media.images[currentIndex];
  const statementAudio = media.audio.find((a: any) => a.idx === currentIndex) || media.audio[currentIndex];
  const statementImageUrl = statementImage?.url || currentStatement?.imageUrl || currentStatement?.image;
  const statementAudioUrl = statementAudio?.url || currentStatement?.audio;

  const handlePlayAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (statementAudioUrl) {
      setIsSpeaking(true);
      const audio = new Audio(getMediaUrl(statementAudioUrl));
      audioRef.current = audio;
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => {
        setIsSpeaking(false);
        fallbackSpeak();
      };
      audio.play().catch(() => { setIsSpeaking(false); fallbackSpeak(); });
    } else {
      fallbackSpeak();
    }
  };

  const fallbackSpeak = () => {
    if ("speechSynthesis" in window) {
      setIsSpeaking(true);
      const u = new SpeechSynthesisUtterance(currentStatement.statement);
      u.rate = 0.85; u.lang = "en-US";
      u.onend = () => setIsSpeaking(false);
      u.onerror = () => setIsSpeaking(false);
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    }
  };

  const handleSelect = (answer: boolean) => {
    if (showFeedback) return;
    setSelectedAnswer(answer);
    setShowFeedback(true);

    if (answer === currentStatement.isTrue) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setShowFeedback(false);
    if (currentIndex < statements.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (onComplete) {
      onComplete(true);
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-1">
          {statements.map((_: any, i: number) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i < currentIndex ? "w-8 bg-blue-500" :
                i === currentIndex ? "w-8 bg-blue-200" : "w-4 bg-slate-200"
              }`}
            />
          ))}
        </div>
        <div className="text-sm font-bold text-slate-500">
          Score: <span className="text-emerald-500">{score}</span> / {statements.length}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-100"
        >
          {/* Image */}
          {statementImageUrl && (
            <div className="mb-6 flex justify-center">
              <img
                src={getMediaUrl(statementImageUrl)}
                alt="Statement reference"
                className="max-h-56 rounded-2xl object-contain bg-slate-50 border border-slate-100"
                loading="lazy"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          )}

          {/* Audio */}
          {(statementAudioUrl || currentStatement?.statement) && (
            <div className="mb-6 flex justify-center">
              <button
                onClick={handlePlayAudio}
                disabled={isSpeaking}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  isSpeaking
                    ? "bg-blue-500 text-white shadow-lg"
                    : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                }`}
              >
                <Volume2 size={18} className={isSpeaking ? "animate-pulse" : ""} />
                {isSpeaking ? "Playing..." : "Listen"}
              </button>
            </div>
          )}

          <div className="mb-10 text-center">
            <span className="text-sm font-bold uppercase tracking-widest text-slate-400">Statement</span>
            <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mt-2 leading-snug">
              "{currentStatement.statement}"
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              disabled={showFeedback}
              onClick={() => handleSelect(true)}
              className={`p-6 rounded-2xl border-2 transition-all font-bold text-xl flex flex-col items-center gap-3 ${
                showFeedback
                  ? (selectedAnswer === true
                      ? currentStatement.isTrue ? "bg-emerald-50 border-emerald-500 text-emerald-900" : "bg-red-50 border-red-500 text-red-900"
                      : currentStatement.isTrue ? "bg-emerald-50/50 border-emerald-300 text-emerald-800" : "bg-slate-50 border-slate-200 opacity-50 text-slate-400")
                  : "bg-emerald-50/30 border-emerald-200 hover:bg-emerald-100/50 hover:border-emerald-400 text-emerald-700"
              }`}
            >
              <div className={`p-4 rounded-full ${showFeedback && selectedAnswer === true ? (currentStatement.isTrue ? "bg-emerald-500 text-white" : "bg-red-500 text-white") : "bg-white shadow-sm"}`}>
                <Check size={32} />
              </div>
              True
            </button>

            <button
              disabled={showFeedback}
              onClick={() => handleSelect(false)}
              className={`p-6 rounded-2xl border-2 transition-all font-bold text-xl flex flex-col items-center gap-3 ${
                showFeedback
                  ? (selectedAnswer === false
                      ? !currentStatement.isTrue ? "bg-emerald-50 border-emerald-500 text-emerald-900" : "bg-red-50 border-red-500 text-red-900"
                      : !currentStatement.isTrue ? "bg-emerald-50/50 border-emerald-300 text-emerald-800" : "bg-slate-50 border-slate-200 opacity-50 text-slate-400")
                  : "bg-rose-50/30 border-rose-200 hover:bg-rose-100/50 hover:border-rose-400 text-rose-700"
              }`}
            >
              <div className={`p-4 rounded-full ${showFeedback && selectedAnswer === false ? (!currentStatement.isTrue ? "bg-emerald-500 text-white" : "bg-red-500 text-white") : "bg-white shadow-sm"}`}>
                <X size={32} />
              </div>
              False
            </button>
          </div>

          <AnimatePresence>
            {showFeedback && (
              <ActionBar
                correct={selectedAnswer === currentStatement.isTrue}
                message={selectedAnswer === currentStatement.isTrue
                  ? "Correct!"
                  : `Incorrect — the statement is ${currentStatement.isTrue ? "True" : "False"}.`}
                detail={currentStatement.explanation}
                onNext={handleNext}
                label={currentIndex === statements.length - 1 ? "Finish" : "Next Statement"}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
