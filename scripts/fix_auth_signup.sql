-- Consolidated Auth Trigger Fix
-- This script replaces the multiple conflicting triggers with a single, robust user initialization flow.

-- 1. Cleanup existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_tenant ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_tenant CASCADE;

-- 2. Create the consolidated initialization function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id UUID;
  v_full_name TEXT;
  v_username TEXT;
BEGIN
  -- Extract metadata
  v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', new.email);
  v_username := COALESCE(new.raw_user_meta_data->>'username', SPLIT_PART(new.email, '@', 1) || '_' || SUBSTRING(new.id::text, 1, 4));

  -- A. Create Profile
  INSERT INTO public.profiles (id, full_name, username, avatar_url)
  VALUES (
    new.id, 
    v_full_name, 
    v_username,
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    username = COALESCE(profiles.username, EXCLUDED.username);

  -- B. Initialize User Stats (Gamification)
  -- Note: We use the renamed table 'user_stats'
  INSERT INTO public.user_stats (user_id, total_xp, level, current_streak, hearts, gems)
  VALUES (new.id, 0, 1, 0, 5, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- C. Link to "General" Tenant
  -- Find the tenant with slug 'general'
  SELECT id INTO v_tenant_id FROM public.tenants WHERE slug = 'general' LIMIT 1;

  -- Fallback: if 'general' doesn't exist, use any tenant or skip (should exist from migration)
  IF v_tenant_id IS NOT NULL THEN
    INSERT INTO public.memberships (user_id, tenant_id, role)
    VALUES (new.id, v_tenant_id, 'student')
    ON CONFLICT (user_id, tenant_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-apply the single trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Manual fix for any users already stuck without some records
-- (Optional, for existing users created before the fix)
INSERT INTO public.user_stats (user_id, total_xp, level, current_streak, hearts, gems)
SELECT id, 0, 1, 0, 5, 0 FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
