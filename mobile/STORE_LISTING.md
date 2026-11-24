# Engy Up — Google Play Store Listing & Store Card

Complete metadata and assets for the Google Play Store Listing.

---

## 1. Core Listing Details

### App Title
- **English**: `Engy Up`
- **Arabic**: `Engy Up | إنجي آب التعليمي`
*(Max 30 characters)*

### Short Description
- **Arabic (Default)**:
  `تطبيق تعليمي تفاعلي لتعلم وإتقان اللغة الإنجليزية مع أنشطة ذكية وتتبع مستمر.`
- **English**:
  `Interactive English learning app with 21 smart activities & progress tracking.`
*(Max 80 characters)*

### Package Name
- `com.engyup.app`

### Full Description (Arabic)
```text
تطبيق Engy Up هو المنصة التعليمية الرقمية الرائدة لتعلم وإتقان اللغة الإنجليزية بأسلوب تفاعلي، مشوق وفعال.

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
• متوافق مع أعلى معايير حماية البيانات الشخصية والخصوصية.
```

### Full Description (English)
```text
Engy Up is the premier interactive learning platform to master English vocabulary, grammar, reading comprehension, and pronunciation through gamified, structured modules.

Key Features:
• 21 interactive activity engines: Multiple Choice, Flashcards, Match Pairs, Word Ordering, Spelling Bee, Category Sort, and more.
• Gamified progress tracking: Earn XP, level up, unlock achievements, and maintain study streaks.
• Dynamic 5-Tier Student Ranking: Beginner, Intermediate, Advanced, Scholar, Master.
• Comprehensive student dashboard: Accuracy telemetry, study minutes, lesson completion breakdown.
• 100% Ad-Free safe learning environment.
• Strict compliance with personal data protection and student privacy standards.
```

---

## 2. Categorization & Contact Details

| Field | Configuration Value |
| :--- | :--- |
| **Application Type** | App |
| **Package Name** | `com.engyup.app` |
| **Category** | Education (التعليم) |
| **Tags** | Education, Language Learning, English, Study Tools, Curriculum |
| **Content Rating** | Everyone (للجميع) — PEGI 3 / ESRB Everyone |
| **Target Audience** | 13–17 years, 18+ |
| **Contact Email** | `support@engyup.com` |
| **Privacy Policy URL** | `https://engy-up.vercel.app/privacy.html` |
| **Terms of Service URL**| `https://engy-up.vercel.app/terms.html` |
| **Account Deletion URL**| `https://engy-up.vercel.app/privacy.html#deletion` |

---

## 3. Data Safety Form Responses

- **Does app collect data?**: Yes (Name, Email, Learning Progress & XP, Crash Diagnostics).
- **Is data shared with third parties?**: No.
- **Is data encrypted in transit?**: Yes (TLS 1.3 / HTTPS).
- **Can users request account deletion?**: Yes (In-app Profile Screen > Delete Account, or web request).
- **Contains Ads?**: No.

---

## 4. Graphics & Media Specifications

| Asset | Dimensions | Requirements | Status |
| :--- | :--- | :--- | :--- |
| **App Icon** | 512 x 512 px | 32-bit PNG, max 1MB | Uploaded (`mobile/assets/icon-512.png`) |
| **Feature Graphic** | 1024 x 500 px | JPEG or 24-bit PNG, max 15MB | Uploaded (`mobile/assets/feature-graphic.png`) |
| **Phone Screenshots** | Min 2, max 8 | 16:9 or 9:16 aspect ratio (e.g. 1080x1920 px) | Dashboard, Lesson Player, Activities |
| **Tablet Screenshots** | 7" & 10" | Recommended for tablet catalog | Supported by responsive layout |

---

## 5. App Content & Policy Forms Checklist

Fill in Google Play Console under **Policy and programs > App content**:

1. **Privacy policy**:
   - URL: `https://engy-up.vercel.app/privacy.html`
2. **Ads**:
   - Answer: **No, my app does not contain ads**.
3. **App access**:
   - Answer: **All functionality is available without special access restrictions**. (Or provide demo credentials `test@engyup.com` / `Password123!` if requested).
4. **Content ratings**:
   - Email: `support@engyup.com`
   - Category: **All Other App Types** / **Educational**
   - Violence, Sex, Language, Controlled Substances, etc.: **No** to all.
   - Result: **PEGI 3 / ESRB Everyone**.
5. **Target audience and content**:
   - Target age groups: **13–17, 18 and over**.
   - Appeal to children: **No**.
6. **News apps**:
   - Answer: **No, this is not a news app**.
7. **COVID-19 contact tracing and status apps**:
   - Answer: **My app is not a publicly available COVID-19 contact tracing or status app**.
8. **Data safety**:
   - Does app collect or share user data? **Yes**.
   - Encrypted in transit? **Yes**.
   - Deletion request mechanism? **Yes** (`https://engy-up.vercel.app/privacy.html#deletion`).
   - Data types collected:
     - **Personal info**: Name (optional), Email address (account auth).
     - **App activity**: In-app learning progress, XP scores.
     - **App info and performance**: Crash logs / diagnostics.
   - Data shared with third parties? **No**.
9. **Financial features**:
   - Answer: **My app does not provide any financial features**.
10. **Government apps**:
    - Answer: **My app does not represent or provide services for any government entity**.

---

## 6. Automated Pipeline Command

To re-run synchronization and publishing automatically:
```bash
cd mobile
npm run play:publish
```
Script uses `mobile/google-service-account.json` to authenticate with Google Play Developer API (v3) and syncs:
- Core details (email, language, site)
- Arabic & English localized title, short description, full description
- 512x512 app icon
- 1024x500 feature graphic
- AAB release bundle when present

---

## 7. 1-Click Browser Auto-Filler Script for Console Forms

To fill Google Play Console policy forms with 1 click:

1. Open [Google Play Console](https://play.google.com/console) in Chrome / Edge / Firefox.
2. Select **Engy Up** (`com.engyup.app`) > **App content** (or any pending task).
3. Open Developer Tools (`F12` or `Ctrl+Shift+I`) and go to the **Console** tab.
4. Copy and paste the script from `mobile/scripts/play-console-autofill.js` (or run bookmarklet).
5. The script automatically detects the section, selects the required radio buttons/checkboxes, fills all URLs and emails, and clicks **Save** / **Next**.
