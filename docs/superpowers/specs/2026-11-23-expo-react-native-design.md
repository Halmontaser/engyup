# Design Document: English Crescent Expo React Native Mobile App

**Date**: 2026-11-23  
**Status**: Draft (Awaiting Review & Approval)  
**Target Path**: `mobile/`  

---

## 1. Intent and Why
English Crescent is currently a React 19 + Vite web application with a Capacitor Android wrapper. The user requested an Expo React Native version ("convert in good way") to evaluate and test the application on mobile devices via Expo Go.

This document specifies a clean, modular React Native app built with Expo that connects to the existing Supabase backend, provides native mobile navigation, and delivers high-performance native interactive learning activities with an extensible fallback for full curriculum compatibility.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
1. **Turnkey Expo Project**: Create a complete Expo React Native project in `mobile/` ready to run with `npx expo start` and test in Expo Go.
2. **Native Authentication & State**: Fully native authentication (Login, Register, Session auto-refresh) powered by Supabase and `@react-native-async-storage/async-storage`.
3. **Native Curriculum Navigation**:
   - Grade overview (Grades 7–12).
   - Unit & module breakdown.
   - Lesson roadmap with progress tracking and gamification stats (XP, streaks, completed badges).
4. **Native Activity Player**:
   - Universal lesson player screen managing step index, score, progress bar, audio cues, and completion.
   - 5 core high-frequency activities implemented 100% natively:
     - `Multiple Choice (MCQ)`: Question text/audio, choices, instant feedback, explanations.
     - `Flashcards`: Flip card animation, English/Arabic, TTS speech playback.
     - `True / False`: Fact assertion, True/False buttons, score trigger.
     - `Word Order (Sentence Builder)`: Shuffled word chips, tap-to-assemble sentence slot, validation.
     - `Match Pairs`: Two-column word/translation pairing with tap selection and match animations.
5. **Universal Fallback Renderer**: An extensible `ActivityRenderer` that gracefully handles remaining activity types (CategorySort, Dictation, ConversationSim, etc.) with book references, instructions, and interactive fallback so no lesson is blocked.
6. **On-Press Arabic Explanation Component (`PressableBilingual` / `ArabicExplanationModal`)**:
   - Touch-friendly on-press interaction for students.
   - Touching any vocabulary word, sentence, or explanation pill opens an instant Arabic explanation sheet/popover with Arabic translation, grammatical context, and English text-to-speech audio pronunciation.
7. **Audio & Speech**: Native audio pronunciation using `expo-av` and `expo-speech` for Yemeni curriculum vocabulary.

### Non-Goals
1. **Admin Suite in Mobile**: The administrative interface (`/admin/*`) is strictly web/desktop; it will not be ported to React Native.
2. **Re-implementing All 20+ Niche Activities in Phase 1**: Complex DOM-heavy activities (e.g. rich canvas drawing, complex nested table drag-and-drop) will be ported incrementally in subsequent milestones.
3. **Database Schema Alteration**: Zero schema changes in Supabase; the app uses the exact existing tables (`courses`, `modules`, `lessons`, `activities`, `profiles`, `user_progress`).

### Anti-Goals
1. **Thin WebView-only Wrapper**: The user explicitly declined a plain WebView wrapper; navigation, auth, dashboard, and core activities must be genuine React Native components.
2. **Breaking Existing Web/Capacitor Code**: The existing web app in `src/` and Capacitor setup remain completely intact and functional.

---

## 3. Constraints
1. **Expo Compatibility**: Must run cleanly on Expo Go (iOS & Android) without requiring custom native compilation (`prebuild`) during development.
2. **Storage**: Session tokens and offline cache must use `@react-native-async-storage/async-storage`.
3. **Backend**: Existing Supabase project (`https://msttsebafjgzllyabsid.supabase.co`).
4. **Environment**: Node v24 LTS support.

---

## 4. Approaches Considered

### Approach 1: Native Core + Modular Activity Engine (Selected)
- Native Expo app in `mobile/` with React Native screens for Auth, Dashboard, Lesson List, and Player.
- Core 5 activities in pure React Native; modular fallback for other types.
- **Why chosen**: Delivers real native UX immediately, testable today in Expo Go, maintains complete curriculum access without delaying the release for months of activity rewriting.

### Approach 2: 100% Native Rewrite of All 20+ Activities (Rejected)
- Rewriting 20+ activity engines at once before any testing.
- **Why rejected**: Massive scope (~15,000 LOC), delayed validation, high regression risk on less frequent activities.

