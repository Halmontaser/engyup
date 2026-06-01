import FlashcardActivity from './FlashcardActivity';
import McqActivity from './McqActivity';
import GapFillActivity from './GapFillActivity';
import TrueFalseActivity from './TrueFalseActivity';
import MatchPairsActivity from './MatchPairsActivity';
import WordOrderActivity from './WordOrderActivity';
import ReadingPassageActivity from './ReadingPassageActivity';
import CategorySortActivity from './CategorySortActivity';
import DialogueReadActivity from './DialogueReadActivity';
import TransformSentenceActivity from './TransformSentenceActivity';
import ImageLabelActivity from './ImageLabelActivity';
import GuessingGameActivity from './GuessingGameActivity';
import ReadingSequenceActivity from './ReadingSequenceActivity';
import PronunciationPracticeActivity from './PronunciationPracticeActivity';
import ListeningComprehensionActivity from './ListeningComprehensionActivity';
import SpellingBeeActivity from './SpellingBeeActivity';
import DictationActivity from './DictationActivity';
import ConversationSimActivity from './ConversationSimActivity';
import PictureDescriptionActivity from './PictureDescriptionActivity';
import { useState, useEffect, useRef } from 'react';
import { AlertCircle, MessageSquare, X, Save, VolumeX, SkipForward, BookOpen, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ErrorBoundary } from '../ErrorBoundary';
import { getMediaUrl } from "@/utils/assets";
import { stopAllAudio } from "@/utils/audio";

export interface ActivityMediaEntry {
  filename: string;
  url: string;
  text?: string;
  audioType?: string;
  prompt?: string;
  idx?: number;
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
    book_type?: string | null;
    book_page?: string | null;
  };
  media?: ActivityMedia;
  onComplete?: (correct?: boolean) => void;
  showControls?: boolean;
}

