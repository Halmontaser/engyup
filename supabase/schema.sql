-- ========================================
-- Crescent English Learning App - Database Schema
-- ========================================
-- Run this in your Supabase SQL Editor to set up the database
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- LESSONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_lessons_order ON lessons(order_index);

-- ========================================
-- ACTIVITIES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id TEXT NOT NULL UNIQUE, -- External ID for the activity
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- flashcard, mcq, gap-fill, etc.
  title TEXT,
  instruction TEXT,
  content JSONB NOT NULL, -- Activity-specific data
  compensates TEXT, -- Learning context/goal
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_activities_lesson ON activities(lesson_id);
CREATE INDEX IF NOT EXISTS idx_activities_order ON activities(order_index);

-- ========================================
-- USER_PROGRESS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL, -- UUID from auth.users
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress', -- in_progress, completed, failed
  completion_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lesson_id) -- One progress record per user per lesson
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_lesson ON user_progress(lesson_id);

-- ========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Lessons: Allow read access to everyone
CREATE POLICY "Lessons are viewable by everyone"
ON lessons FOR SELECT
USING (true);

-- Activities: Allow read access to everyone
CREATE POLICY "Activities are viewable by everyone"
ON activities FOR SELECT
USING (true);

-- User Progress: Allow users to read their own progress
CREATE POLICY "Users can read own progress"
ON user_progress FOR SELECT
USING (auth.uid()::text = user_id);

-- User Progress: Allow users to insert their own progress
CREATE POLICY "Users can insert own progress"
ON user_progress FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- User Progress: Allow users to update their own progress
CREATE POLICY "Users can update own progress"
ON user_progress FOR UPDATE
USING (auth.uid()::text = user_id);

-- ========================================
-- SAMPLE DATA (Optional - for testing)
-- ========================================

-- Insert a sample lesson
INSERT INTO lessons (id, title, description, order_index)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Basic Vocabulary: Animals',
  'Learn common animal names in English',
  1
) ON CONFLICT (id) DO NOTHING;

-- Insert sample flashcard activities
INSERT INTO activities (activity_id, lesson_id, activity_type, title, instruction, content, order_index)
VALUES
  (
    'activity-001',
    '00000000-0000-0000-0000-000000000001',
    'flashcard',
    'Animal Flashcards',
    'Flip the cards to learn the animals',
    '{
      "items": [
        {"word": "Cat", "definition": "A small domesticated carnivorous mammal", "example": "The cat sleeps on the sofa"},
        {"word": "Dog", "definition": "A domesticated carnivorous mammal that typically has a long snout", "example": "The dog plays in the park"},
        {"word": "Bird", "definition": "A warm-blooded egg-laying vertebrate characterized by feathers", "example": "The bird sings in the tree"}
      ]
    }'::jsonb,
    1
  ),
  (
    'activity-002',
    '00000000-0000-0000-0000-000000000001',
    'mcq',
    'Animal Quiz',
    'Choose the correct answer for each question',
    '{
      "questions": [
        {
          "question": "What is a cat?",
          "options": ["A bird", "A small domesticated mammal", "A fish", "A tree"],
          "answer": "A small domesticated mammal"
        },
        {
          "question": "What sound does a dog make?",
          "options": ["Meow", "Tweet", "Bark", "Moo"],
          "answer": "Bark"
        }
      ]
    }'::jsonb,
    2
  )
ON CONFLICT (activity_id) DO NOTHING;

-- ========================================
-- FUNCTIONS FOR UPDATED_AT
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- COMPLETE!
-- ========================================
-- Your database is now set up!
-- You can now run the application and it should work.
-- ========================================
