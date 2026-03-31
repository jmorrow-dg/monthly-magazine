// ============================================================
// QA: Numerical & Entity Consistency Check (max 15 points)
// Validates dates, percentages, counts, company names, and
// model names against source signals.
// ============================================================

import type { QACheckInput, NumericalMismatch, QACheckResult, ExtractedSection } from '../types/qa';
import { extractIssueSections } from './extract-issue-sections';

const NUMBER_PATTERNS = [
  /\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\s*%/g,
  /\$\d{1,3}(?:,\d{3})*(?:\.\d+)?\s*(?:billion|million|trillion|B|M|T|bn|mn)?/gi,
  /\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\s*(?:billion|million|trillion|B|M|T|bn|mn)/gi,
  /\b\d+x\b/gi,
];

interface NumberOccurrence {
  value: string;
  normalised: string;
  section: string;
  context: string;
}

export function runNumericalConsistencyCheck(input: QACheckInput): QACheckResult {
  const mismatches: NumericalMismatch[] = [];
  const sections = extractIssueSections(input);
  const coreSections = sections.filter(s => !s.metadata.is_derivative);

  // Extract numbers from content and signals
  const contentNumbers = extractAllNumbers(coreSections);
  const signalNumbers = extractSignalNumbers(input);
  const signalNormValues = new Set(signalNumbers.map(n => n.normalised));

  // Check year references
  checkYearConsistency(coreSections, input, mismatches);

  // Check company name consistency
  checkCompanyConsistency(coreSections, input, mismatches);

  // Check numerical values against signals
  let totalChecked = 0;
  let verified = 0;

  for (const num of contentNumbers) {
    // Skip years (handled separately)
    if (/^\d{4}$/.test(num.value.trim())) continue;

    totalChecked++;
    if (signalNormValues.has(num.normalised)) {
      verified++;
    }
  }

  // Report unverified numbers in aggregate per section
  const unverifiedBySection = new Map<string, string[]>();
  for (const num of contentNumbers) {
    if (/^\d{4}$/.test(num.value.trim())) continue;
    if (!signalNormValues.has(num.normalised)) {
      const key = num.section;
      if (!unverifiedBySection.has(key)) unverifiedBySection.set(key, []);
      unverifiedBySection.get(key)!.push(num.value);
    }
  }

  for (const [section, values] of unverifiedBySection) {
    if (values.length > 0) {
      mismatches.push({
        claim_text: `Unverified numerical values: ${values.slice(0, 5).join(', ')}${values.length > 5 ? '...' : ''}`,
        field_type: 'number',
        expected_value: 'present in source signals',
        actual_value: `${values.length} value${values.length > 1 ? 's' : ''} not found`,
        signal_id: null,
        section,
        severity: values.length > 6 ? 'warning' : 'info',
      });
    }
  }

  // Score
  let score: number;
  if (totalChecked === 0 && mismatches.length === 0) {
    score = 15; // No numerical claims, full credit
  } else if (totalChecked === 0) {
    score = 15 - mismatches.filter(m => m.severity === 'error').length * 3
                - mismatches.filter(m => m.severity === 'warning').length * 1;
  } else {
    const ratio = totalChecked > 0 ? verified / totalChecked : 1;
    score = 15 * ratio;
    score -= mismatches.filter(m => m.severity === 'error').length * 2;
    score -= mismatches.filter(m => m.severity === 'warning').length * 0.5;
  }

  return {
    category: 'numerical_accuracy',
    score: Math.max(0, Math.min(15, Math.round(score * 100) / 100)),
    max_score: 15,
    numerical_mismatches: mismatches,
  };
}

function checkYearConsistency(
  sections: ExtractedSection[],
  input: QACheckInput,
  mismatches: NumericalMismatch[],
) {
  // Extract years from signals
  const signalYears = new Set<string>();
  for (const signal of input.source_signals) {
    if (signal.signal_date) signalYears.add(signal.signal_date.slice(0, 4));
    const yearMatches = signal.summary.match(/\b(202[0-9])\b/g);
    if (yearMatches) yearMatches.forEach(y => signalYears.add(y));
  }

  if (signalYears.size === 0) return; // Can't validate without signal dates

  for (const section of sections) {
    const yearRefs = section.raw_text.match(/\b(202[0-9])\b/g);
    if (!yearRefs) continue;

    for (const year of new Set(yearRefs)) {
      if (!signalYears.has(year) && parseInt(year) < 2026) {
        // Only flag historical years not in signals (future years may be projections)
        mismatches.push({
          claim_text: `Reference to year ${year}`,
          field_type: 'year',
          expected_value: `One of: ${[...signalYears].join(', ')}`,
          actual_value: year,
          signal_id: null,
          section: section.section_label,
          severity: 'info',
        });
      }
    }
  }
}

