# Expo React Native Mobile App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a high-performance, modular React Native mobile application using Expo in `mobile/` that connects to the existing Supabase backend, provides native curriculum navigation, renders 5 core learning activities natively, and features on-press Arabic explanations and audio pronunciation for Yemeni students.

**Architecture:** Standalone Expo project structured with native navigation (AuthStack, TabNavigator, LessonPlayer), Supabase client with AsyncStorage session persistence, an extensible `ActivityRenderer` routing to pure React Native activity engines (`McqActivity`, `FlashcardActivity`, `TrueFalseActivity`, `WordOrderActivity`, `MatchPairsActivity`, `GenericActivity`), and a reusable `PressableBilingual` component hooked into `ArabicExplanationModal`.

**Tech Stack:** React Native, Expo SDK (TypeScript), `@supabase/supabase-js`, `@react-native-async-storage/async-storage`, `expo-av`, `expo-speech`, `@expo/vector-icons`, `react-native-safe-area-context`.

**Spec:** `docs/superpowers/specs/2026-11-23-expo-react-native-design.md`

## Global Constraints
- Location: Standalone directory `mobile/` with independent `package.json`, `app.json`, and `tsconfig.json`.
- Expo Go compatible: Zero custom native C++/Java/Obj-C code; run purely via standard Expo Go client.
- Auth & Storage: Must use `@react-native-async-storage/async-storage` for Supabase auth and local caching.
- Media Origin: All audio and images must resolve against `EXPO_PUBLIC_CDN_URL=https://pub-97a5f93c54924fc18c9d3cbedfd29066.r2.dev`.
- Multi-Tenant RLS: Automatically bind users to `tenant.slug === 'general'` matching web `AuthContext.tsx`.
- Typography & Layout: Touch targets >= 48px; Arabic line height >= 1.6 to prevent diacritic clipping; full `SafeAreaView` support.

## Review Focus
1. **Network Disconnection During Lesson**: Lesson activity state and progress must remain intact locally if network drops, syncing to `user_progress` when connection resumes.
2. **Missing Media Assets**: If an image or audio URL is null or returns 404, the activity must display a fallback icon and allow lesson completion without crashing.
3. **Arabic Diacritic Rendering**: Arabic text in explanations and cards must render with adequate line height (`lineHeight: 28`+) and `writingDirection: 'rtl'` to avoid clipped diacritics.
4. **Empty Activity Arrays**: Lessons with 0 activities or invalid schemas must trigger `GenericActivity` fallback instead of an unhandled exception or blank screen.
5. **Session Expiration**: Expired auth tokens must auto-refresh via Supabase client without resetting active lesson state.

---

## Tasks

### Task 1: Scaffold Expo Project Structure & Core Dependencies

**Files:**
- Create: `mobile/package.json`
- Create: `mobile/app.json`
- Create: `mobile/tsconfig.json`
- Create: `mobile/.gitignore`

**Interfaces:**
- Produces: Project configuration and module manifest ready for React Native compilation.

- [ ] **Step 1: Write `mobile/package.json` with Expo dependencies**
Include: `expo`, `react`, `react-native`, `@supabase/supabase-js`, `@react-native-async-storage/async-storage`, `expo-speech`, `expo-av`, `@expo/vector-icons`, `react-native-safe-area-context`, `typescript`, `@types/react`.

- [ ] **Step 2: Write `mobile/app.json`**
Configure name ("English Crescent"), slug ("crescent-mobile"), orientation ("portrait"), splash screen, and `expo-speech` plugin configuration.

- [ ] **Step 3: Write `mobile/tsconfig.json` & `mobile/.gitignore`**
Configure TypeScript extending `expo/tsconfig.base` with path alias `@/*` mapping to `./src/*`.

- [ ] **Step 4: Verify directory and package dependencies**
Run: `node -e "const p = require('./mobile/package.json'); console.log(p.name, p.dependencies['@supabase/supabase-js'])"`
Expected: `crescent-mobile ^2.101.1`

- [ ] **Step 5: Commit**
```bash
git add mobile/package.json mobile/app.json mobile/tsconfig.json mobile/.gitignore
git commit -m "feat(mobile): scaffold expo project structure"
```

---

### Task 2: Theme Tokens, Supabase Client & Context Providers

