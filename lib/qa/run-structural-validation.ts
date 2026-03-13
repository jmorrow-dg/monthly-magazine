// ============================================================
// QA: Structural Validation (max 10 points)
// Rule-based completeness checks for all required sections.
// ============================================================

import type { QACheckInput, StructuralFinding, QACheckResult } from '../types/qa';
import { REQUIRED_SECTIONS, COVER_STORY_REQUIRED_FIELDS } from './constants';

export function runStructuralValidation(input: QACheckInput): QACheckResult {
  const findings: StructuralFinding[] = [];

  // Check each required section
  for (const [key, config] of Object.entries(REQUIRED_SECTIONS)) {
    const value = getSectionValue(input, key);

    if (value === null || value === undefined) {
      findings.push({
        section: config.label,
        message: `${config.label} section is missing entirely.`,
        severity: 'blocker',
      });
      continue;
    }

    if (typeof value === 'string') {
      if (value.trim().length === 0) {
        findings.push({
          section: config.label,
          message: `${config.label} is empty.`,
          severity: 'error',
        });
      }
      continue;
    }

    // Cover story object
    if (key === 'cover_story_json' && typeof value === 'object' && !Array.isArray(value)) {
      const cs = value as Record<string, unknown>;
      for (const field of COVER_STORY_REQUIRED_FIELDS) {
        const fieldVal = cs[field];
        if (!fieldVal || (typeof fieldVal === 'string' && fieldVal.trim().length === 0)) {
          findings.push({
            section: 'Cover Story',
            message: `Cover Story field "${field}" is missing or empty.`,
            severity: 'error',
          });
        }
      }
      continue;
    }

    // Array sections
    if (Array.isArray(value)) {
      if (value.length === 0) {
        findings.push({
          section: config.label,
          message: `${config.label} section has no items.`,
          severity: 'error',
        });
      } else if (value.length < config.minItems) {
        findings.push({
          section: config.label,
          message: `${config.label} has ${value.length} items, minimum recommended is ${config.minItems}.`,
          severity: 'warning',
        });
      }
    }
  }

  // Validate linkedin_snippets count (expected 3)
  if (input.linkedin_snippets) {
    if (input.linkedin_snippets.length !== 3) {
      findings.push({
        section: 'LinkedIn Snippets',
        message: `Expected 3 LinkedIn snippets, found ${input.linkedin_snippets.length}.`,
        severity: 'warning',
      });
    }
  }

  // Validate provenance for signals mode
  if (input.generation_mode === 'signals') {
    if (!input.source_signal_ids || input.source_signal_ids.length === 0) {
      findings.push({
        section: 'Provenance',
        message: 'Signals mode issue has no source_signal_ids recorded.',
        severity: 'warning',
      });
    }
  }

  // Score calculation
  const blockerCount = findings.filter(f => f.severity === 'blocker').length;
  const errorCount = findings.filter(f => f.severity === 'error').length;
  const warningCount = findings.filter(f => f.severity === 'warning').length;

  let score = 10;
  score -= blockerCount * 3;
  score -= errorCount * 1.5;
  score -= warningCount * 0.5;

  return {
    category: 'structural_completeness',
    score: Math.max(0, Math.round(score * 100) / 100),
    max_score: 10,
    structural_findings: findings,
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
