-- =====================================================
-- SUPABASE LMS MIGRATION - COMPLETE & ORDERED (FIXED)
-- =====================================================

-- -----------------------------------------------------
-- 1. Core Tables
-- -----------------------------------------------------

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'school_admin', 'teacher', 'student', 'parent')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tenant_id)
);

CREATE TABLE IF NOT EXISTS parent_student (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_global BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lesson_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('video', 'text', 'quiz', 'flashcard')),
  content_json JSONB NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'super_admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

CREATE TABLE IF NOT EXISTS progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  score INTEGER,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- Enable RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_student ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies
CREATE POLICY "Users can view their own tenants via membership" ON tenants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.tenant_id = tenants.id
      AND memberships.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------
-- 2. Triggers for New Users
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user_tenant()
RETURNS TRIGGER AS $$
DECLARE
  new_tenant_id UUID;
  tenant_name TEXT;
  tenant_slug TEXT;
BEGIN
  tenant_name := COALESCE(new.raw_user_meta_data->>'full_name', 'My School');
  tenant_slug := LOWER(REPLACE(tenant_name, ' ', '-')) || '-' || SUBSTRING(new.id::text, 1, 8);

  INSERT INTO public.tenants (name, slug, owner_id)
  VALUES (tenant_name, tenant_slug, new.id)
  RETURNING id INTO new_tenant_id;

  INSERT INTO public.memberships (user_id, tenant_id, role)
  VALUES (new.id, new_tenant_id, 'school_admin');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_tenant ON auth.users;
CREATE TRIGGER on_auth_user_created_tenant
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_tenant();

-- -----------------------------------------------------
-- 3. Additional RLS Policies
-- -----------------------------------------------------

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view memberships in their tenants" ON memberships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.tenant_id = memberships.tenant_id
      AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view courses in their tenants" ON courses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.tenant_id = courses.tenant_id
      AND memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and Teachers can manage courses" ON courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.tenant_id = courses.tenant_id
      AND memberships.user_id = auth.uid()
      AND memberships.role IN ('school_admin', 'teacher')
    )
  );

CREATE POLICY "Users can view modules in their courses" ON modules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses
      JOIN memberships ON memberships.tenant_id = courses.tenant_id
      WHERE courses.id = modules.course_id
      AND memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view lessons in their courses" ON lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses
      JOIN modules ON modules.course_id = courses.id
      JOIN memberships ON memberships.tenant_id = courses.tenant_id
      WHERE lessons.module_id = modules.id
      AND memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own progress" ON progress
  FOR ALL USING (auth.uid() = user_id);

-- -----------------------------------------------------
-- 4. Invitations Table & Webhook Trigger
-- -----------------------------------------------------

CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('school_admin', 'teacher', 'student', 'parent')),
  invited_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage invitations" ON invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.tenant_id = invitations.tenant_id
      AND memberships.user_id = auth.uid()
      AND memberships.role = 'school_admin'
    )
  );

CREATE POLICY "Users can view their own invitations" ON invitations
  FOR SELECT USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE OR REPLACE FUNCTION accept_invitation(invitation_id UUID)
RETURNS void AS $$
DECLARE
  target_invitation RECORD;
BEGIN
  SELECT * FROM invitations WHERE id = invitation_id AND status = 'pending' INTO target_invitation;
  
  IF target_invitation IS NULL THEN
    RAISE EXCEPTION 'Invitation not found or already processed';
  END IF;

  INSERT INTO memberships (user_id, tenant_id, role)
  VALUES (auth.uid(), target_invitation.tenant_id, target_invitation.role)
  ON CONFLICT (user_id, tenant_id) DO UPDATE SET role = target_invitation.role;

  UPDATE invitations SET status = 'accepted' WHERE id = invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.on_invitation_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://okpruwomwojoshrbdewg.supabase.co/functions/v1/send-invitation',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key', true)
    ),
    body := jsonb_build_object('record', row_to_json(NEW))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_on_invitation_created ON public.invitations;
CREATE TRIGGER tr_on_invitation_created
  AFTER INSERT ON public.invitations
  FOR EACH ROW EXECUTE FUNCTION public.on_invitation_created();

-- -----------------------------------------------------
-- 5. Enhanced Membership and Tenant Policies
-- -----------------------------------------------------

CREATE POLICY "Admins can update memberships" ON memberships
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.tenant_id = memberships.tenant_id
      AND m.user_id = auth.uid()
      AND m.role = 'school_admin'
    )
  );

