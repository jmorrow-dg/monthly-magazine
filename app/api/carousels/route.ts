/**
 * GET /api/carousels
 *
 * List carousels with optional status filter.
 * Query params: ?status=pending_review&limit=20
 */

import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const supabase = getSupabase();
    let query = supabase
      .from('carousels')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ carousels: data || [] });
  } catch (err) {
    console.error('List carousels error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    );
  }
}
