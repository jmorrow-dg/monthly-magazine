// ============================================================
// QA Check: Structural Completeness (max 10 points)
// Validates all required sections are populated with minimum items.
// ============================================================

import type { QACheckInput, QACheckResult, QAViolation } from '../../types/qa';
import { REQUIRED_SECTIONS, COVER_STORY_REQUIRED_FIELDS } from '../constants';

export function checkStructural(input: QACheckInput): QACheckResult {
  const violations: QAViolation[] = [];
  let penaltyPoints = 0;

  // Check each required section
  for (const [key, config] of Object.entries(REQUIRED_SECTIONS)) {
    const value = getSectionValue(input, key);

    if (value === null || value === undefined) {
      violations.push({
        check: 'structural_completeness',
        severity: 'error',
        section: config.label,
        field: key,
        message: `${config.label} section is missing entirely.`,
        suggestion: `Generate or add content for the ${config.label} section.`,
      });
      penaltyPoints += 2;
      continue;
    }

    // For string fields (editorial_note, why_this_matters)
    if (typeof value === 'string') {
      if (value.trim().length === 0) {
        violations.push({
          check: 'structural_completeness',
          severity: 'error',
          section: config.label,
          field: key,
          message: `${config.label} is empty.`,
          suggestion: `Add content for ${config.label}.`,
        });
        penaltyPoints += 1.5;
      }
      continue;
    }

    // For object fields (cover_story_json)
    if (key === 'cover_story_json' && typeof value === 'object' && !Array.isArray(value)) {
      const cs = value as Record<string, unknown>;
      for (const field of COVER_STORY_REQUIRED_FIELDS) {
        const fieldVal = cs[field];
        if (!fieldVal || (typeof fieldVal === 'string' && fieldVal.trim().length === 0)) {
          violations.push({
            check: 'structural_completeness',
            severity: 'error',
            section: 'Cover Story',
            field,
            message: `Cover Story field "${field}" is missing or empty.`,
            suggestion: `Add content for the Cover Story ${field} field.`,
          });
          penaltyPoints += 0.5;
        }
      }
      continue;
    }

    // For array sections
    if (Array.isArray(value)) {
      if (value.length === 0) {
        violations.push({
          check: 'structural_completeness',
          severity: 'error',
          section: config.label,
          field: key,
          message: `${config.label} section has no items.`,
          suggestion: `Add at least ${config.minItems} items to ${config.label}.`,
        });
        penaltyPoints += 2;
      } else if (value.length < config.minItems) {
        violations.push({
          check: 'structural_completeness',
          severity: 'warning',
          section: config.label,
          field: key,
          message: `${config.label} has ${value.length} items, minimum recommended is ${config.minItems}.`,
          suggestion: `Consider adding more items to ${config.label}.`,
        });
        penaltyPoints += 1;
      }
    }
  }

  const score = Math.max(0, 10 - penaltyPoints);

  return {
    category: 'structural_completeness',
    score: Math.round(score * 100) / 100,
    max_score: 10,
    violations,
  };
}

function getSectionValue(input: QACheckInput, key: string): unknown {
  switch (key) {
    case 'cover_story_json': return input.cover_story;
    case 'implications_json': return input.implications;
    case 'enterprise_json': return input.enterprise;
    case 'industry_watch_json': return input.industry_watch;
    case 'tools_json': return input.tools;
    case 'playbooks_json': return input.playbooks;
    case 'strategic_signals_json': return input.strategic_signals;
    case 'briefing_prompts_json': return input.briefing_prompts;
    case 'executive_briefing_json': return input.executive_briefing;
    case 'editorial_note': return input.editorial_note;
    case 'why_this_matters': return input.why_this_matters;
    default: return undefined;
  }
}