**Files:**
- Create: `mobile/src/theme/colors.ts`
- Create: `mobile/src/api/supabase.ts`
- Create: `mobile/src/context/AuthContext.tsx`
- Create: `mobile/src/context/ProgressContext.tsx`

**Interfaces:**
- Produces:
  - `colors`: Semantic color constants (Yemeni Agate Gold `#F59E0B`, Oasis Emerald `#10B981`, Arabian Sea Cyan `#06B6D4`, Night Navy `#0F172A`).
  - `supabase`: Initialized client using `AsyncStorage`.
  - `useAuth()`: `{ user, profile, loading, signIn, signUp, signOut, activeTenant }`.
  - `useProgress()`: `{ progress, xp, streak, completeLesson, addXp }`.

- [ ] **Step 1: Create `mobile/src/theme/colors.ts`**
Export primary, accent, surface, border, and text tokens adhering to the Yemeni Scholar palette and WCAG AA contrast ratios.

- [ ] **Step 2: Create `mobile/src/api/supabase.ts`**
Initialize Supabase client with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `auth.storage = AsyncStorage`. Provide helper `getMediaUrl(path: string): string` utilizing `https://pub-97a5f93c54924fc18c9d3cbedfd29066.r2.dev`.

- [ ] **Step 3: Create `mobile/src/context/AuthContext.tsx`**
Implement authentication listener, `signInWithPassword`, `signUp`, `signOut`, profile sync, and auto-membership binding to tenant slug `general`.

- [ ] **Step 4: Create `mobile/src/context/ProgressContext.tsx`**
Implement lesson completion handler upserting to `user_progress` with `(user_id, lesson_id, status: 'completed')`, maintaining local XP counter and streak calculations.

- [ ] **Step 5: Verify Supabase client syntax and exports**
Run: `npx tsc --noEmit --project mobile/tsconfig.json`
Expected: Clean compilation with 0 errors in `src/theme` and `src/api`.

- [ ] **Step 6: Commit**
```bash
git add mobile/src/theme mobile/src/api mobile/src/context
git commit -m "feat(mobile): add theme, supabase client and auth/progress contexts"
```

---

### Task 3: On-Press Arabic Explanation Component (`PressableBilingual` & `ArabicExplanationModal`)

**Files:**
- Create: `mobile/src/components/ArabicExplanationModal.tsx`
- Create: `mobile/src/components/PressableBilingual.tsx`

**Interfaces:**
- Consumes: `colors` from `@/theme/colors`, `expo-speech`.
- Produces:
  - `<ArabicExplanationModal visible={boolean} title={string} explanation={string} vocabulary={string[]} audioText={string} onClose={() => void} />`
  - `<PressableBilingual text={string} explanation={string} audioPrompt?: string />`

- [ ] **Step 1: Create `mobile/src/components/ArabicExplanationModal.tsx`**
Implement modal with:
- Dark overlay and smooth slide-up card.
- English term and phonetic badge.
- Instant Arabic explanation in `Noto Sans Arabic` typography (`lineHeight: 28`, RTL text).
- Audio speaker icon button invoking `expo-speech` with language `'en-US'`.
- "فهمت / Got it" dismiss button.

- [ ] **Step 2: Create `mobile/src/components/PressableBilingual.tsx`**
Implement inline text wrapper:
- Highlights words with subtle dotted underline or transliteration badge.
- Touch trigger opening `ArabicExplanationModal`.
- Includes small "شرح" (Explain) pill for entire sentences.

- [ ] **Step 3: Verify TypeScript typing**
Run: `npx tsc --noEmit --project mobile/tsconfig.json`
Expected: 0 errors in `src/components/PressableBilingual.tsx`.

- [ ] **Step 4: Commit**
```bash
git add mobile/src/components/ArabicExplanationModal.tsx mobile/src/components/PressableBilingual.tsx
git commit -m "feat(mobile): add on-press arabic explanation modal and pressable wrapper"
```

---

### Task 4: Curriculum API & Navigation Shell

**Files:**
- Create: `mobile/src/api/curriculum.ts`
- Create: `mobile/src/screens/AuthScreen.tsx`
- Create: `mobile/src/screens/DashboardScreen.tsx`
- Create: `mobile/src/screens/CourseDetailScreen.tsx`
- Create: `mobile/src/screens/ProfileScreen.tsx`

