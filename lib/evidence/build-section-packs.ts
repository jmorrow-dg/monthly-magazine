// ============================================================
// Intelligence Accuracy Engine: Section Pack Builder
// Assembles curated SectionEvidencePacks for all 14 sections.
// ============================================================

import type {
  EvidenceItem,
  MagazineSectionName,
  SectionEvidencePack,
} from '@/lib/types/evidence';
import { ALL_SECTION_NAMES } from '@/lib/types/evidence';
import type { SignalCluster, IntelligenceTrend } from '@/lib/intelligence/types';
import type { EvidenceConfig } from './config';
import { CLUSTER_TYPE_TO_SECTION } from './config';
import { rankEvidenceForSection } from './rank-evidence';

/**
 * Build evidence packs for all 14 magazine sections.
 * Each section gets a curated subset of evidence ranked by relevance.
 */
export function buildSectionPacks(
  allEvidence: EvidenceItem[],
  clusters: SignalCluster[],
  trends: IntelligenceTrend[],
  config: EvidenceConfig,
): Record<MagazineSectionName, SectionEvidencePack> {
  const result = {} as Record<MagazineSectionName, SectionEvidencePack>;
  const now = new Date().toISOString();

  // Build packs for primary sections first (others may reuse their evidence)
  const primaryPacks = new Map<MagazineSectionName, EvidenceItem[]>();

  for (const section of ALL_SECTION_NAMES) {
    const maxItems = config.max_items_per_section[section] || 6;
    const ranked = rankEvidenceForSection(allEvidence, section, clusters, config.ranking);

    // Filter by minimum relevance threshold
    const filtered = ranked.filter(
      (r) => r.relevance_score >= config.ranking.min_relevance_threshold,
    );

    // Apply section-specific selection rules
    let selected = applySectionRules(section, filtered.map((r) => r.item), maxItems, primaryPacks);

    // Cap at max items
    selected = selected.slice(0, maxItems);

    // Store for reuse by dependent sections
    primaryPacks.set(section, selected);

    // Find primary narrative from matching cluster or top trend
    const narrative = findPrimaryNarrative(section, clusters, trends);

    // Calculate average relevance score
    const relevantRanked = filtered.filter((r) =>
      selected.some((s) => s.id === r.item.id),
    );
    const avgRelevance =
      relevantRanked.length > 0
        ? relevantRanked.reduce((sum, r) => sum + r.relevance_score, 0) / relevantRanked.length
        : 0;

    result[section] = {
      section_name: section,
      evidence_items: selected,
      primary_narrative: narrative,
      section_relevance_score: Math.round(avgRelevance * 1000) / 1000,
      metadata: {
        total_candidates: allEvidence.length,
        selected_count: selected.length,
        min_relevance_threshold: config.ranking.min_relevance_threshold,
        built_at: now,
      },
    };
  }

  return result;
}

// ── Section-specific selection rules ───────────────────────

function applySectionRules(
  section: MagazineSectionName,
  items: EvidenceItem[],
  maxItems: number,
  primaryPacks: Map<MagazineSectionName, EvidenceItem[]>,
): EvidenceItem[] {
  switch (section) {
    case 'industry_watch':
      return diversifyByCompany(items, maxItems, 2);

    case 'tools':
      return prioritiseByKeywords(items, maxItems, [
        'launch', 'release', 'tool', 'platform', 'product', 'app', 'service',
      ]);

    case 'playbooks':
      return prioritiseByField(items, maxItems, 'evidence_text', [
        'practical', 'implement', 'deploy', 'adopt', 'strategy', 'framework',
      ]);

    case 'briefing_prompts':
    case 'executive_briefing':
    case 'ai_native_org':
      return reuseFromPrimarySections(items, maxItems, primaryPacks, ['cover_story', 'implications']);

    case 'editorial':
      return reuseFromPrimarySections(items, maxItems, primaryPacks, ['cover_story']);

    case 'why_this_matters':
      return reuseFromPrimarySections(items, maxItems, primaryPacks, ['implications']);

    case 'global_landscape':
      return diversifyByTags(items, maxItems);

    default:
      return items.slice(0, maxItems);
  }
}

/**
 * Ensure no more than `maxPerCompany` items from the same company.
 */
