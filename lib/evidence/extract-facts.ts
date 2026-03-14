// ============================================================
// Phase 5 Block 1: Evidence Fact Extraction
// Extracts canonical EvidenceFact objects from intelligence signals
// and persists them to the evidence_facts table.
// Deterministic, no LLM calls.
// ============================================================

import type { IntelligenceSignal } from '@/lib/intelligence/types';
import type { EvidenceFact } from '@/lib/types/evidence';
import { getSupabase } from '@/lib/supabase/client';

/**
 * Extract verifiable facts from signals.
 *
 * Each signal produces one EvidenceFact. The fact_text combines the
 * most concrete fields (what_happened, summary) into a single
 * verifiable statement. Company, topic, and region are standardised.
 */
export function extractFactsFromSignals(signals: IntelligenceSignal[]): Omit<EvidenceFact, 'id' | 'created_at'>[] {
  return signals.map((signal) => {
    // Build fact_text from the most concrete fields
    const factParts = [signal.what_happened, signal.summary].filter(Boolean);
    const factText = factParts.join(' ').trim();

    // Derive topic from category or tags
    const topic = signal.topic || signal.category || null;

    // Derive region from tags (look for known region patterns)
    const regionTag = (signal.tags || []).find((t) =>
      /^(north america|europe|asia|australia|global|middle east|africa|latin america)/i.test(t),
    );

    return {
      signal_id: signal.id,
      fact_text: factText,
      company: signal.company || null,
      topic,
      region: regionTag || null,
      source_name: signal.source || '',
      source_url: signal.source_url || null,
      signal_date: signal.signal_date || null,
      confidence_score: signal.composite_score ?? 0,
    };
  });
}

/**
 * Extract facts from signals and persist to the evidence_facts table.
 * Returns the persisted EvidenceFact rows (with IDs).
 * Idempotent: deletes existing facts for the same signal_ids before inserting.
 */
export async function extractAndStoreFacts(
  signals: IntelligenceSignal[],
): Promise<EvidenceFact[]> {
  if (signals.length === 0) return [];

  const supabase = getSupabase();
  const facts = extractFactsFromSignals(signals);

  // Remove existing facts for these signals (idempotent re-run)
  const signalIds = [...new Set(facts.map((f) => f.signal_id))];
  await supabase
    .from('evidence_facts')
    .delete()
    .in('signal_id', signalIds);

  // Insert in batches of 50 for safety
  const allInserted: EvidenceFact[] = [];
  const batchSize = 50;
  for (let i = 0; i < facts.length; i += batchSize) {
    const batch = facts.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('evidence_facts')
      .insert(batch)
      .select();

    if (error) {
      throw new Error(`Failed to insert evidence facts: ${error.message}`);
    }
    if (data) allInserted.push(...(data as EvidenceFact[]));
  }

  return allInserted;
}

/**
 * Fetch evidence facts by their IDs.
 */
export async function getFactsByIds(factIds: string[]): Promise<EvidenceFact[]> {
  if (factIds.length === 0) return [];
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('evidence_facts')
    .select('*')
    .in('id', factIds);

  if (error) throw new Error(`Failed to fetch evidence facts: ${error.message}`);
  return (data || []) as EvidenceFact[];
}

/**
 * Fetch all evidence facts for a set of signal IDs.
 */
export async function getFactsBySignalIds(signalIds: string[]): Promise<EvidenceFact[]> {
  if (signalIds.length === 0) return [];
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('evidence_facts')
    .select('*')
    .in('signal_id', signalIds)
    .order('confidence_score', { ascending: false });

  if (error) throw new Error(`Failed to fetch evidence facts: ${error.message}`);
  return (data || []) as EvidenceFact[];
}
