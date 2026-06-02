
import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "motion/react";
import { RotateCcw, ChevronRight, ChevronLeft, Volume2, Info, RotateCcw as Shuffle } from "lucide-react";
import { ActivityMedia, ActivityMediaEntry } from "./ActivityPlayer";
import { Tooltip } from "@/components/ui/Tooltip";
import { getMediaUrl } from "@/utils/assets";
import { STOP_AUDIO_EVENT } from "@/utils/audio";
import ActionBar from "./ActionBar";
import ImageViewer from "./ImageViewer";

// Constants
const SPEECH_RATE = 0.8;
const SPEECH_LANG = "en-US";
const AUTO_PLAY_DELAY = 500;

interface FlashcardItem {
  word?: string;
  term?: string;
  front?: string;
  definition?: string;
  meaning?: string;
  back?: string;
  translation?: string;
  example?: string;
  imageUrl?: string;
  wordAudio?: string;
}

interface FlashcardProps {
  data: any;
  media: ActivityMedia;
  onComplete?: (correct?: boolean) => void;
}

export default function FlashcardActivity({ data, media, onComplete }: FlashcardProps) {
  const items = (data.items || data.cards || []) as FlashcardItem[];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
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
    (a) => a.text?.toLowerCase() === front.toLowerCase() || a.idx === currentIndex
  ) || wordAudios[currentIndex];
  // Fallback: check wordAudio directly on the item data
  const currentWordAudioUrl = currentWordAudio?.url || current.wordAudio;
  const currentSentenceAudio = sentenceAudios.find((a) => a.idx === currentIndex) || sentenceAudios[currentIndex];

  const currentImage = media.images.find((img) => img.idx === currentIndex) || media.images[currentIndex];
  // Fallback: check imageUrl directly on the item data
  const currentImageUrl = currentImage?.url || current.imageUrl;

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
      const audio = new Audio(getMediaUrl(url));
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
      const audioUrl = currentAudio?.url || items[currentIndex]?.wordAudio;

      // Small delay for transition
      const timer = setTimeout(() => {
        if (isMountedRef.current && (audioUrl || front)) {
          playAudio(audioUrl, front);
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

  const handlePrev = () => {
    setIsFlipped(false);
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  return (
    <div className="max-w-2xl mx-auto w-full">
      <Tooltip content={`بطاقة ${currentIndex + 1} من ${items.length}  •  Card ${currentIndex + 1} of ${items.length}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm font-semibold text-muted uppercase tracking-widest">
            Card {currentIndex + 1} of {items.length}
          </div>
          <div className="flex items-center gap-3">
            {/* Auto-play toggle */}
            <Tooltip content={autoPlayEnabled ? "التشغيل التلقائي: مفعل  •  Auto-play: ON" : "التشغيل التلقائي: غير مفعل  •  Auto-play: OFF"}>
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
            <Tooltip content={`استمع لنطق: "${front}"  •  Listen to "${front}"`}>
              <button
                onClick={() => playAudio(currentWordAudioUrl, front)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${isPlaying
                    ? "bg-indigo-500 text-white shadow-lg"
                    : "bg-indigo-50 text-indigo-600 hover:bg-indigo-500 hover:text-white"
                  }`}
              >
                <Volume2 size={16} className={isPlaying ? "animate-pulse" : ""} />
                {isPlaying ? "جاري..." : "استمع"}
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
            {currentImageUrl && (
              <div className="mb-4">
                <ImageViewer src={currentImageUrl} alt={front} maxHeight="max-h-36" />
              </div>
            )}
            <Tooltip content={`${front} - اضغط لرؤية التعريف  •  Tap to see definition`}>
              <h3 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
                {front}
              </h3>
            </Tooltip>
            <div className="flex items-center justify-center gap-2">
              <p className="text-white/60 text-sm font-medium">Tap to flip</p>
              <Tooltip content="اضغط لقلب البطاقة  •  Tap to flip">
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
            <Tooltip content={`${back} - المعنى والتعريف  •  Definition`}>
              <p className="text-xl md:text-2xl font-medium text-white leading-relaxed">
                {back}
              </p>
            </Tooltip>
            {current.example && (
              <Tooltip content={`"${current.example}" - مثال  •  Example usage`}>
                <p className="text-white/60 text-sm mt-4 italic">
                  &ldquo;{current.example}&rdquo;
                </p>
              </Tooltip>
            )}
            {/* Play sentence audio on back */}
            {currentSentenceAudio && (
              <Tooltip content={`استمع لنطق المثال  •  Hear example`}>
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
        <Tooltip content="البطاقة السابقة  •  Previous card">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 text-muted hover:text-foreground font-medium disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={18} /> Prev
          </button>
        </Tooltip>
        <Tooltip content="إعادة من البداية  •  Restart">
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
        <Tooltip content={currentIndex === items.length - 1 ? "إنهاء البطاقات  •  Complete" : "البطاقة التالية  •  Next card"}>
          {currentIndex === items.length - 1 ? (
            <button
              onClick={handleNext}
              className="px-4 py-2 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white shadow-lg shadow-indigo-200 transition-all"
            >
              Complete <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 font-medium text-muted hover:text-foreground transition-colors"
            >
              Next <ChevronRight size={18} />
            </button>
          )}
        </Tooltip>
      </div>
    </div>
  );
}