function diversifyByCompany(
  items: EvidenceItem[],
  maxItems: number,
  maxPerCompany: number,
): EvidenceItem[] {
  const result: EvidenceItem[] = [];
  const companyCounts = new Map<string, number>();

  for (const item of items) {
    if (result.length >= maxItems) break;

    const company = item.company?.toLowerCase() || '__no_company__';
    const count = companyCounts.get(company) || 0;

    if (count < maxPerCompany) {
      result.push(item);
      companyCounts.set(company, count + 1);
    }
  }

  return result;
}

/**
 * Prioritise items whose evidence_text contains any of the given keywords.
 */
function prioritiseByKeywords(
  items: EvidenceItem[],
  maxItems: number,
  keywords: string[],
): EvidenceItem[] {
  const lowerKeywords = keywords.map((k) => k.toLowerCase());
  const withKeyword: EvidenceItem[] = [];
  const without: EvidenceItem[] = [];

  for (const item of items) {
    const text = item.evidence_text.toLowerCase();
    if (lowerKeywords.some((kw) => text.includes(kw))) {
      withKeyword.push(item);
    } else {
      without.push(item);
    }
  }

  return [...withKeyword, ...without].slice(0, maxItems);
}

/**
 * Prioritise items where a specific field contains given keywords.
 */
function prioritiseByField(
  items: EvidenceItem[],
  maxItems: number,
  field: keyof EvidenceItem,
  keywords: string[],
): EvidenceItem[] {
  const lowerKeywords = keywords.map((k) => k.toLowerCase());
  const withKeyword: EvidenceItem[] = [];
  const without: EvidenceItem[] = [];

  for (const item of items) {
    const value = item[field];
    const text = typeof value === 'string' ? value.toLowerCase() : '';
    if (lowerKeywords.some((kw) => text.includes(kw))) {
      withKeyword.push(item);
    } else {
      without.push(item);
    }
  }

  return [...withKeyword, ...without].slice(0, maxItems);
}

/**
 * Reuse evidence from already-built primary sections when available.
 */
function reuseFromPrimarySections(
  items: EvidenceItem[],
  maxItems: number,
  primaryPacks: Map<MagazineSectionName, EvidenceItem[]>,
  sourceSections: MagazineSectionName[],
): EvidenceItem[] {
  const primaryItems: EvidenceItem[] = [];
  const seen = new Set<string>();

  for (const sourceSection of sourceSections) {
    const sourceItems = primaryPacks.get(sourceSection) || [];
    for (const item of sourceItems) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        primaryItems.push(item);
      }
    }
  }

  // Fill remaining slots from the ranked items
  const remaining = items.filter((i) => !seen.has(i.id));

  return [...primaryItems, ...remaining].slice(0, maxItems);
}

/**
 * Diversify items by their tags (region/sector scope) for global sections.
 */
function diversifyByTags(
  items: EvidenceItem[],
  maxItems: number,
): EvidenceItem[] {
  const result: EvidenceItem[] = [];
  const tagCounts = new Map<string, number>();
  const maxPerTag = 3;

  for (const item of items) {
    if (result.length >= maxItems) break;

    // Check if any tag is over-represented
    const primaryTag = item.tags[0]?.toLowerCase() || '__no_tag__';
    const count = tagCounts.get(primaryTag) || 0;

    if (count < maxPerTag) {
      result.push(item);
      tagCounts.set(primaryTag, count + 1);
    }
  }

  // Backfill if we didn't reach maxItems
  if (result.length < maxItems) {
    const resultIds = new Set(result.map((r) => r.id));
    for (const item of items) {
      if (result.length >= maxItems) break;
      if (!resultIds.has(item.id)) {
        result.push(item);
      }
    }
  }

  return result;
}

// ── Narrative selection ────────────────────────────────────

function findPrimaryNarrative(
  section: MagazineSectionName,
  clusters: SignalCluster[],
  trends: IntelligenceTrend[],
): string | null {
  // Check for a cluster whose type matches this section
  for (const cluster of clusters) {
    if (CLUSTER_TYPE_TO_SECTION[cluster.cluster_type] === section && cluster.narrative_summary) {
      return cluster.narrative_summary;
    }
  }

  // Fallback: use the top trend's strategic_summary
  if (trends.length > 0) {
    const topTrend = trends.reduce((best, t) =>
      (t.confidence_score ?? 0) > (best.confidence_score ?? 0) ? t : best,
    );
    if (topTrend.strategic_summary) {
      return topTrend.strategic_summary;
    }
  }

  return null;
}
