-- ============================================================================
-- reorder_activity: Atomically reposition an activity within or across lessons.
--
-- When an activity moves to position N (0-based), siblings shift to keep
-- order_index values logically consistent. Existing gaps in order_index are
-- preserved — only affected rows shift by ±1.
--
-- Parameters:
--   p_activity_id     UUID of the activity being moved
--   p_new_order_index Target 0-based position (clamped to [0, sibling_count])
--   p_new_lesson_id   (optional) destination lesson; NULL = stay in current lesson
-- ============================================================================
CREATE OR REPLACE FUNCTION reorder_activity(
  p_activity_id     UUID,
  p_new_order_index INTEGER,
  p_new_lesson_id   UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_lesson_id  UUID;
  v_old_order_index INTEGER;
BEGIN
  -- ------------------------------------------------------------------
  -- 1. Fetch current position; bail if activity doesn't exist
  -- ------------------------------------------------------------------
  SELECT lesson_id, order_index
    INTO v_old_lesson_id, v_old_order_index
    FROM activities
   WHERE activity_id = p_activity_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Activity % not found', p_activity_id;
  END IF;

  -- ------------------------------------------------------------------
  -- 2. Resolve target lesson (NULL → stay put)
  -- ------------------------------------------------------------------
  IF p_new_lesson_id IS NULL THEN
    p_new_lesson_id := v_old_lesson_id;
  END IF;

  -- Clamp negative indices to 0
  p_new_order_index := GREATEST(0, p_new_order_index);

  -- ------------------------------------------------------------------
  -- 3. No-op: same lesson + same position
  -- ------------------------------------------------------------------
  IF p_new_lesson_id = v_old_lesson_id
     AND p_new_order_index = v_old_order_index THEN
    RETURN;
  END IF;

  -- ------------------------------------------------------------------
  -- 4. Shift siblings
  -- ------------------------------------------------------------------
  IF p_new_lesson_id = v_old_lesson_id THEN
    -- ---------- Same lesson ----------
    IF p_new_order_index > v_old_order_index THEN
      -- Moving DOWN: shift siblings in (old, new] up by -1
      UPDATE activities
         SET order_index = order_index - 1
       WHERE lesson_id = v_old_lesson_id
         AND activity_id != p_activity_id
         AND order_index > v_old_order_index
         AND order_index <= p_new_order_index;
    ELSE
      -- Moving UP: shift siblings in [new, old) down by +1
      UPDATE activities
         SET order_index = order_index + 1
       WHERE lesson_id = v_old_lesson_id
         AND activity_id != p_activity_id
         AND order_index >= p_new_order_index
         AND order_index < v_old_order_index;
    END IF;
  ELSE
    -- ---------- Cross-lesson move ----------
    -- Close the gap in the *old* lesson
    UPDATE activities
       SET order_index = order_index - 1
     WHERE lesson_id = v_old_lesson_id
       AND activity_id != p_activity_id
       AND order_index > v_old_order_index;

    -- Make room in the *new* lesson
    UPDATE activities
       SET order_index = order_index + 1
     WHERE lesson_id = p_new_lesson_id
       AND order_index >= p_new_order_index;
  END IF;

  -- ------------------------------------------------------------------
  -- 5. Place the activity at its target position
  -- ------------------------------------------------------------------
  UPDATE activities
     SET lesson_id   = p_new_lesson_id,
         order_index = p_new_order_index
   WHERE activity_id = p_activity_id;
END;
$$;


-- ============================================================================
-- reorder_lesson: Atomically reposition a lesson within or across modules.
--
-- Same shift semantics as reorder_activity, operating on the lessons table.
--
-- Parameters:
--   p_lesson_id       UUID of the lesson being moved
--   p_new_order_index Target 0-based position (clamped to [0, sibling_count])
--   p_new_module_id   (optional) destination module; NULL = stay in current module
-- ============================================================================
CREATE OR REPLACE FUNCTION reorder_lesson(
  p_lesson_id       UUID,
  p_new_order_index INTEGER,
  p_new_module_id   UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_module_id   UUID;
  v_old_order_index INTEGER;
BEGIN
  -- ------------------------------------------------------------------
  -- 1. Fetch current position
  -- ------------------------------------------------------------------
  SELECT module_id, order_index
    INTO v_old_module_id, v_old_order_index
    FROM lessons
   WHERE id = p_lesson_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lesson % not found', p_lesson_id;
  END IF;

  -- ------------------------------------------------------------------
  -- 2. Resolve target module (NULL → stay put)
  -- ------------------------------------------------------------------
  IF p_new_module_id IS NULL THEN
    p_new_module_id := v_old_module_id;
  END IF;

  p_new_order_index := GREATEST(0, p_new_order_index);

  -- ------------------------------------------------------------------
  -- 3. No-op
  -- ------------------------------------------------------------------
  IF p_new_module_id = v_old_module_id
     AND p_new_order_index = v_old_order_index THEN
    RETURN;
  END IF;

  -- ------------------------------------------------------------------
  -- 4. Shift siblings
  -- ------------------------------------------------------------------
  IF p_new_module_id = v_old_module_id THEN
    -- Same module
    IF p_new_order_index > v_old_order_index THEN
      -- Moving DOWN
      UPDATE lessons
         SET order_index = order_index - 1
       WHERE module_id = v_old_module_id
         AND id != p_lesson_id
         AND order_index > v_old_order_index
         AND order_index <= p_new_order_index;
    ELSE
      -- Moving UP
      UPDATE lessons
         SET order_index = order_index + 1
       WHERE module_id = v_old_module_id
         AND id != p_lesson_id
         AND order_index >= p_new_order_index
         AND order_index < v_old_order_index;
    END IF;
  ELSE
    -- Cross-module move
    UPDATE lessons
       SET order_index = order_index - 1
     WHERE module_id = v_old_module_id
       AND id != p_lesson_id
       AND order_index > v_old_order_index;

    UPDATE lessons
       SET order_index = order_index + 1
     WHERE module_id = p_new_module_id
       AND order_index >= p_new_order_index;
  END IF;

  -- ------------------------------------------------------------------
  -- 5. Place the lesson
  -- ------------------------------------------------------------------
  UPDATE lessons
     SET module_id   = p_new_module_id,
         order_index = p_new_order_index
   WHERE id = p_lesson_id;
END;
$$;
