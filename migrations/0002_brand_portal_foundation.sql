ALTER TABLE brands ADD COLUMN country_code TEXT;
ALTER TABLE brands ADD COLUMN registration_number TEXT;
ALTER TABLE brands ADD COLUMN contact_name TEXT;
ALTER TABLE brands ADD COLUMN contact_phone TEXT;
ALTER TABLE brands ADD COLUMN updated_at TEXT;

CREATE TABLE IF NOT EXISTS brand_invitations (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  email TEXT NOT NULL COLLATE NOCASE,
  member_role TEXT NOT NULL CHECK(member_role IN ('manager','reviewer','viewer')),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  accepted_at TEXT,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_brand_invites_brand ON brand_invitations(brand_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_brand_members_user ON brand_members(user_id, brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_members_brand_role ON brand_members(brand_id, member_role);

CREATE TABLE IF NOT EXISTS brand_activity_logs (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  actor_user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_brand_activity_brand ON brand_activity_logs(brand_id, created_at DESC);
