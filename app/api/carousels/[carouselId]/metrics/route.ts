/**
 * POST /api/carousels/[carouselId]/metrics
 *
 * Record engagement metrics for a carousel on a specific platform.
 * Body: { platform: string, impressions?: number, likes?: number, comments?: number, saves?: number, shares?: number }
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
    const { platform, ...metrics } = body;

    if (!platform) {
      return NextResponse.json({ error: 'platform is required' }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data: carousel, error } = await supabase
      .from('carousels')
      .select('engagement_metrics')
      .eq('id', carouselId)
      .single();

    if (error || !carousel) {
      return NextResponse.json({ error: 'Carousel not found' }, { status: 404 });
    }

    const existing: Record<string, Record<string, number | string>> = (carousel.engagement_metrics as Record<string, Record<string, number | string>>) || {};
    const updated: Record<string, Record<string, number | string>> = {
      ...existing,
      [platform as string]: {
        ...(existing[platform as string] || {}),
        ...metrics,
        updated_at: new Date().toISOString(),
      },
    };

    const { error: updateError } = await supabase
      .from('carousels')
      .update({ engagement_metrics: updated })
      .eq('id', carouselId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      message: `Metrics saved for ${platform}`,
      metrics: updated[platform as string],
    });
  } catch (err) {
    console.error('[Metrics] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    );
  }
}
