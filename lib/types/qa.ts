// ============================================================
// Editorial QA & Trust Engine — Type Definitions
// ============================================================

/** Severity level of a QA violation */
export type QAViolationSeverity = 'error' | 'warning' | 'info';

/** Check categories that map to scoring breakdown */
export type QACheckCategory =
  | 'factual_grounding'
  | 'citation_coverage'
  | 'numerical_accuracy'
  | 'structural_completeness'
  | 'editorial_compliance'
  | 'reasoning_validity'
  | 'derivative_consistency';

/** A single QA violation found during review */
export interface QAViolation {
  check: QACheckCategory;
  severity: QAViolationSeverity;
  section: string;
  field: string;
  message: string;
  suggestion: string | null;
}

/** A factual claim extracted from content and checked against source signals */
export interface ExtractedClaim {
  claim_text: string;
  section: string;
  field: string;
  grounded: boolean;
  source_signal_id: string | null;
  confidence: number;
}

/** Score breakdown across 7 QA categories (totals to 100) */
export interface QAScoreBreakdown {
  factual_grounding: number;       // max 25
  citation_coverage: number;       // max 20
  numerical_accuracy: number;      // max 15
  structural_completeness: number; // max 10
  editorial_compliance: number;    // max 10
  reasoning_validity: number;      // max 10
  derivative_consistency: number;  // max 10
}

/** Full QA report for an issue */
export interface QAReport {
  issue_id: string;
  qa_score: number;
  score_breakdown: QAScoreBreakdown;
  violations: QAViolation[];
  claims: ExtractedClaim[];
  unsupported_claim_count: number;
  citation_coverage_pct: number;
  passed: boolean;
  threshold_applied: number;
  created_at: string;
}

/** Database row for qa_reports table */
export interface QAReportRow {
  id: string;
  issue_id: string;
  qa_score: number;
  score_breakdown: QAScoreBreakdown;
  violations: QAViolation[];
  claims: ExtractedClaim[];
  unsupported_claim_count: number;
  citation_coverage_pct: number;
  passed: boolean;
  threshold_applied: number;
  created_at: string;
}

/** Input for rule-based check functions */
export interface QACheckInput {
  issue_id: string;
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
  // Derivative artifacts
  executive_summary: string | null;
  beehiiv_summary: string | null;
  welcome_email_snippet: string | null;
  linkedin_snippets: Record<string, unknown>[] | null;
  // Source signals for grounding checks
  source_signals: SourceSignalSummary[];
}

/** Minimal signal data needed for claim grounding */
export interface SourceSignalSummary {
  id: string;
  title: string;
  summary: string;
  why_it_matters: string | null;
  company: string | null;
  category: string;
  source: string;
  source_url: string | null;
  practical_implication: string | null;
}

/** Result from an individual QA check */
export interface QACheckResult {
  category: QACheckCategory;
  score: number;
  max_score: number;
  violations: QAViolation[];
  claims?: ExtractedClaim[];
}
