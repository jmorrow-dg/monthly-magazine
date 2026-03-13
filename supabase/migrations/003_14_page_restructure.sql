-- 14-page magazine restructure: new content sections + subscriber profiles

-- Add new content columns to issues table
ALTER TABLE issues ADD COLUMN IF NOT EXISTS cover_story_json JSONB DEFAULT '{}';
ALTER TABLE issues ADD COLUMN IF NOT EXISTS industry_watch_json JSONB DEFAULT '[]';
ALTER TABLE issues ADD COLUMN IF NOT EXISTS strategic_signals_json JSONB DEFAULT '[]';
ALTER TABLE issues ADD COLUMN IF NOT EXISTS personalized_insight_template TEXT;

-- Update issue_pages constraints for 14-page structure
ALTER TABLE issue_pages DROP CONSTRAINT IF EXISTS issue_pages_page_number_check;
ALTER TABLE issue_pages ADD CONSTRAINT issue_pages_page_number_check CHECK (page_number BETWEEN 1 AND 14);

ALTER TABLE issue_pages DROP CONSTRAINT IF EXISTS issue_pages_page_type_check;
ALTER TABLE issue_pages ADD CONSTRAINT issue_pages_page_type_check CHECK (page_type IN (
  'cover', 'editorial', 'cover-story-intro', 'cover-story-analysis',
  'cover-story-implications', 'strategic-implications', 'enterprise',
  'industry-watch', 'tools', 'playbook', 'playbook-continued',
  'strategic-signals', 'personalized-insight', 'closing',
  'developments', 'implications', 'playbooks'
));

-- Add profile columns to subscribers table (for Clay/Apollo enrichment data)
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS company_size TEXT;

-- Indexes for subscriber profile lookups
CREATE INDEX IF NOT EXISTS idx_subscribers_role ON subscribers(role);
CREATE INDEX IF NOT EXISTS idx_subscribers_industry ON subscribers(industry);
