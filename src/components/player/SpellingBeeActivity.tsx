
import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Volume2,
  ChevronRight,
  Check,
  X,
  RotateCcw,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { ActivityMedia } from "./ActivityPlayer";
import { getMediaUrl } from "@/utils/assets";
import { STOP_AUDIO_EVENT } from "@/utils/audio";
import { Tooltip } from "@/components/ui/Tooltip";
import ActionBar from "./ActionBar";

interface SpellingWord {
  word: string;
  hint?: string;
  scrambled: string[];
  audio?: string;
  imageUrl?: string;
}

interface Props {
  data: any;
  media: ActivityMedia;
  onComplete?: (correct?: boolean) => void;
}

export default function SpellingBeeActivity({ data, media, onComplete }: Props) {
  const words: SpellingWord[] = data.words || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
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

  if (words.length === 0)
    return <div className="text-slate-400 p-4">No words to spell.</div>;

  const current = words[currentIndex];
  const scrambledLetters = current.scrambled || current.word.split("").sort(() => Math.random() - 0.5);

  // Media
  const wordImage = media.images.find((img: any) => img.idx === currentIndex) || media.images[currentIndex];
  const wordAudio = media.audio.find((a: any) => a.idx === currentIndex) || media.audio[currentIndex];
  const imageUrl = wordImage?.url || current.imageUrl || (data as any).imageUrl;
  const audioUrl = wordAudio?.url || current.audio;

  const builtWord = selected.map((i) => scrambledLetters[i]).join("");
  const availableIndices = scrambledLetters
    .map((_, i) => i)
    .filter((i) => !selected.includes(i));

  const handleSelectLetter = (letterIndex: number) => {
    if (isChecked) return;
    setSelected([...selected, letterIndex]);
  };

  const handleRemoveLetter = (position: number) => {
    if (isChecked) return;
    setSelected(selected.filter((_, i) => i !== position));
  };

  const handleCheck = () => {
    setIsChecked(true);
    const correct = builtWord.toLowerCase() === current.word.toLowerCase();
    setIsCorrect(correct);
    if (correct) setScore(score + 1);
  };

  const handleReset = () => {
    setSelected([]);
    setIsChecked(false);
    setIsCorrect(false);
    setShowHint(false);
  };

  const handleNext = () => {
    handleReset();
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (onComplete) {
      onComplete(true);
    }
  };

  // Media lookup for audio
  const wordAudios = media.audio.filter((a) => a.audioType === "word");
  const currentAudio = wordAudios.find(
    (a) => a.text?.toLowerCase() === current.word.toLowerCase()
  ) || wordAudios[currentIndex];

  const handleSpeak = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (currentAudio?.url || audioUrl) {
      setIsSpeaking(true);
      const audio = new Audio(getMediaUrl(currentAudio?.url || audioUrl));
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
      const u = new SpeechSynthesisUtterance(current.word);
      u.rate = 0.75; u.lang = "en-US";
      u.onend = () => setIsSpeaking(false);
      u.onerror = () => setIsSpeaking(false);
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    }
  };

  const progress = ((currentIndex + (isChecked && isCorrect ? 1 : 0)) / words.length) * 100;

  return (
    <div className="max-w-2xl mx-auto w-full">
      {/* Progress */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
          Word {currentIndex + 1} of {words.length}
        </div>
        <div className="text-sm font-bold text-slate-400">
          Score: <span className="text-emerald-600">{score}</span> / {words.length}
        </div>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-8">
        <div className="h-full bg-gradient-to-r from-indigo-400 to-blue-500 rounded-full" style={{ width: `${progress}%` }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white rounded-3xl border border-slate-200 overflow-hidden"
        >
          <div className="p-8 md:p-12">
            {/* Word Image */}
            {imageUrl && (
              <div className="mb-6 flex justify-center">
                <img
                  src={getMediaUrl(imageUrl)}
                  alt="Word reference"
                  className="max-h-40 rounded-2xl object-contain bg-slate-50 border border-slate-100"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            )}

            {/* Listen Button */}
            <div className="text-center mb-8">
              <Tooltip content="استمع للكلمة  •  Listen to word">
                <button
                  onClick={handleSpeak}
                  disabled={isSpeaking}
                  className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg transition-all ${
                    isSpeaking
                      ? "bg-indigo-500 text-white shadow-xl scale-105"
                      : "bg-indigo-50 text-indigo-600 hover:bg-indigo-500 hover:text-white hover:shadow-lg"
                  }`}
                >
                  <Volume2 size={24} className={isSpeaking ? "animate-pulse" : ""} />
                  {isSpeaking ? "جاري..." : "استمع للكلمة"}
                </button>
              </Tooltip>
            </div>

            {/* Hint */}
            {current.hint && (
              <div className="text-center mb-6">
                {!showHint ? (
                  <button
                    onClick={() => setShowHint(true)}
                    className="text-sm text-slate-400 flex items-center gap-2 mx-auto hover:text-indigo-600 transition-colors"
                  >
                    <HelpCircle size={16} /> Show Hint
                  </button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-4 py-2 rounded-xl inline-block"
                  >
                    {current.hint}
                  </motion.div>
                )}
              </div>
            )}

            {/* Built Word Display */}
            <div className="flex items-center justify-center gap-2 mb-8 min-h-[60px] flex-wrap">
              {current.word.split("").map((_, i) => (
                <motion.div
                  key={i}
                  layout
                  className={`w-12 h-14 md:w-14 md:h-16 rounded-xl border-2 flex items-center justify-center text-2xl font-black transition-all ${
                    selected[i] !== undefined
                      ? isChecked
                        ? isCorrect
                          ? "bg-emerald-100 dark:bg-emerald-950/30 border-emerald-400 text-emerald-600"
                          : builtWord[i]?.toLowerCase() === current.word[i]?.toLowerCase()
                          ? "bg-emerald-100 dark:bg-emerald-950/30 border-emerald-400 text-emerald-600"
                          : "bg-red-100 dark:bg-red-950/30 border-red-400 text-red-600"
                        : "bg-indigo-50 border-indigo-500 text-indigo-600 cursor-pointer hover:scale-105"
                      : "bg-slate-50 border-dashed border-slate-200"
                  }`}
                  onClick={() => selected[i] !== undefined && handleRemoveLetter(i)}
                >
                  {selected[i] !== undefined ? scrambledLetters[selected[i]] : ""}
                </motion.div>
              ))}
            </div>

            {/* Correct Answer Reveal */}
            {isChecked && !isCorrect && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center mb-6"
              >
                <span className="text-sm text-slate-400">Correct spelling: </span>
                <span className="font-bold text-emerald-600 text-lg">{current.word}</span>
              </motion.div>
            )}

            {/* Scrambled Letters */}
            {!isChecked && (
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {scrambledLetters.map((letter, i) => {
                  const isUsed = selected.includes(i);
                  return (
                    <motion.button
                      key={i}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleSelectLetter(i)}
                      disabled={isUsed}
                      className={`w-12 h-14 md:w-14 md:h-16 rounded-xl text-2xl font-black transition-all ${
                        isUsed
                          ? "opacity-20 scale-90 cursor-not-allowed bg-[slate-200]"
                          : "bg-slate-50 border-2 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer shadow-sm hover:shadow-md"
                      }`}
                    >
                      {letter}
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Result Message */}
            <AnimatePresence>
              {isChecked && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-6 p-4 rounded-xl text-center font-bold ${
                    isCorrect
                      ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600"
                      : "bg-red-50 dark:bg-red-950/20 text-red-600"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {isCorrect ? (
                      <>
                        <Sparkles size={20} /> Perfect Spelling!
                      </>
                    ) : (
                      <>
                        <X size={20} /> Not quite right
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="px-4 pb-4">
            {!isChecked ? (
              <div className="flex items-center gap-3">
                <button onClick={handleReset} className="px-4 py-2.5 rounded-xl font-medium text-xs text-slate-500 hover:bg-slate-100 transition-all">
                  <RotateCcw size={14} className="inline mr-1.5" /> Reset
                </button>
                <button
                  onClick={handleCheck}
                  disabled={selected.length !== current.word.length}
                  className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white shadow-lg shadow-indigo-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Check Spelling
                </button>
              </div>
            ) : (
              <ActionBar
                correct={isCorrect}
                message={isCorrect ? "🎉 Correct!" : `The word was "${current.word}"`}
                detail={current.definition || current.meaning}
                onNext={handleNext}
                label={currentIndex === words.length - 1 ? "Finish" : "Next Word"}
              />
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
