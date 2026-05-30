import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabase = createClient(
  "https://msttsebafjgzllyabsid.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zdHRzZWJhZmpnemxseWFic2lkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjIyMDQyMywiZXhwIjoyMDkxNzk2NDIzfQ.H0Ec_0v4n1W4aLsLRObGKag5nTAIIt0ccsv88a8FAOU"
);

const R2_PUBLIC = "https://pub-97a5f93c54924fc18c9d3cbedfd29066.r2.dev";
const MEDIA_ROOT = "/mnt/e/Books/english_images/clean_english_project/crescent-app/public/media bucket";

// Build a map: filename -> R2 path
function buildFilenameIndex(): Map<string, string> {
  const index = new Map<string, string>();
  const units = fs.readdirSync(MEDIA_ROOT).filter((d) =>
    fs.statSync(path.join(MEDIA_ROOT, d)).isDirectory()
  );

  for (const unit of units) {
    for (const subdir of ["images", "audio", "bimages"]) {
      const dir = path.join(MEDIA_ROOT, unit, subdir);
      if (!fs.existsSync(dir)) continue;
      for (const file of fs.readdirSync(dir)) {
        const filePath = path.join(dir, file);
        if (!fs.statSync(filePath).isFile()) continue;
        // Store both with and without extension
        const r2Path = `${unit}/${subdir}/${file}`;
        index.set(file, r2Path);
        // Also store without extension for cases like "nationality" -> "nationality.mp3"
        const ext = path.extname(file);
        if (ext) {
          const noExt = file.slice(0, -ext.length);
          if (!index.has(noExt)) index.set(noExt, r2Path);
        }
      }
    }
  }
  return index;
}

// Resolve a media value to an R2 URL
function resolveMediaUrl(value: string, filenameIndex: Map<string, string>): string | null {
  if (!value || typeof value !== "string") return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return null; // already resolved

  // Full path like /media/g11u1/images/file.png
  const pathMatch = value.match(/^\/?media\/([^/]+)\/(images|audio|bimages)\/(.+)$/);
  if (pathMatch) {
    return `${R2_PUBLIC}/${pathMatch[1]}/${pathMatch[2]}/${pathMatch[3]}`;
  }

  // Relative path like images/file.png or audio/file.mp3
  const relMatch = value.match(/^(images|audio|bimages)\/(.+)$/);
  if (relMatch) {
    // Need unit context - can't resolve without it
    return null;
  }

  // Bare filename like "giggle.mp3" or "nationality"
  const filename = value.includes("/") ? path.basename(value) : value;
  const r2Path = filenameIndex.get(filename);
  if (r2Path) {
    return `${R2_PUBLIC}/${r2Path}`;
  }

  return null;
}

// Recursively update media URLs in an object
function updateMediaUrls(obj: any, filenameIndex: Map<string, string>): { updated: any; changed: boolean } {
  if (typeof obj === "string") {
    const resolved = resolveMediaUrl(obj, filenameIndex);
    if (resolved) return { updated: resolved, changed: true };
    return { updated: obj, changed: false };
  }

  if (Array.isArray(obj)) {
    let changed = false;
    const updated = obj.map((item) => {
      const result = updateMediaUrls(item, filenameIndex);
      if (result.changed) changed = true;
      return result.updated;
    });
    return { updated, changed };
  }

  if (obj && typeof obj === "object") {
    let changed = false;
    const updated: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const result = updateMediaUrls(value, filenameIndex);
      if (result.changed) changed = true;
      updated[key] = result.updated;
    }
    return { updated, changed };
  }

  return { updated: obj, changed: false };
}

async function main() {
  console.log("Building filename index from local media...");
  const filenameIndex = buildFilenameIndex();
  console.log(`Indexed ${filenameIndex.size} filenames\n`);

  console.log("Fetching all activities from Supabase...");
  const activities: any[] = [];
  const PAGE_SIZE = 1000;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("activities")
      .select("activity_id, title, activity_type, content")
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error("Error fetching activities:", error.message);
      process.exit(1);
    }
    if (!data || data.length === 0) break;

    activities.push(...data);
    offset += data.length;
    if (data.length < PAGE_SIZE) break;
  }

  console.log(`Found ${activities.length} activities\n`);

  let updated = 0;
  let skipped = 0;
  let unresolved = 0;

  // Process in batches of 20
  const BATCH_SIZE = 20;

  for (let i = 0; i < activities.length; i += BATCH_SIZE) {
    const batch = activities.slice(i, i + BATCH_SIZE);
    const updates: { activity_id: string; content: any }[] = [];

    for (const activity of batch) {
      const content = activity.content;
      if (!content) { skipped++; continue; }

      const { updated: newContent, changed } = updateMediaUrls(content, filenameIndex);

      if (changed) {
        updates.push({ activity_id: activity.activity_id, content: newContent });
        updated++;
      } else {
        skipped++;
      }
    }

    // Apply updates
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from("activities")
        .update({ content: update.content })
        .eq("activity_id", update.activity_id);

      if (updateError) {
        console.error(`  Error updating ${update.activity_id}: ${updateError.message}`);
      }
    }

    if (i % 100 === 0 && i > 0) {
      console.log(`  Processed ${i}/${activities.length}...`);
    }
  }

  console.log(`\nDone!`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped (no changes): ${skipped}`);
}

main().catch(console.error);
