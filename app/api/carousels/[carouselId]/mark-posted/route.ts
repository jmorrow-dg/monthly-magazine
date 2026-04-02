/**
 * POST /api/carousels/[carouselId]/mark-posted
 *
 * Marks a carousel as posted to specific platforms.
 * Tracks which platforms have been posted to and when.
 *
 * Body: { platform: string } or { platforms: string[] }
 */

import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/client';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ carouselId: string }> },
) {
  try {
    const { carouselId } = await params;
    const body = await request.json();
    const supabase = getSupabase();

    const { data: carousel, error } = await supabase
      .from('carousels')
      .select('*')
      .eq('id', carouselId)
      .single();

    if (error || !carousel) {
      return NextResponse.json({ error: 'Carousel not found' }, { status: 404 });
    }

    const platforms = body.platforms || (body.platform ? [body.platform] : []);
    if (!platforms.length) {
      return NextResponse.json({ error: 'platform or platforms required' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const existing = (carousel.posted_platforms as Record<string, string>) || {};
    const updated = { ...existing };

    for (const p of platforms) {
      updated[p] = now;
    }

    const allPosted = (carousel.platforms || []).every((p: string) => updated[p]);

    const { error: updateError } = await supabase
      .from('carousels')
      .update({
        posted_platforms: updated,
        status: allPosted ? 'posted' : carousel.status,
      })
      .eq('id', carouselId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      message: `Marked as posted to: ${platforms.join(', ')}`,
      postedPlatforms: updated,
      allPosted,
    });
  } catch (err) {
    console.error('[MarkPosted] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    );
  }
}
