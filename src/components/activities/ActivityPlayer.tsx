"use client";

import FlashcardActivity from "./FlashcardActivity";
import McqActivity from "./McqActivity";
import GapFillActivity from "./GapFillActivity";
import TrueFalseActivity from "./TrueFalseActivity";
import MatchPairsActivity from "./MatchPairsActivity";
import WordOrderActivity from "./WordOrderActivity";
import ReadingPassageActivity from "./ReadingPassageActivity";
import CategorySortActivity from "./CategorySortActivity";
import DialogueReadActivity from "./DialogueReadActivity";
import TransformSentenceActivity from "./TransformSentenceActivity";
import ImageLabelActivity from "./ImageLabelActivity";
import GuessingGameActivity from "./GuessingGameActivity";
import ReadingSequenceActivity from "./ReadingSequenceActivity";
import PronunciationPracticeActivity from "./PronunciationPracticeActivity";
import ListeningComprehensionActivity from "./ListeningComprehensionActivity";
import SpellingBeeActivity from "./SpellingBeeActivity";
import DictationActivity from "./DictationActivity";
import ConversationSimActivity from "./ConversationSimActivity";
import PictureDescriptionActivity from "./PictureDescriptionActivity";
import { AlertCircle, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ErrorBoundary } from "./ErrorBoundary";

export interface ActivityMediaEntry {
  filename: string;
  url: string;
  text?: string;
  audioType?: string;
  prompt?: string;
}

export interface ActivityMedia {
  audio: ActivityMediaEntry[];
  images: ActivityMediaEntry[];
}

interface ActivityPlayerProps {
  activity: {
    id?: string;
    type: string;
    data: any;
    compensates?: string | null;
  };
  media?: ActivityMedia;
  onComplete?: (correct?: boolean) => void;
}

export default function ActivityPlayer({ activity, media, onComplete, triggerCheck }: ActivityPlayerProps) {
  if (!activity || !activity.data) {
    return <div className="p-4 text-muted">No activity data provided.</div>;
  }

  const { type, data } = activity;
  const m = media || { audio: [], images: [] };

  const renderComponent = () => {
    switch (type) {
      case "flashcard":
        return <FlashcardActivity data={data} media={m} onComplete={onComplete} />;
      case "mcq":
        return <McqActivity data={data} media={m} onComplete={onComplete} />;
      case "gap-fill":
        return <GapFillActivity data={data} media={m} onComplete={onComplete} />;
      case "true-false":
        return <TrueFalseActivity data={data} media={m} onComplete={onComplete} />;
      case "match-pairs":
        return <MatchPairsActivity data={data} media={m} onComplete={onComplete} />;
      case "word-order":
        return <WordOrderActivity data={data} media={m} onComplete={onComplete} />;
      case "reading-passage":
        return <ReadingPassageActivity data={data} media={m} onComplete={onComplete} />;
      case "category-sort":
        return <CategorySortActivity data={data} media={m} onComplete={onComplete} />;
      case "dialogue-read":
        return <DialogueReadActivity data={data} media={m} onComplete={onComplete} />;
      case "transform-sentence":
        return <TransformSentenceActivity data={data} media={m} onComplete={onComplete} />;
      case "image-label":
        return <ImageLabelActivity data={data} media={m} onComplete={onComplete} />;
      case "guessing-game":
        return <GuessingGameActivity data={data} media={m} onComplete={onComplete} />;
      case "reading-sequence":
        return <ReadingSequenceActivity data={data} media={m} onComplete={onComplete} />;
      case "sentence-builder":
        return <WordOrderActivity data={data} media={m} onComplete={onComplete} />;
      case "word-association":
        return <MatchPairsActivity data={data} media={m} onComplete={onComplete} />;
      case "pronunciation-practice":
        return <PronunciationPracticeActivity data={data} media={m} onComplete={onComplete} />;
      case "listening-comprehension":
        return <ListeningComprehensionActivity data={data} media={m} onComplete={onComplete} />;
      case "spelling-bee":
        return <SpellingBeeActivity data={data} media={m} onComplete={onComplete} />;
      case "dictation":
        return <DictationActivity data={data} media={m} onComplete={onComplete} />;
      case "conversation-sim":
        return <ConversationSimActivity data={data} media={m} onComplete={onComplete} />;
      case "picture-description":
        return <PictureDescriptionActivity data={data} media={m} onComplete={onComplete} />;
      default:
        return (
          <div className="p-8 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-start gap-4 mx-auto max-w-2xl w-full">
            <AlertCircle className="text-amber-500 mt-1 shrink-0" size={24} />
            <div>
              <h4 className="text-lg font-bold">Unsupported Activity Type</h4>
              <p className="opacity-80 mt-1">
                The renderer for{" "}
                <code className="bg-amber-200 dark:bg-amber-900 px-2 py-0.5 rounded text-sm">
                  {type}
                </code>{" "}
                is not yet built.
              </p>
              <details className="mt-4">
                <summary className="text-sm cursor-pointer font-medium mb-2 opacity-80 hover:opacity-100">
                  View Raw Data Payload
                </summary>
                <div className="text-xs bg-amber-100 dark:bg-amber-900/40 p-4 rounded-xl overflow-x-auto font-mono text-amber-900 dark:text-amber-200">
                  {JSON.stringify(data, null, 2)}
                </div>
              </details>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="relative">
      <AnimatePresence>
        {activity.compensates && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="mb-4 flex items-center justify-center"
          >
            <div className="group relative flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800 rounded-full text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter shadow-sm cursor-help hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all">
              <Info size={12} className="shrink-0" />
              <span className="truncate max-w-[200px] md:max-w-md">
                Learning Context: {activity.compensates}
              </span>
              
              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-slate-900 text-white text-[11px] font-medium leading-tight rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-64 z-50 text-center normal-case tracking-normal">
                {activity.compensates}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <ErrorBoundary key={activity.id || type}>{renderComponent()}</ErrorBoundary>
    </div>
  );
}
