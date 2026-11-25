CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE, password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user','brand','admin')),
  is_blocked INTEGER NOT NULL DEFAULT 0, blocked_reason TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS email_verification_codes (
  id TEXT PRIMARY KEY, email TEXT NOT NULL COLLATE NOCASE,
  purpose TEXT NOT NULL CHECK(purpose IN ('register','brand_email')),
  code_hash TEXT NOT NULL, expires_at TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0,
  consumed_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_email_codes_lookup ON email_verification_codes(email,purpose,created_at DESC);
CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY, owner_user_id TEXT NOT NULL REFERENCES users(id),
  legal_name TEXT NOT NULL, display_name TEXT NOT NULL, official_email TEXT NOT NULL,
  website_url TEXT, founded_on TEXT, bsc_code TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','verified','rejected','suspended')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, logo_path TEXT
);
CREATE TABLE IF NOT EXISTS brand_members (
  brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_role TEXT NOT NULL DEFAULT 'owner', PRIMARY KEY(brand_id,user_id)
);
CREATE TABLE IF NOT EXISTS bsc_code_requests (
  id TEXT PRIMARY KEY, brand_id TEXT NOT NULL REFERENCES brands(id),
  requested_by TEXT NOT NULL REFERENCES users(id), contact_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', admin_note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS bsc_issuances (
  id TEXT PRIMARY KEY, brand_id TEXT NOT NULL REFERENCES brands(id),
  bsc_code TEXT NOT NULL UNIQUE, token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL, claimed_at TEXT, created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY, manufacturer TEXT NOT NULL, model_name TEXT NOT NULL,
  model_number TEXT, release_date TEXT
);
CREATE TABLE IF NOT EXISTS certification_applications (
  id TEXT PRIMARY KEY, brand_id TEXT NOT NULL REFERENCES brands(id),
  submitted_by TEXT NOT NULL REFERENCES users(id), manufacturer TEXT NOT NULL,
  full_model_name TEXT NOT NULL, model_number TEXT, release_date TEXT,
  nit_value REAL, lux_value REAL, test_video_path TEXT, test_method_notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft', decision_note TEXT,
  archive_device_consent INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS application_assets (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES certification_applications(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK(kind IN ('video','evidence')),
  storage_path TEXT NOT NULL, original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL, file_size INTEGER NOT NULL CHECK(file_size >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS certificates (
  id TEXT PRIMARY KEY, application_id TEXT NOT NULL UNIQUE REFERENCES certification_applications(id),
  brand_id TEXT NOT NULL REFERENCES brands(id), sr_code TEXT NOT NULL UNIQUE,
  score INTEGER NOT NULL CHECK(score BETWEEN 1 AND 100),
  status TEXT NOT NULL DEFAULT 'active', method_version TEXT NOT NULL DEFAULT 'pending-validation',
  public_summary TEXT, issued_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, expires_at TEXT,
  issued_by TEXT NOT NULL REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY, created_by TEXT NOT NULL REFERENCES users(id),
  brand_id TEXT REFERENCES brands(id), subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open', priority TEXT NOT NULL DEFAULT 'normal',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS support_messages (
  id TEXT PRIMARY KEY, ticket_id TEXT NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES users(id), body TEXT NOT NULL,
  internal_note INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT, admin_id TEXT REFERENCES users(id),
  action TEXT NOT NULL, target_type TEXT, target_id TEXT, details TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates(status, issued_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_brand ON certification_applications(brand_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_creator ON support_tickets(created_by, created_at DESC);

INSERT OR IGNORE INTO site_settings(key,value) VALUES
('brand','{"name":"SR Certification","theme":"orange-light","default_locale":"en"}');
INSERT OR IGNORE INTO site_settings(key,value) VALUES
('support','{"email":"bscmailcode@gmail.com","hours":"10:00-22:00","timezone":"Asia/Tehran"}');
