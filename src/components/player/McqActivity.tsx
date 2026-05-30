
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, XCircle, ChevronRight, HelpCircle, Volume2 } from "lucide-react";
import { ActivityMedia } from "./ActivityPlayer";
import { getMediaUrl } from "@/utils/assets";
import { STOP_AUDIO_EVENT } from "@/utils/audio";

interface Props {
  data: any;
  media: ActivityMedia;
  onComplete?: (correct?: boolean) => void;
}

export default function McqActivity({ data, media, onComplete }: Props) {
  const questions = data.questions || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
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

  if (questions.length === 0) return <div>No questions found.</div>;

  const currentQ = questions[currentIndex];
  const isComplex = typeof currentQ.options[0] === 'object';

  // Media lookup
  const questionImage = media.images.find((img: any) => img.idx === currentIndex) || media.images[currentIndex];
  const questionAudio = media.audio.find((a: any) => a.idx === currentIndex) || media.audio[currentIndex];
  const imgSrc = questionImage?.url || currentQ.imageUrl || currentQ.image;
  const audioSrc = questionAudio?.url || currentQ.audio;

  const handlePlayAudio = (url?: string, text?: string) => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (url) {
      setIsSpeaking(true);
      const audio = new Audio(getMediaUrl(url));
      audioRef.current = audio;
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => { setIsSpeaking(false); if (text) fallbackSpeak(text); };
      audio.play().catch(() => { setIsSpeaking(false); if (text) fallbackSpeak(text); });
    } else if (text) {
      fallbackSpeak(text);
    }
  };

  const fallbackSpeak = (text: string) => {
    if ("speechSynthesis" in window) {
      setIsSpeaking(true);
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.85; u.lang = "en-US";
      u.onend = () => setIsSpeaking(false);
      u.onerror = () => setIsSpeaking(false);
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    }
  };

  const handleSelect = (index: number) => {
    if (showFeedback) return;
    setSelectedOption(index);
    setShowFeedback(true);
    let isCorrect = false;
    if (isComplex) isCorrect = currentQ.options[index].isCorrect;
    else isCorrect = currentQ.options[index] === currentQ.answer;
    if (isCorrect) setScore(score + 1);
  };

  const handleNext = () => {
    setSelectedOption(null);
    setShowFeedback(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (onComplete) {
      onComplete(true);
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col h-full">
      {/* Progress */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex gap-1">
          {questions.map((_: any, i: number) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i < currentIndex ? "w-6 bg-blue-500" :
                i === currentIndex ? "w-6 bg-blue-200" : "w-3 bg-slate-200"
              }`}
            />
          ))}
        </div>
        <div className="text-xs font-bold text-slate-500">
          Score: <span className="text-emerald-500">{score}</span> / {questions.length}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-100 flex-1 overflow-y-auto"
        >
          {/* Question Media */}
          {(() => {
            return (
              <div className="mb-4">
                {imgSrc && (
                  <div className="mb-3 flex justify-center">
                    <img
                      src={getMediaUrl(imgSrc)}
                      alt="Question reference"
                      className="max-h-32 rounded-xl object-contain bg-slate-50 border border-slate-100"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                )}
                {audioSrc && (
                  <div className="mb-3 flex justify-center">
                    <button
                      onClick={() => handlePlayAudio(audioSrc, currentQ.question || currentQ.text)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs transition-all ${
                        isSpeaking ? "bg-blue-500 text-white shadow-lg" : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                      }`}
                    >
                      <Volume2 size={16} className={isSpeaking ? "animate-pulse" : ""} />
                      {isSpeaking ? "Playing..." : "Listen"}
                    </button>
                  </div>
                )}
                <h3 className="text-lg md:text-xl font-bold text-slate-800 leading-snug text-center md:text-left">
                  {currentQ.question || currentQ.text}
                </h3>
              </div>
            );
          })()}

          {/* Options */}
          <div className="space-y-2">
            {currentQ.options.map((opt: any, i: number) => {
              const text = isComplex ? (opt.text || opt.label) : opt;
              const optImg = isComplex ? opt.image : null;
              const optAudio = isComplex ? opt.audio : null;
              const isCorrect = isComplex ? opt.isCorrect : text === currentQ.answer;

              let stateClass = "bg-slate-50 border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700";
              if (showFeedback) {
                if (i === selectedOption) {
                  stateClass = isCorrect
                    ? "bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm"
                    : "bg-red-50 border-red-500 text-red-900 shadow-sm";
                } else if (isCorrect) {
                  stateClass = "bg-emerald-50/50 border-emerald-300 text-emerald-800";
                } else {
                  stateClass = "bg-slate-50 border-slate-200 opacity-50";
                }
              }

              return (
                <button
                  key={i}
                  disabled={showFeedback}
                  onClick={() => handleSelect(i)}
                  className={`w-full text-left p-3 md:p-4 rounded-xl border-2 transition-all font-medium text-sm md:text-base flex items-center justify-between ${stateClass}`}
                >
                  <div className="flex flex-col gap-2 w-full mr-3">
                    {optImg && (
                      <img
                        src={getMediaUrl(optImg)}
                        alt={`Option ${i + 1}`}
                        className="max-h-20 rounded-lg object-contain bg-white border border-slate-100"
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    )}
                    {optAudio && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handlePlayAudio(optAudio); }}
                          className={`p-1.5 rounded-full transition-all ${isSpeaking ? "bg-blue-500 text-white" : "text-muted hover:text-blue-500"}`}
                        >
                          <Volume2 size={14} />
                        </button>
                        <audio controls src={getMediaUrl(optAudio.startsWith('http') ? optAudio : `/audio/${optAudio}`)} className="w-full max-w-[200px]" />
                      </div>
                    )}
                    {text && <span>{text}</span>}
                  </div>
                  {showFeedback && i === selectedOption && (
                    <div className="shrink-0">
                      {isCorrect ? <CheckCircle2 className="text-emerald-500" size={24} /> : <XCircle className="text-red-500" size={24} />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Feedback Area */}
          <AnimatePresence>
            {showFeedback && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                className="overflow-hidden"
              >
                <div className={`p-4 rounded-xl border ${
                  (isComplex ? currentQ.options[selectedOption!].isCorrect : currentQ.options[selectedOption!] === currentQ.answer)
                    ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                    : "bg-orange-50 border-orange-100 text-orange-800"
                }`}>
                  <div className="flex items-start gap-3">
                    <HelpCircle className="shrink-0 mt-0.5" size={18} />
                    <div>
                      <h4 className="font-bold text-sm mb-1">
                        {(isComplex ? currentQ.options[selectedOption!].isCorrect : currentQ.options[selectedOption!] === currentQ.answer)
                          ? "Correct!" : "Not quite right."}
                      </h4>
                      <p className="opacity-90 text-sm">
                        {isComplex && currentQ.options[selectedOption!].feedback
                          ? currentQ.options[selectedOption!].feedback
                          : currentQ.explanation || "Review the lesson text if you are unsure."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition shadow-md shadow-blue-200"
                  >
                    {currentIndex === questions.length - 1 ? "Finish" : "Next"}
                    <ChevronRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
