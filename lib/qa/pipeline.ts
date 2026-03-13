// ============================================================
// QA Pipeline Orchestrator
// Runs all QA checks in optimal order and produces a full QA report.
//
// Phase 1 [parallel]:  structural + editorial-style + word-counts     (~instant)
// Phase 2 [sequential]: claim extraction via Claude                   (~15s)
// Phase 3 [parallel]:  citation verification + numerical consistency  (~instant)
// Phase 4 [sequential]: editorial review via Claude                   (~15s)
// Phase 5 [conditional]: derivative consistency                       (~instant)
// Phase 6: score calculation + pass/fail determination
// ============================================================

import type { QACheckInput, QAReport, QAScoreBreakdown, QAViolation, ExtractedClaim, QACheckResult } from '../types/qa';
import { QA_THRESHOLDS, SCORE_WEIGHTS } from './constants';

// Rule-based checks
import { checkStructural } from './checks/structural';
import { checkEditorialStyle } from './checks/editorial-style';
import { checkWordCounts } from './checks/word-counts';
import { checkDerivativeConsistency } from './checks/derivative-consistency';

// LLM-powered checks
import { checkClaimExtraction } from './checks/claim-extraction';
import { checkEditorialReview } from './checks/editorial-review';

// Verification checks
import { checkCitationCoverage } from './checks/citation-verification';
import { checkNumericalConsistency } from './checks/numerical-consistency';

/**
 * Run the full QA pipeline on an issue.
 * Returns a complete QA report with scores, violations, and claims.
 */
export async function runQAPipeline(input: QACheckInput): Promise<QAReport> {
  const allViolations: QAViolation[] = [];
  let allClaims: ExtractedClaim[] = [];

  // Phase 1: Rule-based checks (parallel)
  const [structuralResult, editorialStyleResult, wordCountResult] = await Promise.all([
    Promise.resolve(checkStructural(input)),
    Promise.resolve(checkEditorialStyle(input)),
    Promise.resolve(checkWordCounts(input)),
  ]);

  allViolations.push(
    ...structuralResult.violations,
    ...editorialStyleResult.violations,
    ...wordCountResult.violations,
  );

  // Phase 2: Claim extraction (sequential, LLM call)
  const claimResult = await checkClaimExtraction(input);
  allViolations.push(...claimResult.violations);
  if (claimResult.claims) {
    allClaims = claimResult.claims;
  }

  // Phase 3: Citation + numerical checks (parallel, use extracted claims)
  const [citationResult, numericalResult] = await Promise.all([
    Promise.resolve(checkCitationCoverage(input, allClaims)),
    Promise.resolve(checkNumericalConsistency(input)),
  ]);

  allViolations.push(
    ...citationResult.violations,
    ...numericalResult.violations,
  );

  // Phase 4: Editorial review (sequential, LLM call)
  const editorialReviewResult = await checkEditorialReview(input, allClaims);
  allViolations.push(...editorialReviewResult.violations);

  // Phase 5: Derivative consistency (conditional)
  const derivativeResult = checkDerivativeConsistency(input);
  allViolations.push(...derivativeResult.violations);

  // Phase 6: Score calculation
  // editorial_compliance is split between editorial-style (5pts) and word-counts (5pts)
  const editorialComplianceScore = editorialStyleResult.score + wordCountResult.score;

  const breakdown: QAScoreBreakdown = {
    factual_grounding: normaliseScore(claimResult.score, SCORE_WEIGHTS.factual_grounding),
    citation_coverage: normaliseScore(citationResult.score, SCORE_WEIGHTS.citation_coverage),
    numerical_accuracy: normaliseScore(numericalResult.score, SCORE_WEIGHTS.numerical_accuracy),
    structural_completeness: normaliseScore(structuralResult.score, SCORE_WEIGHTS.structural_completeness),
    editorial_compliance: normaliseScore(editorialComplianceScore, SCORE_WEIGHTS.editorial_compliance),
    reasoning_validity: normaliseScore(editorialReviewResult.score, SCORE_WEIGHTS.reasoning_validity),
    derivative_consistency: normaliseScore(derivativeResult.score, SCORE_WEIGHTS.derivative_consistency),
  };

  const totalScore = Math.round(
    breakdown.factual_grounding +
    breakdown.citation_coverage +
    breakdown.numerical_accuracy +
    breakdown.structural_completeness +
    breakdown.editorial_compliance +
    breakdown.reasoning_validity +
    breakdown.derivative_consistency
  );

  const unsupportedClaimCount = allClaims.filter(c => !c.grounded).length;
  const citationCoveragePct = calculateCitationPct(allClaims);

  const passed = totalScore >= QA_THRESHOLDS.DEFAULT;

  return {
    issue_id: input.issue_id,
    qa_score: totalScore,
    score_breakdown: breakdown,
    violations: allViolations,
    claims: allClaims,
    unsupported_claim_count: unsupportedClaimCount,
    citation_coverage_pct: citationCoveragePct,
    passed,
    threshold_applied: QA_THRESHOLDS.DEFAULT,
    created_at: new Date().toISOString(),
  };
}

/**
 * Normalise a check result score to its weight in the 100-point scale.
 * For example, if a check scored 8/10 and its weight is 10, returns 8.
 * If a check scored 20/25 and its weight is 25, returns 20.
 */
function normaliseScore(rawScore: number, maxPoints: number): number {
  return Math.round(Math.min(rawScore, maxPoints) * 100) / 100;
}

function calculateCitationPct(claims: ExtractedClaim[]): number {
  if (claims.length === 0) return 100;
  const grounded = claims.filter(c => c.grounded).length;
  return Math.round((grounded / claims.length) * 100);
}
