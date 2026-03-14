// ============================================================
// QA Orchestrator: Runs the full QA pipeline for an issue.
// Coordinates all checks and produces a complete QA report.
// ============================================================

import type {
  QACheckInput,
  QACheckResult,
  QAReport,
  SourceSignalSummary,
  SourceTrendSummary,
  SourceClusterSummary,
} from '../types/qa';
import type { Issue } from '../types/issue';
import type { IntelligenceSignal, IntelligenceTrend, SignalCluster } from '../intelligence/types';

// Check modules
import { runStructuralValidation } from './run-structural-validation';
import { runEditorialValidation } from './run-editorial-validation';
import { runNumericalConsistencyCheck } from './run-numerical-consistency-check';
import { runDerivativeConsistencyCheck } from './run-derivative-consistency-check';
import { runLLMEditorialReview } from './run-llm-editorial-review';
import { extractClaims } from './extract-claims';
import { groundClaimsToSignals, groundClaimsToEvidence, groundClaimsToFacts } from './ground-claims-to-signals';
import { extractIssueSections, getCoreContentSections } from './extract-issue-sections';
import { calculateCitationCoverage } from './calculate-citation-coverage';
import { generateSelectedReferences } from './generate-selected-references';
import { calculateQAScore } from './calculate-qa-score';

// Intelligence data fetchers
import { fetchSignalsByIds } from '../intelligence/fetch-signals-by-ids';
import { fetchTrendsByIds } from '../intelligence/fetch-trends-by-ids';
import { fetchClustersByIds } from '../intelligence/fetch-clusters-by-ids';

// Phase 5: Evidence facts
import { getFactsBySignalIds } from '../evidence/extract-facts';

/**
 * Build QACheckInput from an Issue object.
 */
export function buildQAInput(issue: Issue): QACheckInput {
  return {
    issue_id: issue.id,
    generation_mode: issue.generation_mode,
    cover_story: issue.cover_story_json as Record<string, unknown> | null,
    implications: (issue.implications_json || []) as Record<string, unknown>[],
    enterprise: (issue.enterprise_json || []) as Record<string, unknown>[],
    industry_watch: (issue.industry_watch_json || []) as Record<string, unknown>[],
    tools: (issue.tools_json || []) as Record<string, unknown>[],
    playbooks: (issue.playbooks_json || []) as Record<string, unknown>[],
    strategic_signals: (issue.strategic_signals_json || []) as Record<string, unknown>[],
    briefing_prompts: (issue.briefing_prompts_json || []) as Record<string, unknown>[],
    executive_briefing: (issue.executive_briefing_json || []) as Record<string, unknown>[],
    ai_native_org: issue.ai_native_org_json as Record<string, unknown> | null,
    editorial_note: issue.editorial_note,
    why_this_matters: issue.why_this_matters,
    global_landscape: issue.global_landscape_json as Record<string, unknown> | null,
    regional_signals: issue.regional_signals_json as Record<string, unknown> | null,
    // Derivatives
    executive_summary: issue.executive_summary,
    beehiiv_summary: issue.beehiiv_summary,
    welcome_email_snippet: issue.welcome_email_snippet,
    linkedin_snippets: (issue.linkedin_snippets || []) as Record<string, unknown>[],
    // Provenance IDs
    source_signal_ids: issue.source_signal_ids,
    source_cluster_ids: issue.source_cluster_ids,
    source_trend_ids: issue.source_trend_ids,
    // Populated below
    source_signals: [],
    source_trends: [],
    source_clusters: [],
  };
}

/**
 * Convert intelligence types to QA source summaries.
 */
function toSignalSummary(signal: IntelligenceSignal): SourceSignalSummary {
  return {
    id: signal.id,
    title: signal.title,
    summary: signal.summary,
    why_it_matters: signal.why_it_matters,
    who_should_care: signal.who_should_care,
    company: signal.company,
    category: signal.category,
    source: signal.source,
    source_url: signal.source_url,
    signal_date: signal.signal_date,
    practical_implication: signal.practical_implication,
    tags: signal.tags || [],
  };
}

function toTrendSummary(trend: IntelligenceTrend): SourceTrendSummary {
  return {
    id: trend.id,
    title: trend.title,
    description: trend.description,
    strategic_summary: trend.strategic_summary,
    implication_for_operators: trend.implication_for_operators,
    region_scope: trend.region_scope || [],
    sector_scope: trend.sector_scope || [],
    confidence_score: trend.confidence_score,
  };
}

function toClusterSummary(cluster: SignalCluster): SourceClusterSummary {
  return {
    id: cluster.id,
    title: cluster.title,
    theme: cluster.theme,
    cluster_type: cluster.cluster_type,
    narrative_summary: cluster.narrative_summary,
  };
}

/**
 * Run the full QA pipeline for an issue.
 *
 * Pipeline phases:
 * 1. Fetch source data (signals, trends, clusters) for grounding
 * 2. Run rule-based checks in parallel (structural, editorial, numerical)
 * 3. Extract claims via LLM (sequential, depends on sections)
 * 4. Ground claims against signals + calculate coverage
 * 5. Run LLM editorial review (sequential)
 * 6. Run derivative consistency check
 * 7. Calculate final score and build report
 */
