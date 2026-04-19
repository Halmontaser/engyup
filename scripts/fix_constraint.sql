-- Fix: Drop the narrow type constraint and replace with expanded one
ALTER TABLE activities DROP CONSTRAINT IF EXISTS lesson_blocks_type_check;
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_activity_type_check;

-- Add expanded constraint with all Crescent + Nexus types
ALTER TABLE activities ADD CONSTRAINT activities_activity_type_check 
CHECK (activity_type IN (
  'video', 'html', 'link', 'quiz', 'challenge', 'flashcards', 'text', 'pdf', 'embed',
  'flashcard', 'mcq', 'gap-fill', 'true-false', 'match-pairs', 'word-order',
  'reading-passage', 'category-sort', 'dialogue-read', 'transform-sentence',
  'image-label', 'guessing-game', 'reading-sequence', 'sentence-builder',
  'word-association', 'pronunciation-practice', 'listening-comprehension',
  'spelling-bee', 'dictation', 'conversation-sim', 'picture-description'
));

-- Add Crescent-specific columns
ALTER TABLE activities ADD COLUMN IF NOT EXISTS difficulty TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS book_type TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS book_page TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS compensates TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS instruction TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS title TEXT;

-- Add lesson metadata columns
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS cover_image_src TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS passing_score INTEGER DEFAULT 70;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS objectives JSONB;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS language_focus JSONB;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS vocabulary JSONB;

-- Also clean up failed activity inserts (they didn't go through)
-- Delete courses/modules/lessons so we can re-run migration cleanly
DELETE FROM activities;
DELETE FROM lessons;
DELETE FROM modules;
DELETE FROM courses;
