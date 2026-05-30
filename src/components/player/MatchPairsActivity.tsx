
import { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Check, X, RotateCcw, Volume2 } from "lucide-react";
import { ActivityMedia } from "./ActivityPlayer";
import { getMediaUrl } from "@/utils/assets";
import { STOP_AUDIO_EVENT } from "@/utils/audio";

interface Props {
  data: any;
  media: ActivityMedia;
  onComplete?: (correct?: boolean) => void;
}

export default function MatchPairsActivity({ data, media, onComplete }: Props) {
  const pairs = data.pairs || [];

  // Create shuffled columns independently
  // Supports both leftImage/rightImage (schema) and imgUrl (legacy data)
  const leftItems = useMemo(
    () => pairs.map((p: any, i: number) => ({ text: p.left, pairIndex: i, image: p.leftImage || p.imgUrl, audio: p.leftAudio })),
    [pairs]
  );

  const [rightItems, setRightItems] = useState(pairs.map((p: any, i: number) => ({ text: p.right, pairIndex: i, image: p.rightImage || p.imgUrl, audio: p.rightAudio })));

  useEffect(() => {
    const items = pairs.map((p: any, i: number) => ({ text: p.right, pairIndex: i, image: p.rightImage || p.imgUrl, audio: p.rightAudio }));
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setRightItems(shuffled);
  }, [pairs]);

  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [wrongPair, setWrongPair] = useState<{left: number; right: number} | null>(null);
  const [playingIdx, setPlayingIdx] = useState<string | null>(null);
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

  if (pairs.length === 0) return <div className="text-muted">No pairs found.</div>;

  const handlePlayAudio = (url?: string, id?: string) => {
    if (!url) return;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setPlayingIdx(id || url);
    const audio = new Audio(getMediaUrl(url));
    audioRef.current = audio;
    audio.onended = () => setPlayingIdx(null);
    audio.onerror = () => setPlayingIdx(null);
    audio.play().catch(() => setPlayingIdx(null));
  };

  const handleLeftClick = (index: number) => {
    if (matched.has(leftItems[index].pairIndex)) return;
    setSelectedLeft(index);
    setWrongPair(null);

    if (selectedRight !== null) {
      checkMatch(index, selectedRight);
    }
  };

  const handleRightClick = (index: number) => {
    if (matched.has(rightItems[index].pairIndex)) return;
    setSelectedRight(index);
    setWrongPair(null);

    if (selectedLeft !== null) {
      checkMatch(selectedLeft, index);
    }
  };

  const checkMatch = (leftIdx: number, rightIdx: number) => {
    if (leftItems[leftIdx].pairIndex === rightItems[rightIdx].pairIndex) {
      setMatched((prev) => {
        const newMatched = new Set(prev).add(leftItems[leftIdx].pairIndex);
        if (newMatched.size === pairs.length && onComplete) {
          onComplete(true);
        }
        return newMatched;
      });
      setSelectedLeft(null);
      setSelectedRight(null);
    } else {
      setWrongPair({ left: leftIdx, right: rightIdx });
      setTimeout(() => {
        setSelectedLeft(null);
        setSelectedRight(null);
        setWrongPair(null);
      }, 800);
    }
  };

  const handleReset = () => {
    setMatched(new Set());
    setSelectedLeft(null);
    setSelectedRight(null);
    setWrongPair(null);
  };

  const allMatched = matched.size === pairs.length;

  // Media for the pair images (fallback to data-level media)
  const pairImages = media.images || [];
  const pairAudios = media.audio || [];

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm font-semibold text-muted">
          Matched: <span className="text-[var(--success)]">{matched.size}</span> / {pairs.length}
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
        >
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      {allMatched ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-10 bg-[var(--success-light)] rounded-2xl text-center"
        >
          <Check size={40} className="mx-auto mb-4 text-[var(--success)]" />
          <h3 className="text-2xl font-bold">All Pairs Matched!</h3>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-3">
            {leftItems.map((item: any, i: number) => {
              if (!item) return null;
              if (!item.image && !item.text && !item.audio) return null;
              const isMatched = matched.has(item.pairIndex);
              const isSelected = selectedLeft === i;
              const isWrong = wrongPair?.left === i;
              const imgSrc = item.image || pairImages[item.pairIndex]?.url;
              const audSrc = item.audio || pairAudios[item.pairIndex]?.url;

              return (
                <motion.button
                  key={`l-${i}`}
                  onClick={() => handleLeftClick(i)}
                  disabled={isMatched}
                  className={`w-full text-left p-5 rounded-2xl border-2 font-medium transition-all ${
                    isMatched
                      ? "bg-[var(--success-light)] border-[var(--success)] text-[var(--success)] opacity-70"
                      : isWrong
                      ? "bg-red-50 border-red-400 text-red-700 dark:bg-red-950 dark:border-red-500 dark:text-red-300"
                      : isSelected
                      ? "bg-[var(--accent-light)] border-[var(--accent)] text-[var(--accent)] shadow-md"
                      : "bg-[var(--card)] border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-light)]"
                  }`}
                  layout
                >
                  {imgSrc ? (
                    <img
                      src={getMediaUrl(imgSrc)}
                      alt={item.text || `Item ${i + 1}`}
                      className="w-full max-h-40 rounded-lg object-contain mb-2"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : audSrc ? (
                    <div className="flex items-center justify-center py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePlayAudio(audSrc, `l-${i}`); }}
                        className={`p-3 rounded-full transition-all ${playingIdx === `l-${i}` ? "bg-blue-500 text-white" : "bg-[var(--accent-light)] text-[var(--accent)] hover:bg-blue-100"}`}
                      >
                        <Volume2 size={24} className={playingIdx === `l-${i}` ? "animate-pulse" : ""} />
                      </button>
                      <span className="ml-3 text-sm text-muted">{item.text || "Play audio"}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span>{item.text}</span>
                      {isMatched && <Check size={16} />}
                      {isWrong && <X size={16} />}
                    </div>
                  )}
                  {(imgSrc || audSrc) && (
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm">{item.text}</span>
                      {isMatched && <Check size={16} />}
                      {isWrong && <X size={16} />}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Right column */}
          <div className="space-y-3">
            {rightItems.map((item: any, i: number) => {
              if (!item) return null;
              if (!item.image && !item.text && !item.audio) return null;
              const isMatched = matched.has(item.pairIndex);
              const isSelected = selectedRight === i;
              const isWrong = wrongPair?.right === i;
              const imgSrc = item.image || pairImages[item.pairIndex]?.url;
              const audSrc = item.audio || pairAudios[item.pairIndex]?.url;

              return (
                <motion.button
                  key={`r-${i}`}
                  onClick={() => handleRightClick(i)}
                  disabled={isMatched}
                  className={`w-full text-left p-5 rounded-2xl border-2 font-medium transition-all ${
                    isMatched
                      ? "bg-[var(--success-light)] border-[var(--success)] text-[var(--success)] opacity-70"
                      : isWrong
                      ? "bg-red-50 border-red-400 text-red-700 dark:bg-red-950 dark:border-red-500 dark:text-red-300"
                      : isSelected
                      ? "bg-[var(--accent-light)] border-[var(--accent)] text-[var(--accent)] shadow-md"
                      : "bg-[var(--card)] border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-light)]"
                  }`}
                  layout
                >
                  {imgSrc ? (
                    <img
                      src={getMediaUrl(imgSrc)}
                      alt={item.text || `Item ${i + 1}`}
                      className="w-full max-h-40 rounded-lg object-contain mb-2"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : audSrc ? (
                    <div className="flex items-center justify-center py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePlayAudio(audSrc, `r-${i}`); }}
                        className={`p-3 rounded-full transition-all ${playingIdx === `r-${i}` ? "bg-blue-500 text-white" : "bg-[var(--accent-light)] text-[var(--accent)] hover:bg-blue-100"}`}
                      >
                        <Volume2 size={24} className={playingIdx === `r-${i}` ? "animate-pulse" : ""} />
                      </button>
                      <span className="ml-3 text-sm text-muted">{item.text || "Play audio"}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span>{item.text}</span>
                      {isMatched && <Check size={16} />}
                      {isWrong && <X size={16} />}
                    </div>
                  )}
                  {(imgSrc || audSrc) && (
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm">{item.text}</span>
                      {isMatched && <Check size={16} />}
                      {isWrong && <X size={16} />}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
