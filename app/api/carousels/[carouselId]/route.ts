/**
 * GET /api/carousels/[carouselId]
 *
 * Get a single carousel by ID with all content and slide URLs.
 */

import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ carouselId: string }> },
) {
  try {
    const { carouselId } = await params;
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('carousels')
      .select('*')
      .eq('id', carouselId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Carousel not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ carousel: data });
  } catch (err) {
    console.error('Get carousel error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    );
  }
}
