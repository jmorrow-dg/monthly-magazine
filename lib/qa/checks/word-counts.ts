// ============================================================
// QA Check: Word Count Validation (partial score for editorial_compliance)
// Validates content against CONTENT_LIMITS and INLINE_LIMITS.
// ============================================================

import type { QACheckInput, QACheckResult, QAViolation } from '../../types/qa';
import { CONTENT_LIMITS, INLINE_LIMITS } from '../../constants/content-limits';
import { OVERAGE_THRESHOLDS } from '../constants';

export function checkWordCounts(input: QACheckInput): QACheckResult {
  const violations: QAViolation[] = [];
  let errorCount = 0;
  let warningCount = 0;

  // Check cover story fields
  if (input.cover_story && CONTENT_LIMITS.cover_story) {
    const cs = input.cover_story as Record<string, unknown>;
    for (const [field, limit] of Object.entries(CONTENT_LIMITS.cover_story)) {
      const text = cs[field];
      if (typeof text === 'string') {
        const result = validateField(text, limit.maxWords, 'Cover Story', field);
        if (result) {
          violations.push(result);
          if (result.severity === 'error') errorCount++;
          else warningCount++;
        }
      }
    }
  }

  // Check array sections
  const sectionMap: Record<string, { items: Record<string, unknown>[]; label: string }> = {
    implications: { items: input.implications, label: 'Implications' },
    enterprise: { items: input.enterprise, label: 'Enterprise' },
    industry_watch: { items: input.industry_watch, label: 'Industry Watch' },
    tools: { items: input.tools, label: 'Tools' },
    playbooks: { items: input.playbooks, label: 'Playbooks' },
    strategic_signals: { items: input.strategic_signals, label: 'Strategic Signals' },
  };

  for (const [sectionKey, { items, label }] of Object.entries(sectionMap)) {
    const limits = CONTENT_LIMITS[sectionKey];
    if (!limits) continue;

    for (let i = 0; i < items.length; i++) {
      for (const [field, limit] of Object.entries(limits)) {
        const text = items[i][field];
        if (typeof text === 'string') {
          const result = validateField(text, limit.maxWords, `${label}[${i}]`, field);
          if (result) {
            violations.push(result);
            if (result.severity === 'error') errorCount++;
            else warningCount++;
          }
        }
      }
    }
  }

  // Check inline limits
  const inlineMap: Record<string, string | null> = {
    editorial_note: input.editorial_note,
    why_this_matters: input.why_this_matters,
  };

  for (const [key, text] of Object.entries(inlineMap)) {
    if (text && INLINE_LIMITS[key]) {
      const result = validateField(text, INLINE_LIMITS[key].maxWords, 'Inline', key);
      if (result) {
        violations.push(result);
        if (result.severity === 'error') errorCount++;
        else warningCount++;
      }
    }
  }

  // Scoring: 5 points (other half of editorial_compliance)
  // Each error costs 1 point, each warning costs 0.25 points
  const penalty = Math.min(errorCount * 1 + warningCount * 0.25, 5);
  const score = Math.max(0, 5 - penalty);

  return {
    category: 'editorial_compliance',
    score: Math.round(score * 100) / 100,
    max_score: 5, // contributes 5 of the 10 editorial_compliance points
    violations,
  };
}

function validateField(
  text: string,
  maxWords: number,
  section: string,
  field: string,
): QAViolation | null {
  const wordCount = countWords(text);
  const ratio = wordCount / maxWords;

  if (ratio >= OVERAGE_THRESHOLDS.ERROR_PCT) {
    return {
      check: 'editorial_compliance',
      severity: 'error',
      section,
      field,
      message: `Word count ${wordCount} exceeds limit by ${Math.round((ratio - 1) * 100)}% (max: ${maxWords}).`,
      suggestion: `Reduce content to ${maxWords} words or fewer.`,
    };
  }

  if (ratio >= OVERAGE_THRESHOLDS.WARNING_PCT) {
    return {
      check: 'editorial_compliance',
      severity: 'warning',
      section,
      field,
      message: `Word count ${wordCount} is at or near the ${maxWords} word limit.`,
      suggestion: `Consider trimming to stay within the ${maxWords} word limit.`,
    };
  }

  return null;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
