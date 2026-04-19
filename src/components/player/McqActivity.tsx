
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, XCircle, ChevronRight, HelpCircle } from "lucide-react";
import { ActivityMedia } from "./ActivityPlayer";
import { getMediaUrl } from "@/utils/assets";

export default function McqActivity({ data, media, onComplete }: { data: any; media: ActivityMedia; onComplete?: () => void }) {
  const questions = data.questions || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);

  if (questions.length === 0) return <div>No questions found.</div>;

  const currentQ = questions[currentIndex];
  
  // Convert basic MCQ schema if it just uses "options" as strings and "answer"
  // vs complex schema with "options: [{text, isCorrect, feedback}]"
  const isComplex = typeof currentQ.options[0] === 'object';

  const handleSelect = (index: number) => {
    if (showFeedback) return;
    setSelectedOption(index);
    setShowFeedback(true);

    let isCorrect = false;
    if (isComplex) {
      isCorrect = currentQ.options[index].isCorrect;
    } else {
      isCorrect = currentQ.options[index] === currentQ.answer;
    }

    if (isCorrect) setScore(score + 1);
  };

  const handleNext = () => {
    setSelectedOption(null);
    setShowFeedback(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full">
      {/* Progress */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-1">
          {questions.map((_: any, i: number) => (
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
          Score: <span className="text-emerald-500">{score}</span> / {questions.length}
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
          {/* Question Media/Text */}
          {(() => {
            const imgSrc = currentQ.image 
              ? (currentQ.image.startsWith('http') ? currentQ.image : `/images/${currentQ.image}`)
              : media?.images?.[currentIndex]?.url;

            const audioSrc = currentQ.audio
              ? (currentQ.audio.startsWith('http') ? currentQ.audio : `/audio/${currentQ.audio}`)
              : media?.audio?.[currentIndex]?.url;

            return (
              <div className="mb-8">
                {imgSrc && (
                  <div className="mb-6 flex justify-center">
                    <img 
                      src={getMediaUrl(imgSrc)} 
                      alt="Question reference" 
                      className="max-h-64 rounded-2xl object-contain bg-slate-50 border border-slate-100" 
                    loading="lazy" />
                  </div>
                )}
                {audioSrc && (
                  <div className="mb-6 flex justify-center w-full">
                    <audio controls src={audioSrc} className="w-full max-w-md" />
                  </div>
                )}
                <h3 className="text-2xl md:text-3xl font-bold text-slate-800 leading-snug text-center md:text-left">
                  {currentQ.question || currentQ.text}
                </h3>
              </div>
            );
          })()}

          {/* Options */}
          <div className="space-y-4">
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
                  className={`w-full text-left p-6 rounded-2xl border-2 transition-all font-medium text-lg flex items-center justify-between ${stateClass}`}
                >
                  <div className="flex flex-col gap-3 w-full mr-4">
                    {optImg && (
                      <img 
                        src={getMediaUrl(optImg.startsWith('http') ? optImg : `/images/${optImg}`)} 
                        alt={`Option ${i + 1}`} 
                        className="max-h-32 rounded-lg object-contain bg-white border border-slate-100" 
                      loading="lazy" />
                    )}
                    {optAudio && (
                      <audio controls src={optAudio.startsWith('http') ? optAudio : `/audio/${optAudio}`} className="w-full max-w-[200px]" />
                    )}
                    {text && <span>{text}</span>}
                  </div>
                  {showFeedback && i === selectedOption && (
                    <div className="shrink-0">
                      {isCorrect ? <CheckCircle2 className="text-emerald-500" size={28} /> : <XCircle className="text-red-500" size={28} />}
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
                animate={{ opacity: 1, height: "auto", marginTop: 32 }}
                className="overflow-hidden"
              >
                <div className={`p-6 rounded-2xl border ${
                  (isComplex ? currentQ.options[selectedOption!].isCorrect : currentQ.options[selectedOption!] === currentQ.answer)
                    ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                    : "bg-orange-50 border-orange-100 text-orange-800"
                }`}>
                  <div className="flex items-start gap-4">
                    <HelpCircle className="shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold mb-1">
                        {(isComplex ? currentQ.options[selectedOption!].isCorrect : currentQ.options[selectedOption!] === currentQ.answer)
                          ? "Correct!" : "Not quite right."}
                      </h4>
                      <p className="opacity-90">
                        {isComplex && currentQ.options[selectedOption!].feedback 
                          ? currentQ.options[selectedOption!].feedback 
                          : currentQ.explanation || "Review the lesson text if you are unsure."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-md shadow-blue-200"
                  >
                    {currentIndex === questions.length - 1 ? "Finish" : "Next Question"}
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
