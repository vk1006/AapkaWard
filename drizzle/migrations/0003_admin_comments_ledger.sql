CREATE TABLE IF NOT EXISTS admin_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  subject_type VARCHAR(32) NOT NULL,
  subject_id UUID NOT NULL,
  admin_id UUID NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_comments_subject_idx ON admin_comments (subject_type, subject_id);
CREATE INDEX IF NOT EXISTS admin_comments_created_idx ON admin_comments (created_at);

INSERT INTO admin_comments (tenant_id, subject_type, subject_id, admin_id, body, created_at)
SELECT
  tenant_id,
  'suggestion',
  id,
  COALESCE(admin_comment_by, '00000000-0000-0000-0000-000000000000'),
  admin_comment,
  COALESCE(admin_comment_at, now())
FROM suggestions
WHERE admin_comment IS NOT NULL
  AND btrim(admin_comment) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM admin_comments ac
    WHERE ac.subject_type = 'suggestion' AND ac.subject_id = suggestions.id
  );

INSERT INTO admin_comments (tenant_id, subject_type, subject_id, admin_id, body, created_at)
SELECT
  tenant_id,
  'issue',
  id,
  COALESCE(admin_comment_by, '00000000-0000-0000-0000-000000000000'),
  admin_comment,
  COALESCE(admin_comment_at, now())
FROM issues
WHERE admin_comment IS NOT NULL
  AND btrim(admin_comment) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM admin_comments ac
    WHERE ac.subject_type = 'issue' AND ac.subject_id = issues.id
  );

ALTER TABLE suggestions
  DROP COLUMN IF EXISTS admin_comment,
  DROP COLUMN IF EXISTS admin_comment_by,
  DROP COLUMN IF EXISTS admin_comment_at;

ALTER TABLE issues
  DROP COLUMN IF EXISTS admin_comment,
  DROP COLUMN IF EXISTS admin_comment_by,
  DROP COLUMN IF EXISTS admin_comment_at;