export default function ActivityPlayer({ activity, media, onComplete, showControls }: ActivityPlayerProps) {
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [saved, setSaved] = useState(false);
  const [showCompensates, setShowCompensates] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const noteKey = activity?.id ? `activity-note-${activity.id}` : null;

  useEffect(() => {
    if (noteKey) {
      const existing = localStorage.getItem(noteKey);
      if (existing) setNoteText(existing);
      else setNoteText('');
    }
  }, [noteKey]);

  useEffect(() => {
    if (showNote && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [showNote]);

  const handleSave = () => {
    if (noteKey) {
      localStorage.setItem(noteKey, noteText);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  if (!activity || !activity.data) {
    return <div className="p-4 text-slate-400">No activity data provided.</div>;
  }

  const { type, data } = activity;
  const m = media || { audio: [], images: [] };

  const renderComponent = () => {
    switch (type) {
      case 'flashcard':
        return <FlashcardActivity data={data} media={m} onComplete={onComplete} />;
      case 'mcq':
        return <McqActivity data={data} media={m} onComplete={onComplete} />;
      case 'gap-fill':
        return <GapFillActivity data={data} media={m} onComplete={onComplete} />;
      case 'true-false':
        return <TrueFalseActivity data={data} media={m} onComplete={onComplete} />;
      case 'match-pairs':
        return <MatchPairsActivity data={data} media={m} onComplete={onComplete} />;
      case 'word-order':
        return <WordOrderActivity data={data} media={m} onComplete={onComplete} />;
      case 'reading-passage':
        return <ReadingPassageActivity data={data} media={m} onComplete={onComplete} />;
      case 'category-sort':
        return <CategorySortActivity data={data} media={m} onComplete={onComplete} />;
      case 'dialogue-read':
        return <DialogueReadActivity data={data} media={m} onComplete={onComplete} />;
      case 'transform-sentence':
        return <TransformSentenceActivity data={data} media={m} onComplete={onComplete} />;
      case 'image-label':
        return <ImageLabelActivity data={data} media={m} onComplete={onComplete} />;
      case 'guessing-game':
        return <GuessingGameActivity data={data} media={m} onComplete={onComplete} />;
      case 'reading-sequence':
        return <ReadingSequenceActivity data={data} media={m} onComplete={onComplete} />;
      case 'sentence-builder':
        return <WordOrderActivity data={data} media={m} onComplete={onComplete} />;
      case 'word-association':
        return <MatchPairsActivity data={data} media={m} onComplete={onComplete} />;
      case 'pronunciation-practice':
        return <PronunciationPracticeActivity data={data} media={m} onComplete={onComplete} />;
      case 'listening-comprehension':
        return <ListeningComprehensionActivity data={data} media={m} onComplete={onComplete} />;
      case 'spelling-bee':
        return <SpellingBeeActivity data={data} media={m} onComplete={onComplete} />;
      case 'dictation':
        return <DictationActivity data={data} media={m} onComplete={onComplete} />;
      case 'conversation-sim':
        return <ConversationSimActivity data={data} media={m} onComplete={onComplete} />;
      case 'picture-description':
        return <PictureDescriptionActivity data={data} media={m} onComplete={onComplete} />;
      default:
        return (
          <div className="p-8 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-4 mx-auto max-w-2xl w-full">
            <AlertCircle className="text-amber-500 mt-1 shrink-0" size={24} />
            <div>
              <h4 className="text-lg font-bold">Unsupported Activity Type</h4>
              <p className="opacity-80 mt-1">
                The renderer for <code className="bg-amber-200 px-2 py-0.5 rounded text-sm">{type}</code> is not yet built.
              </p>
              <details className="mt-4">
                <summary className="text-sm cursor-pointer font-medium mb-2 opacity-80 hover:opacity-100">View Raw Data Payload</summary>
                <div className="text-xs bg-amber-100 p-4 rounded-xl overflow-x-auto font-mono text-amber-900">
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
      <ErrorBoundary key={activity.id || type}>{renderComponent()}</ErrorBoundary>

      {/* Floating control bar — stop voice / skip (only on first activity) */}
      {showControls && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-1.5">
          {(activity.book_type || activity.book_page) && (
            <button
              className="flex items-center gap-1.5 px-3 py-2 bg-white/90 backdrop-blur-sm border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-xl text-xs font-semibold shadow-sm transition-all"
              title="Book reference"
            >
              <BookOpen size={14} />
              <span>{[activity.book_type?.toUpperCase(), activity.book_page ? `p.${activity.book_page}` : ''].filter(Boolean).join(' ')}</span>
            </button>
          )}
          {activity.compensates && (
            <button
              onClick={() => setShowCompensates(!showCompensates)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/90 backdrop-blur-sm border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded-xl text-xs font-semibold shadow-sm transition-all"
              title="Show compensates"
            >
              <Gift size={14} />
              <span className="hidden sm:inline">Compensates</span>
            </button>
          )}
          <button
            onClick={stopAllAudio}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/90 backdrop-blur-sm border border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-slate-600 hover:text-amber-700 rounded-xl text-xs font-semibold shadow-sm transition-all"
            title="Stop voice / audio"
          >
            <VolumeX size={14} />
            <span className="hidden sm:inline">Stop Voice</span>
          </button>
          {onComplete && (
            <button
              onClick={() => onComplete(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/90 backdrop-blur-sm border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 rounded-xl text-xs font-semibold shadow-sm transition-all"
              title="Skip this activity"
            >
              <SkipForward size={14} />
              <span className="hidden sm:inline">Skip</span>
            </button>
          )}
        </div>
      )}

      {/* Floating Note Button */}
      <button
        onClick={() => setShowNote(!showNote)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 flex items-center justify-center transition-all hover:scale-105"
        title="Add note"
      >
        {showNote ? <X size={20} /> : <MessageSquare size={20} />}
        {noteKey && localStorage.getItem(noteKey) && !showNote && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
        )}
      </button>

      {/* Note Panel */}
      <AnimatePresence>
        {showNote && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
              <h4 className="font-bold text-slate-700 text-sm">My Notes</h4>
              {saved && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-emerald-600 font-medium"
                >
                  Saved!
                </motion.span>
              )}
            </div>
            <div className="p-4">
              <textarea
                ref={textareaRef}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write your notes about this activity..."
                className="w-full h-32 text-sm text-slate-700 bg-slate-50 rounded-xl border border-slate-200 p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Save size={14} />
                  Save
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compensates Dialog */}
      <AnimatePresence>
        {showCompensates && activity.compensates && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-slate-200">
              <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                <Gift size={14} className="text-emerald-500" />
                Compensates
              </h4>
              <button
                onClick={() => setShowCompensates(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-slate-600 leading-relaxed">{activity.compensates}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