CREATE POLICY "Admins can delete memberships" ON memberships
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.tenant_id = memberships.tenant_id
      AND m.user_id = auth.uid()
      AND m.role = 'school_admin'
    )
  );

CREATE POLICY "Admins can update tenant info" ON tenants
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.tenant_id = tenants.id
      AND memberships.user_id = auth.uid()
      AND memberships.role = 'school_admin'
    )
  );

-- -----------------------------------------------------
-- 6. Username Support for Students
-- -----------------------------------------------------

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, username)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'username'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------
-- 7. Parent-Student Relationship Policies
-- -----------------------------------------------------

CREATE POLICY "Parents can manage their student links" ON parent_student
  FOR ALL USING (auth.uid() = parent_id);

CREATE POLICY "Students can view their parent links" ON parent_student
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Parents can view their children's progress" ON progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM parent_student
      WHERE parent_student.student_id = progress.user_id
      AND parent_student.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view their children's profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM parent_student
      WHERE parent_student.student_id = profiles.id
      AND parent_student.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view their children's enrollments" ON enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM parent_student
      WHERE parent_student.student_id = enrollments.user_id
      AND parent_student.parent_id = auth.uid()
    )
  );

-- -----------------------------------------------------
-- 8. Gamification Module v2
-- -----------------------------------------------------

CREATE TABLE IF NOT EXISTS learning_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid,
  event_type text NOT NULL,
  entity_type text,
  entity_id uuid,
  course_id uuid,
  unit_id uuid,
  lesson_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gamification_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid,
  event_type text NOT NULL,
  entity_type text,
  condition jsonb DEFAULT '{}'::jsonb,
  reward jsonb DEFAULT '{}'::jsonb,
  priority int DEFAULT 0,
  cooldown_seconds int DEFAULT 0,
  is_active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS user_gamification (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp bigint DEFAULT 0,
  level int DEFAULT 1,
  streak_days int DEFAULT 0,
  last_activity_date date,
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_course_gamification (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  xp bigint DEFAULT 0,
  level int DEFAULT 1,
  progress numeric DEFAULT 0,
  last_activity_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (user_id, course_id)
);

CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE,
  title text,
  description text,
  icon text
);

CREATE TABLE IF NOT EXISTS user_badges (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id uuid REFERENCES badges(id) ON DELETE CASCADE,
  earned_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_events_user ON learning_events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON learning_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_course ON learning_events(course_id);
CREATE UNIQUE INDEX IF NOT EXISTS unique_event ON learning_events(user_id, event_type, entity_id) WHERE entity_id IS NOT NULL;

CREATE OR REPLACE FUNCTION add_user_xp(uid uuid, xp_to_add int)
RETURNS void AS $$
DECLARE
  v_last_date date;
  v_current_streak int;
BEGIN
  SELECT last_activity_date, streak_days INTO v_last_date, v_current_streak
  FROM user_gamification
  WHERE user_id = uid;

  IF v_last_date IS NULL THEN
    v_current_streak := 1;
  ELSIF v_last_date = CURRENT_DATE THEN
    v_current_streak := COALESCE(v_current_streak, 1);
  ELSIF v_last_date = CURRENT_DATE - INTERVAL '1 day' THEN
    v_current_streak := COALESCE(v_current_streak, 0) + 1;
  ELSE
    v_current_streak := 1;
  END IF;

  INSERT INTO user_gamification (user_id, total_xp, streak_days, last_activity_date, updated_at)
  VALUES (uid, xp_to_add, v_current_streak, CURRENT_DATE, now())
  ON CONFLICT (user_id)
  DO UPDATE SET 
    total_xp = user_gamification.total_xp + xp_to_add,
    streak_days = v_current_streak,
    last_activity_date = CURRENT_DATE,
    updated_at = now();

  UPDATE user_gamification
  SET level = floor(sqrt(total_xp / 100)) + 1
  WHERE user_id = uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION add_course_xp(uid uuid, cid uuid, xp_to_add int)
RETURNS void AS $$
BEGIN
  INSERT INTO user_course_gamification (user_id, course_id, xp, last_activity_at)
  VALUES (uid, cid, xp_to_add, now())
  ON CONFLICT (user_id, course_id)
  DO UPDATE SET 
    xp = user_course_gamification.xp + xp_to_add,
    last_activity_at = now();
    
  UPDATE user_course_gamification
  SET level = floor(sqrt(xp / 100)) + 1
  WHERE user_id = uid AND course_id = cid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION track_learning_event(
  p_user_id uuid,
  p_event_type text,
  p_entity_type text DEFAULT NULL,
  p_entity_id uuid DEFAULT NULL,
  p_course_id uuid DEFAULT NULL,
  p_unit_id uuid DEFAULT NULL,
  p_lesson_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_org_id uuid DEFAULT NULL
) RETURNS boolean AS $$
DECLARE
  v_rule record;
  v_reward jsonb;
  v_xp int;
  v_course_xp int;
  v_badge_key text;
  v_badge_id uuid;
BEGIN
  BEGIN
    INSERT INTO learning_events (
      user_id, org_id, event_type, entity_type, entity_id, 
      course_id, unit_id, lesson_id, metadata
    ) VALUES (
      p_user_id, COALESCE(p_org_id, p_user_id), p_event_type, p_entity_type, p_entity_id,
      p_course_id, p_unit_id, p_lesson_id, p_metadata
    );
  EXCEPTION WHEN unique_violation THEN
    RETURN false;
  END;

  FOR v_rule IN 
    SELECT * FROM gamification_rules 
    WHERE event_type = p_event_type AND is_active = true
    ORDER BY priority DESC
  LOOP
    v_reward := v_rule.reward;
    
    IF v_reward ? 'xp' THEN
      v_xp := (v_reward->>'xp')::int;
      PERFORM add_user_xp(p_user_id, v_xp);
    END IF;
    
    IF v_reward ? 'course_xp' AND p_course_id IS NOT NULL THEN
      v_course_xp := (v_reward->>'course_xp')::int;
      PERFORM add_course_xp(p_user_id, p_course_id, v_course_xp);
    END IF;
    
    IF v_reward ? 'badge' THEN
      v_badge_key := v_reward->>'badge';
      SELECT id INTO v_badge_id FROM badges WHERE key = v_badge_key;
      IF v_badge_id IS NOT NULL THEN
        BEGIN
          INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, v_badge_id);
        EXCEPTION WHEN unique_violation THEN
        END;
      END IF;
    END IF;
    
  END LOOP;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