export async function runIssueQA(issue: Issue): Promise<QAReport> {
  const input = buildQAInput(issue);

  // ── Phase 1: Fetch source data ──────────────────────────────
  const [rawSignals, rawTrends, rawClusters] = await Promise.all([
    input.source_signal_ids?.length
      ? fetchSignalsByIds(input.source_signal_ids).catch(() => [])
      : Promise.resolve([]),
    input.source_trend_ids?.length
      ? fetchTrendsByIds(input.source_trend_ids).catch(() => [])
      : Promise.resolve([]),
    input.source_cluster_ids?.length
      ? fetchClustersByIds(input.source_cluster_ids).catch(() => [])
      : Promise.resolve([]),
  ]);

  input.source_signals = rawSignals.map(toSignalSummary);
  input.source_trends = rawTrends.map(toTrendSummary);
  input.source_clusters = rawClusters.map(toClusterSummary);

  // ── Phase 2: Rule-based checks (parallel) ───────────────────
  const [structuralResult, editorialResult, numericalResult] = await Promise.all([
    Promise.resolve(runStructuralValidation(input)),
    Promise.resolve(runEditorialValidation(input)),
    Promise.resolve(runNumericalConsistencyCheck(input)),
  ]);

  const checkResults: QACheckResult[] = [structuralResult, editorialResult, numericalResult];

  // ── Phase 3: Claim extraction ───────────────────────────────
  const sections = extractIssueSections(input);
  const coreSections = getCoreContentSections(sections);
  const claims = await extractClaims(coreSections);

  // ── Phase 4: Ground claims + citation coverage ──────────────
  // Prefer Phase 5 fact-based grounding > Phase 4 evidence bundle > raw signals
  let groundingResult;
  const evidenceFacts = input.source_signal_ids?.length
    ? await getFactsBySignalIds(input.source_signal_ids).catch(() => [])
    : [];

  if (evidenceFacts.length > 0) {
    groundingResult = groundClaimsToFacts(claims, evidenceFacts, input.source_signals, input.source_trends);
  } else if (issue.evidence_pack_bundle) {
    groundingResult = groundClaimsToEvidence(claims, issue.evidence_pack_bundle, input.source_signals, input.source_trends);
  } else {
    groundingResult = groundClaimsToSignals(claims, input.source_signals, input.source_trends);
  }
  const citationMap = groundingResult.citation_map;
  const unsupportedClaims = groundingResult.unsupported_claims;

  const citationResult = calculateCitationCoverage(citationMap);

  // Build factual grounding result from the grounding data
  const supportedCount = citationMap.filter((c: { support_status: string }) => c.support_status === 'supported').length;
  const totalClaims = citationMap.length;
  const groundingRatio = totalClaims > 0 ? supportedCount / totalClaims : 1;
  const factualGroundingScore = Math.min(25, 25 * groundingRatio
    - unsupportedClaims.filter((c: { severity: string }) => c.severity === 'error').length * 2
    - unsupportedClaims.filter((c: { severity: string }) => c.severity === 'warning').length * 0.5);

  const factualGroundingResult: QACheckResult = {
    category: 'factual_grounding',
    score: Math.max(0, Math.round(factualGroundingScore * 100) / 100),
    max_score: 25,
    unsupported_claims: unsupportedClaims,
    citation_map: citationMap,
  };

  checkResults.push(factualGroundingResult, citationResult);

  // ── Phase 5: LLM editorial review ──────────────────────────
  const llmResult = await runLLMEditorialReview(input);
  checkResults.push(llmResult);

  // ── Phase 6: Derivative consistency ────────────────────────
  const derivativeResult = runDerivativeConsistencyCheck(input);
  checkResults.push(derivativeResult);

  // ── Phase 7: Score calculation + report ────────────────────
  const { qa_score, qa_status, qa_passed, score_breakdown, summary, threshold_applied } =
    calculateQAScore(checkResults);

  // Generate references
  const selectedReferences = generateSelectedReferences(citationMap, input.source_signals);

  // Aggregate counts
  const structuralFindings = checkResults.flatMap(r => r.structural_findings || []);
  const editorialFlags = checkResults.flatMap(r => r.editorial_flags || []);
  const numericalMismatches = checkResults.flatMap(r => r.numerical_mismatches || []);
  const llmReviewFindings = checkResults.flatMap(r => r.llm_review_findings || []);
  const derivativeFindings = checkResults.flatMap(r => r.derivative_consistency_findings || []);

  const report: QAReport = {
    issue_id: issue.id,
    qa_score,
    qa_status,
    qa_passed,
    score_breakdown,
    citation_coverage_score: citationResult.score,
    unsupported_claim_count: unsupportedClaims.length,
    structural_error_count: structuralFindings.filter(f => f.severity === 'error' || f.severity === 'blocker').length,
    editorial_violation_count: editorialFlags.filter(f => f.severity === 'error' || f.severity === 'warning').length,
    numerical_mismatch_count: numericalMismatches.filter(f => f.severity === 'error' || f.severity === 'warning').length,
    reasoning_flag_count: llmReviewFindings.filter(f => f.severity === 'error' || f.severity === 'warning').length,
    // Structured findings
    structural_findings: structuralFindings,
    unsupported_claims: unsupportedClaims,
    citation_map: citationMap,
    numerical_mismatches: numericalMismatches,
    editorial_flags: editorialFlags,
    llm_review_findings: llmReviewFindings,
    derivative_consistency_findings: derivativeFindings,
    selected_references: selectedReferences,
    summary,
    threshold_applied,
    created_at: new Date().toISOString(),
  };

  return report;
}
