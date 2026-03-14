// ============================================================
// Intelligence Accuracy Engine: Pipeline Orchestrator
// Orchestrates evidence extraction, ranking, and pack assembly.
// ============================================================

import type { IntelligenceSignal, IntelligenceTrend, SignalCluster } from '@/lib/intelligence/types';
import type { EvidencePackBundle } from '@/lib/types/evidence';
import { extractAllEvidence } from './extract-evidence';
import { buildSectionPacks } from './build-section-packs';
import { DEFAULT_EVIDENCE_CONFIG } from './config';

/**
 * Build an EvidencePackBundle from raw intelligence data.
 *
 * Pipeline:
 * 1. Extract structured evidence from signals, trends, clusters
 * 2. Rank and select evidence per section
 * 3. Assemble bundle with timing metadata
 *
 * Performance target: <3 seconds for 40 signals + 5 trends + 6 clusters.
 * All operations are synchronous CPU work (no LLM, no network calls).
 */
export async function buildEvidencePipeline(
  signals: IntelligenceSignal[],
  clusters: SignalCluster[],
  trends: IntelligenceTrend[],
  issueId: string,
  monthYear: string,
): Promise<EvidencePackBundle> {
  const startTime = Date.now();

  // Phase 1: Extract evidence items from all sources
  const allEvidence = extractAllEvidence(signals, trends, clusters);

  // Phase 2: Build section packs (ranking + selection)
  const sectionPacks = buildSectionPacks(allEvidence, clusters, trends, DEFAULT_EVIDENCE_CONFIG);

  const pipelineDuration = Date.now() - startTime;

  // Phase 3: Assemble bundle
  const bundle: EvidencePackBundle = {
    issue_id: issueId,
    month_year: monthYear,
    created_at: new Date().toISOString(),
    section_packs: sectionPacks,
    source_signal_ids: signals.map((s) => s.id),
    source_cluster_ids: clusters.map((c) => c.id),
    source_trend_ids: trends.map((t) => t.id),
    pipeline_duration_ms: pipelineDuration,
  };

  return bundle;
}
