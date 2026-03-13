-- ============================================================
-- Migration 009: Editorial QA & Trust Engine
-- Adds QA scoring fields to issues + qa_reports table.
-- ============================================================

-- Add QA summary fields to issues table
ALTER TABLE issues ADD COLUMN IF NOT EXISTS qa_score smallint;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS qa_passed boolean;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS last_qa_run_at timestamptz;

-- QA reports table: stores full report per run
CREATE TABLE IF NOT EXISTS qa_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id uuid NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  qa_score smallint NOT NULL,
  score_breakdown jsonb NOT NULL,
  violations jsonb NOT NULL DEFAULT '[]',
  claims jsonb NOT NULL DEFAULT '[]',
  unsupported_claim_count smallint NOT NULL DEFAULT 0,
  citation_coverage_pct smallint NOT NULL DEFAULT 0,
  passed boolean NOT NULL DEFAULT false,
  threshold_applied smallint NOT NULL DEFAULT 85,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_qa_reports_issue ON qa_reports(issue_id);
CREATE INDEX IF NOT EXISTS idx_qa_reports_date ON qa_reports(created_at DESC);

-- RLS
ALTER TABLE qa_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on qa_reports"
  ON qa_reports FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
