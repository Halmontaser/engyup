import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import mime from "mime-types";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const {
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_ENDPOINT,
  R2_BUCKET_NAME,
} = process.env;

if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ENDPOINT || !R2_BUCKET_NAME) {
  console.error("Missing R2 credentials in .env.local");
  process.exit(1);
}

const s3Client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

const CONCURRENCY_LIMIT = 20;

// Media bucket path (Windows path accessible via WSL)
const MEDIA_BUCKET_PATH = "/mnt/e/Books/english_images/clean_english_project/crescent-app/public/media bucket";

const getAllFiles = (dirPath, basePath = "") => {
  let results = [];
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const relativePath = path.posix.join(basePath, file);

    if (fs.statSync(fullPath).isDirectory()) {
      results = results.concat(getAllFiles(fullPath, relativePath));
    } else {
      results.push({ fullPath, relativePath });
    }
  }
  return results;
};

const uploadFile = async (item) => {
  const { fullPath, relativePath } = item;
  const fileContent = fs.readFileSync(fullPath);
  const contentType = mime.lookup(fullPath) || "application/octet-stream";

  // Upload to R2 with path like: g7u1/images/file.png
  const params = {
    Bucket: R2_BUCKET_NAME,
    Key: relativePath,
    Body: fileContent,
    ContentType: contentType,
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
    console.log(`✅ ${relativePath}`);
  } catch (err) {
    console.error(`❌ ${relativePath}: ${err.message}`);
  }
};

const main = async () => {
  console.log(`🚀 Uploading media from ${MEDIA_BUCKET_PATH}`);
  console.log(`📦 Target: R2 bucket "${R2_BUCKET_NAME}"`);

  if (!fs.existsSync(MEDIA_BUCKET_PATH)) {
    console.error(`❌ Media bucket path not found: ${MEDIA_BUCKET_PATH}`);
    process.exit(1);
  }

  const allFiles = getAllFiles(MEDIA_BUCKET_PATH);
  console.log(`📦 Found ${allFiles.length} files to upload.`);

  const queue = [...allFiles];
  const workers = Array(CONCURRENCY_LIMIT)
    .fill(null)
    .map(async () => {
      while (queue.length > 0) {
        const item = queue.shift();
        if (item) await uploadFile(item);
      }
    });

  await Promise.all(workers);
  console.log("🎉 All files uploaded to R2.");
};

main().catch(console.error);
