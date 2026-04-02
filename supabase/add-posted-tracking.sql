-- Add posted tracking to carousels table
-- posted_platforms: JSONB tracking which platforms have been posted to
-- e.g. { "linkedin": "2026-04-02T10:00:00Z", "instagram": "2026-04-02T10:05:00Z" }

ALTER TABLE carousels
ADD COLUMN IF NOT EXISTS posted_platforms JSONB DEFAULT '{}';

-- Add 'posted' as a valid status
COMMENT ON COLUMN carousels.status IS 'draft | pending_review | approved | rejected | posted';
