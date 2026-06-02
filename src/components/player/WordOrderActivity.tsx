
import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, RotateCcw, ChevronRight, Volume2 } from "lucide-react";

import { ActivityMedia } from "./ActivityPlayer";
import { getMediaUrl } from "@/utils/assets";
import { STOP_AUDIO_EVENT } from "@/utils/audio";

interface Props {
  data: any;
  media: ActivityMedia;
  onComplete?: (correct?: boolean) => void;
}

export default function WordOrderActivity({ data, media, onComplete }: Props) {
  const sentences = useMemo(() => {
    let s = data.sentences || [];
    if (s.length === 0) {
      if (data.correctOrder) s = [{ correctOrder: data.correctOrder }];
      else if (data.answer) s = [{ answer: data.answer }];
      else if (data.sentence) s = [{ sentence: data.sentence }];
    }
    return s;
  }, [data]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
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

  useEffect(() => {
    if (sentences.length > 0 && sentences[currentIndex]) {
      const sentenceObj = sentences[currentIndex];
      let correct: string[] = [];
      if (Array.isArray(sentenceObj.correctOrder)) correct = sentenceObj.correctOrder;
      else if (sentenceObj.correctOrder && typeof sentenceObj.correctOrder === "string") correct = sentenceObj.correctOrder.split(" ");
      else if (sentenceObj.answer && typeof sentenceObj.answer === "string") correct = sentenceObj.answer.split(" ");
      else if (Array.isArray(sentenceObj.answer)) correct = sentenceObj.answer;
      else if (sentenceObj.sentence && typeof sentenceObj.sentence === "string") correct = sentenceObj.sentence.split(" ");
      if (correct.length === 0) correct = ["Error:", "Missing", "Data"];

      const shuffled = [...correct];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      setAvailableWords(shuffled);
      setSelectedWords([]);
      setIsChecked(false);
      setIsCorrect(false);
    }
  }, [currentIndex, sentences]);

  if (sentences.length === 0) return <div>No sentences found.</div>;

  const currentSentence = sentences[currentIndex];
  const sentenceImage = media.images.find((img: any) => img.idx === currentIndex) || media.images[currentIndex];
  const sentenceAudio = media.audio.find((a: any) => a.idx === currentIndex) || media.audio[currentIndex];
  const imageUrl = sentenceImage?.url || currentSentence?.imageUrl || currentSentence?.image;
  const audioUrl = sentenceAudio?.url || currentSentence?.audio;

  const handlePlayAudio = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    const correctText = Array.isArray(currentSentence?.correctOrder) ? currentSentence.correctOrder.join(" ") : (currentSentence?.correctOrder || currentSentence?.answer || "");
    if (audioUrl) {
      setIsSpeaking(true);
      const audio = new Audio(getMediaUrl(audioUrl));
      audioRef.current = audio;
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => { setIsSpeaking(false); fallbackSpeak(correctText); };
      audio.play().catch(() => { setIsSpeaking(false); fallbackSpeak(correctText); });
    } else if (correctText) {
      fallbackSpeak(correctText);
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

  const handleSelectWord = (word: string, fromAvailable: boolean) => {
    if (isChecked) return;
    if (fromAvailable) {
      const index = availableWords.indexOf(word);
      const newAvail = [...availableWords];
      newAvail.splice(index, 1);
      setAvailableWords(newAvail);
      setSelectedWords([...selectedWords, word]);
    } else {
      const index = selectedWords.lastIndexOf(word);
      const newSel = [...selectedWords];
      newSel.splice(index, 1);
      setSelectedWords(newSel);
      setAvailableWords([...availableWords, word]);
    }
  };

  const handleCheck = () => {
    const sentenceObj = sentences[currentIndex];
    let correct: string[] = [];
    if (Array.isArray(sentenceObj.correctOrder)) correct = sentenceObj.correctOrder;
    else if (sentenceObj.correctOrder && typeof sentenceObj.correctOrder === "string") correct = sentenceObj.correctOrder.split(" ");
    else if (sentenceObj.answer && typeof sentenceObj.answer === "string") correct = sentenceObj.answer.split(" ");
    else if (Array.isArray(sentenceObj.answer)) correct = sentenceObj.answer;
    else if (sentenceObj.sentence && typeof sentenceObj.sentence === "string") correct = sentenceObj.sentence.split(" ");
    else correct = ["Error"];
    const isOk = selectedWords.join(" ") === correct.join(" ");
    setIsChecked(true);
    setIsCorrect(isOk);
  };

  const handleReset = () => {
    setAvailableWords([...availableWords, ...selectedWords]);
    setSelectedWords([]);
    setIsChecked(false);
    setIsCorrect(false);
  };

  const handleNext = () => {
    if (currentIndex < sentences.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (onComplete) {
      onComplete(true);
    }
  };

  const canCheck = availableWords.length === 0 && !isChecked;

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
          Sentence {currentIndex + 1} of {sentences.length}
        </div>
      </div>

      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100"
      >
        {/* Image */}
        {imageUrl && (
          <div className="mb-6 flex justify-center">
            <img
              src={getMediaUrl(imageUrl)}
              alt="Sentence reference"
              className="max-h-48 rounded-2xl object-contain bg-slate-50 border border-slate-100"
              loading="lazy"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
        )}

        {/* Audio */}
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
            {isSpeaking ? "جاري..." : "استمع"}
          </button>
        </div>

        <div className="mb-8">
          <p className="text-slate-500 mb-2 font-medium">Build the sentence:</p>

          {/* Answer Box */}
          <div className={`min-h-[100px] p-6 rounded-2xl border-b-4 flex flex-wrap content-start gap-3 transition-colors ${
            isChecked
              ? isCorrect
                ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-100"
                : "bg-red-50 border-red-500 ring-2 ring-red-100"
              : "bg-slate-50 border-slate-300"
            }`}
          >
            {selectedWords.map((word, i) => (
              <motion.button
                layoutId={`word-${word}-${i}`}
                key={`s-${i}`}
                onClick={() => handleSelectWord(word, false)}
                className="px-5 py-3 bg-white text-slate-800 rounded-xl font-bold text-lg shadow-sm border border-slate-200 hover:border-slate-400 hover:shadow transition-all"
              >
                {word}
              </motion.button>
            ))}
          </div>

          <AnimatePresence>
            {isChecked && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-4"
              >
                {isCorrect ? (
                  <div className="text-emerald-600 font-bold flex items-center gap-2">
                    <Check size={20} /> Correct!
                  </div>
                ) : (
                  <div className="text-red-500">
                    <div className="font-bold mb-1">Not quite right.</div>
                    <div className="text-sm">The correct order is:</div>
                    <div className="font-medium text-slate-800 mt-1">
                      {Array.isArray(currentSentence?.correctOrder) ? currentSentence.correctOrder.join(" ") :
                       (currentSentence?.correctOrder || currentSentence?.answer || currentSentence?.sentence || "Unknown")}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Word Bank */}
        <div className="mb-12">
          <div className="flex flex-wrap gap-3">
            {availableWords.map((word, i) => (
              <motion.button
                layoutId={`word-bank-${word}-${i}`}
                key={`a-${i}`}
                onClick={() => handleSelectWord(word, true)}
                className="px-5 py-3 bg-blue-50 text-blue-800 rounded-xl font-bold text-lg border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-colors shadow-sm"
              >
                {word}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center border-t border-slate-100 pt-8">
          <button
            onClick={handleReset}
            disabled={selectedWords.length === 0 || isChecked}
            className="flex items-center gap-2 text-slate-500 font-medium hover:text-slate-800 disabled:opacity-30 transition-colors"
          >
            <RotateCcw size={18} /> Reset
          </button>

          {!isChecked ? (
            <button
              onClick={handleCheck}
              disabled={!canCheck}
              className="px-8 py-4 bg-slate-800 hover:bg-slate-900 focus:ring-4 ring-slate-200 text-white rounded-xl font-bold transition disabled:opacity-30"
            >
              Check Answer
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-md shadow-blue-200"
            >
              {currentIndex === sentences.length - 1 ? "Finish" : "Next Sentence"}
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
