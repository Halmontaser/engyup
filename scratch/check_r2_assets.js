import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config({ path: '.env.local' });

const {
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_ENDPOINT,
  R2_BUCKET_NAME
} = process.env;

const s3Client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

async function checkR2() {
  console.log(`Checking R2 Bucket: ${R2_BUCKET_NAME}`);
  
  const prefixes = ['media/audio/g10', 'media/audio/g11', 'media/images/g10', 'media/images/g11'];
  
  for (const prefix of prefixes) {
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: prefix,
      MaxKeys: 5
    });
    
    try {
      const { Contents } = await s3Client.send(command);
      console.log(`Prefix ${prefix}: found ${Contents?.length || 0} items (showing up to 5)`);
      Contents?.forEach(c => console.log(` - ${c.Key}`));
    } catch (err) {
      console.error(`Error checking ${prefix}:`, err.message);
    }
  }
}

checkR2();
