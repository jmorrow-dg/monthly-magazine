-- Add engagement metrics tracking to carousels table
-- Structure: { "linkedin": { impressions: 0, likes: 0, comments: 0, saves: 0, shares: 0 }, ... }

ALTER TABLE carousels
ADD COLUMN IF NOT EXISTS engagement_metrics JSONB DEFAULT '{}';
