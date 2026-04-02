/**
 * Content Variety Enforcement
 *
 * Tracks recent content category and personal angle usage.
 * Returns adjusted weights to bias toward underrepresented content,
 * preventing repetitive carousels within the same week.
 *
 * Soft biasing (weight multipliers), not hard blocking.
 */

import { getSupabase } from '@/lib/supabase/client';
import type { PersonalAngle, ContentCategory } from './types';

interface RecentUsage {
  angles: Map<string, number>;
  categories: Map<string, number>;
  signalCategories: Map<string, number>;
}

/**
 * Fetch recent carousel metadata and compute usage distributions.
 */
export async function getRecentUsage(lookbackDays = 14): Promise<RecentUsage> {
  const supabase = getSupabase();
  const since = new Date();
  since.setDate(since.getDate() - lookbackDays);

  const { data, error } = await supabase
    .from('carousels')
    .select('content_json, source_signal_category, created_at')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('[Variety] Failed to fetch recent carousels:', error?.message);
    return { angles: new Map(), categories: new Map(), signalCategories: new Map() };
  }

  const angles = new Map<string, number>();
  const categories = new Map<string, number>();
  const signalCategories = new Map<string, number>();

  for (const row of data) {
    const content = row.content_json as { contentCategory?: string; personal?: { angle?: string } } | null;
    const daysSinceCreated = Math.floor(
      (Date.now() - new Date(row.created_at).getTime()) / (1000 * 60 * 60 * 24),
    );

    // Weight by recency: more recent = higher count
    const recencyWeight = daysSinceCreated <= 3 ? 3 : daysSinceCreated <= 7 ? 2 : 1;

    if (content?.personal?.angle) {
      const angle = content.personal.angle;
      angles.set(angle, (angles.get(angle) || 0) + recencyWeight);
    }

    if (content?.contentCategory) {
      categories.set(content.contentCategory, (categories.get(content.contentCategory) || 0) + recencyWeight);
    }

    if (row.source_signal_category) {
      signalCategories.set(
        row.source_signal_category,
        (signalCategories.get(row.source_signal_category) || 0) + recencyWeight,
      );
    }
  }

  return { angles, categories, signalCategories };
}

/**
 * Compute a weight multiplier for a personal angle based on recent usage.
 *
 * Returns a number between 0.1 and 1.0:
 * - 1.0 = not used recently, full weight
 * - 0.6 = used moderately recently
 * - 0.3 = used frequently recently
 * - 0.1 = heavily overused
 */
export function getAngleMultiplier(angle: PersonalAngle, usage: RecentUsage): number {
  const count = usage.angles.get(angle) || 0;

  if (count === 0) return 1.0;
  if (count <= 1) return 0.7;
  if (count <= 2) return 0.4;
  if (count <= 3) return 0.2;
  return 0.1;
}

/**
 * Compute a weight multiplier for a signal category based on recent usage.
 * Used to diversify signal selection.
 */
export function getSignalCategoryMultiplier(category: string, usage: RecentUsage): number {
  const count = usage.signalCategories.get(category) || 0;

  if (count === 0) return 1.5; // Boost underrepresented categories
  if (count <= 2) return 1.0;
  if (count <= 4) return 0.7;
  if (count <= 6) return 0.4;
  return 0.2;
}
