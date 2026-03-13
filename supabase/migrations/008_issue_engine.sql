-- ============================================================
-- Phase 3: Issue Generation Engine
-- Adds slug, is_latest flag, and derivative artifact columns.
-- ============================================================

-- Slug for clean URLs (e.g. "2026-03-edition-04")
ALTER TABLE issues ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Explicit latest flag (faster than ordering by published_at)
ALTER TABLE issues ADD COLUMN IF NOT EXISTS is_latest boolean DEFAULT false;

-- Derivative artifacts for downstream channels
ALTER TABLE issues ADD COLUMN IF NOT EXISTS executive_summary text;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS beehiiv_summary text;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS welcome_email_snippet text;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS linkedin_snippets jsonb;

-- Source trend IDs (provenance from trend intelligence layer)
ALTER TABLE issues ADD COLUMN IF NOT EXISTS source_trend_ids text[];

-- Indexes
CREATE INDEX IF NOT EXISTS idx_issues_slug ON issues(slug);
CREATE INDEX IF NOT EXISTS idx_issues_is_latest ON issues(is_latest) WHERE is_latest = true;
CREATE INDEX IF NOT EXISTS idx_issues_published ON issues(published_at DESC) WHERE status = 'published';

-- Ensure only one issue can be latest at a time
-- (managed by application logic, but partial index helps queries)
