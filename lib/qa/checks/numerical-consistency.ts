// ============================================================
// QA Check: Numerical Consistency (max 15 points)
// Validates numbers, percentages, and statistics in content
// against source signals for accuracy.
// ============================================================

import type { QACheckInput, QACheckResult, QAViolation } from '../../types/qa';

/** Regex to match numbers, percentages, and monetary values */
const NUMBER_PATTERNS = [
  /\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\s*%/g,        // percentages: 42%, 3.5%
  /\$\d{1,3}(?:,\d{3})*(?:\.\d+)?\s*(?:billion|million|trillion|B|M|T|bn|mn)?/gi, // money
  /\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\s*(?:billion|million|trillion|B|M|T|bn|mn)/gi,  // quantities
  /\b\d+x\b/gi,                                    // multipliers: 10x, 100x
  /\b\d{4}\b/g,                                    // years: 2024, 2025
];

interface NumberOccurrence {
  value: string;
  section: string;
  field: string;
  context: string;
}

export function checkNumericalConsistency(input: QACheckInput): QACheckResult {
  const violations: QAViolation[] = [];

  // Extract all numbers from content
  const contentNumbers = extractNumbers(input);

  // Extract all numbers from source signals
  const signalNumbers = extractSignalNumbers(input);

  // Build a lookup of signal number values for cross-referencing
  const signalNumberValues = new Set(signalNumbers.map(n => normaliseNumber(n.value)));

  let totalNumericalClaims = 0;
  let verifiedClaims = 0;
  let yearOnlyClaims = 0;

  for (const num of contentNumbers) {
    const normalised = normaliseNumber(num.value);

    // Skip plain years (2024, 2025, 2026) as these are not data claims
    if (/^\d{4}$/.test(num.value.trim()) && parseInt(num.value.trim()) >= 2020 && parseInt(num.value.trim()) <= 2030) {
      yearOnlyClaims++;
      continue;
    }

    totalNumericalClaims++;

    if (signalNumberValues.has(normalised)) {
      verifiedClaims++;
    }
  }

  // Check for internal consistency (same number used differently)
  const numberUsages = new Map<string, NumberOccurrence[]>();
  for (const num of contentNumbers) {
    const normalised = normaliseNumber(num.value);
    if (!numberUsages.has(normalised)) {
      numberUsages.set(normalised, []);
    }
    numberUsages.get(normalised)!.push(num);
  }

  // Flag numbers that appear with different contexts (potential inconsistency)
  for (const [value, occurrences] of numberUsages) {
    if (occurrences.length > 1) {
      const sections = new Set(occurrences.map(o => o.section));
      if (sections.size > 1) {
        // Same number in different sections, just informational
        // Only flag if it looks like the same stat is being quoted differently
      }
    }
  }

  // Flag unverified numerical claims
  if (totalNumericalClaims > 0) {
    const unverified = totalNumericalClaims - verifiedClaims;
    if (unverified > 0) {
      // Group by section for cleaner violation reporting
      const unverifiedBySection = new Map<string, string[]>();
      for (const num of contentNumbers) {
        const normalised = normaliseNumber(num.value);
        if (/^\d{4}$/.test(num.value.trim())) continue;
        if (!signalNumberValues.has(normalised)) {
          const key = num.section;
          if (!unverifiedBySection.has(key)) {
            unverifiedBySection.set(key, []);
          }
          unverifiedBySection.get(key)!.push(num.value);
        }
      }

      for (const [section, values] of unverifiedBySection) {
        violations.push({
          check: 'numerical_accuracy',
          severity: values.length > 2 ? 'error' : 'warning',
          section,
          field: 'numbers',
          message: `${values.length} numerical value${values.length > 1 ? 's' : ''} not found in source signals: ${values.slice(0, 5).join(', ')}${values.length > 5 ? '...' : ''}.`,
          suggestion: 'Verify these numbers against original source material.',
        });
      }
    }
  }

  // Score calculation
  let score: number;
  if (totalNumericalClaims === 0) {
    // No numerical claims to verify, full points
    score = 15;
  } else {
    const verificationRatio = verifiedClaims / totalNumericalClaims;
    score = Math.round(15 * verificationRatio * 100) / 100;
  }

  return {
    category: 'numerical_accuracy',
    score: Math.max(0, Math.min(15, score)),
    max_score: 15,
    violations,
  };
}

function extractNumbers(input: QACheckInput): NumberOccurrence[] {
  const occurrences: NumberOccurrence[] = [];

  const extractFromText = (text: string, section: string, field: string) => {
    for (const pattern of NUMBER_PATTERNS) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(text)) !== null) {
        const start = Math.max(0, match.index - 30);
        const end = Math.min(text.length, match.index + match[0].length + 30);
        occurrences.push({
          value: match[0],
          section,
          field,
          context: text.slice(start, end),
        });
      }
    }
  };

  // Cover story
  if (input.cover_story) {
    const cs = input.cover_story as Record<string, unknown>;
    for (const [field, val] of Object.entries(cs)) {
      if (typeof val === 'string') extractFromText(val, 'Cover Story', field);
    }
  }

  // Array sections
  const sections: [string, Record<string, unknown>[]][] = [
    ['Implications', input.implications],
    ['Enterprise', input.enterprise],
    ['Industry Watch', input.industry_watch],
    ['Tools', input.tools],
    ['Strategic Signals', input.strategic_signals],
  ];

  for (const [section, items] of sections) {
    for (let i = 0; i < items.length; i++) {
      for (const [field, val] of Object.entries(items[i])) {
        if (typeof val === 'string') extractFromText(val, `${section}[${i}]`, field);
      }
    }
  }

  if (input.editorial_note) extractFromText(input.editorial_note, 'Editorial', 'editorial_note');
  if (input.why_this_matters) extractFromText(input.why_this_matters, 'Why This Matters', 'why_this_matters');

  return occurrences;
}

function extractSignalNumbers(input: QACheckInput): NumberOccurrence[] {
  const occurrences: NumberOccurrence[] = [];

  for (const signal of input.source_signals) {
    const texts = [signal.title, signal.summary, signal.why_it_matters, signal.practical_implication]
      .filter((t): t is string => !!t);

    for (const text of texts) {
      for (const pattern of NUMBER_PATTERNS) {
        const regex = new RegExp(pattern.source, pattern.flags);
        let match;
        while ((match = regex.exec(text)) !== null) {
          occurrences.push({
            value: match[0],
            section: 'Signal',
            field: signal.id,
            context: text,
          });
        }
      }
    }
  }

  return occurrences;
}

function normaliseNumber(value: string): string {
  return value.trim().toLowerCase().replace(/,/g, '').replace(/\s+/g, '');
}
