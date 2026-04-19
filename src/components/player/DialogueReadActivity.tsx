
import { useState, useEffect } from "react";
import { MessageCircle, ChevronRight, Volume2 } from "lucide-react";
import { ActivityMedia } from "./ActivityPlayer";
import { getMediaUrl } from "@/utils/assets";

export default function DialogueReadActivity({ data, media, onComplete }: { data: any; media: ActivityMedia; onComplete?: () => void }) {
  const lines: { speaker: string; text: string }[] = data.lines || data.dialogue || [];
  const wordBank: string[] = data.wordBank || [];
  const [revealedCount, setRevealedCount] = useState(1);
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);

  if (lines.length === 0) return <div className="text-muted">No dialogue found.</div>;

  const handleRevealNext = () => {
    if (revealedCount < lines.length) {
      setRevealedCount(revealedCount + 1);
    }
  };

  const handleRevealAll = () => {
    setRevealedCount(lines.length);
    if (onComplete) {
      onComplete();
    }
  };

  const playAudio = (index: number) => {
    // Media.audio might contain entries like { filename: '...', url: '...' }
    // We assume they are in order if they were extracted correctly
    const audioEntry = media.audio[index];
    if (!audioEntry) return;

    setPlayingIdx(index);
    const audio = new Audio(getMediaUrl(audioEntry.url));
    audio.onended = () => setPlayingIdx(null);
    audio.onerror = () => setPlayingIdx(null);
    audio.play().catch(() => setPlayingIdx(null));
  };

  // ── Auto-play ──
  useEffect(() => {
    // Auto-play the first line on mount if audio is available
    if (lines.length > 0 && media.audio[0]) {
      const timer = setTimeout(() => {
        playAudio(0);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [media.audio, lines.length]);

  // Assign consistent colors to speakers
  const speakerColors: Record<string, string> = {};
  const colorPalette = [
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300",
    "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300",
  ];
  const bubbleColors = [
    "bg-indigo-50 border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-800",
    "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800",
    "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800",
    "bg-pink-50 border-pink-200 dark:bg-pink-950/30 dark:border-pink-800",
    "bg-cyan-50 border-cyan-200 dark:bg-cyan-950/30 dark:border-cyan-800",
  ];
  let colorIdx = 0;
  lines.forEach((line) => {
    if (!speakerColors[line.speaker]) {
      speakerColors[line.speaker] = String(colorIdx);
      colorIdx++;
    }
  });

  return (
    <div className="max-w-3xl mx-auto w-full">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle size={18} className="text-[var(--accent)]" />
        <span className="text-sm font-bold text-muted uppercase tracking-widest">
          Dialogue
        </span>
      </div>

      {/* Word bank */}
      {wordBank.length > 0 && (
        <div className="mb-6 p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl">
          <span className="text-xs font-bold text-muted uppercase tracking-widest block mb-2">
            Word Bank
          </span>
          <div className="flex flex-wrap gap-2">
            {wordBank.map((word, i) => (
              <span
                key={i}
                className="px-3 py-1.5 bg-[var(--accent-light)] text-[var(--accent)] rounded-lg text-sm font-medium"
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Dialogue lines */}
      <div className="space-y-4">
        {lines.slice(0, revealedCount).map((line, i) => {
          const cIdx = Number(speakerColors[line.speaker]) % colorPalette.length;
          const isEven = Number(speakerColors[line.speaker]) % 2 === 0;
          const hasAudio = !!media.audio[i];

          return (
            <div
              key={i}
              className={`flex ${isEven ? "justify-start" : "justify-end"}`}
              style={{
                animation: i === revealedCount - 1 ? "fadeInUp 0.3s ease" : undefined,
              }}
            >
              <div className={`max-w-[80%] ${isEven ? "" : "text-right"}`}>
                <div className={`flex items-center gap-2 mb-1.5 ${isEven ? "" : "flex-row-reverse"}`}>
                   <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${colorPalette[cIdx]}`}
                  >
                    {line.speaker}
                  </span>
                  {hasAudio && (
                    <button 
                      onClick={() => playAudio(i)}
                      className={`p-1.5 rounded-full transition-all ${
                        playingIdx === i 
                          ? "bg-[var(--accent)] text-white scale-110 shadow-md" 
                          : "text-muted hover:bg-[var(--accent-light)] hover:text-[var(--accent)]"
                      }`}
                    >
                      <Volume2 size={14} className={playingIdx === i ? "animate-pulse" : ""} />
                    </button>
                  )}
                </div>
                <div
                  className={`p-5 rounded-2xl border text-base leading-relaxed ${bubbleColors[cIdx]} ${
                    isEven ? "rounded-tl-sm" : "rounded-tr-sm"
                  } transition-all ${playingIdx === i ? "ring-2 ring-[var(--accent)]/30 border-[var(--accent)]" : ""}`}
                >
                  {line.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      {revealedCount < lines.length && (
        <div className="mt-8 flex items-center justify-between">
          <span className="text-sm text-muted">
            {revealedCount} / {lines.length} lines shown
          </span>
          <div className="flex gap-3">
            <button
              onClick={handleRevealAll}
              className="btn-ghost text-sm"
            >
              Show All
            </button>
            <button
              onClick={handleRevealNext}
              className="btn-accent flex items-center gap-2 text-sm"
            >
              Next Line <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

