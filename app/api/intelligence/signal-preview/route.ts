import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { fetchSignalSummary } from '@/lib/intelligence/fetch-signals';

export const dynamic = 'force-dynamic';

/**
 * GET /api/intelligence/signal-preview?month_year=2026-03
 * Returns a preview of scored signals from the Intelligence Hub.
 * Used by the admin UI to show available signals before generation.
 */
export async function GET(request: NextRequest) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const monthYear = request.nextUrl.searchParams.get('month_year');
  if (!monthYear || !/^\d{4}-\d{2}$/.test(monthYear)) {
    return NextResponse.json(
      { error: 'month_year query parameter required (YYYY-MM format)' },
      { status: 400 },
    );
  }

  try {
    const summary = await fetchSignalSummary(monthYear);

    return NextResponse.json({
      month_year: monthYear,
      signals: summary.signals || [],
      total: summary.total || 0,
    });
  } catch (err) {
    console.error('Signal preview fetch failed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch signal preview' },
      { status: 502 },
    );
  }
}
