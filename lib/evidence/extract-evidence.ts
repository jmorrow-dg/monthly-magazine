// ============================================================
// Intelligence Accuracy Engine: Evidence Extraction
// Extracts structured EvidenceItems from raw intelligence data.
// Pure deterministic extraction, no LLM calls.
// ============================================================

import type { IntelligenceSignal, IntelligenceTrend, SignalCluster } from '@/lib/intelligence/types';
import type { EvidenceItem, EvidenceDataPoint } from '@/lib/types/evidence';

// ── Data point extraction regex patterns ───────────────────

const DATA_POINT_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /(\d+(?:\.\d+)?%)/g, label: 'percentage' },
  { pattern: /(\$[\d.]+\s*[BMTbmt](?:illion)?)/gi, label: 'currency' },
  { pattern: /(\b\d+x\b)/g, label: 'multiplier' },
  { pattern: /(\b\d{1,3}(?:,\d{3})+\b)/g, label: 'large_number' },
  { pattern: /(\b\d+(?:\.\d+)?\s*(?:billion|million|trillion))/gi, label: 'amount' },
];

/**
 * Extract quantitative data points from a text string.
 */
export function extractDataPoints(text: string, sourceId: string): EvidenceDataPoint[] {
  if (!text) return [];

  const points: EvidenceDataPoint[] = [];
  const seen = new Set<string>();

  for (const { pattern } of DATA_POINT_PATTERNS) {
    // Reset regex state for each pattern
    const regex = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const value = match[1] || match[0];
      if (seen.has(value)) continue;
      seen.add(value);

      // Extract surrounding context (up to 60 chars around the match)
      const start = Math.max(0, match.index - 30);
      const end = Math.min(text.length, match.index + match[0].length + 30);
      const context = text.slice(start, end).trim();

      points.push({ value, context, source_id: sourceId });
    }
  }

  return points;
}

// ── Signal evidence extraction ─────────────────────────────

export function extractEvidenceFromSignals(signals: IntelligenceSignal[]): EvidenceItem[] {
  return signals.map((signal, index) => {
    // Combine key text fields into evidence_text
    const textParts = [
      signal.what_happened,
      signal.summary,
      signal.why_it_matters,
    ].filter(Boolean);
    const evidenceText = textParts.join(' ');

    // Extract data points from summary and practical_implication
    const dataPointSources = [signal.summary, signal.practical_implication].filter(Boolean).join(' ');
    const dataPoints = extractDataPoints(dataPointSources, signal.id);

    return {
      id: `ev_signal_${signal.id}_${index}`,
      source_type: 'signal' as const,
      source_id: signal.id,
      source_url: signal.source_url,
      title: signal.title,
      evidence_text: evidenceText,
      data_points: dataPoints,
      company: signal.company || null,
      category: signal.category,
      tags: signal.tags || [],
      composite_score: signal.composite_score ?? 0,
      signal_date: signal.signal_date || null,
    };
  });
}

// ── Trend evidence extraction ──────────────────────────────

export function extractEvidenceFromTrends(trends: IntelligenceTrend[]): EvidenceItem[] {
  return trends.map((trend, index) => {
    const textParts = [
      trend.description,
      trend.strategic_summary,
    ].filter(Boolean);
    const evidenceText = textParts.join(' ');

    const dataPointSources = [
      trend.description,
      trend.implication_for_operators,
    ].filter(Boolean).join(' ');
    const dataPoints = extractDataPoints(dataPointSources, trend.id);

    return {
      id: `ev_trend_${trend.id}_${index}`,
      source_type: 'trend' as const,
      source_id: trend.id,
      source_url: null,
      title: trend.title,
      evidence_text: evidenceText,
      data_points: dataPoints,
      company: null,
      category: trend.signal_type_scope?.[0] || 'AI Strategy',
      tags: [
        ...(trend.region_scope || []),
        ...(trend.sector_scope || []),
      ],
      composite_score: trend.confidence_score ?? 0,
      signal_date: trend.month_year || null,
    };
  });
}

// ── Cluster evidence extraction ────────────────────────────

export function extractEvidenceFromClusters(clusters: SignalCluster[]): EvidenceItem[] {
  return clusters
    .filter((cluster) => cluster.narrative_summary)
    .map((cluster, index) => {
      const evidenceText = cluster.narrative_summary || '';
      const dataPoints = extractDataPoints(evidenceText, cluster.id);

      return {
        id: `ev_cluster_${cluster.id}_${index}`,
        source_type: 'cluster' as const,
        source_id: cluster.id,
        source_url: null,
        title: cluster.title,
        evidence_text: evidenceText,
        data_points: dataPoints,
        company: null,
        category: cluster.cluster_type || 'general',
        tags: [],
        composite_score: cluster.avg_composite_score ?? 0,
        signal_date: cluster.month_year || null,
      };
    });
}

// ── Combined extraction ────────────────────────────────────

/**
 * Extract all evidence items from signals, trends, and clusters.
 * Returns a flat array sorted by composite_score descending.
 */
export function extractAllEvidence(
  signals: IntelligenceSignal[],
  trends: IntelligenceTrend[],
  clusters: SignalCluster[],
): EvidenceItem[] {
  const signalEvidence = extractEvidenceFromSignals(signals);
  const trendEvidence = extractEvidenceFromTrends(trends);
  const clusterEvidence = extractEvidenceFromClusters(clusters);

  const all = [...signalEvidence, ...trendEvidence, ...clusterEvidence];

  // Sort by composite_score descending for consistent ordering
  all.sort((a, b) => b.composite_score - a.composite_score);

  return all;
}
