import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

const R2 = new S3Client({
  region: "auto",
  endpoint: "https://09f74d058741265fb9765e2da6423ae5.r2.cloudflarestorage.com",
  forcePathStyle: true,
  credentials: {
    accessKeyId: "c4c40954da1e465b1ab450a494d0cce1",
    secretAccessKey: "54a18cf68d8adaf7d618e0658bd528137e470f4f6995388a297e987a21a6e1d0",
  },
});

const BUCKET = "engyup";
const MEDIA_ROOT = "/mnt/e/Books/english_images/clean_english_project/crescent-app/public/media bucket";
const CONCURRENCY = 100;

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
};

interface UploadTask {
  r2Key: string;
  contentType: string;
  body: Buffer;
}

// Collect all files first
function collectFiles(): UploadTask[] {
  const tasks: UploadTask[] = [];
  const units = fs.readdirSync(MEDIA_ROOT).filter((d) =>
    fs.statSync(path.join(MEDIA_ROOT, d)).isDirectory()
  );

  for (const unit of units) {
    const unitPath = path.join(MEDIA_ROOT, unit);
    for (const subdir of ["images", "audio", "bimages"]) {
      const dir = path.join(unitPath, subdir);
      if (!fs.existsSync(dir)) continue;

      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        if (!fs.statSync(fullPath).isFile()) continue;
        const ext = path.extname(file).toLowerCase();
        const ct = CONTENT_TYPES[ext];
        if (!ct) continue;
        tasks.push({ r2Key: `${unit}/${subdir}/${file}`, contentType: ct, body: fs.readFileSync(fullPath) });
      }
    }
  }
  return tasks;
}

async function upload(task: UploadTask): Promise<boolean> {
  try {
    await R2.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: task.r2Key,
        Body: task.body,
        ContentType: task.contentType,
      })
    );
    return true;
  } catch (err: any) {
    console.error(`FAIL: ${task.r2Key} - ${err.message}`);
    return false;
  }
}

async function main() {
  console.log("Collecting files...");
  const tasks = collectFiles();
  console.log(`Found ${tasks.length} files. Uploading with concurrency ${CONCURRENCY}...\n`);

  let uploaded = 0;
  let failed = 0;
  const queue = [...tasks];

  const workers = Array(CONCURRENCY)
    .fill(null)
    .map(async () => {
      while (queue.length > 0) {
        const task = queue.shift();
        if (!task) break;
        const ok = await upload(task);
        if (ok) {
          uploaded++;
          if (uploaded % 200 === 0) console.log(`  ${uploaded}/${tasks.length} uploaded`);
        } else {
          failed++;
        }
      }
    });

  await Promise.all(workers);
  console.log(`\nDone! ${uploaded} uploaded, ${failed} failed out of ${tasks.length} total`);
  console.log(`Public URL: https://pub-97a5f93c54924fc18c9d3cbedfd29066.r2.dev/`);
}

main().catch(console.error);
