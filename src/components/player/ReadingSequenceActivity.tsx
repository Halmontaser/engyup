
import { useState, useMemo, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { Check, ArrowUpDown, RotateCcw, Volume2 } from "lucide-react";

import { ActivityMedia } from "./ActivityPlayer";
import { getMediaUrl } from "@/utils/assets";
import { STOP_AUDIO_EVENT } from "@/utils/audio";
import ActionBar from "./ActionBar";

interface Props {
  data: any;
  media: ActivityMedia;
  onComplete?: (correct?: boolean) => void;
}

export default function ReadingSequenceActivity({ data, media, onComplete }: Props) {
  const correctOrder: string[] = data.items || data.steps || data.events || [];

  const shuffledItems = useMemo(() => {
    const items = correctOrder.map((text, i) => ({
      text,
      correctIndex: i,
      id: `item-${i}`,
    }));
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [correctOrder]);

  const [userOrder, setUserOrder] = useState(shuffledItems);
  const [isChecked, setIsChecked] = useState(false);
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

  if (correctOrder.length === 0)
    return <div className="text-muted">No sequence items found.</div>;

  // Media
  const seqImage = media.images.length > 0 ? media.images[0] : null;
  const seqImageUrl = seqImage?.url || data.imageUrl || data.image;

  const handlePlayAudio = (text: string) => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if ("speechSynthesis" in window) {
      setIsSpeaking(true);
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.85; u.lang = "en-US";
      u.onend = () => setIsSpeaking(false);
      u.onerror = () => setIsSpeaking(false);
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    }
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (isChecked) return;
    const updated = [...userOrder];
    const [removed] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, removed);
    setUserOrder(updated);
  };

  const handleCheck = () => {
    setIsChecked(true);
    if (onComplete) onComplete(true);
  };

  const handleReset = () => {
    setUserOrder(shuffledItems);
    setIsChecked(false);
  };

  const correctCount = userOrder.filter(
    (item, i) => item.correctIndex === i
  ).length;
  const allCorrect = correctCount === correctOrder.length;

  return (
    <div className="max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ArrowUpDown size={18} className="text-[var(--accent)]" />
          <span className="text-sm font-bold text-muted uppercase tracking-widest">
            Put in Order
          </span>
        </div>
        {isChecked && (
          <span className="text-sm font-bold">
            <span className="text-[var(--success)]">{correctCount}</span> /{" "}
            {correctOrder.length} correct
          </span>
        )}
      </div>

      {/* Sequence image */}
      {seqImageUrl && (
        <div className="mb-6 flex justify-center">
          <img
            src={getMediaUrl(seqImageUrl)}
            alt="Sequence reference"
            className="max-h-48 rounded-2xl object-contain bg-slate-50 border border-slate-100"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      )}

      {isChecked && allCorrect ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-10 bg-[var(--success-light)] rounded-2xl text-center"
        >
          <Check size={40} className="mx-auto mb-4 text-[var(--success)]" />
          <h3 className="text-2xl font-bold">Perfect Order!</h3>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {userOrder.map((item, i) => {
            const isCorrectPosition = isChecked && item.correctIndex === i;
            const isWrongPosition = isChecked && item.correctIndex !== i;

            return (
              <motion.div
                key={item.id}
                layout
                className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${
                  isCorrectPosition
                    ? "border-[var(--success)] bg-[var(--success-light)]"
                    : isWrongPosition
                    ? "border-red-400 bg-red-50 dark:bg-red-950/30 dark:border-red-600"
                    : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    isCorrectPosition
                      ? "bg-[var(--success)] text-white"
                      : isWrongPosition
                      ? "bg-red-500 text-white"
                      : "bg-[var(--accent-light)] text-[var(--accent)]"
                  }`}
                >
                  {i + 1}
                </div>

                <p className="flex-1 font-medium">{item.text}</p>

                {/* Audio button */}
                <button
                  onClick={() => handlePlayAudio(item.text)}
                  className={`p-1.5 rounded-full transition-all shrink-0 ${isSpeaking ? "text-blue-500" : "text-muted/50 hover:text-blue-500"}`}
                >
                  <Volume2 size={14} className={isSpeaking ? "animate-pulse" : ""} />
                </button>

                {!isChecked && (
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => i > 0 && moveItem(i, i - 1)}
                      disabled={i === 0}
                      className="w-7 h-7 rounded-lg bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-muted hover:text-[var(--accent)] hover:border-[var(--accent)] disabled:opacity-20 transition-all text-xs"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => i < userOrder.length - 1 && moveItem(i, i + 1)}
                      disabled={i === userOrder.length - 1}
                      className="w-7 h-7 rounded-lg bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-muted hover:text-[var(--accent)] hover:border-[var(--accent)] disabled:opacity-20 transition-all text-xs"
                    >
                      ▼
                    </button>
                  </div>
                )}

                {isChecked && (
                  <div className="shrink-0">
                    {isCorrectPosition ? (
                      <Check size={18} className="text-[var(--success)]" />
                    ) : (
                      <span className="text-xs text-red-500 font-bold">
                        → {item.correctIndex + 1}
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Controls */}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={handleReset}
          className="px-4 py-2.5 rounded-xl font-medium text-xs text-slate-500 hover:bg-slate-100 transition-all"
        >
          <RotateCcw size={14} className="inline mr-1.5" /> Reset
        </button>
        {!isChecked && (
          <button
            onClick={handleCheck}
            className="px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white shadow-lg shadow-indigo-200 transition-all"
          >
            Check Order
          </button>
        )}
        {isChecked && (
          <ActionBar
            correct={isCorrect}
            message={isCorrect ? "Correct order!" : "Not quite — review the sequence."}
            onNext={handleReset}
            label="Try Again"
          />
        )}
      </div>
    </div>
  );
}
