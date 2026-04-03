-- Add format field to distinguish weekly vs monthly/quarterly issues
ALTER TABLE issues ADD COLUMN IF NOT EXISTS format TEXT NOT NULL DEFAULT 'monthly';
ALTER TABLE issues ADD COLUMN IF NOT EXISTS week_start DATE;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS week_end DATE;

-- Index for quick filtering by format
CREATE INDEX IF NOT EXISTS idx_issues_format ON issues (format);

-- Comment for documentation
COMMENT ON COLUMN issues.format IS 'Issue format: weekly, monthly, or quarterly';
COMMENT ON COLUMN issues.week_start IS 'For weekly issues: Monday of the coverage week';
COMMENT ON COLUMN issues.week_end IS 'For weekly issues: Sunday of the coverage week';
