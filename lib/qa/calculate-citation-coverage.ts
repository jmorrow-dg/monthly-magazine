// ============================================================
// QA: Citation Coverage Calculator (max 20 points)
// Measures what percentage of factual claims are grounded
// in source signals, with section-level thresholds.
// ============================================================

import type { QACheckResult, ClaimReference, SupportStatus } from '../types/qa';

/**
 * Section-level coverage thresholds.
 * High-value sections require higher coverage.
 */
const SECTION_THRESHOLDS: Record<string, number> = {
  'Cover Story': 0.8,
  'Editorial Note': 0.6,
  'Why This Matters': 0.7,
  'Strategic Implications': 0.75,
  'Enterprise Spotlight': 0.75,
  'Executive Summary': 0.5, // derivative, lower threshold
  'Industry Watch': 0.6,
  'Strategic Signals': 0.7,
  'Tools & Platforms': 0.5,
  'Operator Playbooks': 0.5,
  'Executive Briefing': 0.6,
  'Briefing Prompts': 0.4,
};

const DEFAULT_THRESHOLD = 0.5;

interface SectionCoverage {
  section: string;
  total_claims: number;
  supported: number;
  partially_supported: number;
  unsupported: number;
  unverifiable: number;
  coverage_pct: number;
  threshold: number;
  meets_threshold: boolean;
}

/**
 * Calculate citation coverage from the grounding results.
 * Returns a score (0-20) and detailed section-level breakdown.
 */
export function calculateCitationCoverage(
  citationMap: ClaimReference[],
): QACheckResult & { section_coverage: SectionCoverage[]; overall_coverage_pct: number } {
  if (citationMap.length === 0) {
    return {
      category: 'citation_coverage',
      score: 20,
      max_score: 20,
      citation_map: citationMap,
      section_coverage: [],
      overall_coverage_pct: 100,
    };
  }

  // Group claims by section
  const bySection = new Map<string, ClaimReference[]>();
  for (const claim of citationMap) {
    if (!bySection.has(claim.section)) bySection.set(claim.section, []);
    bySection.get(claim.section)!.push(claim);
  }

  // Calculate per-section coverage
  const sectionCoverages: SectionCoverage[] = [];
  for (const [section, claims] of bySection) {
    const counts = countByStatus(claims);
    const coveragePct = claims.length > 0
      ? (counts.supported + counts.partially_supported * 0.5) / claims.length
      : 1;
    const threshold = SECTION_THRESHOLDS[section] ?? DEFAULT_THRESHOLD;

    sectionCoverages.push({
      section,
      total_claims: claims.length,
      supported: counts.supported,
      partially_supported: counts.partially_supported,
      unsupported: counts.unsupported,
      unverifiable: counts.unverifiable,
      coverage_pct: Math.round(coveragePct * 100),
      threshold: Math.round(threshold * 100),
      meets_threshold: coveragePct >= threshold,
    });
  }

  // Overall coverage
  const totalCounts = countByStatus(citationMap);
  const overallCoverage = citationMap.length > 0
    ? (totalCounts.supported + totalCounts.partially_supported * 0.5) / citationMap.length
    : 1;

  // Score calculation:
  // Base score from overall coverage ratio
  let score = 20 * overallCoverage;

  // Penalty for sections that fall below their threshold
  const failingSections = sectionCoverages.filter(s => !s.meets_threshold);
  for (const failing of failingSections) {
    const deficit = (failing.threshold / 100) - (failing.coverage_pct / 100);
    // High-value sections get a heavier penalty
    const isHighValue = (SECTION_THRESHOLDS[failing.section] ?? 0) >= 0.7;
    score -= deficit * (isHighValue ? 4 : 2);
  }

  return {
    category: 'citation_coverage',
    score: Math.max(0, Math.min(20, Math.round(score * 100) / 100)),
    max_score: 20,
    citation_map: citationMap,
    section_coverage: sectionCoverages,
    overall_coverage_pct: Math.round(overallCoverage * 100),
  };
}

function countByStatus(claims: ClaimReference[]): Record<SupportStatus, number> {
  const counts: Record<SupportStatus, number> = {
    supported: 0,
    partially_supported: 0,
    unsupported: 0,
    unverifiable: 0,
  };
  for (const claim of claims) {
    counts[claim.support_status]++;
  }
  return counts;
}
