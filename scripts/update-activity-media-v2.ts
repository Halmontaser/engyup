import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabase = createClient(
  "https://msttsebafjgzllyabsid.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zdHRzZWJhZmpnemxseWFic2lkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjIyMDQyMywiZXhwIjoyMDkxNzk2NDIzfQ.H0Ec_0v4n1W4aLsLRObGKag5nTAIIt0ccsv88a8FAOU"
);

const R2_BASE = "https://pub-97a5f93c54924fc18c9d3cbedfd29066.r2.dev";
const MEDIA_ROOT = "/mnt/e/Books/english_images/clean_english_project/crescent-app/public/media bucket";

// Build a map: filename -> {unit, subdir}[] (a file can exist in multiple units)
function buildFilenameIndex(): Map<string, { unit: string; subdir: string }[]> {
  const index = new Map<string, { unit: string; subdir: string }[]>();
  const units = fs.readdirSync(MEDIA_ROOT).filter((d) =>
    fs.statSync(path.join(MEDIA_ROOT, d)).isDirectory()
  );

  for (const unit of units) {
    for (const subdir of ["images", "audio", "bimages"]) {
      const dir = path.join(MEDIA_ROOT, unit, subdir);
      if (!fs.existsSync(dir)) continue;
      for (const file of fs.readdirSync(dir)) {
        if (!fs.statSync(path.join(dir, file)).isFile()) continue;
        const existing = index.get(file) || [];
        existing.push({ unit, subdir });
        index.set(file, existing);
      }
    }
  }
  return index;
}

// Build lesson_id -> unit mapping from activities.json files
function buildLessonUnitMap(): Map<string, string> {
  const map = new Map<string, string>();
  const units = fs.readdirSync(MEDIA_ROOT).filter((d) =>
    fs.statSync(path.join(MEDIA_ROOT, d)).isDirectory()
  );

  for (const unit of units) {
    const jsonPath = path.join(MEDIA_ROOT, unit, "activities.json");
    if (!fs.existsSync(jsonPath)) continue;
    try {
      const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
      // Map moduleId to unit
      if (data.moduleId) {
        map.set(data.moduleId, unit);
      }
      // Map each lesson ID and title to unit
      for (const lesson of data.lessons || []) {
        if (lesson.id) {
          map.set(lesson.id, unit);
        }
        if (lesson.title) {
          map.set(`title:${lesson.title}`, unit);
        }
      }
    } catch {}
  }
  return map;
}

// Resolve a media value
function resolveMediaUrl(
  value: string,
  filenameIndex: Map<string, { unit: string; subdir: string }[]>,
  unitHint?: string
): string | null {
  if (!value || typeof value !== "string") return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return null;

  // /media/g7u1/images/file.png
  let match = value.match(/^\/?media\/([^/]+)\/(images|audio|bimages)\/(.+)$/);
  if (match) return `${R2_BASE}/${match[1]}/${match[2]}/${match[3]}`;

  // /media/audio/file.mp3
  match = value.match(/^\/?media\/audio\/(.+)$/);
  if (match && unitHint) return `${R2_BASE}/${unitHint}/audio/${match[1]}`;

  // Bare filename like "giggle.mp3" or "villa.mp3"
  const filename = value.includes("/") ? path.basename(value) : value;

  // Try with unit hint first
  if (unitHint) {
    // Check if this file exists in this unit's audio folder
    const entries = filenameIndex.get(filename);
    if (entries) {
      const unitMatch = entries.find((e) => e.unit === unitHint);
      if (unitMatch) return `${R2_BASE}/${unitMatch.unit}/${unitMatch.subdir}/${filename}`;
      // If not in this unit, use first match
      return `${R2_BASE}/${entries[0].unit}/${entries[0].subdir}/${filename}`;
    }
  }

  // Global filename lookup
  const entries = filenameIndex.get(filename);
  if (entries) return `${R2_BASE}/${entries[0].unit}/${entries[0].subdir}/${filename}`;

  return null;
}

// Recursively update media URLs
function updateMediaUrls(
  obj: any,
  filenameIndex: Map<string, { unit: string; subdir: string }[]>,
  unitHint?: string
): { updated: any; changed: boolean } {
  if (typeof obj === "string") {
    const resolved = resolveMediaUrl(obj, filenameIndex, unitHint);
    if (resolved) return { updated: resolved, changed: true };
    return { updated: obj, changed: false };
  }

  if (Array.isArray(obj)) {
    let changed = false;
    const updated = obj.map((item) => {
      const result = updateMediaUrls(item, filenameIndex, unitHint);
      if (result.changed) changed = true;
      return result.updated;
    });
    return { updated, changed };
  }

  if (obj && typeof obj === "object") {
    let changed = false;
    const updated: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const result = updateMediaUrls(value, filenameIndex, unitHint);
      if (result.changed) changed = true;
      updated[key] = result.updated;
    }
    return { updated, changed };
  }

  return { updated: obj, changed: false };
}

// Try to detect unit from activity content or lesson
function detectUnit(content: any, lessonId?: string, lessonUnitMap?: Map<string, string>): string | undefined {
  // From content JSON
  const str = JSON.stringify(content);
  const match = str.match(/g(\d+)u(\d+)/i);
  if (match) return `g${match[1]}u${match[2]}`;

  // From lesson map
  if (lessonId && lessonUnitMap?.has(lessonId)) return lessonUnitMap.get(lessonId);

  return undefined;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  console.log("Building filename index...");
  const filenameIndex = buildFilenameIndex();
  console.log(`Indexed ${filenameIndex.size} unique filenames\n`);

  console.log("Building lesson-unit map...");
  const lessonUnitMap = buildLessonUnitMap();
  console.log(`Mapped ${lessonUnitMap.size} lessons\n`);

  // Fetch all activities with lesson info
  console.log("Fetching all activities...");
  const activities: any[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabase
      .from("activities")
      .select("activity_id, title, activity_type, content, lesson_id")
      .range(offset, offset + 999);
    if (error) { console.error("Error:", error.message); return; }
    if (!data || data.length === 0) break;
    activities.push(...data);
    offset += data.length;
    if (data.length < 1000) break;
  }
  console.log(`Found ${activities.length} activities\n`);

  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < activities.length; i++) {
    const activity = activities[i];
    if (!activity.content) { skipped++; continue; }

    const unitHint = detectUnit(activity.content, activity.lesson_id, lessonUnitMap);
    const result = updateMediaUrls(activity.content, filenameIndex, unitHint);

    if (!result.changed) { skipped++; continue; }

    if (dryRun) {
      console.log(`[DRY RUN] ${activity.title} (${activity.activity_type}) unit=${unitHint || '?'}`);
      updated++;
    } else {
      const { error: updateError } = await supabase
        .from("activities")
        .update({ content: result.value })
        .eq("activity_id", activity.activity_id);

      if (updateError) {
        console.error(`FAIL: ${activity.title} - ${updateError.message}`);
      } else {
        updated++;
        if (updated % 50 === 0) console.log(`  Updated ${updated}...`);
      }
    }
  }

  console.log(`\nDone! Updated: ${updated}, Skipped: ${skipped}`);
}

main().catch(console.error);
