-- Migration 006: Add regional signals and global landscape data columns
-- Supports the Regional Signal Layer with dynamic per-issue regional intelligence

ALTER TABLE issues ADD COLUMN IF NOT EXISTS global_landscape_json jsonb DEFAULT NULL;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS regional_signals_json jsonb DEFAULT NULL;