INSERT INTO gamification_rules (event_type, reward) VALUES
('lesson_completed', '{"xp": 10, "course_xp": 5}'),
('quiz_passed', '{"xp": 50, "course_xp": 20}'),
('course_completed', '{"xp": 200, "badge": "course_master"}')
ON CONFLICT DO NOTHING;

INSERT INTO badges (key, title, description, icon) VALUES
('course_master', 'Course Master', 'Completed a full course', '🏆'),
('fast_learner', 'Fast Learner', 'Completed 5 lessons in one day', '⚡')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own gamification stats" ON user_gamification FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE user_course_gamification ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own course gamification stats" ON user_course_gamification FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE learning_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own events" ON learning_events FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own badges" ON user_badges FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view badges" ON badges FOR SELECT USING (true);

-- -----------------------------------------------------
-- 9. Custom IDs and Tenant Sequences
-- -----------------------------------------------------

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS custom_id TEXT UNIQUE;

CREATE TABLE IF NOT EXISTS tenant_sequences (
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  next_val INTEGER DEFAULT 1000,
  PRIMARY KEY (tenant_id, role)
);

CREATE OR REPLACE FUNCTION generate_custom_id(p_user_id UUID, p_tenant_id UUID, p_role TEXT)
RETURNS TEXT AS $$
DECLARE
  v_prefix TEXT;
  v_tenant_short TEXT;
  v_serial INTEGER;
  v_custom_id TEXT;
BEGIN
  v_prefix := CASE 
    WHEN p_role = 'student' THEN 'STU'
    WHEN p_role = 'parent' THEN 'PAR'
    WHEN p_role = 'teacher' THEN 'TEA'
    WHEN p_role = 'school_admin' THEN 'ADM'
    ELSE 'USR'
  END;

  v_tenant_short := UPPER(SUBSTRING(p_tenant_id::TEXT FROM 1 FOR 4));

  INSERT INTO tenant_sequences (tenant_id, role, next_val)
  VALUES (p_tenant_id, p_role, 1001)
  ON CONFLICT (tenant_id, role)
  DO UPDATE SET next_val = tenant_sequences.next_val + 1
  RETURNING next_val - 1 INTO v_serial;

  v_custom_id := v_prefix || '-' || v_tenant_short || '-' || v_serial;
  
  RETURN v_custom_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.sync_profile_custom_id()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM profiles WHERE id = NEW.user_id AND custom_id IS NULL) THEN
    UPDATE profiles 
    SET custom_id = generate_custom_id(NEW.user_id, NEW.tenant_id, NEW.role)
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_membership_created ON memberships;
CREATE TRIGGER on_membership_created
  AFTER INSERT ON memberships
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_custom_id();

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT user_id, tenant_id, role FROM memberships LOOP
    IF EXISTS (SELECT 1 FROM profiles WHERE id = r.user_id AND custom_id IS NULL) THEN
      UPDATE profiles 
      SET custom_id = generate_custom_id(r.user_id, r.tenant_id, r.role)
      WHERE id = r.user_id;
    END IF;
  END LOOP;
