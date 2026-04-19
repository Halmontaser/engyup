
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ChevronRight, HelpCircle } from "lucide-react";

import { ActivityMedia } from "./ActivityPlayer";
import { getMediaUrl } from "@/utils/assets";

export default function TransformSentenceActivity({ data, media, onComplete }: { data: any; media: ActivityMedia; onComplete?: () => void }) {
  // Schema assumption: { sentences: [{ original, answer, hint }] }
  const sentences = data.sentences || data.items || data.prompts || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);

  if (sentences.length === 0) return <div className="text-muted p-4">No transform sentences found.</div>;

  const currentSentence = sentences[currentIndex];
  
  // Fallbacks depending on specific generation property names
  let promptText = currentSentence.prompt || currentSentence.original || currentSentence.text;
  if (Array.isArray(currentSentence.initial_sentences)) {
    promptText = currentSentence.initial_sentences.join(" ");
  }
  
  const rawAnswer = currentSentence.answer || currentSentence.correct || currentSentence.correct_form || currentSentence.correct_answer || currentSentence.combined_sentence || "";
  const answerText = Array.isArray(rawAnswer) ? rawAnswer[0] : rawAnswer;

  const handleCheck = () => {
    setIsChecked(true);
    
    // Clean strings for comparison (remove punctuation, lower case, extra spaces)
    const clean = (str: string) => str.replace(/[.,!?]/g, "").trim().toLowerCase();
    
    const correct = clean(inputValue) === clean(answerText);
    setIsCorrect(correct);
    if (correct) setScore(score + 1);
  };

  const handleNext = () => {
    setInputValue("");
    setIsChecked(false);
    setIsCorrect(false);
    if (currentIndex < sentences.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
          Sentence {currentIndex + 1} of {sentences.length}
        </div>
        <div className="text-sm font-bold text-slate-500">
          Score: <span className="text-emerald-500">{score}</span> / {sentences.length}
        </div>
      </div>

      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100"
      >
        
        <div className="mb-4">
          <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Original Sentence</span>
        </div>
        
        <h3 className="text-2xl font-medium text-slate-800 mb-8">
          {promptText}
        </h3>

        {currentSentence.hint && !isChecked && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3 text-blue-800">
            <HelpCircle size={20} className="shrink-0 mt-0.5 opacity-70" />
            <div className="text-sm font-medium">{currentSentence.hint}</div>
          </div>
        )}

        <div className="relative">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isChecked}
            placeholder="Type your transformed sentence here..."
            className={`w-full p-6 text-xl rounded-2xl border-2 outline-none transition-colors resize-none min-h-[120px] ${
              isChecked 
                ? isCorrect 
                  ? "bg-emerald-50 border-emerald-500 text-emerald-800" 
                  : "bg-red-50 border-red-500 text-red-800"
                : "bg-slate-50 border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
            }`}
          />
        </div>

        <AnimatePresence>
          {isChecked && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-6"
            >
              {isCorrect ? (
                <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-700 flex items-center gap-3 font-bold">
                  <Check size={24} className="text-emerald-500" /> Perfect transformation!
                </div>
              ) : (
                <div className="p-6 bg-orange-50 rounded-2xl border border-orange-100 text-orange-800">
                  <div className="font-bold mb-2">Not quite right.</div>
                  <div className="text-sm opacity-80 uppercase tracking-widest font-bold">Correct Answer:</div>
                  <div className="text-lg font-medium mt-1">{answerText}</div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-10 flex justify-end">
          {!isChecked ? (
            <button
              onClick={handleCheck}
              disabled={inputValue.trim().length === 0}
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
