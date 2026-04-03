// ============================================================
// Intelligence Hub: Weekly Signal Fetch Client
// Fetches scored signals from the past 7 days for weekly edition.
// Queries Supabase ai_signals table directly (same as carousel).
// ============================================================

import { getSupabase } from '@/lib/supabase/client';
import type { IntelligenceSignal, SignalContext } from './types';

export interface WeeklySignalFeed {
  success: boolean;
  week_start: string;
  week_end: string;
  total: number;
  signals: IntelligenceSignal[];
  by_category: Record<string, IntelligenceSignal[]>;
}

/**
 * Fetch scored signals for a specific week (Mon-Sun).
 * Falls back to the most recent 7 days if no dates provided.
 */
export async function fetchWeeklySignals(
  weekStart?: string,
  weekEnd?: string,
): Promise<WeeklySignalFeed> {
  const supabase = getSupabase();

  const end = weekEnd ? new Date(weekEnd) : new Date();
  const start = weekStart
    ? new Date(weekStart)
    : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('ai_signals')
    .select('*')
    .gte('signal_date', startStr)
    .lte('signal_date', endStr)
    .gte('composite_score', 5.0)
    .in('status', ['scored', 'included'])
    .order('composite_score', { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(`Weekly signal fetch failed: ${error.message}`);
  }

  const signals = (data || []) as IntelligenceSignal[];

  // Group by category
  const by_category: Record<string, IntelligenceSignal[]> = {};
  for (const s of signals) {
    const cat = s.category || 'Uncategorised';
    if (!by_category[cat]) by_category[cat] = [];
    by_category[cat].push(s);
  }

  return {
    success: true,
    week_start: startStr,
    week_end: endStr,
    total: signals.length,
    signals,
    by_category,
  };
}

/**
 * Build signal context from weekly signals for content generation.
 * Lighter than monthly: no clusters or trends, just raw signals ranked by score.
 */
export function buildWeeklySignalContext(feed: WeeklySignalFeed): SignalContext {
  // Take top signals by score for context
  const topSignals = feed.signals.slice(0, 50);

  return {
    signals: topSignals.map((s) => ({
      title: s.title,
      summary: s.summary,
      why_it_matters: s.why_it_matters || '',
      category: s.category,
      composite_score: s.composite_score ?? 0,
      source: s.source,
      source_url: s.source_url || '',
      company: s.company || null,
      practical_implication: s.practical_implication || null,
    })),
  };
}

/**
 * Identify the top signal/theme for the weekly lead story.
 * Returns the highest scoring signal as the lead narrative anchor.
 */
export function findWeeklyLeadSignal(
  signals: IntelligenceSignal[],
): IntelligenceSignal | null {
  if (signals.length === 0) return null;
  return signals[0]; // Already sorted by composite_score desc
}

/**
 * Compute the week date range (Mon-Sun) for a given date.
 */
export function getWeekRange(date: Date = new Date()): { weekStart: string; weekEnd: string } {
  const d = new Date(date);
  // Find the previous Monday
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday = 0 offset
  const monday = new Date(d);
  monday.setDate(d.getDate() - diff);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    weekStart: monday.toISOString().split('T')[0],
    weekEnd: sunday.toISOString().split('T')[0],
  };
}
