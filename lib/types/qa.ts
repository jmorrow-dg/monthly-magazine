// ============================================================
// Editorial QA & Trust Engine — Type Definitions (Phase 3.5)
// ============================================================

// ── Severity & Status ───────────────────────────────────────

export type QAFindingSeverity = 'info' | 'warning' | 'error' | 'blocker';

export type QAStatus = 'not_run' | 'running' | 'passed' | 'failed' | 'warning';

// ── Check Categories ────────────────────────────────────────

export type QACheckCategory =
  | 'factual_grounding'
  | 'citation_coverage'
  | 'numerical_accuracy'
  | 'structural_completeness'
  | 'editorial_compliance'
  | 'reasoning_validity'
  | 'derivative_consistency';

// ── Claim Types ─────────────────────────────────────────────

export type ClaimType =
  | 'event'
  | 'launch'
  | 'funding'
  | 'partnership'
  | 'statistic'
  | 'adoption'
  | 'trend'
  | 'strategic_implication'
  | 'regional_movement'
  | 'company_action';

export type SupportStatus = 'supported' | 'partially_supported' | 'unsupported' | 'unverifiable';

// ── Extracted Sections ──────────────────────────────────────

export interface ExtractedSection {
  section_key: string;
  section_label: string;
  raw_text: string;
  metadata: Record<string, unknown>;
}

// ── Claim Reference (citation map entry) ────────────────────

export interface ClaimReference {
  claim_text: string;
  section: string;
  claim_type: ClaimType;
  support_status: SupportStatus;
  matched_signal_ids: string[];
  matched_source_urls: string[];
  evidence_excerpt: string | null;
  confidence_score: number;
  reason: string;
}

// ── Unsupported Claim ───────────────────────────────────────

export interface UnsupportedClaim {
  claim_text: string;
  section: string;
  claim_type: ClaimType;
  reason: string;
  confidence_score: number;
  suggested_action: string;
  severity: QAFindingSeverity;
}

// ── Numerical Mismatch ──────────────────────────────────────

export interface NumericalMismatch {
  claim_text: string;
  field_type: string;
  expected_value: string;
  actual_value: string;
  signal_id: string | null;
  section: string;
  severity: QAFindingSeverity;
}

// ── Editorial Flag ──────────────────────────────────────────

export interface EditorialFlag {
  section: string;
  rule: string;
  message: string;
  severity: QAFindingSeverity;
}

// ── Structural Finding ──────────────────────────────────────

export interface StructuralFinding {
  section: string;
  message: string;
  severity: QAFindingSeverity;
}

// ── LLM Review Finding ──────────────────────────────────────

export type LLMFindingType =
  | 'unsupported_claim'
  | 'overstated_conclusion'
  | 'weak_evidence'
  | 'prediction_as_fact'
  | 'scope_drift'
  | 'tone_issue'
  | 'operator_recommendation_not_grounded';

export interface LLMReviewFinding {
  section: string;
  finding_type: LLMFindingType;
  message: string;
  severity: QAFindingSeverity;
  confidence_score: number;
}

// ── Derivative Consistency Finding ──────────────────────────

export interface DerivativeConsistencyFinding {
  derivative: string;
  finding_type: string;
  message: string;
  severity: QAFindingSeverity;
}

// ── Selected Reference ──────────────────────────────────────

export interface SelectedReference {
  source_label: string;
  source_url: string;
  supporting_signal_ids: string[];
}

// ── Score Breakdown ─────────────────────────────────────────

export interface QAScoreBreakdown {
  factual_grounding: number;       // max 25
  citation_coverage: number;       // max 20
  numerical_accuracy: number;      // max 15
  structural_completeness: number; // max 10
  editorial_compliance: number;    // max 10
  reasoning_validity: number;      // max 10
  derivative_consistency: number;  // max 10
}

// ── Full QA Report ──────────────────────────────────────────

export interface QAReport {
  issue_id: string;
  qa_score: number;
  qa_status: QAStatus;
  qa_passed: boolean;
  score_breakdown: QAScoreBreakdown;
  citation_coverage_score: number;
  unsupported_claim_count: number;
  structural_error_count: number;
  editorial_violation_count: number;
  numerical_mismatch_count: number;
  reasoning_flag_count: number;
  // Structured findings (stored as JSONB)
  structural_findings: StructuralFinding[];
  unsupported_claims: UnsupportedClaim[];
  citation_map: ClaimReference[];
  numerical_mismatches: NumericalMismatch[];
  editorial_flags: EditorialFlag[];
  llm_review_findings: LLMReviewFinding[];
  derivative_consistency_findings: DerivativeConsistencyFinding[];
  selected_references: SelectedReference[];
  summary: string;
  threshold_applied: number;
  created_at: string;
}

// ── Database Row ────────────────────────────────────────────

export interface QAReportRow extends QAReport {
  id: string;
}

// ── Source Signal Summary (for grounding) ───────────────────

export interface SourceSignalSummary {
  id: string;
  title: string;
  summary: string;
  why_it_matters: string | null;
  who_should_care: string | null;
  company: string | null;
  category: string;
  source: string;
  source_url: string | null;
  signal_date: string | null;
  practical_implication: string | null;
  tags: string[];
}

// ── Source Trend Summary (for context) ──────────────────────

export interface SourceTrendSummary {
  id: string;
  title: string;
  description: string;
  strategic_summary: string | null;
  implication_for_operators: string | null;
  region_scope: string[];
  sector_scope: string[];
  confidence_score: number | null;
}

// ── Source Cluster Summary ──────────────────────────────────

export interface SourceClusterSummary {
  id: string;
  title: string;
  theme: string;
  cluster_type: string;
  narrative_summary: string | null;
}

// ── QA Check Input (passed to the orchestrator) ─────────────

export interface QACheckInput {
  issue_id: string;
  generation_mode: 'signals' | 'sources' | null;
  // All content sections (raw from issue)
  cover_story: Record<string, unknown> | null;
  implications: Record<string, unknown>[];
  enterprise: Record<string, unknown>[];
  industry_watch: Record<string, unknown>[];
  tools: Record<string, unknown>[];
  playbooks: Record<string, unknown>[];
  strategic_signals: Record<string, unknown>[];
  briefing_prompts: Record<string, unknown>[];
  executive_briefing: Record<string, unknown>[];
  ai_native_org: Record<string, unknown> | null;
  editorial_note: string | null;
  why_this_matters: string | null;
  global_landscape: Record<string, unknown> | null;
  regional_signals: Record<string, unknown> | null;
  // Derivative artifacts
  executive_summary: string | null;
  beehiiv_summary: string | null;
  welcome_email_snippet: string | null;
  linkedin_snippets: Record<string, unknown>[] | null;
  // Source provenance
  source_signal_ids: string[] | null;
  source_cluster_ids: string[] | null;
  source_trend_ids: string[] | null;
  // Resolved source data (populated by orchestrator)
  source_signals: SourceSignalSummary[];
  source_trends: SourceTrendSummary[];
  source_clusters: SourceClusterSummary[];
}

// ── Individual Check Result ─────────────────────────────────

export interface QACheckResult {
  category: QACheckCategory;
  score: number;
  max_score: number;
  structural_findings?: StructuralFinding[];
  unsupported_claims?: UnsupportedClaim[];
  citation_map?: ClaimReference[];
  numerical_mismatches?: NumericalMismatch[];
  editorial_flags?: EditorialFlag[];
  llm_review_findings?: LLMReviewFinding[];
  derivative_consistency_findings?: DerivativeConsistencyFinding[];
}