### Approach 3: Expo WebView Shell (Rejected)
- A pure WebView wrapper in Expo.
- **Why rejected**: Specifically declined by the user.

---

## 5. System Architecture & Component Design

### 5.1 Project Layout (`mobile/`)
```
mobile/
├── app.json                 # Expo configuration (name, slug, splash, icon, orientation)
├── package.json             # Expo dependencies
├── tsconfig.json            # React Native TS configuration
├── App.tsx                  # Root entry point with NavigationContainer & AuthProvider
├── src/
│   ├── api/
│   │   ├── supabase.ts      # Native Supabase client with AsyncStorage
│   │   └── curriculum.ts    # Fetch courses, grades, modules, lessons, activities
│   ├── context/
│   │   ├── AuthContext.tsx  # User state, login, register, logout, profile
│   │   └── ProgressContext.tsx # Progress sync, XP, streaks, completed lessons
│   ├── navigation/
│   │   ├── RootNavigator.tsx # Auth vs Main Stack
│   │   ├── TabNavigator.tsx  # Bottom tabs (Home, Courses, Profile)
│   │   └── types.ts          # Type definitions for navigation params
│   ├── screens/
│   │   ├── AuthScreen.tsx    # Login / Register with Arabic/English toggle
│   │   ├── DashboardScreen.tsx # Grade selector, streak banner, continue learning
│   │   ├── CourseDetailScreen.tsx # Unit & lesson list with status indicators
│   │   ├── LessonPlayerScreen.tsx # Activity runner, top bar, progress, bottom action
│   │   └── ProfileScreen.tsx # User XP, streak, grade info, logout
│   ├── components/
│   │   ├── ProgressBar.tsx   # Animated lesson progress indicator
│   │   ├── Header.tsx        # Branded header with back button and XP badge
│   │   ├── PressableBilingual.tsx # Word/phrase touchable for Arabic explanation
│   │   ├── ArabicExplanationModal.tsx # Bottom sheet / popup for Arabic translation & audio
│   │   └── ActivityRenderer.tsx # Activity router / factory
│   ├── activities/
│   │   ├── McqActivity.tsx
│   │   ├── FlashcardActivity.tsx
│   │   ├── TrueFalseActivity.tsx
│   │   ├── WordOrderActivity.tsx
│   │   ├── MatchPairsActivity.tsx
│   │   └── GenericActivity.tsx # Graceful fallback for remaining types
│   ├── theme/
│   │   └── colors.ts        # Emerald & Indigo palette matching Crescent brand
│   └── utils/
│       ├── audio.ts         # expo-speech & expo-av helpers
│       └── storage.ts       # AsyncStorage wrappers
```

### 5.2 Core Workflows

1. **Authentication Flow**:
   - App loads -> `AuthContext` checks `AsyncStorage` for active session -> if authenticated, mounts `TabNavigator`; otherwise mounts `AuthScreen`.
   - `AuthScreen` supports email/password login and registration with automatic profile bootstrapping.

2. **Curriculum & Lesson Flow**:
   - `DashboardScreen` fetches courses from Supabase filtered by grade.
   - User selects Grade -> `CourseDetailScreen` lists modules and lessons with completion status.
   - User taps Lesson -> `LessonPlayerScreen` loads lesson activities ordered by `order_index`.
   - `LessonPlayerScreen` steps through activities 0 to N.
   - On completion of each activity, XP is awarded and progress is pushed to Supabase (`user_progress`).
   - On final activity, a celebratory completion modal displays score, XP earned, and a button to return to the course roadmap.

3. **Native Activity Engine Details**:
   - **MCQ**: Renders prompt, optional audio play button, 4 choice buttons. Touching an option highlights green/red, plays feedback tone, enables "Continue" button.
   - **Flashcard**: Shows card front (term/phrase). Tap to flip reveals translation/explanation. Audio button triggers `expo-speech` pronunciation.
   - **True/False**: Fact statement with large green "True" and red "False" touchable controls.
   - **Word Order**: Target sentence broken into shuffled word chips. Tapping a chip moves it into the constructed sentence zone. "Check" validates the sequence.
   - **Match Pairs**: Left column (English words) and Right column (Arabic/meanings). Tapping one on each column checks for a match; successful matches light up green and lock.

---

## 6. Verification and Testing Plan

1. **Expo Bundler Verification**:
   - Run `npx expo start` to ensure bundler starts with zero compilation or missing dependency errors.
   - Verify `tsc --noEmit` clean TypeScript validation in `mobile/`.