END $$;

-- -----------------------------------------------------
-- 10. Add Foreign Keys to Profiles for Gamification Tables
-- -----------------------------------------------------

ALTER TABLE user_gamification
ADD CONSTRAINT user_gamification_user_id_profile_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE user_course_gamification
ADD CONSTRAINT user_course_gamification_user_id_profile_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE learning_events
ADD CONSTRAINT learning_events_user_id_profile_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE user_badges
ADD CONSTRAINT user_badges_user_id_profile_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Users can view their own course gamification stats" ON user_course_gamification;
CREATE POLICY "Anyone can view course gamification stats" ON user_course_gamification FOR SELECT USING (true);

-- -----------------------------------------------------
-- 11. Enrollments Policies
-- -----------------------------------------------------

CREATE POLICY "Users can view their own enrollments" ON enrollments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins and teachers can view tenant enrollments" ON enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.tenant_id = enrollments.tenant_id
      AND memberships.user_id = auth.uid()
      AND memberships.role IN ('super_admin', 'school_admin', 'teacher')
    )
  );

CREATE POLICY "Users can enroll themselves" ON enrollments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    AND (role = 'student' OR EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.tenant_id = enrollments.tenant_id
      AND memberships.user_id = auth.uid()
      AND memberships.role = 'super_admin'
    ))
    AND EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.tenant_id = enrollments.tenant_id
      AND memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and teachers can manage enrollments" ON enrollments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.tenant_id = enrollments.tenant_id
      AND memberships.user_id = auth.uid()
      AND memberships.role IN ('super_admin', 'school_admin', 'teacher')
    )
  );

ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS enrollments_role_check;
ALTER TABLE enrollments ADD CONSTRAINT enrollments_role_check CHECK (role IN ('student', 'teacher', 'super_admin'));

-- -----------------------------------------------------
-- 12. Update Profiles Policy for Leaderboard Visibility
-- -----------------------------------------------------

DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

CREATE POLICY "Users can view profiles in their tenants" ON profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM memberships m1
    JOIN memberships m2 ON m1.tenant_id = m2.tenant_id
    WHERE m1.user_id = auth.uid()
    AND m2.user_id = profiles.id
  )
);

CREATE POLICY "Super admins can view all profiles" ON profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM memberships
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  )
);

-- -----------------------------------------------------
-- 13. Subscriptions and Bulk Import Support
-- -----------------------------------------------------

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all subscriptions" ON subscriptions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'school_admin')
  )
);

CREATE TABLE IF NOT EXISTS bulk_import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  imported_by UUID REFERENCES auth.users(id),
  total_records INTEGER NOT NULL,
  success_count INTEGER NOT NULL,
  error_count INTEGER NOT NULL,
  errors JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE bulk_import_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view import logs" ON bulk_import_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'school_admin')
  )
);

-- -----------------------------------------------------
-- 14. Notifications System (Basic Table)
-- -----------------------------------------------------

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.tenant_id = notifications.tenant_id
      AND memberships.user_id = auth.uid()
      AND memberships.role IN ('super_admin', 'school_admin', 'teacher')
    )
  );

CREATE OR REPLACE FUNCTION create_notification(
  p_tenant_id UUID,
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_link TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (tenant_id, user_id, title, message, type, link)
  VALUES (p_tenant_id, p_user_id, p_title, p_message, p_type, p_link)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------
-- 15. Flexible Quizzes and Notes (CREATED BEFORE RENAMING)
-- -----------------------------------------------------

CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  passing_score INTEGER DEFAULT 70,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice',
  options JSONB DEFAULT '[]'::jsonb,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  answers JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone in tenant can view quizzes" ON quizzes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships 
      WHERE memberships.tenant_id = quizzes.tenant_id 
      AND memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage quizzes" ON quizzes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM memberships 
      WHERE memberships.tenant_id = quizzes.tenant_id 
      AND memberships.user_id = auth.uid()
      AND memberships.role IN ('super_admin', 'school_admin', 'teacher')
    )
  );

