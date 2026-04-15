"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, RotateCcw, ChevronRight } from "lucide-react";

import { ActivityMedia } from "./ActivityPlayer";

export default function WordOrderActivity({ data, media, onComplete }: { data: any; media: ActivityMedia; onComplete?: () => void }) {
  const sentences = useMemo(() => {
    let s = data.sentences || [];
    
    // Handle root-level correctOrder or answer properties by creating a mock sentence object
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

  useEffect(() => {
    if (sentences.length > 0 && sentences[currentIndex]) {
      const sentenceObj = sentences[currentIndex];
      
      // Handle various schema generations
      let correct: string[] = [];
      if (Array.isArray(sentenceObj.correctOrder)) {
        correct = sentenceObj.correctOrder;
      } else if (sentenceObj.correctOrder && typeof sentenceObj.correctOrder === "string") {
        correct = sentenceObj.correctOrder.split(" ");
      } else if (sentenceObj.answer && typeof sentenceObj.answer === "string") {
        correct = sentenceObj.answer.split(" ");
      } else if (Array.isArray(sentenceObj.answer)) {
        correct = sentenceObj.answer;
      } else if (sentenceObj.sentence && typeof sentenceObj.sentence === "string") {
        correct = sentenceObj.sentence.split(" ");
      }
      
      if (correct.length === 0) {
        console.warn("Could not find correctOrder array", sentenceObj);
        correct = ["Error:", "Missing", "Data"];
      }

      // Shuffle the words
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

  const handleSelectWord = (word: string, fromAvailable: boolean) => {
    if (isChecked) return;
    
    if (fromAvailable) {
      // Move from available to selected
      const index = availableWords.indexOf(word);
      const newAvail = [...availableWords];
      newAvail.splice(index, 1);
      setAvailableWords(newAvail);
      setSelectedWords([...selectedWords, word]);
    } else {
      // Move from selected to available
      const index = selectedWords.lastIndexOf(word); // use last to pick the one clicked
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
      onComplete();
    }
  };

  const currentSentence = sentences[currentIndex];
  // Calculate if we should enable check button
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
              disabled={currentIndex === sentences.length - 1 && isCorrect}
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
