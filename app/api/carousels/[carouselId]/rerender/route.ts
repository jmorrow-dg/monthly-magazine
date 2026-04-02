/**
 * POST /api/carousels/[carouselId]/rerender
 *
 * Re-renders slides 2-5 for an existing carousel using the current templates.
 * Keeps the existing hero image (slide 1) and content, just re-renders the visuals.
 */

import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/client';
import { renderAllPlatforms } from '@/lib/carousel/render';
import { selectPhoto, selectHeadshot } from '@/lib/carousel/select-photo';
import type { CarouselContent, Platform } from '@/lib/carousel/types';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ carouselId: string }> },
) {
  try {
    const { carouselId } = await params;
    const supabase = getSupabase();

    const { data: carousel, error } = await supabase
      .from('carousels')
      .select('*')
      .eq('id', carouselId)
      .single();

    if (error || !carousel) {
      return NextResponse.json({ error: 'Carousel not found' }, { status: 404 });
    }

    const content = carousel.content_json as CarouselContent;
    const platforms: Platform[] = carousel.platforms || ['linkedin'];

    // Fix old carousels that have null ctaText or "none" variant
    if (!content.closer.ctaText || (content.closer.ctaVariant as string) === 'none') {
      const { CTA_WEIGHTS: weights } = await import('@/lib/carousel/types');
      const total = weights.reduce((sum: number, w: { weight: number }) => sum + w.weight, 0);
      let random = Math.random() * total;
      for (const w of weights) {
        random -= w.weight;
        if (random <= 0) {
          content.closer.ctaVariant = w.variant;
          content.closer.ctaText = w.text;
          break;
        }
      }
    }

    // Select fresh photos
    const photoUrl = await selectPhoto();
    const closerPhotoUrl = await selectHeadshot();

    console.log(`[Rerender] Carousel ${carouselId}: re-rendering slides for ${platforms.length} platforms...`);

    // Re-render all platforms in parallel
    const platformResults = await renderAllPlatforms(carouselId, content, photoUrl, closerPhotoUrl, platforms);
    const slideUrlsByPlatform: Record<string, string[]> = {};
    for (const [platform, urls] of platformResults) {
      slideUrlsByPlatform[platform] = urls;
    }

    // Update carousel in database (including fixed content)
    const { error: updateError } = await supabase
      .from('carousels')
      .update({
        slide_urls_by_platform: slideUrlsByPlatform,
        content_json: content,
        photo_path: photoUrl,
      })
      .eq('id', carouselId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log(`[Rerender] Carousel ${carouselId}: complete`);

    return NextResponse.json({
      message: 'Slides re-rendered successfully',
      carouselId,
      platforms,
      slideCount: Object.values(slideUrlsByPlatform).reduce((sum, urls) => sum + urls.length, 0),
    });
  } catch (err) {
    console.error('[Rerender] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    );
  }
}
