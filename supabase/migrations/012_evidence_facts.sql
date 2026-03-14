-- ============================================================
-- Migration 012: Phase 5 Evidence Engine — Relational Tables
-- Adds evidence_facts, issue_evidence_packs, issue_claims,
-- and issue_section_provenance for structured traceability.
-- Safe to run after 011_evidence_engine.sql (idempotent).
-- ============================================================

-- ── evidence_facts: canonical intelligence facts from signals ─

CREATE TABLE IF NOT EXISTS evidence_facts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id text NOT NULL,
  fact_text text NOT NULL,
  company text,
  topic text,
  region text,
  source_name text NOT NULL DEFAULT '',
  source_url text,
  signal_date date,
  confidence_score real NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evidence_facts_signal_id
  ON evidence_facts (signal_id);

COMMENT ON TABLE evidence_facts IS
  'Canonical intelligence facts extracted from signals. Each row is a verifiable factual statement.';

-- ── issue_evidence_packs: curated evidence per section per issue ─

CREATE TABLE IF NOT EXISTS issue_evidence_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  section_key text NOT NULL,
  fact_ids uuid[] NOT NULL DEFAULT '{}',
  priority_companies text[] NOT NULL DEFAULT '{}',
  priority_topics text[] NOT NULL DEFAULT '{}',
  reference_urls text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_issue_evidence_packs_issue_id
  ON issue_evidence_packs (issue_id);

COMMENT ON TABLE issue_evidence_packs IS
  'Per-section curated evidence packs built before generation. Links facts to sections.';

-- ── issue_claims: extracted claims mapped to evidence ─

CREATE TABLE IF NOT EXISTS issue_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  section_key text NOT NULL,
  claim_text text NOT NULL,
  supporting_fact_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_issue_claims_issue_id
  ON issue_claims (issue_id);

COMMENT ON TABLE issue_claims IS
  'Factual claims extracted from generated sections, mapped to supporting evidence facts.';

-- ── issue_section_provenance: generation audit trail ─

CREATE TABLE IF NOT EXISTS issue_section_provenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  section_key text NOT NULL,
  evidence_pack_id uuid REFERENCES issue_evidence_packs(id),
  source_signal_ids text[] NOT NULL DEFAULT '{}',
  supporting_fact_ids uuid[] NOT NULL DEFAULT '{}',
  reference_urls text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_issue_section_provenance_issue_id
  ON issue_section_provenance (issue_id);

COMMENT ON TABLE issue_section_provenance IS
  'Provenance records tracing which evidence supported each generated section.';
