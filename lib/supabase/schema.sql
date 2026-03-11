-- David & Goliath AI Intelligence Magazine
-- Supabase Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Issues ──────────────────────────────────────────────────────────────────

CREATE TABLE issues (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title               TEXT NOT NULL DEFAULT 'The David & Goliath AI Intelligence Report',
  month               INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year                INTEGER NOT NULL CHECK (year >= 2024),
  edition             INTEGER NOT NULL,
  status              TEXT NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft', 'review', 'approved', 'published', 'archived')),

  cover_headline      TEXT NOT NULL DEFAULT 'AI Intelligence Report',
  cover_subtitle      TEXT,
  cover_edition_label TEXT,
  cover_image_url     TEXT,

  editorial_note      TEXT,

  developments_json   JSONB DEFAULT '[]'::jsonb,
  implications_json   JSONB DEFAULT '[]'::jsonb,
  enterprise_json     JSONB DEFAULT '[]'::jsonb,
  tools_json          JSONB DEFAULT '[]'::jsonb,
  playbooks_json      JSONB DEFAULT '[]'::jsonb,

  html_snapshot       TEXT,
  pdf_url             TEXT,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at        TIMESTAMPTZ,

  UNIQUE(month, year)
);

-- ── Issue Pages ─────────────────────────────────────────────────────────────

CREATE TABLE issue_pages (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id            UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  page_number         INTEGER NOT NULL CHECK (page_number BETWEEN 1 AND 8),
  page_type           TEXT NOT NULL
                        CHECK (page_type IN (
                          'cover', 'editorial', 'developments', 'implications',
                          'enterprise', 'tools', 'playbooks', 'closing'
                        )),
  spread_position     TEXT CHECK (spread_position IN ('left', 'right', 'full')),
  title               TEXT,
  content_json        JSONB DEFAULT '{}'::jsonb,
  html_fragment       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(issue_id, page_number)
);

-- ── Issue Assets ────────────────────────────────────────────────────────────

CREATE TABLE issue_assets (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id            UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  asset_type          TEXT NOT NULL CHECK (asset_type IN ('cover_image', 'section_image', 'pdf', 'icon')),
  url                 TEXT NOT NULL,
  metadata_json       JSONB DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Issue Reviews ───────────────────────────────────────────────────────────

CREATE TABLE issue_reviews (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id            UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  review_status       TEXT NOT NULL CHECK (review_status IN ('submitted', 'approved', 'changes_requested')),
  review_notes        TEXT,
  approved_by         TEXT,
  approved_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Auto-update trigger ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER issues_updated_at
  BEFORE UPDATE ON issues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER issue_pages_updated_at
  BEFORE UPDATE ON issue_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_year_month ON issues(year, month);
CREATE INDEX idx_issue_pages_issue ON issue_pages(issue_id);
CREATE INDEX idx_issue_assets_issue ON issue_assets(issue_id);
CREATE INDEX idx_issue_reviews_issue ON issue_reviews(issue_id);
