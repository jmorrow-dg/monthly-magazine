// ============================================================
// Intelligence Accuracy Engine: Evidence Ranking
// Scores evidence items for relevance to each magazine section.
// ============================================================

import type { EvidenceItem, MagazineSectionName } from '@/lib/types/evidence';
import type { SignalCluster } from '@/lib/intelligence/types';
import type { EvidenceRankingConfig } from './config';
import { SECTION_CATEGORY_MAP, CLUSTER_TYPE_TO_SECTION } from './config';

export interface RankedEvidence {
  item: EvidenceItem;
  relevance_score: number;
  ranking_factors: {
    category_alignment: number;
    composite_score_weight: number;
    cluster_membership: number;
    trend_alignment: number;
    recency_bias: number;
  };
}

/**
 * Rank all evidence items for a specific section.
 * Returns items sorted by relevance_score descending.
 */
export function rankEvidenceForSection(
  items: EvidenceItem[],
  section: MagazineSectionName,
  clusters: SignalCluster[],
  config: EvidenceRankingConfig,
): RankedEvidence[] {
  if (items.length === 0) return [];

  const { weights } = config;
  const sectionCategories = SECTION_CATEGORY_MAP[section] || [];

  // Build a set of signal IDs that belong to clusters matching this section
  const clusterSignalIds = new Set<string>();
  for (const cluster of clusters) {
    const clusterSection = CLUSTER_TYPE_TO_SECTION[cluster.cluster_type];
    if (clusterSection === section) {
      for (const signalId of cluster.signal_ids || []) {
        clusterSignalIds.add(signalId);
      }
    }
  }

  // Find max composite score for normalisation
  const maxScore = Math.max(...items.map((i) => i.composite_score), 1);

  // Get current month for recency calculation
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const ranked = items.map((item) => {
    // 1. Category alignment (0 or 0.5 or 1.0)
    let categoryAlignment = 0;
    if (sectionCategories.length > 0) {
      const itemCategory = item.category.toLowerCase();
      const primaryMatch = sectionCategories[0]?.toLowerCase();
      if (primaryMatch && itemCategory.includes(primaryMatch)) {
        categoryAlignment = 1.0;
      } else if (sectionCategories.some((c) => itemCategory.includes(c.toLowerCase()))) {
        categoryAlignment = 0.7;
      } else {
        // Check if any of the item's tags match section categories
        const hasTagMatch = item.tags.some((tag) =>
          sectionCategories.some((c) => tag.toLowerCase().includes(c.toLowerCase())),
        );
        categoryAlignment = hasTagMatch ? 0.3 : 0;
      }
    }

    // 2. Composite score normalised to 0-1
    const compositeScoreWeight = maxScore > 0 ? item.composite_score / maxScore : 0;

    // 3. Cluster membership
    let clusterMembership = 0;
    if (item.source_type === 'signal' && clusterSignalIds.has(item.source_id)) {
      clusterMembership = 1.0;
    } else if (item.source_type === 'cluster') {
      // Cluster evidence items: check if the cluster_type matches this section
      const matchingCluster = clusters.find((c) => c.id === item.source_id);
      if (matchingCluster && CLUSTER_TYPE_TO_SECTION[matchingCluster.cluster_type] === section) {
        clusterMembership = 1.0;
      }
    }

    // 4. Trend alignment: trend items with relevant scope get boost
    let trendAlignment = 0;
    if (item.source_type === 'trend') {
      // Trends generally apply broadly; give a base alignment
      trendAlignment = 0.5;
      // Boost if tags (which contain region/sector scope) match section focus
      if (item.tags.length > 0) {
        trendAlignment = 0.8;
      }
    }

    // 5. Recency bias: items from current month get 1.0
    let recencyBias = 0.5; // default for undated items
    if (item.signal_date) {
      const itemMonth = item.signal_date.slice(0, 7); // YYYY-MM
      if (itemMonth === currentMonthStr) {
        recencyBias = 1.0;
      } else {
        // Decay for older months
        const monthsDiff = monthDifference(itemMonth, currentMonthStr);
        recencyBias = Math.max(0, 1 - monthsDiff * 0.2);
      }
    }

    // Calculate weighted relevance score
    const relevance_score =
      weights.category_alignment * categoryAlignment +
      weights.composite_score * compositeScoreWeight +
      weights.cluster_membership * clusterMembership +
      weights.trend_alignment * trendAlignment +
      weights.recency_bias * recencyBias;

    return {
      item,
      relevance_score,
      ranking_factors: {
        category_alignment: categoryAlignment,
        composite_score_weight: compositeScoreWeight,
        cluster_membership: clusterMembership,
        trend_alignment: trendAlignment,
        recency_bias: recencyBias,
      },
    };
  });

  // Sort by relevance descending
  ranked.sort((a, b) => b.relevance_score - a.relevance_score);

  return ranked;
}

/**
 * Calculate approximate month difference between two YYYY-MM strings.
 */
function monthDifference(a: string, b: string): number {
  const [aYear, aMonth] = a.split('-').map(Number);
  const [bYear, bMonth] = b.split('-').map(Number);
  return Math.abs((bYear - aYear) * 12 + (bMonth - aMonth));
}
