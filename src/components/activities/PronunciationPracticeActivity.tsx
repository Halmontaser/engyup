"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, ChevronRight, ChevronLeft, Mic, BookOpen, Sparkles, RotateCcw, Info } from "lucide-react";
import { ActivityMedia } from "./ActivityPlayer";
import { Tooltip } from "@/components/ui/Tooltip";

// Constants
const SPEECH_RATE = 0.8;
const SPEECH_LANG = "en-US";
const AUTO_PLAY_DELAY = 500;

interface Word {
  word: string;
  phonetic?: string;
  syllables?: string[];
  audioSrc?: string;
}

interface Props {
  data: any;
  media: ActivityMedia;
  onComplete?: (correct?: boolean) => void;
  triggerCheck?: number;
}

export default function PronunciationPracticeActivity({ data, media, onComplete, triggerCheck }: Props) {
  const words: Word[] = data.words || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSyllables, setShowSyllables] = useState(false);
  const [practiced, setPracticed] = useState<Set<number>>(new Set());
  const [isComplete, setIsComplete] = useState(false);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isMountedRef = useRef(true);

  const current = words[currentIndex];

  const wordAudios = media.audio.filter((a) => a.audioType === "word");
  const currentAudio = wordAudios.find(
    (a) => a.text?.toLowerCase() === (current?.word || "").toLowerCase()
  ) || wordAudios[currentIndex];

  const playAudio = useCallback((url?: string, text?: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    speechSynthesis.cancel();

    if (url) {
      setIsSpeaking(true);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        if (isMountedRef.current) setIsSpeaking(false);
        audioRef.current = null;
      };
      audio.onerror = () => {
        if (isMountedRef.current) setIsSpeaking(false);
        audioRef.current = null;
        if (text && "speechSynthesis" in window) {
          const u = new SpeechSynthesisUtterance(text);
          u.rate = SPEECH_RATE;
          u.lang = SPEECH_LANG;
          u.onend = () => {
            if (isMountedRef.current) setIsSpeaking(false);
          };
          speechSynthesis.speak(u);
        }
      };
      audio.play().catch(() => {
        if (isMountedRef.current) setIsSpeaking(false);
        audioRef.current = null;
      });
    } else if (text && "speechSynthesis" in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = SPEECH_RATE;
      utterance.lang = SPEECH_LANG;
      utterance.onend = () => {
        if (isMountedRef.current) setIsSpeaking(false);
      };
      speechSynthesis.speak(utterance);
    }
  }, []);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      speechSynthesis.cancel();
    };
  }, []);

  const handleNext = useCallback(() => {
    setPracticed((prev) => new Set([...prev, currentIndex]));
    setShowSyllables(false);
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsComplete(true);
      if (onComplete) {
        onComplete(true);
      }
    }
  }, [currentIndex, words.length, onComplete]);

  // Handle external triggerCheck from LessonPlayer footer
  useEffect(() => {
    if (triggerCheck && triggerCheck > 0 && !isComplete) {
      handleNext();
    }
  }, [triggerCheck, isComplete, handleNext]);

  useEffect(() => {
    if (autoPlayEnabled && words.length > 0 && !isComplete) {
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          playAudio(currentAudio?.url, current?.word);
        }
      }, AUTO_PLAY_DELAY);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, currentAudio, current?.word, words.length, playAudio, autoPlayEnabled, isComplete]);

  const handleSpeak = () => playAudio(currentAudio?.url, current?.word);

  const handlePrev = () => {
    setShowSyllables(false);
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setPracticed(new Set());
    setIsComplete(false);
    setShowSyllables(false);
  };

  if (words.length === 0) return <div className="text-muted p-4">No words to practice.</div>;

  const currentImage = media.images[currentIndex];

  if (isComplete) {
    return (
      <div className="max-w-2xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[var(--card)] rounded-3xl border border-[var(--border)] overflow-hidden p-10 md:p-14 text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-400 to-emerald-600">
            <Sparkles size={36} className="text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Practice Complete!</h3>
          <p className="text-muted mb-6">
            You practiced <span className="font-bold text-[var(--success)]">{practiced.size}</span> out of <span className="font-bold">{words.length}</span> words.
          </p>
          <div className="flex justify-center gap-4 mt-8">
            <button onClick={handleReset} className="btn-ghost flex items-center gap-2">
              <RotateCcw size={18} /> Practice Again
            </button>
            {onComplete && (
              <button onClick={() => onComplete(true)} className="btn-accent flex items-center gap-2">
                Finish Activity <ChevronRight size={18} />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  const progress = (practiced.size / words.length) * 100;

  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold text-muted uppercase tracking-widest">
            Word {currentIndex + 1} of {words.length}
          </div>
          <button
            onClick={() => setAutoPlayEnabled(!autoPlayEnabled)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              autoPlayEnabled
                ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
            }`}
          >
            <Volume2 size={12} />
            Auto-play: {autoPlayEnabled ? "On" : "Off"}
          </button>
        </div>
        <div className="text-sm font-bold text-muted">
          Practiced: <span className="text-[var(--success)]">{practiced.size}</span> / {words.length}
        </div>
      </div>
      <div className="progress-track mb-8">
        <div className="progress-fill" style={{ width: `${progress}%`, transition: 'width 0.3s ease' }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-[var(--card)] rounded-3xl border border-[var(--border)] overflow-hidden"
        >
          <div className="p-10 md:p-14 text-center">
            {currentImage && (
              <div className="mb-6 mx-auto max-w-[180px] max-h-[140px] rounded-2xl overflow-hidden bg-[var(--background)]">
                <img src={currentImage.url} alt={current?.word} className="w-full h-full object-contain" />
              </div>
            )}
            {current?.phonetic && (
              <div className="text-sm font-mono text-[var(--accent)] mb-3 tracking-wide flex items-center justify-center gap-2">
                <Info size={12} /> {current.phonetic}
              </div>
            )}
            <motion.h2 className="text-5xl md:text-6xl font-black mb-8 bg-gradient-to-r from-[var(--accent)] to-purple-500 bg-clip-text text-transparent">
              {current?.word}
            </motion.h2>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              <button
                onClick={handleSpeak}
                disabled={isSpeaking}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${
                  isSpeaking ? "bg-[var(--accent)] text-white" : "bg-[var(--accent-light)] text-[var(--accent)] hover:bg-[var(--accent)]"
                }`}
              >
                <Volume2 size={22} className={isSpeaking ? "animate-pulse" : ""} />
                {isSpeaking ? "Playing..." : "Listen"}
              </button>

              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200"
              >
                <Mic size={20} /> I Practiced This
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between px-8 py-5 border-t border-[var(--border)] bg-[var(--background)]/50">
            <button onClick={handlePrev} disabled={currentIndex === 0} className="btn-ghost flex items-center gap-2 text-sm disabled:opacity-30">
              <ChevronLeft size={18} /> Previous
            </button>
            <div className="flex gap-1.5">
              {words.map((_, i) => (
                <div key={i} className={`w-2.5 h-2.5 rounded-full ${i === currentIndex ? "bg-[var(--accent)] scale-125" : practiced.has(i) ? "bg-[var(--success)]" : "bg-[var(--border)]"}`} />
              ))}
            </div>
            <button onClick={handleNext} className="btn-accent flex items-center gap-2 text-sm">
              {currentIndex === words.length - 1 ? "Finish" : "Next"} <ChevronRight size={18} />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
