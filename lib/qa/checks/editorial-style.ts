// ============================================================
// QA Check: Editorial Style Compliance (partial score for editorial_compliance)
// Detects remaining dashes and non-Australian spelling.
// ============================================================

import type { QACheckInput, QACheckResult, QAViolation } from '../../types/qa';
import { AU_SPELLING_MAP } from '../constants';

/** Regex patterns for dash detection (mirrors sanitise-dashes.ts) */
const EM_DASH = /\u2014/g;
const EN_DASH = /\u2013/g;
const SPACED_HYPHEN = / - /g;

export function checkEditorialStyle(input: QACheckInput): QACheckResult {
  const violations: QAViolation[] = [];
  let dashCount = 0;
  let spellingCount = 0;

  // Collect all text content with section/field labels
  const textEntries = extractAllText(input);

  for (const entry of textEntries) {
    // Check for dashes
    const emDashes = entry.text.match(EM_DASH);
    const enDashes = entry.text.match(EN_DASH);
    const spacedHyphens = entry.text.match(SPACED_HYPHEN);

    const totalDashes = (emDashes?.length || 0) + (enDashes?.length || 0) + (spacedHyphens?.length || 0);
    if (totalDashes > 0) {
      dashCount += totalDashes;
      violations.push({
        check: 'editorial_compliance',
        severity: 'error',
        section: entry.section,
        field: entry.field,
        message: `Found ${totalDashes} dash${totalDashes > 1 ? 'es' : ''} (em dash, en dash, or spaced hyphen).`,
        suggestion: 'Replace dashes with commas, semicolons, or restructure the sentence. Use sanitiseDashes() utility.',
      });
    }

    // Check for US spellings
    const words = entry.text.toLowerCase().split(/\b/);
    const usSpellings = new Set<string>();
    for (const word of words) {
      if (AU_SPELLING_MAP[word] && AU_SPELLING_MAP[word] !== word) {
        usSpellings.add(word);
      }
    }

    if (usSpellings.size > 0) {
      spellingCount += usSpellings.size;
      const corrections = Array.from(usSpellings)
        .map(w => `"${w}" should be "${AU_SPELLING_MAP[w]}"`)
        .join('; ');

      violations.push({
        check: 'editorial_compliance',
        severity: 'warning',
        section: entry.section,
        field: entry.field,
        message: `Found ${usSpellings.size} US English spelling${usSpellings.size > 1 ? 's' : ''}: ${corrections}.`,
        suggestion: 'Update to Australian English spelling.',
      });
    }
  }

  // Scoring: start at 5 (half of editorial_compliance's 10 points)
  // Each dash occurrence costs 0.5 points, each spelling issue costs 0.25 points
  const dashPenalty = Math.min(dashCount * 0.5, 3);
  const spellingPenalty = Math.min(spellingCount * 0.25, 2);
  const score = Math.max(0, 5 - dashPenalty - spellingPenalty);

  return {
    category: 'editorial_compliance',
    score: Math.round(score * 100) / 100,
    max_score: 5, // This check contributes 5 of the 10 editorial_compliance points
    violations,
  };
}

interface TextEntry {
  section: string;
  field: string;
  text: string;
}

function extractAllText(input: QACheckInput): TextEntry[] {
  const entries: TextEntry[] = [];

  // Cover story
  if (input.cover_story) {
    const cs = input.cover_story as Record<string, unknown>;
    for (const [field, val] of Object.entries(cs)) {
      if (typeof val === 'string' && val.trim()) {
        entries.push({ section: 'Cover Story', field, text: val });
      }
    }
  }

  // Array sections
  const arraySections: [string, Record<string, unknown>[]][] = [
    ['Implications', input.implications],
    ['Enterprise', input.enterprise],
    ['Industry Watch', input.industry_watch],
    ['Tools', input.tools],
    ['Playbooks', input.playbooks],
    ['Strategic Signals', input.strategic_signals],
    ['Briefing Prompts', input.briefing_prompts],
    ['Executive Briefing', input.executive_briefing],
  ];

  for (const [section, items] of arraySections) {
    for (let i = 0; i < items.length; i++) {
      for (const [field, val] of Object.entries(items[i])) {
        if (typeof val === 'string' && val.trim()) {
          entries.push({ section: `${section}[${i}]`, field, text: val });
        }
        if (Array.isArray(val)) {
          for (const item of val) {
            if (typeof item === 'string' && item.trim()) {
              entries.push({ section: `${section}[${i}]`, field, text: item });
            }
          }
        }
      }
    }
  }

  // Inline text fields
  if (input.editorial_note) {
    entries.push({ section: 'Editorial', field: 'editorial_note', text: input.editorial_note });
  }
  if (input.why_this_matters) {
    entries.push({ section: 'Why This Matters', field: 'why_this_matters', text: input.why_this_matters });
  }

  // AI Native Org
  if (input.ai_native_org) {
    const org = input.ai_native_org as Record<string, unknown>;
    if (typeof org.layer_focus_text === 'string') {
      entries.push({ section: 'AI Native Org', field: 'layer_focus_text', text: org.layer_focus_text });
    }
    if (Array.isArray(org.signals)) {
      for (let i = 0; i < org.signals.length; i++) {
        const sig = org.signals[i] as Record<string, unknown>;
        if (typeof sig.headline === 'string') entries.push({ section: `AI Native Org[${i}]`, field: 'headline', text: sig.headline });
        if (typeof sig.explanation === 'string') entries.push({ section: `AI Native Org[${i}]`, field: 'explanation', text: sig.explanation });
      }
    }
  }

  return entries;
}
