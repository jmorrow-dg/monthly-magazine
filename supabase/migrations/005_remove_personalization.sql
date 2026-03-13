-- Migration 005: Remove per-reader personalization, rename to "Why This Matters"
-- The magazine is now static per issue. Personalization moves to the email layer.

-- Rename the column on issues
ALTER TABLE issues RENAME COLUMN personalized_insight_template TO why_this_matters;

-- Update page_type constraint to replace 'personalized-insight' with 'why-this-matters'
ALTER TABLE issue_pages DROP CONSTRAINT IF EXISTS issue_pages_page_type_check;
ALTER TABLE issue_pages ADD CONSTRAINT issue_pages_page_type_check CHECK (
  page_type IN (
    'cover', 'editorial', 'cover-story-intro', 'cover-story-analysis',
    'cover-story-implications', 'strategic-implications', 'enterprise',
    'industry-watch', 'tools', 'playbook', 'playbook-continued',
    'strategic-signals', 'why-this-matters', 'section-divider', 'closing'
  )
);

-- Update existing rows
UPDATE issue_pages SET page_type = 'why-this-matters' WHERE page_type = 'personalized-insight';
UPDATE issue_pages SET title = 'Why This Matters' WHERE page_type = 'why-this-matters' AND title = 'For You';
