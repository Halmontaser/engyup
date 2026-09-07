-- ============================================================================
-- reorder_activities_pedagogical: One-shot function that reorders EVERY
-- activity inside EVERY lesson according to Crescent's 4-phase pedagogical flow
-- and activity difficulty hierarchy.
--
-- Phase 0 (stable intro content): video, html, link, quiz, challenge,
--                                 flashcards, text, pdf, embed
-- Phase 1 (Input/Exposure):       flashcard, pronunciation-practice,
--                                 listening-comprehension
-- Phase 2 (Guided Practice):      image-label, guessing-game, mcq, true-false,
--                                 match-pairs, word-order, reading-sequence
-- Phase 3 (Application):          category-sort, gap-fill, reading-passage
-- Phase 4 (Production):           dialogue-read, transform-sentence,
--                                 conversation-sim, picture-description,
--                                 dictation, spelling-bee
--
-- Type aliases:
--   sentence-builder -> word-order
--   word-association -> match-pairs
--
-- Usage:
--   SELECT reorder_activities_pedagogical();      -- execute
--   SELECT reorder_activities_pedagogical(true);  -- dry run (preview only)
-- ============================================================================
CREATE OR REPLACE FUNCTION reorder_activities_pedagogical(
  p_dry_run BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lesson                RECORD;
  v_row                   RECORD;
  v_lessons_processed     INTEGER := 0;
  v_skipped_empty         INTEGER := 0;
  v_activities_reordered  INTEGER := 0;
  v_already_correct       INTEGER := 0;
  v_unknown_types_seen    JSONB   := '{}'::jsonb;
  v_lesson_moves          INTEGER;
  v_ids                   UUID[];
  v_orders                INTEGER[];
BEGIN
  -- ------------------------------------------------------------------
  -- Loop over every lesson in module/position order
  -- ------------------------------------------------------------------
  FOR v_lesson IN
    SELECT id
      FROM lessons
     ORDER BY module_id, order_index
  LOOP
    v_lessons_processed := v_lessons_processed + 1;

    -- No activities in this lesson -> skip
    IF NOT EXISTS (SELECT 1 FROM activities WHERE lesson_id = v_lesson.id) THEN
      v_skipped_empty := v_skipped_empty + 1;
      CONTINUE;
    END IF;

    v_lesson_moves := 0;
    v_ids          := '{}'::UUID[];
    v_orders       := '{}'::INTEGER[];

    -- ----------------------------------------------------------------
    -- Compute the proposed pedagogical order for this lesson
    -- ----------------------------------------------------------------
    FOR v_row IN
      WITH ranked AS (
        SELECT
          a.activity_id,
          a.activity_type,
          a.order_index AS old_order_index,
          CASE a.activity_type
            WHEN 'sentence-builder' THEN 'word-order'
            WHEN 'word-association' THEN 'match-pairs'
            ELSE a.activity_type
          END AS canonical_type
        FROM activities a
        WHERE a.lesson_id = v_lesson.id
      ),
      classified AS (
        SELECT
          r.activity_id,
          r.activity_type,
          r.canonical_type,
          r.old_order_index,
          CASE
            WHEN r.canonical_type IN (
              'video', 'html', 'link', 'quiz', 'challenge',
              'flashcards', 'text', 'pdf', 'embed'
            ) THEN 0
            WHEN r.canonical_type IN (
              'flashcard', 'pronunciation-practice', 'listening-comprehension'
            ) THEN 1
            WHEN r.canonical_type IN (
              'image-label', 'guessing-game', 'mcq', 'true-false',
              'match-pairs', 'word-order', 'reading-sequence'
            ) THEN 2
            WHEN r.canonical_type IN (
              'category-sort', 'gap-fill', 'reading-passage'
            ) THEN 3
            WHEN r.canonical_type IN (
              'dialogue-read', 'transform-sentence', 'conversation-sim',
              'picture-description', 'dictation', 'spelling-bee'
            ) THEN 4
            ELSE 99999
          END AS phase_rank,
          CASE r.canonical_type
            WHEN 'video' THEN 9999
            WHEN 'html' THEN 9999
            WHEN 'link' THEN 9999
            WHEN 'quiz' THEN 9999
            WHEN 'challenge' THEN 9999
            WHEN 'flashcards' THEN 9999
            WHEN 'text' THEN 9999
            WHEN 'pdf' THEN 9999
            WHEN 'embed' THEN 9999
            WHEN 'flashcard' THEN 10
            WHEN 'pronunciation-practice' THEN 20
            WHEN 'listening-comprehension' THEN 30
            WHEN 'image-label' THEN 40
            WHEN 'guessing-game' THEN 50
            WHEN 'mcq' THEN 60
            WHEN 'true-false' THEN 70
            WHEN 'match-pairs' THEN 80
            WHEN 'word-order' THEN 90
            WHEN 'reading-sequence' THEN 95
            WHEN 'category-sort' THEN 100
            WHEN 'gap-fill' THEN 110
            WHEN 'reading-passage' THEN 120
            WHEN 'dialogue-read' THEN 130
            WHEN 'transform-sentence' THEN 140
            WHEN 'conversation-sim' THEN 150
            WHEN 'picture-description' THEN 160
            WHEN 'dictation' THEN 170
            WHEN 'spelling-bee' THEN 180
            ELSE 99999
          END AS type_rank
        FROM ranked r
      )
      SELECT
        c.activity_id,
        c.activity_type,
        c.old_order_index,
        (row_number() OVER (ORDER BY c.phase_rank, c.type_rank, c.old_order_index) - 1)::INTEGER AS new_order_index,
        c.phase_rank,
        c.type_rank
      FROM classified c
      ORDER BY c.phase_rank, c.type_rank, c.old_order_index
    LOOP
      -- Track any activity type that is not in the known mapping
      IF v_row.phase_rank = 99999 OR v_row.type_rank = 99999 THEN
        v_unknown_types_seen := v_unknown_types_seen || jsonb_build_object(
          v_row.activity_type,
          COALESCE((v_unknown_types_seen ->> v_row.activity_type)::INTEGER, 0) + 1
        );
      END IF;

      -- Count movements vs. already-correct positions
      IF v_row.old_order_index != v_row.new_order_index THEN
        v_activities_reordered := v_activities_reordered + 1;
        v_lesson_moves         := v_lesson_moves + 1;
      ELSE
        v_already_correct := v_already_correct + 1;
      END IF;

      -- Stage the new positions for a single bulk UPDATE per lesson
      IF NOT p_dry_run THEN
        v_ids    := array_append(v_ids, v_row.activity_id);
        v_orders := array_append(v_orders, v_row.new_order_index);
      END IF;
    END LOOP;

    IF v_lesson_moves > 0 THEN
      RAISE NOTICE 'Lesson %: reordered % activities', v_lesson.id, v_lesson_moves;
    END IF;

    -- Apply the reordered positions in one statement (avoids unique-index
    -- conflicts that can occur with row-by-row updates)
    IF NOT p_dry_run AND array_length(v_ids, 1) > 0 THEN
      UPDATE activities a
         SET order_index = r.new_order_index
        FROM unnest(v_ids, v_orders) AS r(activity_id, new_order_index)
       WHERE a.activity_id = r.activity_id;
    END IF;
  END LOOP;

  -- ------------------------------------------------------------------
  -- Return summary
  -- ------------------------------------------------------------------
  RETURN jsonb_build_object(
    'dry_run',              p_dry_run,
    'lessons_processed',    v_lessons_processed,
    'skipped_empty',        v_skipped_empty,
    'activities_reordered', v_activities_reordered,
    'already_correct',      v_already_correct,
    'unknown_types_seen',   v_unknown_types_seen
  );
END;
$$;
