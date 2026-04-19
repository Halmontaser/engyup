# Deployment Master Plan — Crescent English Learning App
> Grades 7-12 | Self-Paced Digital Learning | No Supervisor Required

---

## Phase 0: Data Foundation ✅ COMPLETE
- [x] Extract textbook pages to `textbook_data.db` (Grades 7-12, PB + WB)
- [x] Extract images metadata to database (1,067+ images)
- [x] Migrate iSpring quizzes to `components.db` (Grades 7-9)
- [x] Migrate store_v4 JSON to `components.db` (Grades 10-12)
- [x] Normalize activity types across all grades
- [x] Create lesson-page mapping (`page_lessons`)
- [x] Export lesson contexts JSON for generation pipeline

---

## Phase 1: Content Quality & Enrichment [x] COMPLETE
**Goal**: Fill gaps between classroom curriculum and self-learning app

### 1.1 Quality Audit [x]
- [x] Document skill coverage gaps (Listening, Speaking, Reading, Writing)
- [x] Identify lessons with < 3 activities (Density Gap)
- [x] Verify instruction quality and pedagogical "scaffolding"

### 1.2 Activity Enrichment [x]
- [x] Generate conversational instructions for all 4,184 activities
- [x] Populate explanatory feedback for all MCQs and True/False tasks
- [x] Address curriculum density gaps
- [x] Generate new activities for listening skill (critically underserved)
- [x] Generate new activities for speaking skill (critically underserved)  
- [x] Add pronunciation-practice activities for all vocabulary
- [x] Add dictation activities per unit
- [x] Add conversation-sim activities to replace pair work
- [x] Add spelling-bee activities for Grades 7-8
- [x] Validate and ingest generated activities to `components.db`

### 1.3 Grade 10 Unit 2 Gap
- [X] Create store_v4.json for Grade 10 Unit 2 (currently missing)
- [X] Ingest into components.db

---

## Phase 2: Media Asset Generation 🔲 NEXT
**Goal**: Create all images, audio, and video assets

### 2.1 Image Generation
- [ ] Audit all `imageRef` fields in activities — list missing images
- [X] Extract image prompts from `images` table in textbook_data.db
- [X] Generate flashcard images using AI (vocabulary items)
- [x] Generate scene images for reading passages
- [ ] Generate character illustrations for dialogues
- [ ] Optimize all images (WebP, responsive sizes)
- [ ] Upload to storage bucket and update DB references

### 2.2 Audio Generation (TTS)
- [ ] Generate TTS audio for ALL vocabulary words (priority: Grades 7-9)
- [ ] Generate TTS for dialogue lines
- [ ] Generate TTS for listening comprehension passages
- [ ] Generate TTS for dictation sentences
- [ ] Generate TTS for instructions (optional, for accessibility)
- [ ] Validate pronunciation quality
- [ ] Upload to storage and update `audioSrc` fields

### 2.3 Video Content
- [ ] Identify lessons that benefit from video explanations
- [ ] Create grammar explanation videos (animated)
- [ ] Create cultural context videos (Yemeni settings)
- [ ] Create "how to use the app" onboarding video
- [ ] Host on CDN and link in lesson metadata

---

## Phase 3: Component Development & Enhancement 🔲
**Goal**: Build/fix TypeScript components to support all activity types

### 3.1 Existing Components — Fixes
- [ ] Audit `components/src/` for build errors
- [ ] Fix `BaseComponent.ts` rendering issues
- [ ] Ensure all 12 existing types render correctly
- [ ] Add proper error boundaries
- [ ] Fix responsive design for mobile/tablet

### 3.2 New Component Types (from audit)
- [ ] `PronunciationPractice` — record & compare with native audio
- [ ] `Dictation` — play audio, type what you hear
- [ ] `ListeningComprehension` — audio + MCQ questions
- [ ] `SpellingBee` — hear word, spell it letter by letter
- [ ] `ConversationSim` — branching dialogue tree
- [ ] `PictureDescription` — describe what you see, keyword matching
- [ ] `StoryBuilder` — construct sentences from word bank
- [ ] `HandwritingTrace` — canvas-based letter tracing (Grade 7)

### 3.3 Component Enhancements
- [ ] Add audio playback support to ALL components
- [ ] Add hint system (progressive hints, max 3)
- [ ] Add animation transitions between activities
- [ ] Add celebration animations (confetti, stars) on completion
- [ ] Add detailed per-option feedback (not just correct/incorrect)
- [ ] Add RTL support for Arabic hints/translations
- [ ] Add accessibility (ARIA labels, keyboard navigation)
- [ ] Add offline support (Service Worker + cached assets)

