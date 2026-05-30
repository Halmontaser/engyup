
import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { MapPin, Check, Eye, Volume2 } from "lucide-react";

import { ActivityMedia } from "./ActivityPlayer";
import { getMediaUrl } from "@/utils/assets";
import { STOP_AUDIO_EVENT } from "@/utils/audio";

interface Props {
  data: any;
  media: ActivityMedia;
  onComplete?: (correct?: boolean) => void;
}

export default function ImageLabelActivity({ data, media, onComplete }: Props) {
  const imageSrc = data.image?.src || data.imageUrl || data.image || "";
  const imageAlt = data.image?.alt || "Label this image";
  const hotspots: {
    id: string;
    x: number;
    y: number;
    label: string;
    width?: number;
    height?: number;
  }[] = data.hotspots || [];

  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [isChecked, setIsChecked] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
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

  if (hotspots.length === 0)
    return <div className="text-muted">No image labels found.</div>;

  // Media: main image from media.images
  const mainImage = media.images.length > 0 ? media.images[0] : null;
  const mainImageUrl = mainImage?.url || imageSrc;

  const handlePlayAudio = (text: string) => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if ("speechSynthesis" in window) {
      setIsSpeaking(true);
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.85; u.lang = "en-US";
      u.onend = () => setIsSpeaking(false);
      u.onerror = () => setIsSpeaking(false);
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    }
  };

  const handleChange = (id: string, value: string) => {
    if (isChecked) return;
    setInputs((prev) => ({ ...prev, [id]: value }));
  };

  const handleCheck = () => {
    setIsChecked(true);
    if (onComplete) onComplete(true);
  };

  const correctCount = hotspots.filter(
    (h) => inputs[h.id]?.trim().toLowerCase() === h.label.toLowerCase()
  ).length;

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-[var(--accent)]" />
          <span className="text-sm font-bold text-muted uppercase tracking-widest">
            Label the Image
          </span>
        </div>
        {isChecked && (
          <span className="text-sm font-bold">
            <span className="text-[var(--success)]">{correctCount}</span> /{" "}
            {hotspots.length} correct
          </span>
        )}
      </div>

      {/* Image display */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
        {mainImageUrl && (
          <div className="relative mb-6 rounded-xl overflow-hidden">
            <img
              src={getMediaUrl(mainImageUrl)}
              alt={imageAlt}
              className="w-full h-auto max-h-80 object-contain bg-slate-50 rounded-xl"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}

        {/* Label inputs as a grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hotspots.map((spot, i) => {
            const userVal = inputs[spot.id] || "";
            const isCorrect = userVal.trim().toLowerCase() === spot.label.toLowerCase();

            return (
              <div
                key={spot.id}
                className={`p-4 rounded-xl border-2 transition-colors ${
                  isChecked
                    ? isCorrect
                      ? "border-[var(--success)] bg-[var(--success-light)]"
                      : "border-red-400 bg-red-50 dark:bg-red-950/30"
                    : "border-[var(--border)]"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-muted uppercase tracking-widest">
                    Label {i + 1}
                  </label>
                  <button
                    onClick={() => handlePlayAudio(spot.label)}
                    className={`p-1 rounded-full transition-all ${isSpeaking ? "text-blue-500" : "text-muted/50 hover:text-blue-500"}`}
                  >
                    <Volume2 size={14} className={isSpeaking ? "animate-pulse" : ""} />
                  </button>
                </div>
                <input
                  type="text"
                  value={userVal}
                  onChange={(e) => handleChange(spot.id, e.target.value)}
                  disabled={isChecked}
                  placeholder="Type the label..."
                  className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-glow)] transition-all text-base"
                />
                {isChecked && !isCorrect && (
                  <div className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">
                    Answer: {spot.label}
                  </div>
                )}
                {isChecked && isCorrect && (
                  <div className="mt-2 flex items-center gap-1.5 text-sm text-[var(--success)] font-medium">
                    <Check size={14} /> Correct!
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-between items-center">
        {!isChecked ? (
          <>
            <button
              onClick={() => setShowAnswers(!showAnswers)}
              className="btn-ghost flex items-center gap-2 text-sm"
            >
              <Eye size={14} />
              {showAnswers ? "Hide Hints" : "Show Hints"}
            </button>
            <button
              onClick={handleCheck}
              disabled={Object.keys(inputs).length < hotspots.length}
              className="btn-accent"
            >
              Check Answers
            </button>
          </>
        ) : (
          <div className="w-full text-center text-muted text-sm">
            {correctCount === hotspots.length
              ? "Perfect score!"
              : "Review the correct answers above."}
          </div>
        )}
      </div>

      {/* Hints */}
      {showAnswers && !isChecked && (
        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-2">
            Available Labels
          </div>
          <div className="flex flex-wrap gap-2">
            {hotspots
              .map((h) => h.label)
              .sort()
              .map((label, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded-lg text-sm font-medium"
                >
                  {label}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
