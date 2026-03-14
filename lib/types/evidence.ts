// ============================================================
// Intelligence Accuracy Engine: Evidence Types
// Structured evidence packs for section-specific generation.
// ============================================================

/** Section names matching magazine generation functions. */
export type MagazineSectionName =
  | 'cover_story'
  | 'implications'
  | 'enterprise'
  | 'industry_watch'
  | 'tools'
  | 'playbooks'
  | 'strategic_signals'
  | 'briefing_prompts'
  | 'executive_briefing'
  | 'ai_native_org'
  | 'editorial'
  | 'why_this_matters'
  | 'regional_signals'
  | 'global_landscape';

export const ALL_SECTION_NAMES: MagazineSectionName[] = [
  'cover_story',
  'implications',
  'enterprise',
  'industry_watch',
  'tools',
  'playbooks',
  'strategic_signals',
  'briefing_prompts',
  'executive_briefing',
  'ai_native_org',
  'editorial',
  'why_this_matters',
  'regional_signals',
  'global_landscape',
];

export type EvidenceSourceType = 'signal' | 'trend' | 'cluster';

/** A specific data point extracted from evidence text. */
export interface EvidenceDataPoint {
  /** The raw value, e.g. "72%", "$4.2B", "3x increase" */
  value: string;
  /** Surrounding context, e.g. "enterprise AI adoption rate in Q1 2026" */
  context: string;
  /** The signal/trend/cluster ID this data point came from */
  source_id: string;
}

/** A single piece of structured evidence extracted from intelligence data. */
export interface EvidenceItem {
  /** Deterministic ID: ev_{source_type}_{source_id}_{index} */
  id: string;
  source_type: EvidenceSourceType;
  /** Original signal/trend/cluster ID */
  source_id: string;
  source_url: string | null;
  title: string;
  /** The extractable factual content */
  evidence_text: string;
  data_points: EvidenceDataPoint[];
  company: string | null;
  category: string;
  tags: string[];
  /** Inherited from signal composite_score or trend confidence_score */
  composite_score: number;
  signal_date: string | null;
}

/** Curated evidence for a specific magazine section. */
export interface SectionEvidencePack {
  section_name: MagazineSectionName;
  evidence_items: EvidenceItem[];
  /** Derived from cluster/trend theme */
  primary_narrative: string | null;
  /** Average relevance score of selected items */
  section_relevance_score: number;
  metadata: {
    total_candidates: number;
    selected_count: number;
    min_relevance_threshold: number;
    built_at: string;
  };
}

/** All section packs for an issue, stored as a single JSONB column. */
export interface EvidencePackBundle {
  issue_id: string;
  month_year: string;
  created_at: string;
  section_packs: Record<MagazineSectionName, SectionEvidencePack>;
  source_signal_ids: string[];
  source_cluster_ids: string[];
  source_trend_ids: string[];
  pipeline_duration_ms: number;
}

// ── Phase 5: Relational Evidence Types ────────────────────

/** Canonical intelligence fact extracted from a signal (persisted to DB). */
export interface EvidenceFact {
  id: string;
  signal_id: string;
  fact_text: string;
  company: string | null;
  topic: string | null;
  region: string | null;
  source_name: string;
  source_url: string | null;
  signal_date: string | null;
  confidence_score: number;
  created_at: string;
}

/** Section evidence pack row (persisted to DB). */
export interface IssueEvidencePack {
  id: string;
  issue_id: string;
  section_key: MagazineSectionName;
  fact_ids: string[];
  priority_companies: string[];
  priority_topics: string[];
  reference_urls: string[];
  created_at: string;
}

/** Extracted claim mapped to supporting evidence (persisted to DB). */
export interface IssueClaim {
  id: string;
  issue_id: string;
  section_key: MagazineSectionName;
  claim_text: string;
  supporting_fact_ids: string[];
  created_at: string;
}

/** Section provenance record (persisted to DB). */
export interface IssueSectionProvenance {
  id: string;
  issue_id: string;
  section_key: MagazineSectionName;
  evidence_pack_id: string | null;
  source_signal_ids: string[];
  supporting_fact_ids: string[];
  reference_urls: string[];
  created_at: string;
}
