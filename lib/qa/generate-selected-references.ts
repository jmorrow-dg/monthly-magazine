// ============================================================
// QA: Selected References Generator
// Builds a curated list of references from grounded claims
// for display in the QA report.
// ============================================================

import type { ClaimReference, SelectedReference, SourceSignalSummary } from '../types/qa';

/**
 * Generate a list of selected references from the citation map.
 * Groups by source URL and enriches with signal metadata.
 */
export function generateSelectedReferences(
  citationMap: ClaimReference[],
  signals: SourceSignalSummary[],
): SelectedReference[] {
  // Build signal lookup
  const signalById = new Map<string, SourceSignalSummary>();
  for (const signal of signals) {
    signalById.set(signal.id, signal);
  }

  // Collect unique source URLs with their supporting signal IDs
  const refMap = new Map<string, { label: string; signalIds: Set<string> }>();

  for (const claim of citationMap) {
    if (claim.support_status === 'unsupported') continue;

    for (const signalId of claim.matched_signal_ids) {
      const signal = signalById.get(signalId);
      if (!signal) continue;

      const url = signal.source_url || `signal:${signalId}`;
      if (!refMap.has(url)) {
        refMap.set(url, {
          label: signal.source || signal.title,
          signalIds: new Set(),
        });
      }
      refMap.get(url)!.signalIds.add(signalId);
    }

    // Also include direct matched URLs
    for (const url of claim.matched_source_urls) {
      if (!refMap.has(url)) {
        // Try to find the signal for this URL to get a label
        const matchingSignal = signals.find(s => s.source_url === url);
        refMap.set(url, {
          label: matchingSignal?.source || matchingSignal?.title || url,
          signalIds: new Set(claim.matched_signal_ids),
        });
      }
    }
  }

  // Convert to array and sort by number of supporting signals (most referenced first)
  const references: SelectedReference[] = [];
  for (const [url, data] of refMap) {
    // Skip internal signal references without real URLs
    if (url.startsWith('signal:')) continue;

    references.push({
      source_label: data.label,
      source_url: url,
      supporting_signal_ids: [...data.signalIds],
    });
  }

  return references
    .sort((a, b) => b.supporting_signal_ids.length - a.supporting_signal_ids.length)
    .slice(0, 20); // Cap at 20 references
}