**Interfaces:**
- Consumes: `supabase` from `@/api/supabase`, `useAuth()`.
- Produces:
  - `getGradesCourses(tenantId: string)`: Returns courses for Grades 7–12 with module counts.
  - `getCourseWithLessons(courseId: string)`: Returns modules and lessons for selected course.
  - Screen components for Auth, Dashboard, CourseDetail, and Profile.

- [ ] **Step 1: Create `mobile/src/api/curriculum.ts`**
Implement Supabase query methods:
- `fetchCourses(tenantId: string)`: Select courses where title or code includes 'grade'.
- `fetchCourseModules(courseId: string)`: Select modules with lessons sorted by `order_index`.
- `fetchLessonActivities(lessonId: string)`: Select activities sorted by `order_index`.

- [ ] **Step 2: Create `mobile/src/screens/AuthScreen.tsx`**
Bilingual student login & register screen with email/password inputs, role badge, loading spinner, and error banners.

- [ ] **Step 3: Create `mobile/src/screens/DashboardScreen.tsx`**
Student dashboard featuring:
- Top greeting with active grade badge and XP counter.
- Daily streak tracker (Flame icon).
- 6 Grade cards (Grade 7 through Grade 12) showing unit count, progress indicator, and "ادخل المنهج" button.

- [ ] **Step 4: Create `mobile/src/screens/CourseDetailScreen.tsx`**
Roadmap view displaying units (modules) and numbered lesson cards with completion badges and "ابدأ الدرس" action.

- [ ] **Step 5: Create `mobile/src/screens/ProfileScreen.tsx`**
Student profile showing account details, governorate/school info, total XP, mastered lessons counter, and sign out button.

- [ ] **Step 6: Verify TypeScript typing**
Run: `npx tsc --noEmit --project mobile/tsconfig.json`
Expected: Clean compilation with 0 errors across all screens.

- [ ] **Step 7: Commit**
```bash
git add mobile/src/api/curriculum.ts mobile/src/screens
git commit -m "feat(mobile): add curriculum api and navigation screens"
```

---

### Task 5: Core Native Activity Engines

**Files:**
- Create: `mobile/src/activities/McqActivity.tsx`
- Create: `mobile/src/activities/FlashcardActivity.tsx`
- Create: `mobile/src/activities/TrueFalseActivity.tsx`
- Create: `mobile/src/activities/WordOrderActivity.tsx`
- Create: `mobile/src/activities/MatchPairsActivity.tsx`
- Create: `mobile/src/activities/GenericActivity.tsx`

**Interfaces:**
- Activity Props contract: `{ data: any, media?: any, onComplete: (correct?: boolean) => void }`
- Consumes: `PressableBilingual`, `colors`, `expo-speech`.

- [ ] **Step 1: Create `mobile/src/activities/McqActivity.tsx`**
Multiple Choice question renderer:
- Displays question prompt with `PressableBilingual` for Arabic explanations.
- Audio play button for listening questions.
- 4 touchable choice cards. Selection reveals correct (green) or incorrect (red) state.
- Primary "Check / Continue" button pinned at bottom.

- [ ] **Step 2: Create `mobile/src/activities/FlashcardActivity.tsx`**
Interactive vocabulary flashcard:
- Card surface showing English term + speaker button.
- Tap card to flip and reveal Arabic translation and usage sentence.
- "I know this" / "Review again" mastery buttons.

- [ ] **Step 3: Create `mobile/src/activities/TrueFalseActivity.tsx`**
True / False statement activity:
- Statement card with bilingual helper.
- Prominent Green "True (صح)" and Red "False (خطأ)" touchable buttons.
- Instant feedback animation and explanation card.

- [ ] **Step 4: Create `mobile/src/activities/WordOrderActivity.tsx`**
Sentence builder using tap-to-place chips:
- Upper target sentence slot showing currently placed words in sequence.
- Lower word bank with randomized word chips.
- Tapping a bank chip moves it to target slot; tapping slot chip returns it.
- "Check Sentence" button validates correct word ordering.

- [ ] **Step 5: Create `mobile/src/activities/MatchPairsActivity.tsx`**
Two-column pair matching:
- Left column (English words) and Right column (Arabic translations / definitions).
- Tapping item on left then right checks match.
- Correct matches lock in emerald green with checkmark; wrong matches flash amber and reset.

- [ ] **Step 6: Create `mobile/src/activities/GenericActivity.tsx`**
Polished fallback renderer for remaining 16 activity types:
- Card with textbook icon, book reference (e.g. "SB p.12"), activity instruction, and raw prompt.
- `PressableBilingual` explanation support.
- "Mark as Complete / إنهاء النشاط" button.

