-- ============================================================================
-- reorder_all_listening_first: One-shot function that processes EVERY lesson
-- across ALL courses, moving listening-comprehension activities to the first
-- position (lowest order_index) in their respective lessons.
--
-- Uses the reorder_activity function for atomic sibling shifting.
--
-- Returns: JSON summary — { total_lessons, lessons_with_lc, moved, already_first, skipped }
--
-- Usage:
--   SELECT reorder_all_listening_first();         -- execute
--   SELECT reorder_all_listening_first(true);     -- dry run (preview only)
-- ============================================================================
CREATE OR REPLACE FUNCTION reorder_all_listening_first(
  p_dry_run BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lesson          RECORD;
  v_first_order     INTEGER;
  v_first_id        UUID;
  v_lc              RECORD;
  v_total_lessons   INTEGER := 0;
  v_lessons_with_lc INTEGER := 0;
  v_already_first   INTEGER := 0;
  v_moved           INTEGER := 0;
  v_skipped         INTEGER := 0;
BEGIN
  -- ------------------------------------------------------------------
  -- Loop over every lesson
  -- ------------------------------------------------------------------
  FOR v_lesson IN
    SELECT id, title
      FROM lessons
     ORDER BY module_id, order_index
  LOOP
    v_total_lessons := v_total_lessons + 1;

    -- ----------------------------------------------------------------
    -- 1. Find the first activity (lowest order_index) in this lesson
    -- ----------------------------------------------------------------
    SELECT activity_id, order_index
      INTO v_first_id, v_first_order
      FROM activities
     WHERE lesson_id = v_lesson.id
     ORDER BY order_index ASC
     LIMIT 1;

    -- No activities at all in this lesson → skip
    IF NOT FOUND THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    -- ----------------------------------------------------------------
    -- 2. Find a listening-comprehension activity in this lesson
    --    (take the first one if there are multiple)
    -- ----------------------------------------------------------------
    SELECT activity_id, order_index, title
      INTO v_lc
      FROM activities
     WHERE lesson_id = v_lesson.id
       AND activity_type = 'listening-comprehension'
     ORDER BY order_index ASC
     LIMIT 1;

    -- No listening-comprehension activity in this lesson → skip
    IF NOT FOUND THEN
      CONTINUE;
    END IF;

    v_lessons_with_lc := v_lessons_with_lc + 1;

    -- Already at the first position → skip
    IF v_lc.order_index = v_first_order THEN
      v_already_first := v_already_first + 1;
      CONTINUE;
    END IF;

    -- ----------------------------------------------------------------
    -- 3. Move listening-comprehension to the first position
    -- ----------------------------------------------------------------
    IF NOT p_dry_run THEN
      PERFORM reorder_activity(v_lc.activity_id, v_first_order);
    END IF;

    v_moved := v_moved + 1;

    RAISE NOTICE 'Lesson %: "%" (%) → position %', v_lesson.id, v_lc.title, v_lc.activity_id, v_first_order;
  END LOOP;

  -- ------------------------------------------------------------------
  -- Return summary
  -- ------------------------------------------------------------------
  RETURN jsonb_build_object(
    'dry_run',           p_dry_run,
    'total_lessons',     v_total_lessons,
    'empty_lessons',     v_skipped,
    'lessons_with_lc',   v_lessons_with_lc,
    'already_first',     v_already_first,
    'moved',             v_moved
  );
END;
$$;
