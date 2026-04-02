-- Carousel Engine: Database Schema
-- Run this migration against the Supabase project

-- Carousels table
CREATE TABLE IF NOT EXISTS carousels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected')),

  -- Source signal
  source_signal_id TEXT NOT NULL,
  source_signal_title TEXT NOT NULL,
  source_signal_category TEXT NOT NULL,

  -- Generated content (all 5 slides)
  content_json JSONB NOT NULL,

  -- Platform-specific captions
  captions_json JSONB NOT NULL,

  -- Rendered slide URLs keyed by platform
  slide_urls_by_platform JSONB NOT NULL DEFAULT '{}',

  -- Target platforms
  platforms TEXT[] NOT NULL DEFAULT ARRAY['linkedin', 'instagram', 'x', 'tiktok'],

  -- Personal photo used
  photo_path TEXT,

  -- Scheduling metadata
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,

  -- Indexes
  CONSTRAINT unique_signal_per_week UNIQUE (source_signal_id, week_number, year)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_carousels_status ON carousels (status);
CREATE INDEX IF NOT EXISTS idx_carousels_created ON carousels (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_carousels_week ON carousels (year, week_number);

-- Storage bucket for carousel images
-- Run via Supabase dashboard or API:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('carousel-images', 'carousel-images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('photo-archive', 'photo-archive', true);

-- RLS policies (open for service role, which is what the app uses)
ALTER TABLE carousels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on carousels"
  ON carousels
  FOR ALL
  USING (true)
  WITH CHECK (true);
