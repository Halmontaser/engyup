-- Fix: Include super_admin in admin management policies
-- super_admin was missing from 3 policies, blocking superadmins from editing

-- 1. Fix activities management policy
DROP POLICY IF EXISTS "Admins can manage activities" ON activities;
CREATE POLICY "Admins can manage activities" ON activities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN modules ON modules.id = lessons.module_id
      JOIN courses ON courses.id = modules.course_id
      JOIN memberships ON memberships.tenant_id = courses.tenant_id
      WHERE activities.lesson_id = lessons.id
      AND memberships.user_id = auth.uid()
      AND memberships.role IN ('super_admin', 'school_admin', 'teacher')
    )
  );

-- 2. Fix quiz questions management policy
DROP POLICY IF EXISTS "Admins can manage questions" ON quiz_questions;
CREATE POLICY "Admins can manage questions" ON quiz_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM quizzes
      JOIN memberships ON quizzes.tenant_id = memberships.tenant_id
      WHERE quizzes.quiz_id = quiz_questions.quiz_id
      AND memberships.user_id = auth.uid()
      AND memberships.role IN ('super_admin', 'school_admin', 'teacher')
    )
  );

-- 3. Fix courses management policy
DROP POLICY IF EXISTS "Admins and Teachers can manage courses" ON courses;
CREATE POLICY "Admins and Teachers can manage courses" ON courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.tenant_id = courses.tenant_id
      AND memberships.user_id = auth.uid()
      AND memberships.role IN ('super_admin', 'school_admin', 'teacher')
    )
  );
