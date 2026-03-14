import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { listSignals } from '@/lib/supabase/intelligence-queries';

/**
 * GET /api/intelligence/signals?limit=50&offset=0&category=Enterprise+AI&search=openai
 * Paginated signal browser. Admin-only.
 */
export async function GET(request: Request) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit') || 50), 100);
    const offset = Math.max(Number(searchParams.get('offset') || 0), 0);
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;

    const { signals, total } = await listSignals({ limit, offset, category, search });

    return NextResponse.json({
      signals,
      total,
      limit,
      offset,
      has_more: offset + signals.length < total,
    });
  } catch (error) {
    console.error('Failed to list signals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch signals' },
      { status: 500 },
    );
  }
}
