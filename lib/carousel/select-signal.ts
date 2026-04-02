/**
 * Signal Selection for Carousels
 *
 * Picks the best signal from the ai_signals table for carousel generation.
 * Queries Supabase directly (same database as carousels table).
 * Avoids signals already used in recent carousels.
 * Targets 3-5 carousels per week from the strongest signals.
 */

import type { IntelligenceSignal } from '@/lib/intelligence/types';
import { getSupabase } from '@/lib/supabase/client';

/**
 * Fetch recent signals and select the best unused candidate for a carousel.
 */
export async function selectTopSignal(
  overrideSignalId?: string,
): Promise<IntelligenceSignal | null> {
  const signals = await fetchRecentSignals();

  if (!signals.length) {
    console.warn('[Carousel] No signals available for carousel generation');
    return null;
  }

  if (overrideSignalId) {
    const match = signals.find((s) => s.id === overrideSignalId);
    if (match) return match;
    console.warn(`[Carousel] Override signal ${overrideSignalId} not found in recent signals`);
  }

  const usedIds = await getRecentlyUsedSignalIds();
  let candidates = signals
    .filter((s) => !usedIds.has(s.id))
    .filter((s) => (s.composite_score ?? 0) >= 7.0);

  if (!candidates.length) {
    // Fall back to highest scoring even if recently used
    console.warn('[Carousel] No unused high-scoring signals. Falling back to top signal.');
    return signals[0];
  }

  // Apply category diversity: boost underrepresented signal categories
  try {
    const { getRecentUsage, getSignalCategoryMultiplier } = await import('./variety');
    const usage = await getRecentUsage();

    candidates = candidates
      .map((s) => ({
        signal: s,
        adjustedScore: (s.composite_score ?? 0) * getSignalCategoryMultiplier(s.category, usage),
      }))
      .sort((a, b) => b.adjustedScore - a.adjustedScore)
      .map((s) => s.signal);
  } catch {
    // Variety module unavailable, fall back to raw score sorting
    candidates.sort((a, b) => (b.composite_score ?? 0) - (a.composite_score ?? 0));
  }

  return candidates[0];
}

/**
 * Fetch scored signals from the last 60 days directly from Supabase.
 * Extended from 7 days to support evergreen content scheduling from older signals.
 */
async function fetchRecentSignals(): Promise<IntelligenceSignal[]> {
  const supabase = getSupabase();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 60);

  const { data, error } = await supabase
    .from('ai_signals')
    .select('*')
    .gte('composite_score', 6.0)
    .gte('signal_date', sevenDaysAgo.toISOString().split('T')[0])
    .in('status', ['scored', 'included'])
    .order('composite_score', { ascending: false })
    .limit(100);

  if (error) {
    console.error('[Carousel] Failed to fetch signals:', error.message);
    throw new Error(`Signal fetch failed: ${error.message}`);
  }

  return (data || []) as IntelligenceSignal[];
}

/**
 * Get signal IDs used in carousels from the last 14 days.
 */
async function getRecentlyUsedSignalIds(): Promise<Set<string>> {
  const supabase = getSupabase();
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const { data, error } = await supabase
    .from('carousels')
    .select('source_signal_id')
    .gte('created_at', twoWeeksAgo.toISOString());

  if (error) {
    console.error('[Carousel] Failed to fetch recent carousel signal IDs:', error.message);
    return new Set();
  }

  return new Set((data || []).map((r: { source_signal_id: string }) => r.source_signal_id));
}
