import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import mime from "mime-types";
import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const {
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_ENDPOINT,
  R2_BUCKET_NAME
} = process.env;

if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ENDPOINT || !R2_BUCKET_NAME) {
  console.error("Missing required Environment Variables. Ensure R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, and R2_BUCKET_NAME are set in .env.local");
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
  const s3Key = path.posix.join("media", relativePath);

  const params = {
    Bucket: R2_BUCKET_NAME,
    Key: s3Key,
    Body: fileContent,
    ContentType: contentType,
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
    console.log(`✅ Uploaded ${s3Key}`);
  } catch (err) {
    console.error(`❌ Failed to upload ${s3Key}:`, err.message);
  }
};

const main = async () => {
  const mediaDir = path.resolve(process.cwd(), "public/media");
  console.log(`🚀 Starting high-speed upload from ${mediaDir}`);
  
  const allFiles = getAllFiles(mediaDir);
  console.log(`📦 Found ${allFiles.length} files to sync.`);

  const queue = [...allFiles];
  const workers = Array(CONCURRENCY_LIMIT).fill(null).map(async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (item) await uploadFile(item);
    }
  });

  await Promise.all(workers);
  console.log("🎉 All files synced to R2 successfully.");
};

main().catch(console.error);

