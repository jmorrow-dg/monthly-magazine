-- ============================================================
-- Migration 011: Intelligence Accuracy Engine
-- Stores per-section evidence packs as JSONB on the issues table.
-- Safe to run after 010_qa_engine_expanded.sql (idempotent).
-- ============================================================

ALTER TABLE issues ADD COLUMN IF NOT EXISTS evidence_pack_bundle jsonb;

COMMENT ON COLUMN issues.evidence_pack_bundle IS
  'EvidencePackBundle: per-section curated evidence packs used during AI generation. Write-once after generation, read by QA and admin UI.';
