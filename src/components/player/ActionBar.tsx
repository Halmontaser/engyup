import { motion } from "motion/react";
import { ArrowRight, CheckCircle2, XCircle, HelpCircle } from "lucide-react";

interface ActionBarProps {
  correct: boolean | null;
  message?: string;
  detail?: string;
  onNext: () => void;
  label?: string;
  isLast?: boolean;
}

export default function ActionBar({
  correct,
  message,
  detail,
  onNext,
  label,
  isLast = false,
}: ActionBarProps) {
  const isCorrect = correct === true;
  const isWrong = correct === false;

  const defaultMessage = isCorrect ? "Correct!" : isWrong ? "Not quite right" : "";
  const defaultDetail = isCorrect
    ? "Great work — keep it up!"
    : isWrong
    ? "Review the lesson if you're unsure."
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className="mt-5"
    >
      {/* Explanation card */}
      <div
        className={`relative overflow-hidden rounded-2xl border-2 ${
          isCorrect
            ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50"
            : isWrong
            ? "border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50"
            : "border-slate-200 bg-slate-50"
        }`}
      >
        {/* Accent bar */}
        <div
          className={`absolute top-0 left-0 right-0 h-1 ${
            isCorrect
              ? "bg-gradient-to-r from-emerald-400 to-teal-400"
              : isWrong
              ? "bg-gradient-to-r from-amber-400 to-orange-400"
              : "bg-slate-300"
          }`}
        />

        <div className="p-4 pt-5">
          <div className="flex items-start gap-3">
            <div
              className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
                isCorrect
                  ? "bg-emerald-500 text-white"
                  : isWrong
                  ? "bg-amber-500 text-white"
                  : "bg-slate-400 text-white"
              }`}
            >
              {isCorrect ? (
                <CheckCircle2 size={18} />
              ) : isWrong ? (
                <HelpCircle size={18} />
              ) : (
                <XCircle size={18} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4
                className={`font-black text-sm mb-0.5 ${
                  isCorrect ? "text-emerald-800" : isWrong ? "text-amber-800" : "text-slate-700"
                }`}
              >
                {message || defaultMessage}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {detail || defaultDetail}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Continue button */}
      <motion.button
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        onClick={onNext}
        className={`mt-3 w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg ${
          isCorrect
            ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-emerald-200"
            : isWrong
            ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-200"
            : "bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white shadow-indigo-200"
        }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {label || (isLast ? "Finish" : "Continue")}
        <motion.span
          animate={{ x: [0, 3, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ArrowRight size={18} />
        </motion.span>
      </motion.button>
    </motion.div>
  );
}
