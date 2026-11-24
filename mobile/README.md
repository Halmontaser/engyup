# Engy Up - Mobile App & Setup Guide

Cross-platform native mobile application for interactive English learning, built with Expo SDK 52, React Native 0.76, and Supabase.

---

## 1. Quick Start & Local Development

### Prerequisites
- Node.js (v18 or v20 recommended)
- [Expo Go](https://expo.dev/go) on iOS or Android (for development testing)

### Installation
```bash
cd mobile
npm install
```

### Running Locally
```bash
# Start Metro bundler (displays QR code for Expo Go)
npx expo start

# Run directly targeting Android simulator / device
npm run android

# Run web preview
npm run web
```

---

## 2. Production Build Setup (Google Play Console)

Google Play requires a signed **Android App Bundle (`.aab`)**. Expo Application Services (EAS Build) manages building and signing in the cloud.

### Step 1: Install EAS CLI and Authenticate
```bash
cd mobile
npx eas login
```

### Step 2: Configure Build Profiles (`eas.json`)
The production profile in `mobile/eas.json` is set to generate an `app-bundle`:
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "env": {
        "KOTLIN_VERSION": "1.9.25"
      }
    }
  }
}
```

### Step 3: Trigger Android Production Build
```bash
npx eas build --platform android --profile production
```
- EAS automatically provisions and secures a release keystore on Expo's encrypted servers.
- The build produces an `.aab` file ready for Google Play upload.

---

## 3. Google Play Store Submission Checklist

1. **Create Application in Google Play Console**:
   - App Name: `Engy Up`
   - Package Name: `com.engyup.app`
   - Default Language: `Arabic` or `English (US)`
   - App Category: `Education`
   - Pricing: `Free`

2. **Upload Artifact**:
   - Navigate to **Production** (or **Closed Testing**).
   - Click **Create new release**.
   - Upload the generated `.aab` file (downloadable from EAS build dashboard).

3. **Data Safety & Privacy Policy**:
   - Provide the Privacy Policy URL:
     `https://engy-up.vercel.app/privacy` (or `https://engy-up.vercel.app/privacy.html`)
   - Terms of Service URL:
     `https://engy-up.vercel.app/terms` (or `https://engy-up.vercel.app/terms.html`)
   - **Data Types Declared**:
     - *Personal Info*: Name, Email, Grade Level (Account management & curriculum matching).
     - *App Activity*: Exercise completions, XP points, streaks (App functionality & self-evaluation).
     - *Diagnostics*: Crash logs and OS version (Diagnostics & stability, anonymized).
   - **No Sensitive Data**: No financial, biometric, health, or precise location data collected.
   - **No Commercial Ads**: 100% ad-free educational environment.

4. **Account Deletion (Mandatory Play Store Requirement)**:
   - In-app account deletion is accessible from the user's **Profile Screen** (`حذف الحساب وجميع البيانات نهائياً`).
   - Web deletion request is accessible at `https://engy-up.vercel.app/privacy` under the "Data Deletion" tab.

---

## 4. Legal Compliance & Data Protection Framework

The application complies with the **Personal Data Protection Law (PDPL) Framework** and SDAIA regulatory standards:

- **Legal Basis**: Explicit user/guardian consent, performance of educational service contract, and legitimate security interests.
- **Minors & Students**: Legal guardian consent is enforced for users under 18; guardians retain the right to inspect, correct, or erase student data at any time.
- **Data Subject Rights**:
  1. Right to Know / Information (حق العلم)
  2. Right to Access (حق الوصول)
  3. Right to Correction (حق التصحيح والتحديث)
  4. Right to Destruction / Erasure (حق طلب الإتلاف)
  5. Right to Withdraw Consent (حق سحب الموافقة)
  6. Right to Data Portability (حق نقل البيانات)
- **Encryption**: TLS 1.3 transit encryption, AES-256 database encryption, Row-Level Security (RLS) data isolation.
- **Privacy Office Contact**: `privacy@engyup.com` / `support@engyup.com`

---

## 5. Mobile Project Structure

```
mobile/
├── App.tsx                     # App entry point (SafeAreaProvider, Providers, RootNavigator)
├── app.json                    # Expo config (package com.engyup.app, versionCode, plugins)
├── eas.json                    # EAS Build profiles (production app-bundle, Kotlin 1.9.25)
├── package.json                # Dependencies (@react-native-async-storage, @supabase/supabase-js, expo-*)
├── tsconfig.json               # TypeScript path alias configuration (@/*)
└── src/
    ├── activities/             # Native activity engines for Yemeni curriculum
    │   ├── CategorySortActivity.tsx
    │   ├── FlashcardActivity.tsx
    │   ├── GenericActivity.tsx
    │   ├── MatchPairsActivity.tsx
    │   ├── McqActivity.tsx
    │   ├── SpellingBeeActivity.tsx
    │   ├── TrueFalseActivity.tsx
    │   └── WordOrderActivity.tsx
    ├── api/                    # Supabase REST client & curriculum loaders
    │   ├── curriculum.ts
    │   └── supabase.ts
    ├── components/             # Shared UI components
    │   ├── ActivityRenderer.tsx
    │   ├── ArabicExplanationModal.tsx
    │   ├── PressableBilingual.tsx
    │   └── ProgressBar.tsx
    ├── context/                # Context state management
    │   ├── AuthContext.tsx     # Supabase auth, session tokens, tenant binding
    │   └── ProgressContext.tsx # XP, rank, calendar streaks, offline sync queue
    ├── navigation/             # Navigation stacks & tab bar
    │   └── RootNavigator.tsx
    ├── screens/                # User screens
    │   ├── AuthScreen.tsx      # Login & register with privacy policy notice
    │   ├── CourseDetailScreen.tsx
    │   ├── DashboardScreen.tsx # Grade selector, streak, XP, and rank level
    │   ├── LessonPlayerScreen.tsx
    │   ├── PracticeScreen.tsx
    │   └── ProfileScreen.tsx   # Stats, rank badge, in-app privacy modal, account deletion
    ├── theme/                  # Theme tokens (colors, accessible touch targets >= 48px)
    │   └── colors.ts
    └── utils/
        └── audio.ts            # Text-to-speech & audio playback utility
```
