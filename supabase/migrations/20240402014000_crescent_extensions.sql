-- Migration: Extend Nexus activities table for Crescent's 21 activity types

-- 1. Drop the existing narrow constraint
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_activity_type_check;

-- 2. Add expanded constraint with all Crescent types
ALTER TABLE activities ADD CONSTRAINT activities_activity_type_check 
CHECK (activity_type IN (
  -- Nexus originals
  'video', 'html', 'link', 'quiz', 'challenge', 'flashcards', 'text', 'pdf', 'embed',
  -- Crescent activity types
  'flashcard', 'mcq', 'gap-fill', 'true-false', 'match-pairs', 'word-order',
  'reading-passage', 'category-sort', 'dialogue-read', 'transform-sentence',
  'image-label', 'guessing-game', 'reading-sequence', 'sentence-builder',
  'word-association', 'pronunciation-practice', 'listening-comprehension',
  'spelling-bee', 'dictation', 'conversation-sim', 'picture-description'
));

-- 3. Add Crescent-specific columns to activities
ALTER TABLE activities ADD COLUMN IF NOT EXISTS difficulty TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS book_type TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS book_page TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS compensates TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS instruction TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS title TEXT;

-- 4. Add cover image to lessons (for Crescent's lesson cards)
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS cover_image_src TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS passing_score INTEGER DEFAULT 70;

-- 5. Add lesson metadata fields
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS objectives JSONB;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS language_focus JSONB;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS vocabulary JSONB;