CREATE POLICY "Anyone can view questions of accessible quizzes" ON questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quizzes
      JOIN memberships ON quizzes.tenant_id = memberships.tenant_id
      WHERE quizzes.id = questions.quiz_id
      AND memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage questions" ON questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM quizzes
      JOIN memberships ON quizzes.tenant_id = memberships.tenant_id
      WHERE quizzes.id = questions.quiz_id
      AND memberships.user_id = auth.uid()
      AND memberships.role IN ('super_admin', 'school_admin', 'teacher')
    )
  );

CREATE POLICY "Users can view their own attempts" ON quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attempts" ON quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own notes" ON notes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view public notes in their tenant" ON notes
  FOR SELECT USING (
    is_private = false 
    AND EXISTS (
      SELECT 1 FROM memberships 
      WHERE memberships.tenant_id = notes.tenant_id 
      AND memberships.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------
-- 16. Apply Clear Naming Conventions (NOW SAFE - TABLES EXIST)
-- -----------------------------------------------------

-- 1. Quizzes
ALTER TABLE quizzes RENAME COLUMN id TO quiz_id;
ALTER TABLE quizzes RENAME COLUMN title TO quiz_title;
ALTER TABLE quizzes RENAME COLUMN target_id TO lesson_id;
ALTER TABLE quizzes DROP COLUMN IF EXISTS target_type;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS time_limit_seconds INTEGER;

-- 2. QuizQuestions
ALTER TABLE questions RENAME TO quiz_questions;
ALTER TABLE quiz_questions RENAME COLUMN id TO question_id;
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 1;

-- 3. QuizSubmissions
ALTER TABLE quiz_attempts RENAME TO quiz_submissions;
ALTER TABLE quiz_submissions RENAME COLUMN id TO submission_id;
ALTER TABLE quiz_submissions RENAME COLUMN completed_at TO submitted_at;
ALTER TABLE quiz_submissions ADD COLUMN IF NOT EXISTS time_taken INTEGER;

-- 4. UserProgress
ALTER TABLE progress RENAME TO user_progress;
ALTER TABLE user_progress RENAME COLUMN id TO progress_id;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed'));
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS completion_date TIMESTAMPTZ;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS xp_earned INTEGER DEFAULT 0;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS accuracy_percentage NUMERIC;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS attempts_count INTEGER DEFAULT 0;

UPDATE user_progress SET status = 'completed', completion_date = updated_at WHERE completed = true;

-- 5. UserStats
ALTER TABLE user_gamification RENAME TO user_stats;
ALTER TABLE user_stats DROP CONSTRAINT IF EXISTS user_gamification_pkey CASCADE;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS stat_id UUID PRIMARY KEY DEFAULT gen_random_uuid();
ALTER TABLE user_stats ADD CONSTRAINT user_stats_user_id_key UNIQUE (user_id);
ALTER TABLE user_stats RENAME COLUMN streak_days TO current_streak;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS hearts INTEGER DEFAULT 5;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS gems INTEGER DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS league_id UUID;

-- 6. LessonAttempts
CREATE TABLE IF NOT EXISTS lesson_attempts (
  attempt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  score INTEGER,
  mistakes_count INTEGER DEFAULT 0,
  hearts_lost INTEGER DEFAULT 0
);

-- 7. Challenges
CREATE TABLE IF NOT EXISTS challenges (
  challenge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT
);

-- 8. ChallengeProgress
CREATE TABLE IF NOT EXISTS challenge_progress (
  progress_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES lesson_attempts(attempt_id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES challenges(challenge_id) ON DELETE CASCADE,
  user_answer TEXT,
  is_correct BOOLEAN,
  time_spent INTEGER,
  hints_used INTEGER DEFAULT 0
);

-- 9. Friends
CREATE TABLE IF NOT EXISTS friends (
  friendship_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own lesson attempts" ON lesson_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own lesson attempts" ON lesson_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own challenge progress" ON challenge_progress FOR SELECT USING (
  EXISTS (SELECT 1 FROM lesson_attempts WHERE lesson_attempts.attempt_id = challenge_progress.attempt_id AND lesson_attempts.user_id = auth.uid())
);

CREATE POLICY "Users can view their friends" ON friends FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- -----------------------------------------------------
-- 17. Notifications for Progress and Course Completion (NOW SAFE)
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION notify_parents_on_lesson_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_parent_id UUID;
  v_student_name TEXT;
  v_lesson_title TEXT;
  v_course_title TEXT;
  v_tenant_id UUID;
BEGIN
  IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status != 'completed') THEN
    
    SELECT full_name INTO v_student_name FROM profiles WHERE id = NEW.user_id;
    
    SELECT l.title, c.title, c.tenant_id INTO v_lesson_title, v_course_title, v_tenant_id
    FROM lessons l
    JOIN modules m ON l.module_id = m.id
    JOIN courses c ON m.course_id = c.id
    WHERE l.id = NEW.lesson_id;

    FOR v_parent_id IN 
      SELECT parent_id FROM parent_student WHERE student_id = NEW.user_id
    LOOP
      PERFORM create_notification(
        v_tenant_id,
        v_parent_id,
        'Lesson Completed',
        v_student_name || ' has completed the lesson "' || v_lesson_title || '" in course "' || v_course_title || '".',
        'success',
        NULL
      );
    END LOOP;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_lesson_completion_notify_parents ON user_progress;
CREATE TRIGGER on_lesson_completion_notify_parents
  AFTER INSERT OR UPDATE ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION notify_parents_on_lesson_completion();

-- -----------------------------------------------------
-- 18. xAPI Lite
-- -----------------------------------------------------

CREATE TABLE IF NOT EXISTS xapi_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  verb TEXT NOT NULL CHECK (verb IN ('start', 'end', 'score', 'store')),
  activity_id TEXT NOT NULL,
  activity_type TEXT,
  score NUMERIC,
  max_score NUMERIC,
  success BOOLEAN,
  completion BOOLEAN,
  duration INTERVAL,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE xapi_statements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own xapi statements"
  ON xapi_statements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own xapi statements"
  ON xapi_statements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view public xapi statements"
  ON xapi_statements FOR SELECT
  USING (is_public = true);

CREATE OR REPLACE FUNCTION xapi_start(
  p_activity_id TEXT,
  p_activity_type TEXT DEFAULT NULL,
  p_tenant_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_is_public BOOLEAN DEFAULT false
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO xapi_statements (user_id, tenant_id, verb, activity_id, activity_type, metadata, is_public)
  VALUES (auth.uid(), p_tenant_id, 'start', p_activity_id, p_activity_type, p_metadata, p_is_public)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION xapi_end(
  p_activity_id TEXT,
  p_activity_type TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT NULL,
  p_completion BOOLEAN DEFAULT NULL,
  p_duration INTERVAL DEFAULT NULL,
  p_tenant_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_is_public BOOLEAN DEFAULT false
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO xapi_statements (user_id, tenant_id, verb, activity_id, activity_type, success, completion, duration, metadata, is_public)
  VALUES (auth.uid(), p_tenant_id, 'end', p_activity_id, p_activity_type, p_success, p_completion, p_duration, p_metadata, p_is_public)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION xapi_score(
  p_activity_id TEXT,
  p_score NUMERIC,
  p_max_score NUMERIC DEFAULT 100,
  p_activity_type TEXT DEFAULT NULL,
  p_tenant_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_is_public BOOLEAN DEFAULT false
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO xapi_statements (user_id, tenant_id, verb, activity_id, activity_type, score, max_score, metadata, is_public)
  VALUES (auth.uid(), p_tenant_id, 'score', p_activity_id, p_activity_type, p_score, p_max_score, p_metadata, p_is_public)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION xapi_store(
  p_activity_id TEXT,
  p_verb TEXT,
  p_activity_type TEXT DEFAULT NULL,
  p_tenant_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_is_public BOOLEAN DEFAULT false
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO xapi_statements (user_id, tenant_id, verb, activity_id, activity_type, metadata, is_public)
  VALUES (auth.uid(), p_tenant_id, p_verb, p_activity_id, p_activity_type, p_metadata, p_is_public)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------
-- 19. Integrations and Sync Support
-- -----------------------------------------------------

CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  endpoint_url TEXT,
  api_key TEXT,
  secret_token TEXT,
  events TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL,
  request_payload JSONB,
  response_payload JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES auth.users(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT;

ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage integrations" ON integrations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.tenant_id = integrations.tenant_id
      AND memberships.user_id = auth.uid()
      AND memberships.role IN ('super_admin', 'school_admin')
    )
  );

CREATE POLICY "Admins can view sync logs" ON sync_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM integrations
      JOIN memberships ON integrations.tenant_id = memberships.tenant_id
      WHERE integrations.id = sync_logs.integration_id
      AND memberships.user_id = auth.uid()
      AND memberships.role IN ('super_admin', 'school_admin')
    )
  );

CREATE OR REPLACE FUNCTION trigger_integration_webhook()
RETURNS TRIGGER AS $$
BEGIN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------
-- 20. Adaptive Slide Engine
-- -----------------------------------------------------

CREATE TABLE IF NOT EXISTS user_learning_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_style TEXT DEFAULT 'visual' CHECK (preferred_style IN ('visual', 'auditory', 'reading', 'kinesthetic')),
  difficulty_level TEXT DEFAULT 'intermediate' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  interests TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lesson_adaptive_config (
  lesson_id UUID PRIMARY KEY REFERENCES lessons(id) ON DELETE CASCADE,
  difficulty TEXT DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  learning_style TEXT DEFAULT 'visual' CHECK (learning_style IN ('visual', 'auditory', 'reading', 'kinesthetic')),
  required_plan TEXT DEFAULT 'free',
  tags TEXT[] DEFAULT '{}',
  prerequisites UUID[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS adaptive_branching_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  source_lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  condition_type TEXT NOT NULL,
  condition_value JSONB NOT NULL,
  target_lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_learning_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_adaptive_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE adaptive_branching_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own preferences" ON user_learning_preferences
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view lesson config" ON lesson_adaptive_config
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage lesson config" ON lesson_adaptive_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM memberships 
      JOIN lessons ON lessons.id = lesson_adaptive_config.lesson_id
      JOIN modules ON modules.id = lessons.module_id
      JOIN courses ON courses.id = modules.course_id
      WHERE memberships.tenant_id = courses.tenant_id
      AND memberships.user_id = auth.uid()
      AND memberships.role IN ('super_admin', 'school_admin', 'teacher')
    )
  );

CREATE POLICY "Anyone can view branching rules" ON adaptive_branching_rules
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage branching rules" ON adaptive_branching_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM memberships 
      WHERE memberships.tenant_id = adaptive_branching_rules.tenant_id
      AND memberships.user_id = auth.uid()
      AND memberships.role IN ('super_admin', 'school_admin', 'teacher')
    )
  );

-- -----------------------------------------------------
-- 21. Add Prerequisites to Courses
-- -----------------------------------------------------

ALTER TABLE courses
ADD COLUMN IF NOT EXISTS prerequisites UUID[] DEFAULT '{}'::UUID[];

-- -----------------------------------------------------
-- 22. Security Audit and Policy Hardening for New Schema
-- -----------------------------------------------------

-- Activities (formerly lesson_blocks)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lesson_blocks') AND
     NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activities') THEN
    ALTER TABLE lesson_blocks RENAME TO activities;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'id') THEN
    ALTER TABLE activities RENAME COLUMN id TO activity_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'type') THEN
    ALTER TABLE activities RENAME COLUMN type TO activity_type;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'content_json') THEN
    ALTER TABLE activities RENAME COLUMN content_json TO content;
  END IF;
