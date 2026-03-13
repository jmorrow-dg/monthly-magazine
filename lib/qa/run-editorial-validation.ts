// ============================================================
// QA: Editorial Rule Validation (max 10 points)
// Enforces dash rules, AU English, word counts, title lengths.
// ============================================================

import type { QACheckInput, EditorialFlag, QACheckResult, ExtractedSection } from '../types/qa';
import { AU_SPELLING_MAP, OVERAGE_THRESHOLDS } from './constants';
import { CONTENT_LIMITS, INLINE_LIMITS } from '../constants/content-limits';
import { extractIssueSections } from './extract-issue-sections';

const EM_DASH = /\u2014/g;
const EN_DASH = /\u2013/g;
const SPACED_HYPHEN = / - /g;

export function runEditorialValidation(input: QACheckInput): QACheckResult {
  const flags: EditorialFlag[] = [];
  const sections = extractIssueSections(input);

  // ── Dash detection ────────────────────────────────────────
  for (const section of sections) {
    const emDashes = section.raw_text.match(EM_DASH)?.length || 0;
    const enDashes = section.raw_text.match(EN_DASH)?.length || 0;
    const spacedHyphens = section.raw_text.match(SPACED_HYPHEN)?.length || 0;
    const total = emDashes + enDashes + spacedHyphens;

    if (total > 0) {
      flags.push({
        section: section.section_label,
        rule: 'no_dashes',
        message: `Found ${total} dash${total > 1 ? 'es' : ''} (em dash, en dash, or spaced hyphen).`,
        severity: 'error',
      });
    }
  }

  // ── Australian English spelling ───────────────────────────
  for (const section of sections) {
    if (section.metadata.is_derivative) continue; // check derivatives separately

    const words = section.raw_text.toLowerCase().split(/\b/);
    const usSpellings = new Set<string>();
    for (const word of words) {
      if (AU_SPELLING_MAP[word] && AU_SPELLING_MAP[word] !== word) {
        usSpellings.add(word);
      }
    }

    if (usSpellings.size > 0) {
      const corrections = Array.from(usSpellings)
        .slice(0, 5)
        .map(w => `"${w}" -> "${AU_SPELLING_MAP[w]}"`)
        .join('; ');

      flags.push({
        section: section.section_label,
        rule: 'australian_english',
        message: `Found ${usSpellings.size} US English spelling${usSpellings.size > 1 ? 's' : ''}: ${corrections}${usSpellings.size > 5 ? '...' : ''}.`,
        severity: 'warning',
      });
    }
  }

  // ── Word count validation ─────────────────────────────────
  validateWordCounts(input, flags);

  // ── Title length validation ───────────────────────────────
  if (input.cover_story) {
    const cs = input.cover_story as Record<string, unknown>;
    if (typeof cs.headline === 'string' && cs.headline.length > 80) {
      flags.push({
        section: 'Cover Story',
        rule: 'title_length',
        message: `Cover story headline is ${cs.headline.length} characters (max 80).`,
        severity: 'warning',
      });
    }
  }

  // Score calculation
  const errorCount = flags.filter(f => f.severity === 'error').length;
  const warningCount = flags.filter(f => f.severity === 'warning').length;

  let score = 10;
  score -= Math.min(errorCount * 1, 5);
  score -= Math.min(warningCount * 0.25, 3);

  return {
    category: 'editorial_compliance',
    score: Math.max(0, Math.round(score * 100) / 100),
    max_score: 10,
    editorial_flags: flags,
  };
}

function validateWordCounts(input: QACheckInput, flags: EditorialFlag[]) {
  // Cover story fields
  if (input.cover_story && CONTENT_LIMITS.cover_story) {
    const cs = input.cover_story as Record<string, unknown>;
    for (const [field, limit] of Object.entries(CONTENT_LIMITS.cover_story)) {
      if (typeof cs[field] === 'string') {
        checkWordCount(cs[field] as string, limit.maxWords, `Cover Story`, field, flags);
      }
    }
  }

  // Array sections
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
        if (typeof items[i][field] === 'string') {
          checkWordCount(items[i][field] as string, limit.maxWords, `${label}[${i}]`, field, flags);
        }
      }
    }
  }

  // Inline limits
  if (input.editorial_note && INLINE_LIMITS.editorial_note) {
    checkWordCount(input.editorial_note, INLINE_LIMITS.editorial_note.maxWords, 'Editorial', 'editorial_note', flags);
  }
  if (input.why_this_matters && INLINE_LIMITS.why_this_matters) {
    checkWordCount(input.why_this_matters, INLINE_LIMITS.why_this_matters.maxWords, 'Why This Matters', 'why_this_matters', flags);
  }
}

function checkWordCount(text: string, maxWords: number, section: string, field: string, flags: EditorialFlag[]) {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const ratio = wordCount / maxWords;

  if (ratio >= OVERAGE_THRESHOLDS.ERROR_PCT) {
    flags.push({
      section: `${section}/${field}`,
      rule: 'word_count',
      message: `Word count ${wordCount} exceeds limit by ${Math.round((ratio - 1) * 100)}% (max: ${maxWords}).`,
      severity: 'error',
    });
  } else if (ratio >= OVERAGE_THRESHOLDS.WARNING_PCT) {
    flags.push({
      section: `${section}/${field}`,
      rule: 'word_count',
      message: `Word count ${wordCount} is at/near the ${maxWords} word limit.`,
      severity: 'info',
    });
  }
}
