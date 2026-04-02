/**
 * POST /api/carousels/[carouselId]/regenerate
 *
 * Regenerates content (slides 2-5) for an existing carousel using the new
 * content strategy framework. Keeps the existing hero image (slide 1).
 * Then re-renders all slides with updated templates.
 */

import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/client';
import { generateCarouselContent, generateCarouselCaptions } from '@/lib/carousel/generate-content';
import { renderCarouselSlides } from '@/lib/carousel/render';
import { selectPhoto, selectHeadshot } from '@/lib/carousel/select-photo';
import type { IntelligenceSignal } from '@/lib/intelligence/types';
import type { CarouselContent, Platform } from '@/lib/carousel/types';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ carouselId: string }> },
) {
  try {
    const { carouselId } = await params;
    const body = await request.json().catch(() => ({})) as { personalAngle?: string; ctaVariant?: string };
    const supabase = getSupabase();

    // Fetch existing carousel
    const { data: carousel, error } = await supabase
      .from('carousels')
      .select('*')
      .eq('id', carouselId)
      .single();

    if (error || !carousel) {
      return NextResponse.json({ error: 'Carousel not found' }, { status: 404 });
    }

    // Fetch the source signal
    const { data: signal, error: sigError } = await supabase
      .from('ai_signals')
      .select('*')
      .eq('id', carousel.source_signal_id)
      .single();

    if (sigError || !signal) {
      return NextResponse.json({ error: 'Source signal not found' }, { status: 404 });
    }

    console.log(`[Regenerate] ${carouselId}: regenerating content for "${signal.title}"...`);

    // Regenerate content with new framework (optional angle/CTA overrides from body)
    const content = await generateCarouselContent(
      signal as IntelligenceSignal,
      body.personalAngle as any,
      body.ctaVariant as any,
    );

    // Preserve the existing hero image
    const oldContent = carousel.content_json as CarouselContent;
    content.hero.generatedImageUrl = oldContent.hero.generatedImageUrl;

    // Regenerate captions with new framework
    const captions = await generateCarouselCaptions(signal as IntelligenceSignal, content);

    // Select fresh photos (pass angle so lost_everything always gets fire photo)
    const photoUrl = await selectPhoto(undefined, content.personal.angle);
    const closerPhotoUrl = await selectHeadshot();

    // Re-render for all platforms
    const platforms: Platform[] = carousel.platforms || ['linkedin', 'instagram', 'x', 'tiktok'];
    const slideUrlsByPlatform: Record<string, string[]> = {};

    for (const platform of platforms) {
      const result = await renderCarouselSlides(carouselId, content, platform, photoUrl, closerPhotoUrl);
      slideUrlsByPlatform[platform] = result.slideUrls;
    }

    // Update database
    const { error: updateError } = await supabase
      .from('carousels')
      .update({
        content_json: content,
        captions_json: captions,
        slide_urls_by_platform: slideUrlsByPlatform,
        photo_path: photoUrl,
      })
      .eq('id', carouselId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log(`[Regenerate] ${carouselId}: complete`);

    return NextResponse.json({
      message: 'Content regenerated and slides re-rendered',
      carouselId,
      headline: content.signal.headline,
      insight: content.insight.headline,
      ctaVariant: content.closer.ctaVariant,
    });
  } catch (err) {
    console.error('[Regenerate] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    );
  }
}
