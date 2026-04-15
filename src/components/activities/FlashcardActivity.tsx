"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { RotateCcw, ChevronRight, ChevronLeft, Volume2, Info, RotateCcw as Shuffle } from "lucide-react";
import { ActivityMedia } from "./ActivityPlayer";
import { Tooltip } from "@/components/ui/Tooltip";

// Constants
const SPEECH_RATE = 0.8;
const SPEECH_LANG = "en-US";
const AUTO_PLAY_DELAY = 500;

interface MediaIndex {
  idx?: number;
}

interface MediaEntryExtended extends ActivityMediaEntry {
  idx?: number;
}

interface FlashcardItem {
  word?: string;
  term?: string;
  front?: string;
  definition?: string;
  meaning?: string;
  back?: string;
  translation?: string;
  example?: string;
}

interface FlashcardProps {
  data: any;
  media: ActivityMedia;
  onComplete?: (correct?: boolean) => void;
  triggerCheck?: number;
  [key: string]: any;
}

export default function FlashcardActivity({ data, media, onComplete, triggerCheck }: FlashcardProps) {
  const items = (data.items || data.cards || []) as FlashcardItem[];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const isMountedRef = useRef(true);

  if (items.length === 0) return <div className="text-muted">No flashcards found.</div>;

  const current = items[currentIndex];
  const front = current.word || current.term || current.front || "";
  const back =
    current.definition || current.meaning || current.back || current.translation || "";

  // ── Media lookup ──
  // Audio: match by index in the audio array OR by matching text
  const wordAudios = media.audio.filter((a) => a.audioType === "word");
  const sentenceAudios = media.audio.filter((a) => a.audioType === "sentence");
  const currentWordAudio = wordAudios.find(
    (a) => a.text?.toLowerCase() === front.toLowerCase() || (a as MediaIndex).idx === currentIndex
  ) || wordAudios[currentIndex];
  const currentSentenceAudio = (sentenceAudios as MediaIndex[]).find((a) => a.idx === currentIndex) || sentenceAudios[currentIndex];

  const currentImage = (media.images as MediaIndex[]).find((img) => img.idx === currentIndex) || media.images[currentIndex];

  const handleFlip = () => setIsFlipped(!isFlipped);

  // ── Audio playback with race condition prevention ──
  const playAudio = useCallback((url?: string, text?: string) => {
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    speechSynthesis.cancel();

    if (url) {
      setIsPlaying(true);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        if (isMountedRef.current) {
          setIsPlaying(false);
        }
        audioRef.current = null;
      };
      audio.onerror = () => {
        if (isMountedRef.current) {
          setIsPlaying(false);
        }
        audioRef.current = null;
        // Fallback to speechSynthesis
        if (text && "speechSynthesis" in window) {
          const u = new SpeechSynthesisUtterance(text);
          u.rate = SPEECH_RATE;
          u.lang = SPEECH_LANG;
          speechSynthesis.speak(u);
        }
      };
      audio.play().catch(() => {
        if (isMountedRef.current) {
          setIsPlaying(false);
        }
        audioRef.current = null;
      });
    } else if (text && "speechSynthesis" in window) {
      setIsPlaying(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = SPEECH_RATE;
      utterance.lang = SPEECH_LANG;
      utterance.onend = () => {
        if (isMountedRef.current) {
          setIsPlaying(false);
        }
      };
      utterance.onerror = () => {
        if (isMountedRef.current) {
          setIsPlaying(false);
        }
      };
      speechSynthesis.speak(utterance);
    }
  }, []);

  // ── Cleanup on unmount ──
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

  // ── Auto-play on card change (after useCallback is defined) ──
  useEffect(() => {
    if (autoPlayEnabled && items.length > 0) {
      const front = items[currentIndex].word || items[currentIndex].term || items[currentIndex].front || "";
      const wordAudios = media.audio.filter((a) => a.audioType === "word");
      const currentAudio = wordAudios.find(
        (a) => a.text?.toLowerCase() === front.toLowerCase() || (a as MediaIndex).idx === currentIndex
      ) || wordAudios[currentIndex];

      // Small delay for transition
      const timer = setTimeout(() => {
        if (isMountedRef.current && (currentAudio?.url || front)) {
          playAudio(currentAudio?.url, front);
        }
      }, AUTO_PLAY_DELAY);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, items, media.audio, playAudio, autoPlayEnabled]);

  const handleNext = useCallback(() => {
    setIsFlipped(false);
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (onComplete) {
      onComplete(true);
    }
  }, [currentIndex, items.length, onComplete]);

  // Handle external triggerCheck
  useEffect(() => {
    if (triggerCheck && triggerCheck > 0) {
        handleNext();
    }
  }, [triggerCheck, handleNext]);

  const handlePrev = () => {
    setIsFlipped(false);
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  return (
    <div className="max-w-2xl mx-auto w-full">
      <Tooltip content={`Card ${currentIndex + 1} of ${items.length} - Position in deck`}>
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm font-semibold text-muted uppercase tracking-widest">
            Card {currentIndex + 1} of {items.length}
          </div>
          <div className="flex items-center gap-3">
            {/* Auto-play toggle */}
            <Tooltip content={autoPlayEnabled ? "Auto-play: ON - Audio plays automatically when changing cards" : "Auto-play: OFF - Tap Listen button to play audio"}>
              <button
                onClick={() => setAutoPlayEnabled(!autoPlayEnabled)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${autoPlayEnabled
                    ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
                  }`}
              >
                <Volume2 size={14} />
                {autoPlayEnabled ? "On" : "Off"}
              </button>
            </Tooltip>
            {/* Audio play button */}
            <Tooltip content={`Play pronunciation for "${front}"`}>
              <button
                onClick={() => playAudio(currentWordAudio?.url, front)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${isPlaying
                    ? "bg-[var(--accent)] text-white shadow-lg"
                    : "bg-[var(--accent-light)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white"
                  }`}
              >
                <Volume2 size={16} className={isPlaying ? "animate-pulse" : ""} />
                {isPlaying ? "Playing..." : "Listen"}
              </button>
            </Tooltip>
          </div>
        </div>
      </Tooltip>

      {/* Card */}
      <div className="perspective-[800px] mb-8">
        <motion.div
          onClick={handleFlip}
          className="relative cursor-pointer select-none"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 200, damping: 25 }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Front */}
          <div
            className={`bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 md:p-12 text-center min-h-[280px] flex flex-col items-center justify-center shadow-lg ${isFlipped ? "invisible" : ""
              }`}
            style={{ backfaceVisibility: "hidden" }}
          >
            {/* Image on front */}
            {currentImage && (
              <Tooltip content={`${front} - Visual representation of the word`}>
                <div className="mb-4 rounded-2xl overflow-hidden bg-white/10 max-w-[200px] max-h-[150px]">
                  <img
                    src={currentImage.url}
                    alt={front}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              </Tooltip>
            )}
            <Tooltip content={`${front} - Click card to see definition`}>
              <h3 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
                {front}
              </h3>
            </Tooltip>
            <div className="flex items-center justify-center gap-2">
              <p className="text-white/60 text-sm font-medium">Tap to flip</p>
              <Tooltip content="Flip card to reveal the definition">
                <Info size={14} className="text-white/60" />
              </Tooltip>
            </div>
          </div>

          {/* Back */}
          <div
            className={`absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 md:p-12 text-center min-h-[280px] flex flex-col items-center justify-center shadow-lg ${!isFlipped ? "invisible" : ""
              }`}
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <Tooltip content={`${back} - English meaning and definition`}>
              <p className="text-xl md:text-2xl font-medium text-white leading-relaxed">
                {back}
              </p>
            </Tooltip>
            {current.example && (
              <Tooltip content={`"${current.example}" - Usage in context`}>
                <p className="text-white/60 text-sm mt-4 italic">
                  &ldquo;{current.example}&rdquo;
                </p>
              </Tooltip>
            )}
            {/* Play sentence audio on back */}
            {currentSentenceAudio && (
              <Tooltip content={`Hear example pronunciation: "${current.example || back}"`}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playAudio(currentSentenceAudio.url, current.example || back);
                  }}
                  className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white text-sm font-semibold hover:bg-white/30 transition-all"
                >
                  <Volume2 size={14} /> Hear example
                </button>
              </Tooltip>
            )}
          </div>
        </motion.div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Tooltip content="Go to previous card">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 text-muted hover:text-foreground font-medium disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={18} /> Prev
          </button>
        </Tooltip>
        <Tooltip content="Restart from the beginning - Reset to first card">
          <button
            onClick={() => {
              setIsFlipped(false);
              setCurrentIndex(0);
            }}
            className="flex items-center gap-2 text-muted hover:text-foreground font-medium transition-colors"
          >
            <RotateCcw size={16} /> Reset
          </button>
        </Tooltip>
        <Tooltip content={currentIndex === items.length - 1 ? "Complete flashcard activity" : "Go to next card"}>
          <button
            onClick={handleNext}
            disabled={currentIndex === items.length - 1}
            className="flex items-center gap-2 text-muted hover:text-foreground font-medium disabled:opacity-30 transition-colors"
          >
            Next <ChevronRight size={18} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
