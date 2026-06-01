
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Volume2,
  ChevronRight,
  Check,
  X,
  HelpCircle,
  PenLine,
} from "lucide-react";
import { ActivityMedia } from "./ActivityPlayer";
import { getMediaUrl } from "@/utils/assets";
import { STOP_AUDIO_EVENT } from "@/utils/audio";
import ActionBar from "./ActionBar";

interface DictationSentence {
  expectedText: string;
  hints?: string[];
  difficulty?: string;
  imageUrl?: string;
}

interface Props {
  data: any;
  media: ActivityMedia;
  onComplete?: (correct?: boolean) => void;
}

export default function DictationActivity({ data, media, onComplete }: Props) {
  const sentences: DictationSentence[] = data.sentences || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [isChecked, setIsChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [showHints, setShowHints] = useState(false);
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
  const [showDiff, setShowDiff] = useState(false);

  if (sentences.length === 0)
    return <div className="text-muted p-4">No sentences for dictation.</div>;

  const current = sentences[currentIndex];

  // Media lookup
  const sentenceImage = media.images.find((img: any) => img.idx === currentIndex) || media.images[currentIndex];
  const sentenceAudios = media.audio.filter((a) => a.audioType === "sentence" || a.audioType === "dictation");
  const currentAudio = sentenceAudios.find(
    (a) => a.text?.toLowerCase() === current.expectedText.toLowerCase()
  ) || sentenceAudios[currentIndex] || (media.audio[currentIndex]);
  const imageUrl = sentenceImage?.url || current.imageUrl;

  const handlePlayAudio = (rate?: number) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (currentAudio?.url) {
      setIsSpeaking(true);
      const audio = new Audio(getMediaUrl(currentAudio.url));
      audioRef.current = audio;
      if (rate && rate < 0.8) audio.playbackRate = rate / 0.85;
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => {
        setIsSpeaking(false);
        fallbackSpeak(rate);
      };
      audio.play().catch(() => { setIsSpeaking(false); fallbackSpeak(rate); });
    } else {
      fallbackSpeak(rate);
    }
  };

  const fallbackSpeak = (rate?: number) => {
    if ("speechSynthesis" in window) {
      setIsSpeaking(true);
      const u = new SpeechSynthesisUtterance(current.expectedText);
      u.rate = rate || 0.85; u.lang = "en-US";
      u.onend = () => setIsSpeaking(false);
      u.onerror = () => setIsSpeaking(false);
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    }
  };

  const normalizeText = (text: string) =>
    text
      .trim()
      .toLowerCase()
      .replace(/['']/g, "'")
      .replace(/[""]/g, '"')
      .replace(/\s+/g, " ");

  const calculateAccuracy = () => {
    const expected = normalizeText(current.expectedText);
    const actual = normalizeText(userInput);
    if (expected === actual) return 100;
    const expectedWords = expected.split(" ");
    const actualWords = actual.split(" ");
    let matchCount = 0;
    for (let i = 0; i < Math.max(expectedWords.length, actualWords.length); i++) {
      if (expectedWords[i] === actualWords[i]) matchCount++;
    }
    return Math.round((matchCount / expectedWords.length) * 100);
  };

  const handleCheck = () => {
    setIsChecked(true);
    const accuracy = calculateAccuracy();
    if (accuracy >= 80) setScore(score + 1);
  };

  const handleNext = () => {
    setUserInput("");
    setIsChecked(false);
    setShowHints(false);
    setShowDiff(false);
    if (currentIndex < sentences.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (onComplete) {
      onComplete(true);
    }
  };

  const accuracy = isChecked ? calculateAccuracy() : 0;
  const isPerfect = accuracy === 100;
  const isClose = accuracy >= 80 && !isPerfect;

  const renderDiff = () => {
    const expectedWords = current.expectedText.split(" ");
    const actualWords = userInput.trim().split(" ");
    return (
      <div className="flex flex-wrap gap-1 mt-4">
        {expectedWords.map((word, i) => {
          const actual = actualWords[i] || "";
          const match = normalizeText(word) === normalizeText(actual);
          return (
            <span
              key={i}
              className={`px-2 py-1 rounded text-sm font-medium ${
                match
                  ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
                  : "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 line-through"
              }`}
            >
              {word}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto w-full">
      {/* Progress */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm font-semibold text-muted uppercase tracking-widest">
          Sentence {currentIndex + 1} of {sentences.length}
        </div>
        <div className="text-sm font-bold text-muted">
          Score: <span className="text-[var(--success)]">{score}</span> /{" "}
          {sentences.length}
        </div>
      </div>
      <div className="progress-track mb-8">
        <div
          className="progress-fill"
          style={{
            width: `${((currentIndex + (isChecked ? 1 : 0)) / sentences.length) * 100}%`,
          }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-[var(--card)] rounded-3xl border border-[var(--border)] overflow-hidden"
        >
          <div className="p-8 md:p-12">
            {/* Image */}
            {imageUrl && (
              <div className="mb-6 flex justify-center">
                <img
                  src={getMediaUrl(imageUrl)}
                  alt="Dictation reference"
                  className="max-h-40 rounded-2xl object-contain bg-slate-50 border border-slate-100"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            )}

            {/* Play Audio Section */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <button
                  onClick={() => handlePlayAudio(0.85)}
                  disabled={isSpeaking}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${
                    isSpeaking
                      ? "bg-[var(--accent)] text-white shadow-lg"
                      : "bg-[var(--accent-light)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white"
                  }`}
                >
                  <Volume2
                    size={20}
                    className={isSpeaking ? "animate-pulse" : ""}
                  />
                  {isSpeaking ? "Playing..." : "Play"}
                </button>
                <button
                  onClick={() => handlePlayAudio(0.5)}
                  disabled={isSpeaking}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold bg-purple-100 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 transition-all"
                >
                  <Volume2 size={20} />
                  Slow
                </button>
              </div>

              {current.difficulty && (
                <div className="mt-3">
                  <span className="activity-type-badge">
                    {current.difficulty}
                  </span>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <PenLine size={16} className="text-muted" />
                <label className="text-sm font-semibold text-muted">
                  Type what you hear:
                </label>
              </div>
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                disabled={isChecked}
                placeholder="Type the sentence here..."
                rows={3}
                className={`w-full p-5 rounded-2xl border-2 text-lg outline-none resize-none transition-all ${
                  isChecked
                    ? isPerfect
                      ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20"
                      : isClose
                      ? "border-amber-400 bg-amber-50 dark:bg-amber-950/20"
                      : "border-red-400 bg-red-50 dark:bg-red-950/20"
                    : "border-[var(--border)] bg-[var(--background)] focus:border-[var(--accent)] focus:bg-[var(--accent-light)]"
                }`}
              />
            </div>

            {/* Result */}
            {isChecked && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div
                  className={`mt-6 p-5 rounded-2xl ${
                    isPerfect
                      ? "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300"
                      : isClose
                      ? "bg-amber-50 dark:bg-amber-950/20 border border-amber-300"
                      : "bg-red-50 dark:bg-red-950/20 border border-red-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {isPerfect ? (
                      <>
                        <Check size={20} className="text-emerald-500" />
                        <span className="font-bold text-emerald-600">
                          Perfect! 100% accuracy
                        </span>
                      </>
                    ) : isClose ? (
                      <>
                        <Check size={20} className="text-amber-500" />
                        <span className="font-bold text-amber-600">
                          Close! {accuracy}% accuracy
                        </span>
                      </>
                    ) : (
                      <>
                        <X size={20} className="text-red-500" />
                        <span className="font-bold text-red-600">
                          {accuracy}% accuracy — keep trying!
                        </span>
                      </>
                    )}
                  </div>

                  {!isPerfect && (
                    <>
                      <p className="text-sm text-muted mb-2">Correct text:</p>
                      <p className="font-medium text-[var(--foreground)]">
                        {current.expectedText}
                      </p>
                      <button
                        onClick={() => setShowDiff(!showDiff)}
                        className="mt-3 text-xs font-semibold text-muted hover:text-[var(--accent)] transition-colors"
                      >
                        {showDiff ? "Hide" : "Show"} word comparison
                      </button>
                      {showDiff && renderDiff()}
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {/* Hints */}
            {current.hints && current.hints.length > 0 && !isChecked && (
              <div className="mt-6">
                <button
                  onClick={() => setShowHints(!showHints)}
                  className="text-sm text-muted flex items-center gap-2 hover:text-[var(--accent)] transition-colors"
                >
                  <HelpCircle size={16} />
                  {showHints ? "Hide Hints" : "Need a hint?"}
                </button>
                <AnimatePresence>
                  {showHints && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 space-y-2"
                    >
                      {current.hints.map((hint, i) => (
                        <div
                          key={i}
                          className="text-sm p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-700 dark:text-amber-400"
                        >
                          {hint}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="px-4 pb-4">
            {!isChecked ? (
              <button
                onClick={handleCheck}
                disabled={!userInput.trim()}
                className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white shadow-lg shadow-indigo-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Check Answer
              </button>
            ) : (
              <ActionBar
                correct={isPerfect ? true : isClose ? null : false}
                message={isPerfect ? "Perfect! 100%" : isClose ? `Close! ${accuracy}%` : `${accuracy}% — keep trying!`}
                detail={`Correct: "${current.expectedText}"`}
                onNext={handleNext}
                label={currentIndex === sentences.length - 1 ? "Finish" : "Next Sentence"}
              />
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
