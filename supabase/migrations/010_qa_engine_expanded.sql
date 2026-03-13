-- ============================================================
-- Migration 010: Editorial QA & Trust Engine — Expanded Schema
-- Adds granular QA fields to issues + restructures qa_reports.
-- Safe to run after 009_qa_engine.sql (idempotent).
-- ============================================================

-- ── Expanded QA fields on issues table ──────────────────────

ALTER TABLE issues ADD COLUMN IF NOT EXISTS qa_status text DEFAULT 'not_run';
ALTER TABLE issues ADD COLUMN IF NOT EXISTS citation_coverage_score smallint;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS unsupported_claim_count smallint DEFAULT 0;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS structural_error_count smallint DEFAULT 0;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS editorial_violation_count smallint DEFAULT 0;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS numerical_mismatch_count smallint DEFAULT 0;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS reasoning_flag_count smallint DEFAULT 0;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS qa_summary text;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS qa_override boolean DEFAULT false;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS qa_override_reason text;

-- ── Expand qa_reports table with structured finding columns ─

ALTER TABLE qa_reports ADD COLUMN IF NOT EXISTS qa_status text NOT NULL DEFAULT 'not_run';
ALTER TABLE qa_reports ADD COLUMN IF NOT EXISTS citation_coverage_score smallint;
ALTER TABLE qa_reports ADD COLUMN IF NOT EXISTS structural_error_count smallint NOT NULL DEFAULT 0;
ALTER TABLE qa_reports ADD COLUMN IF NOT EXISTS editorial_violation_count smallint NOT NULL DEFAULT 0;
ALTER TABLE qa_reports ADD COLUMN IF NOT EXISTS numerical_mismatch_count smallint NOT NULL DEFAULT 0;
ALTER TABLE qa_reports ADD COLUMN IF NOT EXISTS reasoning_flag_count smallint NOT NULL DEFAULT 0;
ALTER TABLE qa_reports ADD COLUMN IF NOT EXISTS structural_findings jsonb DEFAULT '[]';
ALTER TABLE qa_reports ADD COLUMN IF NOT EXISTS citation_map jsonb DEFAULT '[]';
ALTER TABLE qa_reports ADD COLUMN IF NOT EXISTS numerical_mismatches jsonb DEFAULT '[]';
ALTER TABLE qa_reports ADD COLUMN IF NOT EXISTS editorial_flags jsonb DEFAULT '[]';
ALTER TABLE qa_reports ADD COLUMN IF NOT EXISTS llm_review_findings jsonb DEFAULT '[]';
ALTER TABLE qa_reports ADD COLUMN IF NOT EXISTS derivative_consistency_findings jsonb DEFAULT '[]';
ALTER TABLE qa_reports ADD COLUMN IF NOT EXISTS selected_references jsonb DEFAULT '[]';
ALTER TABLE qa_reports ADD COLUMN IF NOT EXISTS summary text;

-- Rename existing columns for backward compatibility
-- The original 009 migration created: violations jsonb, claims jsonb
-- We keep them and add the new structured columns alongside.
-- The new code will write to both old and new columns during transition.
