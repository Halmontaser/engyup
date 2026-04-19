-- CRITICAL FIX: Robust Auth Trigger v3
-- This script replaces all legacy triggers with a fail-safe user initialization pipeline.

-- 1. CLEANUP (Force-drop everything related to user creation)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_tenant ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_tenant CASCADE;

-- 2. CREATE ROBUST INITIALIZATION FUNCTION
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id UUID;
  v_full_name TEXT;
  v_username TEXT;
  v_role TEXT;
BEGIN
  -- Extract and sanitize inputs
  v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', SPLIT_PART(new.email, '@', 1));
  v_username := COALESCE(new.raw_user_meta_data->>'username', SPLIT_PART(new.email, '@', 1) || '_' || SUBSTRING(new.id::text, 1, 4));
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'student');

  -- Ensure role is lowercase as per CHECK constraint
  v_role := LOWER(v_role);
  IF v_role NOT IN ('super_admin', 'school_admin', 'teacher', 'student', 'parent') THEN
    v_role := 'student';
  END IF;

  -- A. PROFILE CREATION (Fail-safe)
  BEGIN
    INSERT INTO public.profiles (id, full_name, username, avatar_url)
    VALUES (new.id, v_full_name, v_username, new.raw_user_meta_data->>'avatar_url')
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      username = COALESCE(profiles.username, EXCLUDED.username);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Could not create profile for user %: %', new.id, SQLERRM;
  END;

  -- B. USER STATS INITIALIZATION (Fail-safe)
  BEGIN
    INSERT INTO public.user_stats (user_id, total_xp, level, current_streak, hearts, gems)
    VALUES (new.id, 0, 1, 0, 5, 0)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Could not initialize stats for user %: %', new.id, SQLERRM;
  END;

  -- C. TENANT LINKING (Link to "general" slug)
  BEGIN
    SELECT id INTO v_tenant_id FROM public.tenants WHERE slug = 'general' LIMIT 1;
    
    IF v_tenant_id IS NOT NULL THEN
      INSERT INTO public.memberships (user_id, tenant_id, role)
      VALUES (new.id, v_tenant_id, v_role)
      ON CONFLICT (user_id, tenant_id) DO NOTHING;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Could not link user % to tenant: %', new.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RE-APPLY THE TRIGGER
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. ENSURE RLS ALLOWS USERS TO SEE THEIR OWN PROFILES (Fundamental for login state)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

-- 5. FINAL CHECK: Initialize stats for any users that might exist (unlikely)
INSERT INTO public.user_stats (user_id, total_xp, level, current_streak, hearts, gems)
SELECT id, 0, 1, 0, 5, 0 FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
