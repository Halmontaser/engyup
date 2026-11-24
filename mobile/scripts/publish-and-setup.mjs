import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getGoogleAccessToken, GooglePlayAPI } from './google-play-api.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');
const mobileRoot = path.resolve(__dirname, '..');

const SERVICE_ACCOUNT_PATH = path.join(mobileRoot, 'google-service-account.json');
const PACKAGE_NAME = 'com.engyup.app';

// Store Listing Metadata
const LISTING_DATA = {
  details: {
    contactEmail: 'support@engyup.com',
    contactWebsite: 'https://engy-up.vercel.app',
    defaultLanguage: 'ar'
  },
  listings: {
    'ar': {
      title: 'Engy Up | إنجي آب التعليمي',
      shortDescription: 'تطبيق تعليمي تفاعلي لتعلم وإتقان اللغة الإنجليزية مع أنشطة ذكية وتتبع مستمر.',
      fullDescription: `تطبيق Engy Up هو المنصة التعليمية الرقمية الرائدة لتعلم وإتقان اللغة الإنجليزية بأسلوب تفاعلي، مشوق وفعال.

✨ أبرز مميزات التطبيق:
• محتوى دراسي متكامل وشامل لمهارات اللغة الإنجليزية الأساسية.
• 21 نمطاً متنوعاً من الأنشطة التفاعلية:
  - الاختيار من متعدد (MCQ) واختبارات الفهم والاستيعاب.
  - مطابقة الأزواج وتوصيل الكلمات بالصور والتعاريف.
  - ترتيب الكلمات لبناء جمل سليمة نحوياً.
  - البطاقات التعليمية الذكية (Flashcards) لتثبيت المفردات.
  - أنشطة التهجئة (Spelling Bee) والتصنيف والملء.
• نظام تحفيزي متكامل (Gamification):
  - كسب نقاط الخبرة (XP) مع كل نشاط مكتمل.
  - تقدم في المستويات وفتح إنجازات جديدة.
  - سلاسل التعلم اليومية (Daily Streaks) للمحافظة على الاستمرارية.
• 5 رتب تعليمية لتدرج الطلاب:
  1. مبتدئ (Beginner)
  2. متقدم (Intermediate)
  3. خبير (Advanced)
  4. متفوق (Scholar)
  5. باحث (Master)
• لوحة بيانات وإحصائيات تفصيلية لمتابعة معدل الدقة، إجمالي وقت التعلم، وتفاصيل الدروس المنجزة.
• بيئة تعليمية آمنة 100% وخالية تماماً من أي إعلانات تجارية.
• متوافق مع أعلى معايير حماية البيانات الشخصية والخصوصية.`
    },
    'en-US': {
      title: 'Engy Up',
      shortDescription: 'Interactive English learning app with 21 smart activities & progress tracking.',
      fullDescription: `Engy Up is the premier interactive learning platform to master English vocabulary, grammar, reading comprehension, and pronunciation through gamified, structured modules.

Key Features:
• 21 interactive activity engines: Multiple Choice, Flashcards, Match Pairs, Word Ordering, Spelling Bee, Category Sort, and more.
• Gamified progress tracking: Earn XP, level up, unlock achievements, and maintain study streaks.
• Dynamic 5-Tier Student Ranking: Beginner, Intermediate, Advanced, Scholar, Master.
• Comprehensive student dashboard: Accuracy telemetry, study minutes, lesson completion breakdown.
• 100% Ad-Free safe learning environment.
• Strict compliance with personal data protection and student privacy standards.`
    }
  }
};

