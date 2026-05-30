import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabase = createClient(
  "https://msttsebafjgzllyabsid.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zdHRzZWJhZmpnemxseWFic2lkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjIyMDQyMywiZXhwIjoyMDkxNzk2NDIzfQ.H0Ec_0v4n1W4aLsLRObGKag5nTAIIt0ccsv88a8FAOU"
);

const R2_BASE = "https://pub-97a5f93c54924fc18c9d3cbedfd29066.r2.dev";
const MEDIA_ROOT = "/mnt/e/Books/english_images/clean_english_project/crescent-app/public/media bucket";

// Build a map of all available media files in R2
function buildMediaFileMap(): Set<string> {
  const files = new Set<string>();
  const units = fs.readdirSync(MEDIA_ROOT).filter((d) =>
    fs.statSync(path.join(MEDIA_ROOT, d)).isDirectory()
  );

  for (const unit of units) {
    const unitPath = path.join(MEDIA_ROOT, unit);
    for (const subdir of ["images", "audio", "bimages"]) {
      const dir = path.join(unitPath, subdir);
      if (!fs.existsSync(dir)) continue;
      for (const file of fs.readdirSync(dir)) {
        if (fs.statSync(path.join(dir, file)).isFile()) {
          // Store as: g7u1/images/filename.png
          files.add(`${unit}/${subdir}/${file}`);
          // Also store just filename for fallback matching
          files.add(file);
        }
      }
    }
  }
  return files;
}

// Deep replace media URLs in content
function replaceMediaUrls(obj: any, unitHint?: string): { value: any; changed: boolean } {
  if (typeof obj === "string") {
    // Already an R2 URL
    if (obj.startsWith(R2_BASE)) return { value: obj, changed: false };

    // Already any https URL (external) - leave it
    if (obj.startsWith("https://") || obj.startsWith("http://")) return { value: obj, changed: false };

    // Pattern: /media/g7u1/images/filename.png
    let match = obj.match(/^\/?media\/([^/]+)\/(images|audio|bimages)\/(.+)$/);
    if (match) {
      return { value: `${R2_BASE}/${match[1]}/${match[2]}/${match[3]}`, changed: true };
    }

    // Pattern: /media/audio/filename.mp3 (no unit)
    match = obj.match(/^\/?media\/audio\/(.+)$/);
    if (match && unitHint) {
      return { value: `${R2_BASE}/${unitHint}/audio/${match[1]}`, changed: true };
    }

    // Pattern: /images/filename.png (relative)
    match = obj.match(/^\/?(images|audio|bimages)\/(.+)$/);
    if (match && unitHint) {
      return { value: `${R2_BASE}/${unitHint}/${match[1]}/${match[2]}`, changed: true };
    }

    // Bare filename like "Six.mp3" or "villa.mp3" - try to find in audio
    if (unitHint && /\.(mp3|ogg|wav|m4a)$/i.test(obj) && !obj.includes("/")) {
      return { value: `${R2_BASE}/${unitHint}/audio/${obj}`, changed: true };
    }

    // Bare image name like "gen-g7-u1-1.2-img-1" - can't resolve without extension
    return { value: obj, changed: false };
  }

  if (Array.isArray(obj)) {
    let changed = false;
    const newArr = obj.map((item) => {
      const result = replaceMediaUrls(item, unitHint);
      if (result.changed) changed = true;
      return result.value;
    });
    return { value: newArr, changed };
  }

  if (obj && typeof obj === "object") {
    let changed = false;
    const newObj: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const result = replaceMediaUrls(value, unitHint);
      if (result.changed) changed = true;
      newObj[key] = result.value;
    }
    return { value: newObj, changed };
  }

  return { value: obj, changed: false };
}

// Try to determine unit from content or title
function detectUnit(content: any, title: string): string | undefined {
  const str = JSON.stringify(content);
  // Look for unit patterns like g7u1, g10u3, etc.
  const match = str.match(/g(\d+)u(\d+)/i);
  if (match) return `g${match[1]}u${match[2]}`;
  // Try from title
  const titleMatch = title.match(/g(\d+)\s*u(\d+)/i);
  if (titleMatch) return `g${titleMatch[1]}u${titleMatch[2]}`;
  return undefined;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  console.log("Building media file map...");
  const mediaFiles = buildMediaFileMap();
  console.log(`Found ${mediaFiles.size} unique media files\n`);

  console.log("Fetching all activities from Supabase...");
  const activities: any[] = [];
  let offset = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from("activities")
      .select("activity_id, title, activity_type, content")
      .range(offset, offset + pageSize - 1);
    if (error) { console.error("Error:", error.message); return; }
    if (!data || data.length === 0) break;
    activities.push(...data);
    offset += data.length;
    if (data.length < pageSize) break;
  }

  console.log(`Found ${activities.length} activities\n`);

  let updated = 0;
  let skipped = 0;

  for (const activity of activities) {
    if (!activity.content) {
      skipped++;
      continue;
    }

    const unitHint = detectUnit(activity.content, activity.title || "");
    const result = replaceMediaUrls(activity.content, unitHint);

    if (!result.changed) {
      skipped++;
      continue;
    }

    if (dryRun) {
      console.log(`[DRY RUN] Would update: ${activity.title} (${activity.activity_type})`);
      updated++;
    } else {
      const { error: updateError } = await supabase
        .from("activities")
        .update({ content: result.value })
        .eq("activity_id", activity.activity_id);

      if (updateError) {
        console.error(`FAIL: ${activity.title} - ${updateError.message}`);
      } else {
        console.log(`Updated: ${activity.title} (${activity.activity_type})`);
        updated++;
      }
    }
  }

  console.log(`\nDone! Updated: ${updated}, Skipped: ${skipped}`);
}

main().catch(console.error);
