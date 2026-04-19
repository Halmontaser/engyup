-- FIX: RLS Recursion & 500 Internal Server Errors
-- This script fixes the security policies that cause infinite loops and database crashes.

-- 1. FIX MEMBERSHIPS POLICY (The primary cause of the 500 errors)
-- Old policy used an EXISTS check on the same table, causing recursion.
DROP POLICY IF EXISTS "Users can view memberships in their tenants" ON public.memberships;
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.memberships;

CREATE POLICY "Users can view their own memberships" ON public.memberships
  FOR SELECT USING (auth.uid() = user_id);

-- Optional: Allow users to see other members of the same tenant (non-recursive way)
-- We use a function or a simplified check if needed, but for now, own-membership is enough to unblock.

-- 2. FIX TENANTS POLICY
-- Ensure users can see the 'General' tenant and any they own/belong to.
DROP POLICY IF EXISTS "Users can view their own tenants via membership" ON public.tenants;
CREATE POLICY "Users can view their own tenants via membership" ON public.tenants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.tenant_id = tenants.id
      AND memberships.user_id = auth.uid()
    ) OR slug = 'general'
  );

-- 3. FIX USER_STATS POLICY (Rename compatibility)
-- The table was renamed from user_gamification to user_stats.
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own gamification stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can view their own stats" ON public.user_stats;
CREATE POLICY "Users can view their own stats" ON public.user_stats
  FOR SELECT USING (auth.uid() = user_id);

-- 4. FIX ENROLLMENTS (Ensure students can see their own enrollments)
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Users can view their own enrollments" ON public.enrollments;
CREATE POLICY "Users can view their own enrollments" ON public.enrollments
  FOR SELECT USING (auth.uid() = user_id);

-- 5. FIX USER_PROGRESS
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own progress" ON public.user_progress;
CREATE POLICY "Users can manage their own progress" ON public.user_progress
  FOR ALL USING (auth.uid() = user_id);
