"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ChevronRight, HelpCircle } from "lucide-react";

import { ActivityMedia } from "./ActivityPlayer";

export default function TrueFalseActivity({ data, media, onComplete }: { data: any; media: ActivityMedia; onComplete?: () => void }) {
  const statements = data.statements || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);

  if (statements.length === 0) return <div>No true/false statements found.</div>;

  const currentStatement = statements[currentIndex];

  const handleSelect = (answer: boolean) => {
    if (showFeedback) return;
    setSelectedAnswer(answer);
    setShowFeedback(true);

    if (answer === currentStatement.isTrue) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setShowFeedback(false);
    if (currentIndex < statements.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-1">
          {statements.map((_: any, i: number) => (
            <div 
              key={i} 
              className={`h-2 rounded-full transition-all duration-300 ${
                i < currentIndex ? "w-8 bg-blue-500" : 
                i === currentIndex ? "w-8 bg-blue-200" : "w-4 bg-slate-200"
              }`} 
            />
          ))}
        </div>
        <div className="text-sm font-bold text-slate-500">
          Score: <span className="text-emerald-500">{score}</span> / {statements.length}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-100"
        >
          <div className="mb-10 text-center">
            <span className="text-sm font-bold uppercase tracking-widest text-slate-400">Statement</span>
            <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mt-2 leading-snug">
              "{currentStatement.statement}"
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              disabled={showFeedback}
              onClick={() => handleSelect(true)}
              className={`p-6 rounded-2xl border-2 transition-all font-bold text-xl flex flex-col items-center gap-3 ${
                showFeedback 
                  ? (selectedAnswer === true
                      ? currentStatement.isTrue ? "bg-emerald-50 border-emerald-500 text-emerald-900" : "bg-red-50 border-red-500 text-red-900"
                      : currentStatement.isTrue ? "bg-emerald-50/50 border-emerald-300 text-emerald-800" : "bg-slate-50 border-slate-200 opacity-50 text-slate-400")
                  : "bg-emerald-50/30 border-emerald-200 hover:bg-emerald-100/50 hover:border-emerald-400 text-emerald-700"
              }`}
            >
              <div className={`p-4 rounded-full ${showFeedback && selectedAnswer === true ? (currentStatement.isTrue ? "bg-emerald-500 text-white" : "bg-red-500 text-white") : "bg-white shadow-sm"}`}>
                <Check size={32} />
              </div>
              True
            </button>

            <button
              disabled={showFeedback}
              onClick={() => handleSelect(false)}
              className={`p-6 rounded-2xl border-2 transition-all font-bold text-xl flex flex-col items-center gap-3 ${
                showFeedback 
                  ? (selectedAnswer === false
                      ? !currentStatement.isTrue ? "bg-emerald-50 border-emerald-500 text-emerald-900" : "bg-red-50 border-red-500 text-red-900"
                      : !currentStatement.isTrue ? "bg-emerald-50/50 border-emerald-300 text-emerald-800" : "bg-slate-50 border-slate-200 opacity-50 text-slate-400")
                  : "bg-rose-50/30 border-rose-200 hover:bg-rose-100/50 hover:border-rose-400 text-rose-700"
              }`}
            >
              <div className={`p-4 rounded-full ${showFeedback && selectedAnswer === false ? (!currentStatement.isTrue ? "bg-emerald-500 text-white" : "bg-red-500 text-white") : "bg-white shadow-sm"}`}>
                <X size={32} />
              </div>
              False
            </button>
          </div>

          <AnimatePresence>
            {showFeedback && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 32 }}
                className="overflow-hidden"
              >
                <div className={`p-6 rounded-2xl border ${
                  selectedAnswer === currentStatement.isTrue
                    ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                    : "bg-orange-50 border-orange-100 text-orange-800"
                }`}>
                  <div className="flex items-start gap-4">
                    <HelpCircle className="shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold mb-1">
                        {selectedAnswer === currentStatement.isTrue ? "Correct!" : "Incorrect."} The statement is {currentStatement.isTrue ? "True" : "False"}.
                      </h4>
                      <p className="opacity-90">{currentStatement.explanation}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-md shadow-blue-200"
                  >
                    {currentIndex === statements.length - 1 ? "Finish" : "Next Statement"}
                    <ChevronRight size={20} />
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