END $$;

ALTER TABLE activities ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT true;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS xp_reward INTEGER DEFAULT 10;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS time_estimate_minutes INTEGER;

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activities in their courses" ON activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN modules ON modules.id = lessons.module_id
      JOIN courses ON courses.id = modules.course_id
      JOIN memberships ON memberships.tenant_id = courses.tenant_id
      WHERE activities.lesson_id = lessons.id
      AND memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage activities" ON activities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN modules ON modules.id = lessons.module_id
      JOIN courses ON courses.id = modules.course_id
      JOIN memberships ON memberships.tenant_id = courses.tenant_id
      WHERE activities.lesson_id = lessons.id
      AND memberships.user_id = auth.uid()
      AND memberships.role IN ('school_admin', 'teacher')
    )
  );

DROP POLICY IF EXISTS "Anyone can view questions of accessible quizzes" ON quiz_questions;
CREATE POLICY "Anyone can view questions of accessible quizzes" ON quiz_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quizzes
      JOIN memberships ON quizzes.tenant_id = memberships.tenant_id
      WHERE quizzes.quiz_id = quiz_questions.quiz_id
      AND memberships.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage questions" ON quiz_questions;
CREATE POLICY "Admins can manage questions" ON quiz_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM quizzes
      JOIN memberships ON quizzes.tenant_id = memberships.tenant_id
      WHERE quizzes.quiz_id = quiz_questions.quiz_id
      AND memberships.user_id = auth.uid()
      AND memberships.role IN ('school_admin', 'teacher')
    )
  );