- [ ] **Step 7: Verify TypeScript typing**
Run: `npx tsc --noEmit --project mobile/tsconfig.json`
Expected: 0 errors across all activity files.

- [ ] **Step 8: Commit**
```bash
git add mobile/src/activities
git commit -m "feat(mobile): implement core native activity engines"
```

---

### Task 6: Lesson Player Screen, ActivityRenderer & Completion Flow

**Files:**
- Create: `mobile/src/components/ActivityRenderer.tsx`
- Create: `mobile/src/components/ProgressBar.tsx`
- Create: `mobile/src/screens/LessonPlayerScreen.tsx`

**Interfaces:**
- Consumes: All activity engines from `@/activities/*`, `useProgress()`.
- Produces: Full lesson runner managing activity sequencing, score, and completion.

- [ ] **Step 1: Create `mobile/src/components/ProgressBar.tsx`**
Smooth animated progress bar showing current activity index / total activities and XP counter.

- [ ] **Step 2: Create `mobile/src/components/ActivityRenderer.tsx`**
Factory component routing activity types (`multiple-choice` -> `McqActivity`, `flashcard` -> `FlashcardActivity`, `true-false` -> `TrueFalseActivity`, `word-order` / `sentence-builder` -> `WordOrderActivity`, `match-pairs` / `word-association` -> `MatchPairsActivity`, default -> `GenericActivity`).

- [ ] **Step 3: Create `mobile/src/screens/LessonPlayerScreen.tsx`**
Full lesson player coordinating:
- Top bar with exit button, progress bar, and textbook reference pill.
- Scrollable activity viewport.
- Bottom action container with 52px thumb-zone button.
- Completion celebration modal displaying score, earned XP, and "العودة للمنهج" button that triggers `completeLesson()`.

- [ ] **Step 4: Verify TypeScript typing**
Run: `npx tsc --noEmit --project mobile/tsconfig.json`
Expected: 0 errors in player components.

- [ ] **Step 5: Commit**
```bash
git add mobile/src/components/ActivityRenderer.tsx mobile/src/components/ProgressBar.tsx mobile/src/screens/LessonPlayerScreen.tsx
git commit -m "feat(mobile): create activity renderer and lesson player screen"
```

---

### Task 7: App Root Wiring, Expo Config & Verification

**Files:**
- Create: `mobile/App.tsx`
- Create: `mobile/src/navigation/RootNavigator.tsx`

**Interfaces:**
- Produces: Complete executable Expo application entry point.

- [ ] **Step 1: Create `mobile/src/navigation/RootNavigator.tsx`**
Coordinates screen transitions:
- If `loading`: renders branded splash loader.
- If `!user`: renders `AuthScreen`.
- If `user`: renders `DashboardScreen`, `CourseDetailScreen`, `LessonPlayerScreen`, and `ProfileScreen`.

- [ ] **Step 2: Create `mobile/App.tsx`**
Root application wrapping `SafeAreaProvider`, `AuthProvider`, `ProgressProvider`, and `RootNavigator`.

- [ ] **Step 3: Run comprehensive TypeScript verification**
Run: `npx tsc --noEmit --project mobile/tsconfig.json`
Expected: Clean compilation with 0 errors across the entire `mobile/` directory.

- [ ] **Step 4: Run Expo start dry run / configuration check**
Verify `mobile/app.json` and package structure are valid and ready for Expo Go.

- [ ] **Step 5: Commit**
```bash
git add mobile/App.tsx mobile/src/navigation
git commit -m "feat(mobile): wire root navigation and app entry point"
```

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-11-23-expo-react-native-app.md`. Please review the plan. Which execution approach would you prefer?

- **Subagent-driven** - A fresh subagent implements each task and a fresh reviewer checks it before the next one starts, then a whole-branch review at the end. Most thorough; costs a fresh context per task and per review.
- **Native** - I implement every task myself in this session, the way this harness runs work, then one fresh reviewer on the most capable model checks the whole branch. Cheapest and fastest; no independent review until the end.

**For this plan I recommend Native**, because the tasks are cleanly partitioned in `mobile/`, share established type contracts, and can be built and verified with zero friction in this session. Does the plan capture what you want, and which approach should we use?
