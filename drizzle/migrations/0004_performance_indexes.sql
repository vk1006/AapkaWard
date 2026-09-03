-- Performance indexes for common read paths (idempotent).

-- Moderation
CREATE INDEX IF NOT EXISTS moderation_subject_idx ON moderation_cases (subject_type, subject_id);
CREATE INDEX IF NOT EXISTS moderation_decision_idx ON moderation_cases (decision);
CREATE INDEX IF NOT EXISTS moderation_pending_created_idx ON moderation_cases (decision, created_at DESC);

-- Suggestions: public wall + admin lists
CREATE INDEX IF NOT EXISTS suggestions_status_idx ON suggestions (moderation_status);
CREATE INDEX IF NOT EXISTS suggestions_user_idx ON suggestions (user_id);
CREATE INDEX IF NOT EXISTS suggestions_approved_list_idx
  ON suggestions (tenant_id, moderation_status, published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS suggestions_admin_list_idx
  ON suggestions (moderation_status, created_at DESC);
CREATE INDEX IF NOT EXISTS suggestions_created_idx ON suggestions (created_at DESC);

-- Issues: public list + admin lists + petition linkage
CREATE INDEX IF NOT EXISTS issues_lifecycle_idx ON issues (lifecycle);
CREATE INDEX IF NOT EXISTS issues_user_idx ON issues (user_id);
CREATE INDEX IF NOT EXISTS issues_status_created_idx ON issues (moderation_status, created_at DESC);
CREATE INDEX IF NOT EXISTS issues_petition_id_idx ON issues (petition_id) WHERE petition_id IS NOT NULL;

-- Issue media batch loads
CREATE INDEX IF NOT EXISTS issue_media_issue_idx ON issue_media (issue_id);

-- Events: public calendar + admin list
CREATE INDEX IF NOT EXISTS events_starts_idx ON events (starts_at);
CREATE INDEX IF NOT EXISTS events_tenant_idx ON events (tenant_id);
CREATE INDEX IF NOT EXISTS events_public_list_idx ON events (tenant_id, published, starts_at);
CREATE INDEX IF NOT EXISTS events_admin_list_idx ON events (tenant_id, starts_at DESC);

-- RSVP counts and lookups
CREATE INDEX IF NOT EXISTS event_rsvps_event_status_idx ON event_rsvps (event_id, status);

-- Petitions
CREATE INDEX IF NOT EXISTS petitions_status_idx ON petitions (status);

-- Identity / auth
CREATE INDEX IF NOT EXISTS users_tenant_idx ON users (tenant_id);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions (expires_at);

-- Content pages
CREATE INDEX IF NOT EXISTS manifesto_slug_idx ON manifesto_items (slug);
CREATE INDEX IF NOT EXISTS manifesto_tenant_idx ON manifesto_items (tenant_id);
CREATE INDEX IF NOT EXISTS pages_slug_idx ON pages (tenant_id, slug);

-- Platform
CREATE INDEX IF NOT EXISTS audit_events_created_idx ON audit_events (created_at);
CREATE INDEX IF NOT EXISTS outbox_pending_idx ON outbox (created_at) WHERE processed_at IS NULL;

-- Admin comment ledger (sorted reads per subject)
CREATE INDEX IF NOT EXISTS admin_comments_subject_created_idx
  ON admin_comments (subject_type, subject_id, created_at);
