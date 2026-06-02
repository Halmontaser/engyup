
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Eye,
  ChevronRight,
  ChevronDown,
  PenLine,
  ImageIcon,
  Sparkles,
  Check,
} from "lucide-react";
import { ActivityMedia } from "./ActivityPlayer";
import { getMediaUrl } from "@/utils/assets";
import ActionBar from "./ActionBar";
import ImageViewer from "./ImageViewer";
import ImageViewer from "./ImageViewer";

interface Props {
  data: any;
  media: ActivityMedia;
  onComplete?: (correct?: boolean) => void;
}

export default function PictureDescriptionActivity({ data, media, onComplete }: Props) {
  const image: string = data.imageUrl || data.image || "";
  const promptQuestions: string[] = data.promptQuestions || [];
  const sampleAnswers: string[] = data.sampleAnswers || [];
  const keywords: string[] = data.keywords || [];

  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [revealedAnswers, setRevealedAnswers] = useState<Set<number>>(
    new Set()
  );
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);

  if (promptQuestions.length === 0)
    return <div className="text-slate-400 p-4">No questions provided.</div>;

  const handleReveal = (idx: number) => {
    setRevealedAnswers((prev) => new Set([...prev, idx]));
  };

  const handleInputChange = (idx: number, value: string) => {
    setUserAnswers({ ...userAnswers, [idx]: value });
  };

  const highlightKeywords = (text: string) => {
    if (!text || typeof text !== "string") return text || "";
    if (keywords.length === 0) return text;
    const regex = new RegExp(`\\b(${keywords.join("|")})\\b`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      keywords.some((k) => k.toLowerCase() === (part || "").toLowerCase()) ? (
        <span
          key={i}
          className="font-bold text-indigo-600 bg-indigo-50 px-1 rounded"
        >
          {part}
        </span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  const answeredCount = Object.keys(userAnswers).filter(
    (k) => userAnswers[parseInt(k)]?.trim()
  ).length;

  return (
    <div className="max-w-4xl mx-auto w-full">
      {/* Progress */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
          {answeredCount} of {promptQuestions.length} answered
        </div>
        {keywords.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 font-semibold">Keywords:</span>
            {keywords.slice(0, 5).map((kw, i) => (
              <span
                key={i}
                className="text-xs px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600 font-bold"
              >
                {kw}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image Panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-3xl border border-slate-200 overflow-hidden"
        >
          <div className="aspect-[4/3] bg-gradient-to-br from-[indigo-50] to-purple-100 dark:to-purple-950/30 flex items-center justify-center relative">
            {media.images.length > 0 ? (
              <img
                src={getMediaUrl(media.images[0].url)}
                alt="Activity image"
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
/* eslint-disable-next-line */

/* eslint-disable-next-line */

/* eslint-disable-next-line */

                  (e.target as HTMLImageElement).style.display = "none";
                  (
                    e.target as HTMLImageElement
                  ).nextElementSibling?.classList.remove("hidden");
                }}
              />
            ) : image && /\.(png|jpg|jpeg|webp|svg|gif)$/i.test(image) ? (
              <img
                src={getMediaUrl(image)}
                alt="Activity image"
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
/* eslint-disable-next-line */

/* eslint-disable-next-line */

/* eslint-disable-next-line */

                  (e.target as HTMLImageElement).style.display = "none";
                  (
                    e.target as HTMLImageElement
                  ).nextElementSibling?.classList.remove("hidden");
                }}
              />
            ) : null}
            <div
              className={`flex flex-col items-center gap-3 text-indigo-600 ${
                media.images.length > 0 || (image && /\.(png|jpg|jpeg|webp|svg|gif)$/i.test(image)) ? "hidden" : ""
              }`}
            >
              <ImageIcon size={48} strokeWidth={1.5} />
              <p className="text-sm font-semibold opacity-70">
                Picture Reference
              </p>
              {image && (
                <p className="text-xs opacity-50">Image ID: {image}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Questions Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-3xl border border-slate-200 overflow-hidden"
        >
          <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
            {promptQuestions.map((question, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`p-4 rounded-2xl border transition-all ${
                  currentQ === i
                    ? "border-indigo-500 bg-indigo-50/50"
                    : "border-slate-200"
                }`}
                onClick={() => setCurrentQ(i)}
              >
                {/* Question */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0 text-xs font-bold">
                    {i + 1}
                  </div>
                  <p className="text-sm font-semibold">{question}</p>
                </div>

                {/* User Input */}
                <textarea
                  value={userAnswers[i] || ""}
                  onChange={(e) => handleInputChange(i, e.target.value)}
                  placeholder="Write your answer..."
                  rows={2}
                  className="w-full p-3 rounded-xl text-sm bg-slate-50 border border-slate-200 outline-none resize-none focus:border-indigo-500 transition-colors"
                />

                {/* Reveal / Sample Answer */}
                {sampleAnswers[i] && (
                  <div className="mt-2">
                    {!revealedAnswers.has(i) ? (
                      <button
                        onClick={() => handleReveal(i)}
                        className="text-xs text-slate-400 flex items-center gap-1 hover:text-indigo-600 transition-colors"
                      >
                        <Eye size={14} /> Show sample answer
                      </button>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Check
                            size={14}
                            className="text-emerald-500"
                          />
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            Sample Answer
                          </span>
                        </div>
                        <p className="text-sm text-emerald-700 dark:text-emerald-300">
                          {highlightKeywords(sampleAnswers[i])}
                        </p>
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Show All Button */}
          {sampleAnswers.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex gap-3">
              <button
                onClick={() => {
                  if (!showAllAnswers) {
                    setRevealedAnswers(
                      new Set(promptQuestions.map((_, i) => i))
                    );
                    setShowAllAnswers(true);
                  } else {
                    setRevealedAnswers(new Set());
                    setShowAllAnswers(false);
                  }
                }}
                className="btn-ghost flex items-center justify-center gap-2 text-sm"
              >
                <Sparkles size={16} />
                {showAllAnswers
                  ? "Hide All Sample Answers"
                  : "Show All Sample Answers"}
              </button>
              {answeredCount >= promptQuestions.length && onComplete && (
                <ActionBar
                  correct={true}
                  message="All questions answered!"
                  onNext={() => onComplete?.(true)}
                  label="Finish Activity"
                />
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
