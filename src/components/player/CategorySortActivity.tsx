
import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { Check, X, RotateCcw, Volume2 } from "lucide-react";

import { ActivityMedia } from "./ActivityPlayer";
import { getMediaUrl } from "@/utils/assets";
import { STOP_AUDIO_EVENT } from "@/utils/audio";
import ActionBar from "./ActionBar";
import ImageViewer from "./ImageViewer";

interface Props {
  data: any;
  media: ActivityMedia;
  onComplete?: (correct?: boolean) => void;
}

export default function CategorySortActivity({ data, media, onComplete }: Props) {
  const categories: { name: string; items: string[] }[] = data.categories || [];

  const allItems = categories.flatMap((cat) =>
    (cat.items || []).map((item: string) => ({ text: item, category: cat.name }))
  );

  const [pool, setPool] = useState(() => {
    const shuffled = [...allItems];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  });

  const [buckets, setBuckets] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(categories.map((c) => [c.name, []]))
  );
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [isChecked, setIsChecked] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
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

  if (categories.length === 0)
    return <div className="text-slate-400">No categories found.</div>;

  // Media: category-level images
  const categoryImage = media.images.length > 0 ? media.images[0] : null;
  const categoryImageUrl = categoryImage?.url || data.imageUrl || data.image;

  const handlePlayAudio = (text: string) => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if ("speechSynthesis" in window) {
      setPlayingAudio(text);
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.85; u.lang = "en-US";
      u.onend = () => setPlayingAudio(null);
      u.onerror = () => setPlayingAudio(null);
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    }
  };

  const handleDrop = (item: string, targetCategory: string) => {
    if (isChecked) return;
    setPool((prev) => prev.filter((p) => p.text !== item));
    setBuckets((prev) => ({
      ...prev,
      [targetCategory]: [...prev[targetCategory], item],
    }));
  };

  const handleRemove = (item: string, category: string) => {
    if (isChecked) return;
    setBuckets((prev) => ({
      ...prev,
      [category]: prev[category].filter((i) => i !== item),
    }));
    const original = allItems.find((a) => a.text === item);
    if (original) setPool((prev) => [...prev, original]);
  };

  const handleCheck = () => {
    setIsChecked(true);
    const res: Record<string, boolean> = {};
    for (const cat of categories) {
      for (const item of buckets[cat.name]) {
        res[item] = (cat.items || []).includes(item);
      }
    }
    setResults(res);
    if (onComplete) onComplete(true);
  };

  const handleReset = () => {
    const shuffled = [...allItems];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setPool(shuffled);
    setBuckets(Object.fromEntries(categories.map((c) => [c.name, []])));
    setResults({});
    setIsChecked(false);
  };

  const allSorted = pool.length === 0;
  const correctCount = Object.values(results).filter(Boolean).length;

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm font-semibold text-slate-400">
          {isChecked
            ? `${correctCount} / ${allItems.length} correct`
            : `${pool.length} items remaining`}
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-800 transition-colors"
        >
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      {/* Category image */}
      {categoryImageUrl && (
        <div className="mb-6 flex justify-center">
          <img
            src={getMediaUrl(categoryImageUrl)}
            alt="Category reference"
            className="max-h-48 rounded-2xl object-contain bg-slate-50 border border-slate-100"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      )}

      {/* Item pool */}
      {pool.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-8 p-6 bg-white border border-slate-200 rounded-2xl">
          {pool.map((item, i) => (
            <motion.span
              key={`pool-${item.text}`}
              layout
              className="px-4 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-medium text-sm cursor-pointer hover:shadow-md transition-shadow flex items-center gap-2"
            >
              {item.text}
              <button
                onClick={(e) => { e.stopPropagation(); handlePlayAudio(item.text); }}
                className={`p-0.5 rounded-full transition-all ${playingAudio === item.text ? "text-blue-500" : "text-slate-400/50 hover:text-blue-500"}`}
              >
                <Volume2 size={12} className={playingAudio === item.text ? "animate-pulse" : ""} />
              </button>
            </motion.span>
          ))}
        </div>
      )}

      {/* Category buckets */}
      <div className={`grid gap-6 ${categories.length <= 2 ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-3"}`}>
        {categories.map((cat, i) => (
          <div
            key={cat.name || `cat-${i}`}
            className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-5 min-h-[140px]"
          >
            <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">
              {cat.name}
            </h4>

            <div className="flex flex-wrap gap-2">
              {buckets[cat.name].map((item) => (
                <motion.button
                  key={`b-${item}`}
                  layout
                  onClick={() => handleRemove(item, cat.name)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-colors ${
                    isChecked
                      ? results[item]
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                      : "bg-indigo-50 text-indigo-600 hover:bg-indigo-500 hover:text-white"
                  }`}
                >
                  {item}
                  {isChecked && (results[item] ? <Check size={14} /> : <X size={14} />)}
                </motion.button>
              ))}
            </div>

            {!isChecked && pool.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5 opacity-0 hover:opacity-100 transition-opacity duration-300">
                {pool.map((item, j) => (
                  <button
                    key={`target-${cat.name || i}-${item.text}-${j}`}
                    onClick={() => handleDrop(item.text, cat.name)}
                    className="px-2 py-1 text-xs text-slate-400-foreground hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-transparent hover:border-indigo-500 transition-all"
                  >
                    + {item.text}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Check button */}
      {allSorted && !isChecked && (
        <div className="mt-8">
          <button
            onClick={handleCheck}
            className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white shadow-lg shadow-indigo-200 transition-all"
          >
            Check Answers
          </button>
        </div>
      )}
      {isChecked && (
        <div className="mt-6">
          <ActionBar
            correct={true}
            message={`${correctCount} of ${allItems.length} correct`}
            detail="Great work! Review any mismatches above."
            onNext={() => {}}
            label="Done"
          />
        </div>
      )}
    </div>
  );
}
