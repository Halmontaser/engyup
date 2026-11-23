# English Crescent - Expo React Native Mobile App

Native cross-platform mobile app for the English Crescent Yemeni curriculum, built with Expo and React Native.

---

## Features
- **Yemeni Curriculum Navigation**: Direct access to Grades 7 through 12, units/modules, and ordered lessons.
- **On-Press Arabic Explanations**: Tap any English word, sentence, or the `[شرح]` badge to instantly open an Arabic translation sheet with contextual definitions and native audio pronunciation.
- **Native Activity Engines**:
  - **Multiple Choice (MCQ)**: Instant touch feedback, explanations, and speech playback.
  - **Flashcards**: Tap-to-flip cards with Arabic translations, phonetics, and mastery tracking.
  - **True / False**: Large touchable cards with instant validation.
  - **Word Order (Sentence Builder)**: Tap-to-place word chips into sentence slots (no clunky drag-and-drop).
  - **Match Pairs**: Dual-column tap-to-match cards with green lock animations.
  - **Generic Activity Fallback**: Clean card displaying textbook references (e.g. `SB p.14`) and instructions for all other activity types.
- **Gamification & Progress**: Real-time XP rewards, daily streaks, and automatic progress syncing to Supabase (`user_progress`).
- **Offline Resilient**: Session tokens and curriculum data cached in `AsyncStorage`.

---

## How to Test and Run with Expo

### Prerequisites
- Node.js (v18+)
- [Expo Go](https://expo.dev/go) app installed on your physical iOS or Android phone.

### Quick Start

1. Navigate to the `mobile` directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
npm install
```

3. Start the Expo development server:
```bash
npx expo start
```

4. Scan the QR code:
- **Android**: Open the **Expo Go** app and tap "Scan QR code".
- **iOS**: Open the native **Camera** app, point it at the terminal QR code, and tap the prompt to open in Expo Go.
- **Web Simulator**: Press `w` in the terminal to test in your web browser.

---

## Architecture & Code Structure

```
mobile/
├── App.tsx                     # App entry point (SafeArea, Auth, Progress)
├── app.json                    # Expo project configuration
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration with @/* alias
└── src/
    ├── activities/             # Native activity renderers
    │   ├── FlashcardActivity.tsx
    │   ├── GenericActivity.tsx
    │   ├── MatchPairsActivity.tsx
    │   ├── McqActivity.tsx
    │   ├── TrueFalseActivity.tsx
    │   └── WordOrderActivity.tsx
    ├── api/                    # Supabase client and curriculum fetching
    │   ├── curriculum.ts
    │   └── supabase.ts
    ├── components/             # Reusable UI & activity wrapper
    │   ├── ActivityRenderer.tsx
    │   ├── ArabicExplanationModal.tsx
    │   ├── PressableBilingual.tsx
    │   └── ProgressBar.tsx
    ├── context/                # Global state providers
    │   ├── AuthContext.tsx
    │   └── ProgressContext.tsx
    ├── navigation/             # Navigation controller
    │   └── RootNavigator.tsx
    ├── screens/                # Mobile application screens
    │   ├── AuthScreen.tsx
    │   ├── CourseDetailScreen.tsx
    │   ├── DashboardScreen.tsx
    │   ├── LessonPlayerScreen.tsx
    │   └── ProfileScreen.tsx
    └── theme/                  # Yemeni Scholar design system
        └── colors.ts
```