### 3.4 Gamification Enhancements
- [ ] Wire hearts system (lose heart on wrong answer)
- [ ] Implement XP tracking with level progression
- [ ] Add daily streak tracking with push notifications
- [ ] Add achievement badges (per unit, per skill mastery)
- [ ] Add leaderboard (optional, class/school mode)
- [ ] Add "review mistakes" feature (spaced repetition)

---

## Phase 4: App Shell & Navigation 🔲
**Goal**: Build the main app wrapper around components

### 4.1 Core App
- [ ] Grade selection screen
- [ ] Unit overview with progress indicators
- [ ] Lesson flow (activity sequencer)
- [ ] Progress dashboard (skills radar chart)
- [ ] Settings (language, difficulty, audio on/off)

### 4.2 User Experience
- [ ] Onboarding tutorial (first-time user)
- [ ] Adaptive difficulty (auto-adjust based on performance)
- [ ] Review mode (redo failed activities)
- [ ] Bookmark/favorites system
- [ ] Search functionality

### 4.3 Design System
- [ ] Dark mode / light mode toggle
- [ ] Custom theme per grade (color coding)
- [ ] Consistent typography (Inter + Arabic-compatible font)
- [ ] Smooth micro-animations
- [ ] Loading states and skeleton screens

---

## Phase 5: Backend & Deployment 🔲
**Goal**: Deploy production-ready application

### 5.1 Database Migration
- [ ] Migrate `components.db` schema to PostgreSQL (`create_textbook_schema.sql`)
- [ ] Migrate `textbook_data.db` to PostgreSQL
- [ ] Set up Row Level Security (RLS) policies
- [ ] Create API endpoints for lesson/activity retrieval
- [ ] Set up edge functions for progress tracking

### 5.2 Storage & CDN
- [ ] Create storage buckets (images, audio, video)
- [ ] Upload all media assets
- [ ] Configure CDN caching headers
- [ ] Set up image optimization pipeline

### 5.3 Authentication
- [ ] Student registration (email or school code)
- [ ] Teacher dashboard (view student progress)
- [ ] Anonymous mode (try without account)

### 5.4 Deployment
- [ ] Build production bundle
- [ ] Deploy frontend to hosting (Vercel/InsForge)
- [ ] Configure custom domain
- [ ] Set up monitoring and error tracking
- [ ] Performance testing (Lighthouse score > 90)
- [ ] PWA support (installable on mobile)

### 5.5 Analytics
- [ ] Track activity completion rates
- [ ] Track time per activity
- [ ] Track skill progression
- [ ] Track drop-off points
- [ ] Weekly usage reports

---

## Phase 6: Testing & Launch 🔲

### 6.1 Content Review
- [ ] Subject matter expert review (English teacher)
- [ ] Cultural appropriateness review
- [ ] Accuracy spot-check (50 random activities per grade)

### 6.2 Technical Testing
- [ ] Unit tests for all components
- [ ] Integration tests for lesson flow
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Mobile testing (Android, iOS)
- [ ] Offline functionality testing
- [ ] Load testing

### 6.3 User Testing
- [ ] Pilot with 5-10 students per grade
- [ ] Collect feedback on difficulty, clarity, engagement
- [ ] Iterate based on feedback

### 6.4 Launch
- [ ] Soft launch (single school)
- [ ] Collect analytics for 2 weeks
- [ ] Fix critical issues
- [ ] Public launch

---

## Priority Matrix

| Task | Impact | Effort | Priority |
|------|--------|--------|----------|
| Audio generation (TTS) | 🔴 Critical | Medium | P0 |
| Listening activities | 🔴 Critical | Medium | P0 |
| Speaking activities | 🔴 Critical | High | P0 |
| Image generation | 🟡 High | Medium | P1 |
| Component fixes | 🟡 High | Medium | P1 |
| New component types | 🟡 High | High | P1 |
| Gamification wiring | 🟢 Medium | Low | P2 |
| Video content | 🟢 Medium | High | P2 |
| Backend deployment | 🟡 High | Medium | P1 |
| Analytics | 🟢 Medium | Low | P3 |

---

## Estimated Timeline
| Phase | Duration | Dependencies |
|-------|----------|-------------|
| Phase 1 | 2 weeks | Data ready ✅ |
| Phase 2 | 3 weeks | Phase 1 |
| Phase 3 | 4 weeks | Phase 1 |
| Phase 4 | 3 weeks | Phase 3 |
| Phase 5 | 2 weeks | Phase 3, 4 |
| Phase 6 | 2 weeks | All phases |
| **Total** | **~16 weeks** | |
