/**
 * Carousel Frequency Limiter
 *
 * Enforces the 3-5 carousels per week target.
 * Prevents over-generation and ensures quality over quantity.
 */

import { getSupabase } from '@/lib/supabase/client';

const MAX_PER_WEEK = 5;

interface LimitCheckResult {
  allowed: boolean;
  reason?: string;
  currentCount: number;
  maxAllowed: number;
}

/**
 * Check if we can generate another carousel this week.
 */
export async function checkWeeklyLimit(): Promise<LimitCheckResult> {
  const now = new Date();
  const weekStart = getWeekStart(now);
  const weekEnd = getWeekEnd(now);

  const supabase = getSupabase();

  const { count, error } = await supabase
    .from('carousels')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', weekStart.toISOString())
    .lte('created_at', weekEnd.toISOString());

  if (error) {
    console.error('[Frequency] Failed to check weekly count:', error.message);
    // Allow generation if we can't check (fail open)
    return { allowed: true, currentCount: 0, maxAllowed: MAX_PER_WEEK };
  }

  const currentCount = count ?? 0;

  if (currentCount >= MAX_PER_WEEK) {
    return {
      allowed: false,
      reason: `Weekly limit reached: ${currentCount}/${MAX_PER_WEEK} carousels generated this week (Mon-Sun). Next slot available Monday.`,
      currentCount,
      maxAllowed: MAX_PER_WEEK,
    };
  }

  return {
    allowed: true,
    currentCount,
    maxAllowed: MAX_PER_WEEK,
  };
}

/**
 * Get the optimal days for carousel generation this week.
 * Returns which weekdays should have carousels, spread evenly.
 *
 * For 3-5 per week:
 * - 5: Mon, Tue, Wed, Thu, Fri
 * - 4: Mon, Tue, Wed, Thu
 * - 3: Mon, Wed, Fri
 */
export function getScheduledDays(targetCount: number): number[] {
  switch (targetCount) {
    case 5: return [1, 2, 3, 4, 5]; // Mon-Fri
    case 4: return [1, 2, 3, 4];    // Mon-Thu
    case 3: return [1, 3, 5];       // Mon, Wed, Fri
    default: return [1, 3, 5];      // Default to 3
  }
}

/**
 * Check if today is a scheduled carousel day.
 */
export function isTodayScheduled(targetCount = 4): boolean {
  const today = new Date().getUTCDay(); // 0=Sun, 1=Mon...
  const scheduledDays = getScheduledDays(targetCount);
  return scheduledDays.includes(today);
}

/**
 * Get Monday 00:00 UTC of the current week.
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Get Sunday 23:59:59 UTC of the current week.
 */
function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  return end;
}
