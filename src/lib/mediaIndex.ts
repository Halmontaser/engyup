import fs from "fs";
import path from "path";

export interface AudioEntry {
  filename: string;
  text?: string;
  audioType?: string; // "word" | "sentence" | "dialogue" | "passage"
  url: string;
}

export interface ImageEntry {
  filename: string;
  prompt?: string;
  url: string;
}

export interface ActivityMedia {
  audio: AudioEntry[];
  images: ImageEntry[];
}

// ── Singleton index, built once per server lifetime ──
let audioIndex: Map<string, AudioEntry[]> | null = null;
let imageIndex: Map<string, ImageEntry[]> | null = null;

/**
 * Parse a CSV line, handling quoted fields with commas inside.
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

/**
 * Loads JSON mapping built via script traversing Grade 7 / 8 filenames
 */
function loadMediaMapJson(
  audioIdx: Map<string, AudioEntry[]>,
  imageIdx: Map<string, ImageEntry[]>
) {
  const mapPath = path.join(process.cwd(), "public", "media", "media_map.json");
  if (!fs.existsSync(mapPath)) return;

  try {
    const raw = fs.readFileSync(mapPath, "utf-8");
    const data = JSON.parse(raw);
    for (const [activityId, media] of Object.entries(data)) {
      // The DB often prefixes activity IDs with "g7-" or the grade prefix. Ensure mappings match.
      const mappedId = activityId.startsWith("g7-") ? activityId : `g7-${activityId}`;
      const actMedia = media as { audio?: any[]; images?: any[] };
      if (actMedia.audio && actMedia.audio.length > 0) {
        audioIdx.set(mappedId, actMedia.audio);
        audioIdx.set(activityId, actMedia.audio); // Fallback
      }
      if (actMedia.images && actMedia.images.length > 0) {
        imageIdx.set(mappedId, actMedia.images);
        imageIdx.set(activityId, actMedia.images); // Fallback
      }
    }
    console.log(`[mediaIndex] Loaded JSON map for ${Object.keys(data).length} activities`);
  } catch (err) {
    console.error("[mediaIndex] Error parsing media_map.json:", err);
  }
}

function buildAudioIndex(): Map<string, AudioEntry[]> {
  const idx = new Map<string, AudioEntry[]>();
  
  const csvPath = path.join(process.cwd(), "..", "media", "audio_scripts.csv");
  if (fs.existsSync(csvPath)) {
    const raw = fs.readFileSync(csvPath, "utf-8");
    const lines = raw.split(/\r?\n/).filter((l) => l.trim());

    // Skip header: filename,text,audio_type,activity,lesson,unit,grade,activity_type
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      if (cols.length < 4) continue;

      const [filename, text, audioType, activityId] = cols;
      if (!activityId || !filename) continue;

      const entry: AudioEntry = {
        filename,
        text,
        audioType,
        url: `/media/audio/${filename}`,
      };

      const existing = idx.get(activityId);
      if (existing) {
        existing.push(entry);
      } else {
        idx.set(activityId, [entry]);
      }
    }
  }

  // Load from the JSON map file
  if (!imageIndex) {
     // we'll load both json at once
  }

  console.log(`[mediaIndex] Audio index built...`);
  return idx;
}

function buildImageIndex(): Map<string, ImageEntry[]> {
  const idx = new Map<string, ImageEntry[]>();

  const csvPath = path.join(process.cwd(), "..", "media", "image_prompts.csv");
  if (fs.existsSync(csvPath)) {
    const raw = fs.readFileSync(csvPath, "utf-8");
    const lines = raw.split(/\r?\n/).filter((l) => l.trim());

    // Skip header: filename,prompt,activity,lesson,unit,grade,activity_type
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      if (cols.length < 3) continue;

      const [filename, prompt, activityId] = cols;
      if (!activityId || !filename) continue;

      const entry: ImageEntry = {
        filename,
        prompt,
        url: `/media/images/${filename}`,
      };

      const existing = idx.get(activityId);
      if (existing) {
        existing.push(entry);
      } else {
        idx.set(activityId, [entry]);
      }
    }
  }

  console.log(`[mediaIndex] Image index built...`);
  return idx;
}

function initIndices() {
  if (!audioIndex) audioIndex = buildAudioIndex();
  if (!imageIndex) imageIndex = buildImageIndex();
  
  // also merge the json map
  loadMediaMapJson(audioIndex, imageIndex);
}

/**
 * Get all media (audio + images) for a given activity ID.
 */
export function getMediaForActivity(activityId: string): ActivityMedia {
  initIndices();

  return {
    audio: audioIndex?.get(activityId) || [],
    images: imageIndex?.get(activityId) || [],
  };
}

/**
 * Batch: get media for multiple activity IDs at once.
 * Returns a map of activityId → ActivityMedia.
 */
export function getMediaForActivities(
  activityIds: string[]
): Record<string, ActivityMedia> {
  initIndices();

  const result: Record<string, ActivityMedia> = {};
  for (const id of activityIds) {
    result[id] = {
      audio: audioIndex?.get(id) || [],
      images: imageIndex?.get(id) || [],
    };
  }
  return result;
}