DROP POLICY IF EXISTS "Users can view their own attempts" ON quiz_submissions;
CREATE POLICY "Users can view their own submissions" ON quiz_submissions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own attempts" ON quiz_submissions;
CREATE POLICY "Users can insert their own submissions" ON quiz_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own progress" ON user_progress;
CREATE POLICY "Users can manage their own progress" ON user_progress
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Parents can view their children's progress" ON user_progress;
CREATE POLICY "Parents can view their children's progress" ON user_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM parent_student
      WHERE parent_student.parent_id = auth.uid()
      AND parent_student.student_id = user_progress.user_id
    )
  );

DROP POLICY IF EXISTS "Users can view their own gamification stats" ON user_stats;
CREATE POLICY "Users can view their own stats" ON user_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone in tenant can view stats for leaderboard" ON user_stats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships m1
      JOIN memberships m2 ON m1.tenant_id = m2.tenant_id
      WHERE m1.user_id = auth.uid()
      AND m2.user_id = user_stats.user_id
    )
  );

CREATE TABLE IF NOT EXISTS activity_progress (
  progress_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES activities(activity_id) ON DELETE CASCADE,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  score INTEGER,
  time_spent_seconds INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, activity_id)
);

ALTER TABLE activity_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activity progress" ON activity_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own activity progress" ON activity_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own activity progress" ON activity_progress FOR UPDATE USING (auth.uid() = user_id);

