-- Partner applications registry
CREATE TABLE IF NOT EXISTS partner_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,  -- e.g. 'schoology', 'my-tutor-app'
  api_key TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  api_secret TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  webhook_url TEXT,           -- URL to POST progress events to
  allowed_origins TEXT[],     -- CORS origins for iframe embedding
  allowed_courses UUID[],     -- Course IDs this partner can access (NULL = all)
  is_active BOOLEAN DEFAULT true,
  rate_limit_per_hour INTEGER DEFAULT 1000,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Map partner users to Engyup users (or create shadow accounts)
CREATE TABLE IF NOT EXISTS partner_user_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_app_id UUID REFERENCES partner_apps(id) ON DELETE CASCADE,
  external_user_id TEXT NOT NULL,       -- User ID in the partner's system
  engyup_user_id UUID REFERENCES auth.users(id),  -- Mapped Engyup user (nullable for lazy creation)
  display_name TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(partner_app_id, external_user_id)
);

-- Track API usage for rate limiting and analytics
CREATE TABLE IF NOT EXISTS partner_api_logs (
  id BIGSERIAL PRIMARY KEY,
  partner_app_id UUID REFERENCES partner_apps(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for rate limiting lookups
CREATE INDEX IF NOT EXISTS idx_partner_api_logs_rate ON partner_api_logs (partner_app_id, created_at);
CREATE INDEX IF NOT EXISTS idx_partner_user_mappings_lookup ON partner_user_mappings (partner_app_id, external_user_id);

-- RLS Policies
ALTER TABLE partner_apps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages partner_apps"
  ON partner_apps FOR ALL
  USING (auth.role() = 'service_role');

ALTER TABLE partner_user_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages partner_user_mappings"
  ON partner_user_mappings FOR ALL
  USING (auth.role() = 'service_role');

ALTER TABLE partner_api_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages partner_api_logs"
  ON partner_api_logs FOR ALL
  USING (auth.role() = 'service_role');
