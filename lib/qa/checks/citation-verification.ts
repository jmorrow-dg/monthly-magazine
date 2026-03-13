// ============================================================
// QA Check: Citation Coverage (max 20 points)
// Verifies that content sections reference source signals adequately.
// Uses extracted claims to calculate coverage percentage.
// ============================================================

import type { QACheckInput, QACheckResult, QAViolation, ExtractedClaim } from '../../types/qa';

/**
 * Checks citation coverage: what percentage of content sections
 * have at least one claim grounded in a source signal.
 * Also checks for source_signal references in section items.
 */
export function checkCitationCoverage(
  input: QACheckInput,
  claims: ExtractedClaim[],
): QACheckResult {
  const violations: QAViolation[] = [];

  // If no source signals, full credit (sources mode)
  if (!input.source_signals || input.source_signals.length === 0) {
    return {
      category: 'citation_coverage',
      score: 20,
      max_score: 20,
      violations: [],
    };
  }

  // Track which sections have grounded claims
  const sectionsCovered = new Set<string>();
  const sectionsTotal = new Set<string>();

  // Define expected sections
  const expectedSections = [
    'Cover Story',
    'Implications',
    'Enterprise',
    'Industry Watch',
    'Strategic Signals',
  ];

  for (const section of expectedSections) {
    sectionsTotal.add(section);
  }

  // Check which sections have grounded claims
  for (const claim of claims) {
    if (claim.grounded) {
      // Normalise section name (remove array indices)
      const normalisedSection = claim.section.replace(/\[\d+\]/, '').trim();
      sectionsCovered.add(normalisedSection);
    }
  }

  // Check for source_signal fields in array items
  const sectionItems: Record<string, Record<string, unknown>[]> = {
    'Implications': input.implications,
    'Enterprise': input.enterprise,
    'Industry Watch': input.industry_watch,
    'Strategic Signals': input.strategic_signals,
  };

  let itemsWithSourceRef = 0;
  let totalItems = 0;

  for (const [section, items] of Object.entries(sectionItems)) {
    for (const item of items) {
      totalItems++;
      if (item.source_signal && typeof item.source_signal === 'string' && item.source_signal.trim()) {
        itemsWithSourceRef++;
      }
    }
  }

  // Calculate coverage percentage
  const sectionCoveragePct = sectionsTotal.size > 0
    ? Math.round((sectionsCovered.size / sectionsTotal.size) * 100)
    : 100;

  const itemCoveragePct = totalItems > 0
    ? Math.round((itemsWithSourceRef / totalItems) * 100)
    : 100;

  // Blended coverage: 60% section coverage, 40% item-level source refs
  const blendedCoverage = Math.round(sectionCoveragePct * 0.6 + itemCoveragePct * 0.4);

  // Report uncovered sections
  for (const section of expectedSections) {
    if (!sectionsCovered.has(section)) {
      violations.push({
        check: 'citation_coverage',
        severity: section === 'Cover Story' ? 'error' : 'warning',
        section,
        field: 'coverage',
        message: `${section} section has no claims grounded in source signals.`,
        suggestion: `Ensure ${section} content references source material.`,
      });
    }
  }

  // Report low item-level coverage
  if (totalItems > 0 && itemCoveragePct < 50) {
    violations.push({
      check: 'citation_coverage',
      severity: 'warning',
      section: 'All Sections',
      field: 'source_signal',
      message: `Only ${itemCoveragePct}% of section items have source_signal references.`,
      suggestion: 'Add source_signal references to more section items for traceability.',
    });
  }

  // Score: 20 points * (blended coverage / 100)
  const score = Math.round(20 * (blendedCoverage / 100) * 100) / 100;

  return {
    category: 'citation_coverage',
    score: Math.min(20, score),
    max_score: 20,
    violations,
  };
}
