
import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Volume2, ChevronRight, ChevronLeft, Mic, BookOpen, Sparkles, RotateCcw, Info } from "lucide-react";
import { ActivityMedia } from "./ActivityPlayer";
import { Tooltip } from "@/components/ui/Tooltip";
import { getMediaUrl } from "@/utils/assets";
import { STOP_AUDIO_EVENT } from "@/utils/audio";
import ActionBar from "./ActionBar";

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
}

export default function PronunciationPracticeActivity({ data, media, onComplete }: Props) {
  const words: Word[] = data.words || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSyllables, setShowSyllables] = useState(false);
  const [practiced, setPracticed] = useState<Set<number>>(new Set());
  const [isComplete, setIsComplete] = useState(false);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
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
      const audio = new Audio(getMediaUrl(url));
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

  if (words.length === 0) return <div className="text-slate-400 p-4">No words to practice.</div>;

  const currentImage = media.images[currentIndex];

  if (isComplete) {
    return (
      <div className="max-w-2xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl border border-slate-200 overflow-hidden p-10 md:p-14 text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-400 to-emerald-600">
            <Sparkles size={36} className="text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Practice Complete!</h3>
          <p className="text-slate-400 mb-6">
            You practiced <span className="font-bold text-emerald-600">{practiced.size}</span> out of <span className="font-bold">{words.length}</span> words.
          </p>
          <div className="flex justify-center gap-4 mt-8">
            <button onClick={handleReset} className="px-5 py-3 rounded-xl font-medium text-sm text-slate-500 hover:bg-slate-100 transition-all">
              <RotateCcw size={16} className="inline mr-1.5" /> Practice Again
            </button>
            {onComplete && (
              <button onClick={() => onComplete(true)} className="px-5 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-200 transition-all">
                Finish Activity <ChevronRight size={16} />
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
          <div className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
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
        <div className="text-sm font-bold text-slate-400">
          Practiced: <span className="text-emerald-600">{practiced.size}</span> / {words.length}
        </div>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-8">
        <div className="h-full bg-gradient-to-r from-indigo-400 to-blue-500 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.3s ease' }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white rounded-3xl border border-slate-200 overflow-hidden"
        >
          <div className="p-10 md:p-14 text-center">
            {currentImage && (
              <div className="mb-6 mx-auto max-w-[180px] max-h-[140px] rounded-2xl overflow-hidden bg-slate-50">
                <img src={getMediaUrl(currentImage.url)} alt={current?.word} className="w-full h-full object-contain" loading="lazy" />
              </div>
            )}
            {current?.phonetic && (
              <div className="text-sm font-mono text-indigo-600 mb-3 tracking-wide flex items-center justify-center gap-2">
                <Info size={12} /> {current.phonetic}
              </div>
            )}
            <motion.h2 className="text-5xl md:text-6xl font-black mb-8 bg-gradient-to-r from-[indigo-600] to-purple-500 bg-clip-text text-transparent">
              {current?.word}
            </motion.h2>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              <button
                onClick={handleSpeak}
                disabled={isSpeaking}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${
                  isSpeaking ? "bg-indigo-500 text-white" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-500"
                }`}
              >
                <Volume2 size={22} className={isSpeaking ? "animate-pulse" : ""} />
                {isSpeaking ? "جاري..." : "استمع"}
              </button>

              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200"
              >
                <Mic size={20} /> I Practiced This
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between px-8 py-5 border-t border-slate-200 bg-slate-50/50">
            <button onClick={handlePrev} disabled={currentIndex === 0} className="px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 transition-all disabled:opacity-30">
              <ChevronLeft size={16} className="inline mr-1" /> Previous
            </button>
            <div className="flex gap-1.5">
              {words.map((_, i) => (
                <div key={i} className={`w-2.5 h-2.5 rounded-full ${i === currentIndex ? "bg-indigo-500 scale-125" : practiced.has(i) ? "bg-[emerald-600]" : "bg-[slate-200]"}`} />
              ))}
            </div>
            <button onClick={handleNext} className="px-4 py-2 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white shadow-lg shadow-indigo-200 transition-all">
              {currentIndex === words.length - 1 ? "Finish" : "Next"} <ChevronRight size={16} />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
