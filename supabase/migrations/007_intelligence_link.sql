-- Migration 007: Add intelligence hub link columns to issues
-- Tracks which signals and clusters were used to generate each issue.

ALTER TABLE issues ADD COLUMN IF NOT EXISTS source_signal_ids text[];
ALTER TABLE issues ADD COLUMN IF NOT EXISTS source_cluster_ids text[];
ALTER TABLE issues ADD COLUMN IF NOT EXISTS generation_mode text DEFAULT 'sources';