2. **Functional Testing**:
   - Test Auth flow: Login with test credentials and verify session persists after app reload.
   - Test Curriculum navigation: Grades 7-12 load properly from Supabase.
   - Test Lesson Player: Load a sample lesson containing core activities; verify state transitions, XP increment, and completion callback.
   - Test Audio/Speech: Verify speech pronunciation triggers on flashcard/MCQ items.

---

## 7. Mobile UI Evaluation & Speed Enhancements
Analysis of the current web app reveals 4 critical mobile pain points that this Expo React Native version solves:

### 7.1 Pain Point 1: Broken Hover Tooltips on Touch Devices
- **Web Flaw**: `Tooltip.tsx` relied on `onMouseEnter` / `onMouseLeave`, rendering tooltips unusable on smartphones.
- **Mobile Native Solution**: Replaced with `PressableBilingual` and `ArabicExplanationModal`. Students tap any word, sentence, or the "شرح" pill to trigger a native bottom-sheet modal with:
  - Clear Arabic translation in large, comfortable Arabic typography (`lineHeight: 28`, 1.7x font size to prevent diacritic clipping).
  - Contextual grammatical notes and textbook vocabulary definition.
  - Native audio speaker button (`expo-speech`) to hear proper British/American pronunciation instantly.

### 7.2 Pain Point 2: Fragile HTML5 Drag-and-Drop
- **Web Flaw**: Activities used desktop `e.dataTransfer` drag events, which fail on mobile browsers and capacitive touchscreens.
- **Mobile Native Solution**: Converted to **Tap-to-Select & Tap-to-Place** chip physics:
  - `WordOrderActivity`: Tapping word bank chips instantly snaps them into sentence slots with spring feedback. Tapping a placed word returns it.
  - `MatchPairsActivity`: Tap left card (English) -> tap right card (Arabic). Matching triggers green glow and locks.

### 7.3 Pain Point 3: Thumb-Zone Ergonomics & Safe Areas
- **Web Flaw**: Navigation buttons were scattered in top corners or modal headers outside comfortable one-handed reach.
- **Mobile Native Solution**:
  - Full `SafeAreaView` wrapping for notch and home indicator clearance.
  - Pinned bottom action bar with high-contrast primary CTA buttons (min height 52px, 48px touch targets).
  - Progress bar fixed at the top with current activity step index, XP counter, and quick exit close button.

### 7.4 Pain Point 4: Performance & Low-Bandwidth Speed
- **Web Flaw**: Browser DOM repaints and CSS-in-JS overhead strained budget Android devices commonly used in Yemeni schools.
- **Mobile Native Solution**:
  - Pure React Native `StyleSheet` objects for zero runtime CSS overhead.
  - Optimistic UI updates: instant feedback on button presses (<16ms response time) before background Supabase syncing.
  - Vector icons via `@expo/vector-icons` (zero image download delay).
  - Cached lesson responses in `AsyncStorage` for rapid offline-resilient navigation.


---

## 7. What is Left to the Builder
- Exact color hex tokens matching the web app's Tailwind palette (`colors.ts`).
- Icon selection from `@expo/vector-icons` / `lucide-react-native`.
- Refinements to chip sizing and spacing for small vs large mobile screens.

---

## 8. Resolved Architecture Decisions (Builder Check)
1. **Offline Scope**: Online-first model. Auth tokens, user profile, and recent grade/course queries are cached in `AsyncStorage`. Full offline media pre-caching with SQLite is reserved for Phase 2.
2. **Fallback Activity UX (`GenericActivity`)**: Polished native card displaying lesson title, activity instruction, textbook page reference, raw prompt, and an interactive "Mark Complete" button. Zero WebView dependency needed.
3. **Multi-Tenant Context**: Replicates web `AuthContext.tsx` behavior: automatically looks up `memberships` for `tenant.slug === 'general'`, auto-assigning student membership if not present. All curriculum queries seamlessly satisfy Supabase RLS.
4. **Progress Persistence**: Upserts to Supabase table `user_progress` with `user_id`, `lesson_id`, and `status: 'completed'` on final activity completion, exactly matching `CrescentLessonView.tsx`.
5. **Media Asset Origin**: Configured via `EXPO_PUBLIC_CDN_URL=https://pub-97a5f93c54924fc18c9d3cbedfd29066.r2.dev` (matching Cloudflare R2 bucket in `.env`).
6. **On-Press Arabic Explanation**: `PressableBilingual` wraps words and sentences. On tap, it presents `ArabicExplanationModal` containing Arabic definition, contextual translation, and audio pronunciation button.

