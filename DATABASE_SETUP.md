# Database Setup Guide

## Quick Setup

The "failed to fetch" error is likely because the required database tables don't exist in your Supabase project. Follow these steps to set up the database:

### Step 1: Go to Supabase Dashboard

1. Visit [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: `msttsebajfgzllabasid`
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run the Schema

1. Open the file `supabase/schema.sql` in this project
2. Copy all the SQL code
3. Paste it into the Supabase SQL Editor
4. Click **Run** (or press `Ctrl/Cmd + Enter`)

### Step 3: Verify the Setup

After running the schema, you should see:
- ✅ Three tables created: `lessons`, `activities`, `user_progress`
- ✅ Sample lesson and activities inserted
- ✅ Row Level Security policies configured

### Step 4: Check the Tables

1. Go to **Table Editor** in the Supabase dashboard
2. You should see the `lessons` table with one sample lesson
3. You should see the `activities` table with two sample activities

### Step 5: Test the App

Now refresh your application (http://localhost:5173) and try accessing a lesson with ID: `00000000-0000-0000-0000-000000000001`

## What the Schema Creates

### Tables:
- **lessons** - Stores lesson information (title, description, order)
- **activities** - Stores individual activities for lessons (flashcards, MCQs, etc.)
- **user_progress** - Tracks user progress through lessons

### Sample Data:
- 1 lesson: "Basic Vocabulary: Animals"
- 2 activities:
  - Flashcard activity with 3 animal cards
  - Multiple choice quiz with 2 questions

## Adding Your Own Content

To add your own lessons and activities:

### Using SQL:
```sql
-- Add a new lesson
INSERT INTO lessons (title, description, order_index)
VALUES ('My New Lesson', 'Lesson description', 2)
RETURNING id;

-- Use the returned ID to add activities
INSERT INTO activities (activity_id, lesson_id, activity_type, title, content, order_index)
VALUES (
  'my-activity-1',
  '<lesson-id-from-above>',
  'flashcard',
  'My Flashcards',
  '{"items": [{"word": "Hello", "definition": "A greeting"}]}',
  1
);
```

### Using Supabase Dashboard:
1. Go to **Table Editor**
2. Select the table (lessons or activities)
3. Click **Insert Row**
4. Fill in the data
5. Click **Save**

## Troubleshooting

### "Failed to fetch" error:
- Check that the tables exist in Supabase Table Editor
- Check that RLS policies allow access (the schema sets this up)
- Check browser console for detailed error messages

### Environment variables:
Ensure your `.env.local` file has the correct Supabase URL:
```env
VITE_SUPABASE_URL=https://msttsebajfgzllabasid.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-key-here
```

### Sample lesson not showing:
The sample lesson ID is: `00000000-0000-0000-0000-000000000001`
Navigate to: `/lesson/any-course-id/00000000-0000-0000-0000-000000000001`

## Need Help?

If you encounter issues:
1. Check the browser console (F12) for detailed error messages
2. Check the Supabase logs in the dashboard
3. Verify the tables exist and have data in Table Editor