-- -----------------------------------------------------
-- 23. Notification Preferences
-- -----------------------------------------------------

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'system';

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  system_announcements BOOLEAN NOT NULL DEFAULT true,
  course_updates BOOLEAN NOT NULL DEFAULT true,
  new_badges BOOLEAN NOT NULL DEFAULT true,
  parent_alerts BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION handle_new_user_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_notification_preferences ON auth.users;
CREATE TRIGGER on_auth_user_created_notification_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_notification_preferences();

CREATE OR REPLACE FUNCTION create_notification(
  p_tenant_id UUID,
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_link TEXT DEFAULT NULL,
  p_category TEXT DEFAULT 'system'
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
  v_enabled BOOLEAN;
BEGIN
  SELECT 
    CASE 
      WHEN p_category = 'course_update' THEN course_updates
      WHEN p_category = 'badge' THEN new_badges
      WHEN p_category = 'parent_alert' THEN parent_alerts
      ELSE system_announcements
    END INTO v_enabled
  FROM notification_preferences
  WHERE user_id = p_user_id;

  IF v_enabled IS NULL OR v_enabled = true THEN
    INSERT INTO notifications (tenant_id, user_id, title, message, type, link, category)
    VALUES (p_tenant_id, p_user_id, p_title, p_message, p_type, p_link, p_category)
    RETURNING id INTO v_notification_id;
  END IF;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------
-- 24. Extend Activities for Crescent's 21 Activity Types
-- -----------------------------------------------------

ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_activity_type_check;

ALTER TABLE activities ADD CONSTRAINT activities_activity_type_check 
CHECK (activity_type IN (
  'video', 'html', 'link', 'quiz', 'challenge', 'flashcards', 'text', 'pdf', 'embed',
  'flashcard', 'mcq', 'gap-fill', 'true-false', 'match-pairs', 'word-order',
  'reading-passage', 'category-sort', 'dialogue-read', 'transform-sentence',
  'image-label', 'guessing-game', 'reading-sequence', 'sentence-builder',
  'word-association', 'pronunciation-practice', 'listening-comprehension',
  'spelling-bee', 'dictation', 'conversation-sim', 'picture-description'
));

ALTER TABLE activities ADD COLUMN IF NOT EXISTS difficulty TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS book_type TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS book_page TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS compensates TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS instruction TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS title TEXT;

ALTER TABLE lessons ADD COLUMN IF NOT EXISTS cover_image_src TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS passing_score INTEGER DEFAULT 70;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS objectives JSONB;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS language_focus JSONB;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS vocabulary JSONB;

-- =====================================================
-- END OF MIGRATION
-- =====================================================