-- Ward Campaign initial schema

CREATE TABLE IF NOT EXISTS feature_flags (
  key VARCHAR(64) PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT false,
  payload JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  actor_id UUID,
  action VARCHAR(128) NOT NULL,
  entity_type VARCHAR(64) NOT NULL,
  entity_id VARCHAR(64),
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic VARCHAR(128) NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(256) NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  UNIQUE (key, window_start)
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  phone_e164 VARCHAR(20) NOT NULL,
  name VARCHAR(128),
  locale VARCHAR(8) NOT NULL DEFAULT 'hi',
  role VARCHAR(32) NOT NULL DEFAULT 'resident',
  ward_self_declared BOOLEAN NOT NULL DEFAULT false,
  verified_elector BOOLEAN NOT NULL DEFAULT false,
  banned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS users_phone_idx ON users(phone_e164);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  user_agent_hash VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS manifesto_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  slug VARCHAR(128) NOT NULL,
  theme VARCHAR(64) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  title_hi VARCHAR(256) NOT NULL,
  title_en VARCHAR(256) NOT NULL,
  body_hi TEXT NOT NULL,
  body_en TEXT NOT NULL,
  image_key VARCHAR(512),
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  slug VARCHAR(64) NOT NULL,
  title_hi VARCHAR(256) NOT NULL,
  title_en VARCHAR(256) NOT NULL,
  body_hi TEXT NOT NULL,
  body_en TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS moderation_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  subject_type VARCHAR(32) NOT NULL,
  subject_id UUID NOT NULL,
  locale VARCHAR(8) NOT NULL DEFAULT 'hi',
  scores JSONB DEFAULT '{}',
  decision VARCHAR(32) NOT NULL DEFAULT 'pending',
  decided_by UUID,
  reason_code VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  user_id UUID NOT NULL,
  category VARCHAR(64) NOT NULL,
  body TEXT NOT NULL,
  landmark VARCHAR(256),
  locale VARCHAR(8) NOT NULL DEFAULT 'hi',
  moderation_status VARCHAR(32) NOT NULL DEFAULT 'pending',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  title_hi VARCHAR(256) NOT NULL,
  title_en VARCHAR(256) NOT NULL,
  body_hi TEXT NOT NULL,
  body_en TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  place_text VARCHAR(512) NOT NULL,
  map_url VARCHAR(1024),
  capacity INTEGER,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status VARCHAR(16) NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, user_id)
);

CREATE TABLE IF NOT EXISTS issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  user_id UUID NOT NULL,
  body TEXT NOT NULL,
  category VARCHAR(64) NOT NULL,
  landmark VARCHAR(256),
  moderation_status VARCHAR(32) NOT NULL DEFAULT 'pending',
  lifecycle VARCHAR(32) NOT NULL DEFAULT 'received',
  duplicate_of_id UUID,
  petition_id UUID,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS issue_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  store_key VARCHAR(512) NOT NULL,
  kind VARCHAR(16) NOT NULL,
  bytes INTEGER NOT NULL,
  scan_status VARCHAR(32) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS petitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  authority_name VARCHAR(256) NOT NULL,
  ask_hi TEXT NOT NULL,
  ask_en TEXT NOT NULL,
  threshold INTEGER NOT NULL,
  deadline TIMESTAMPTZ,
  status VARCHAR(32) NOT NULL DEFAULT 'collecting',
  proof_file_key VARCHAR(512),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (issue_id)
);

CREATE TABLE IF NOT EXISTS petition_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  petition_id UUID NOT NULL REFERENCES petitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  display_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (petition_id, user_id)
);
