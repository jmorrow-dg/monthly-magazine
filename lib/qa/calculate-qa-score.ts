// ============================================================
// QA: Score Calculator
// Combines all check results into a final weighted score
// with severity-based deductions.
// ============================================================

import type {
  QACheckResult,
  QAScoreBreakdown,
  QAStatus,
  QAFindingSeverity,
} from '../types/qa';
import { SCORE_WEIGHTS, QA_THRESHOLDS } from './constants';

interface ScoreOutput {
  qa_score: number;
  qa_status: QAStatus;
  qa_passed: boolean;
  score_breakdown: QAScoreBreakdown;
  summary: string;
  threshold_applied: number;
}

/**
 * Calculate the final QA score from all check results.
 * Applies severity-weighted deductions on top of raw category scores.
 */
export function calculateQAScore(
  checkResults: QACheckResult[],
  threshold?: number,
): ScoreOutput {
  const appliedThreshold = threshold ?? QA_THRESHOLDS.DEFAULT;

  // Build breakdown from category scores
  const breakdown: QAScoreBreakdown = {
    factual_grounding: 0,
    citation_coverage: 0,
    numerical_accuracy: 0,
    structural_completeness: 0,
    editorial_compliance: 0,
    reasoning_validity: 0,
    derivative_consistency: 0,
  };

  for (const result of checkResults) {
    const key = result.category as keyof QAScoreBreakdown;
    if (key in breakdown) {
      breakdown[key] = result.score;
    }
  }

  // Raw score is the sum of category scores
  let rawScore = Object.values(breakdown).reduce((sum, v) => sum + v, 0);

  // Collect all findings across all checks and apply severity deductions
  let blockerCount = 0;
  let errorCount = 0;
  let warningCount = 0;
  const summaryParts: string[] = [];

  for (const result of checkResults) {
    const findings = collectFindings(result);
    for (const finding of findings) {
      switch (finding.severity) {
        case 'blocker':
          blockerCount++;
          break;
        case 'error':
          errorCount++;
          break;
        case 'warning':
          warningCount++;
          break;
      }
    }
  }

  // Severity deductions (applied to raw score)
  // Blockers are hard failures regardless of score
  if (blockerCount > 0) {
    rawScore = Math.min(rawScore, appliedThreshold - 1);
    summaryParts.push(`${blockerCount} blocker${blockerCount > 1 ? 's' : ''} found`);
  }

  if (errorCount > 0) {
    summaryParts.push(`${errorCount} error${errorCount > 1 ? 's' : ''}`);
  }

  if (warningCount > 0) {
    summaryParts.push(`${warningCount} warning${warningCount > 1 ? 's' : ''}`);
  }

  // Clamp final score
  const finalScore = Math.max(0, Math.min(100, Math.round(rawScore * 100) / 100));

  // Determine status
  let qaStatus: QAStatus;
  if (finalScore >= QA_THRESHOLDS.PUBLISH_READY && blockerCount === 0) {
    qaStatus = 'passed';
  } else if (finalScore >= appliedThreshold && blockerCount === 0) {
    qaStatus = 'warning';
  } else {
    qaStatus = 'failed';
  }

  const qaPassed = qaStatus !== 'failed';

  // Build summary
  if (summaryParts.length === 0) {
    summaryParts.push('All checks passed');
  }

  const statusLabel = qaPassed ? 'Passed' : 'Failed';
  const summary = `QA ${statusLabel} (${finalScore}/100). ${summaryParts.join(', ')}.`;

  return {
    qa_score: finalScore,
    qa_status: qaStatus,
    qa_passed: qaPassed,
    score_breakdown: breakdown,
    summary,
    threshold_applied: appliedThreshold,
  };
}

/**
 * Extract severity from all finding types in a check result.
 */
function collectFindings(result: QACheckResult): { severity: QAFindingSeverity }[] {
  const findings: { severity: QAFindingSeverity }[] = [];

  if (result.structural_findings) {
    findings.push(...result.structural_findings);
  }
  if (result.unsupported_claims) {
    findings.push(...result.unsupported_claims);
  }
  if (result.numerical_mismatches) {
    findings.push(...result.numerical_mismatches);
  }
  if (result.editorial_flags) {
    findings.push(...result.editorial_flags);
  }
  if (result.llm_review_findings) {
    findings.push(...result.llm_review_findings);
  }
  if (result.derivative_consistency_findings) {
    findings.push(...result.derivative_consistency_findings);
  }

  return findings;
}