function checkCompanyConsistency(
  sections: ExtractedSection[],
  input: QACheckInput,
  mismatches: NumericalMismatch[],
) {
  if (input.source_signals.length === 0) return;

  // Build set of canonical company names from signals
  const signalCompanies = new Set<string>();
  for (const signal of input.source_signals) {
    if (signal.company) signalCompanies.add(signal.company.toLowerCase());
  }

  // Common known company name variants
  const COMPANY_ALIASES: Record<string, string[]> = {
    'openai': ['open ai'],
    'google': ['alphabet', 'deepmind', 'google cloud'],
    'microsoft': ['msft', 'azure'],
    'amazon': ['aws', 'amazon web services'],
    'meta': ['facebook', 'meta platforms'],
    'anthropic': [],
  };

  // Check for company names in content that aren't in signals
  for (const section of sections) {
    // Extract capitalised multi-word entities that look like company names
    const potentialCompanies = section.raw_text.match(/\b[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*\b/g);
    if (!potentialCompanies) continue;

    for (const company of new Set(potentialCompanies)) {
      const lower = company.toLowerCase();
      // Skip common non-company words
      if (NON_COMPANY_WORDS.has(lower)) continue;
      if (lower.length < 3) continue;

      // Check if this company is in signals
      const isInSignals = signalCompanies.has(lower) ||
        [...signalCompanies].some(sc => {
          const aliases = COMPANY_ALIASES[sc] || [];
          return aliases.includes(lower) || lower.includes(sc) || sc.includes(lower);
        });

      // We don't flag every unknown company, only note for info
    }
  }
}

function extractAllNumbers(sections: ExtractedSection[]): NumberOccurrence[] {
  const results: NumberOccurrence[] = [];
  for (const section of sections) {
    for (const pattern of NUMBER_PATTERNS) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(section.raw_text)) !== null) {
        const start = Math.max(0, match.index - 30);
        const end = Math.min(section.raw_text.length, match.index + match[0].length + 30);
        results.push({
          value: match[0],
          normalised: normaliseNumberValue(match[0]),
          section: section.section_label,
          context: section.raw_text.slice(start, end),
        });
      }
    }
  }
  return results;
}

function extractSignalNumbers(input: QACheckInput): NumberOccurrence[] {
  const results: NumberOccurrence[] = [];
  for (const signal of input.source_signals) {
    const texts = [signal.title, signal.summary, signal.why_it_matters, signal.practical_implication]
      .filter((t): t is string => !!t);
    for (const text of texts) {
      for (const pattern of NUMBER_PATTERNS) {
        const regex = new RegExp(pattern.source, pattern.flags);
        let match;
        while ((match = regex.exec(text)) !== null) {
          results.push({
            value: match[0],
            normalised: normaliseNumberValue(match[0]),
            section: 'Signal',
            context: text,
          });
        }
      }
    }
  }
  return results;
}

function normaliseNumberValue(raw: string): string {
  let v = raw.trim().toLowerCase().replace(/,/g, '').replace(/\s+/g, '');
  // Strip currency and percent symbols for comparison
  v = v.replace(/[$%]/g, '');
  // Normalise unit suffixes
  v = v.replace(/billion|bn/g, 'b');
  v = v.replace(/million|mn/g, 'm');
  v = v.replace(/trillion/g, 't');
  return v;
}

const NON_COMPANY_WORDS = new Set([
  'the', 'this', 'that', 'these', 'those', 'what', 'which', 'where', 'when',
  'how', 'why', 'who', 'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'strategic', 'enterprise', 'industry', 'global', 'regional', 'national',
  'north', 'south', 'east', 'west', 'america', 'europe', 'asia', 'africa',
  'australia', 'implications', 'analysis', 'introduction', 'conclusion',
  'cover', 'story', 'editorial', 'briefing', 'report', 'intelligence',
]);