async function main() {
  console.log('=====================================================');
  console.log(` Engy Up — Automated Google Play Setup & Publisher   `);
  console.log(` Target Package: ${PACKAGE_NAME}                     `);
  console.log('=====================================================\n');

  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error(`[ERROR] Service account key not found at ${SERVICE_ACCOUNT_PATH}`);
    process.exit(1);
  }

  console.log('[1/5] Authenticating via Google Service Account JWT...');
  let auth;
  try {
    auth = await getGoogleAccessToken(SERVICE_ACCOUNT_PATH);
    console.log(`[OK] Successfully authenticated as: ${auth.email}`);
  } catch (err) {
    console.error(`[AUTH FAILED] ${err.message}`);
    process.exit(1);
  }

  const api = new GooglePlayAPI(auth.token, PACKAGE_NAME);

  console.log(`\n[2/5] Creating Edit transaction for ${PACKAGE_NAME}...`);
  const editRes = await api.createEdit();

  if (!editRes.ok) {
    console.error(`\n[API RESPONSE (${editRes.status})]:`, JSON.stringify(editRes.data, null, 2));

    if (editRes.status === 404 || (editRes.data && editRes.data.error && editRes.data.error.message && editRes.data.error.message.includes('Package not found'))) {
      console.log(`
-------------------------------------------------------------------------------
[ACTION REQUIRED IN GOOGLE PLAY CONSOLE]
Package '${PACKAGE_NAME}' is not yet initialized in your Google Play Console!

Google Play API security requires:
1. Open Google Play Console: https://play.google.com/console
2. Click "Create App":
   - App Name: Engy Up
   - Default language: Arabic (ar) or English (en-US)
   - App or Game: App
   - Free or Paid: Free
3. Invite Service Account:
   - Go to: Console > Users and permissions > Invite new users
   - Email: ${auth.email}
   - App permissions: Select 'Engy Up' (or All apps)
   - Permissions: 'Releases' (Create, edit, and roll out releases) + 'Store presence'
4. Once created, re-run this automated setup script!
-------------------------------------------------------------------------------`);
      return;
    }

    if (editRes.status === 403) {
      console.log(`
-------------------------------------------------------------------------------
[PERMISSION DENIED IN GOOGLE PLAY CONSOLE]
Service account ${auth.email} does not have permissions for ${PACKAGE_NAME}.

Fix:
1. Open Google Play Console: https://play.google.com/console
2. Navigate to "Users and permissions"
3. Grant "${auth.email}" Admin or Release permissions for "${PACKAGE_NAME}".
-------------------------------------------------------------------------------`);
      return;
    }

    process.exit(1);
  }

  const editId = editRes.data.id;
  console.log(`[OK] Edit transaction active. Edit ID: ${editId}`);

  console.log(`\n[3/5] Updating Core App Details...`);
  const detailsRes = await api.updateDetails(editId, LISTING_DATA.details);
  if (detailsRes.ok) {
    console.log(`[OK] Details updated: Email=${LISTING_DATA.details.contactEmail}, DefaultLang=${LISTING_DATA.details.defaultLanguage}`);
  } else {
    console.warn(`[WARN] Details update returned status ${detailsRes.status}:`, detailsRes.data);
  }

  console.log(`\n[4/5] Updating Localized Store Listings (Arabic & English) and Assets...`);
  const iconPath = path.join(mobileRoot, 'assets', 'icon-512.png');
  const featureGraphicPath = path.join(mobileRoot, 'assets', 'feature-graphic.png');

  for (const [lang, listing] of Object.entries(LISTING_DATA.listings)) {
    const listRes = await api.updateListing(editId, lang, listing);
    if (listRes.ok) {
      console.log(`[OK] Listing '${lang}' updated successfully: Title="${listing.title}"`);
    } else {
      console.warn(`[WARN] Listing '${lang}' update returned status ${listRes.status}:`, listRes.data);
    }

    // Upload App Icon
    if (fs.existsSync(iconPath)) {
      console.log(`Uploading 512x512 app icon for language '${lang}'...`);
      const iconRes = await api.uploadImage(editId, lang, 'icon', iconPath);
      if (iconRes.ok) {
        console.log(`[OK] App icon uploaded for '${lang}'`);
      } else {
        console.warn(`[WARN] App icon upload returned ${iconRes.status}:`, iconRes.data);
      }
    }

    // Upload Feature Graphic
    if (fs.existsSync(featureGraphicPath)) {
      console.log(`Uploading 1024x500 feature graphic for language '${lang}'...`);
      const featRes = await api.uploadImage(editId, lang, 'featureGraphic', featureGraphicPath);
      if (featRes.ok) {
        console.log(`[OK] Feature graphic uploaded for '${lang}'`);
      } else {
        console.warn(`[WARN] Feature graphic upload returned ${featRes.status}:`, featRes.data);
      }
    }
  }

  // Check for AAB bundle to upload
  console.log(`\n[5/5] Checking for compiled AAB release bundle...`);
  const potentialAabPaths = [
    path.join(mobileRoot, 'EngyUp-release.aab'),
    path.join(mobileRoot, 'app-release.aab'),
    path.join(projectRoot, 'android/app/build/outputs/bundle/release/app-release.aab')
  ];

  let uploadedBundle = false;
  for (const aabPath of potentialAabPaths) {
    if (fs.existsSync(aabPath)) {
      console.log(`Found bundle at: ${aabPath}. Uploading to Google Play...`);
      const uploadRes = await api.uploadBundle(editId, aabPath);
      if (uploadRes.ok) {
        const versionCode = uploadRes.data.versionCode;
        console.log(`[OK] Uploaded bundle with versionCode: ${versionCode}`);
        console.log(`Assigning to track 'production'...`);
        const trackRes = await api.updateTrack(editId, 'production', [versionCode]);
        if (trackRes.ok) {
          console.log(`[OK] Track updated with versionCode ${versionCode}`);
          uploadedBundle = true;
        } else {
          console.warn(`[WARN] Track assignment returned ${trackRes.status}:`, trackRes.data);
        }
      } else {
        console.warn(`[WARN] Bundle upload returned ${uploadRes.status}:`, uploadRes.data);
      }
      break;
    }
  }

  if (!uploadedBundle) {
    console.log('No compiled AAB bundle found yet (or upload skipped). Validating and committing metadata changes...');
  }

  const commitRes = await api.commitEdit(editId);
  if (commitRes.ok) {
    console.log(`\n🎉 [SUCCESS] Google Play changes committed successfully for ${PACKAGE_NAME}!`);
  } else {
    console.warn(`[WARN] Commit returned ${commitRes.status}:`, commitRes.data);
  }
}

main().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
