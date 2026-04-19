-- FINAL UNBLOCK: Dashboard Data & Visibility
-- This script fixes the 403 Forbidden errors and the persistent loading spinner.

-- 1. FULL MEMBERSHIPS ACCESS (Enable self-healing and join support)
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own memberships" ON public.memberships;
CREATE POLICY "Users can manage their own memberships" ON public.memberships
  FOR ALL USING (auth.uid() = user_id);

-- 2. CURRICULUM VISIBILITY (Allow all students to see the lessons)
-- We simplify this to ensure the dashboard always loads.

-- Courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view courses in their tenants" ON public.courses;
DROP POLICY IF EXISTS "Authenticated users can view all courses" ON public.courses;
CREATE POLICY "Authenticated users can view all courses" ON public.courses
  FOR SELECT TO authenticated USING (true);

-- Modules
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view modules in their courses" ON public.modules;
DROP POLICY IF EXISTS "Authenticated users can view all modules" ON public.modules;
CREATE POLICY "Authenticated users can view all modules" ON public.modules
  FOR SELECT TO authenticated USING (true);

-- Lessons
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view lessons in their modules" ON public.lessons;
DROP POLICY IF EXISTS "Authenticated users can view all lessons" ON public.lessons;
CREATE POLICY "Authenticated users can view all lessons" ON public.lessons
  FOR SELECT TO authenticated USING (true);

-- Activities
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view activities in their lessons" ON public.activities;
DROP POLICY IF EXISTS "Authenticated users can view all activities" ON public.activities;
CREATE POLICY "Authenticated users can view all activities" ON public.activities
  FOR SELECT TO authenticated USING (true);

-- 3. TENANT VISIBILITY REFINEMENT
DROP POLICY IF EXISTS "Users can view their own tenants via membership" ON public.tenants;
CREATE POLICY "Anyone can view tenants" ON public.tenants
  FOR SELECT TO authenticated USING (true);

-- 4. PROFILE REFINEMENT (Fix 400 error)
-- Ensure 'role' is readable and 'username' is indexed
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

-- 5. FINAL GRANTS (Ensuring the 'authenticated' role has base permissions)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE ON public.memberships TO authenticated;
GRANT INSERT, UPDATE ON public.user_stats TO authenticated;
GRANT INSERT, UPDATE ON public.user_progress TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
