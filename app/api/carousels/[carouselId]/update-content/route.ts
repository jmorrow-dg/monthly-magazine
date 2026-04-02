/**
 * POST /api/carousels/[carouselId]/update-content
 *
 * Updates carousel content (slide text, captions) without regenerating.
 * Optionally re-renders slides after updating.
 *
 * Body: { content?: Partial<CarouselContent>, captions?: Partial<CarouselCaption>, rerender?: boolean }
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

    const currentContent = carousel.content_json as CarouselContent;
    const currentCaptions = carousel.captions_json as Record<string, string>;

    // Deep merge content updates
    const updatedContent: CarouselContent = body.content
      ? (deepMerge(currentContent as unknown as Record<string, unknown>, body.content) as unknown as CarouselContent)
      : currentContent;

    const updatedCaptions = body.captions
      ? { ...currentCaptions, ...body.captions }
      : currentCaptions;

    // Update in database
    const updatePayload: Record<string, unknown> = {
      content_json: updatedContent,
      captions_json: updatedCaptions,
    };

    const { error: updateError } = await supabase
      .from('carousels')
      .update(updatePayload)
      .eq('id', carouselId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Optionally re-render
    if (body.rerender) {
      const photoUrl = await selectPhoto(carousel.photo_path, updatedContent.personal?.angle);
      const closerPhotoUrl = await selectHeadshot();
      const platforms: Platform[] = carousel.platforms || ['linkedin', 'instagram', 'x', 'tiktok'];

      const platformResults = await renderAllPlatforms(carouselId, updatedContent, photoUrl, closerPhotoUrl, platforms);
      const slideUrlsByPlatform: Record<string, string[]> = {};
      for (const [platform, urls] of platformResults) {
        slideUrlsByPlatform[platform] = urls;
      }

      await supabase
        .from('carousels')
        .update({ slide_urls_by_platform: slideUrlsByPlatform })
        .eq('id', carouselId);

      return NextResponse.json({
        message: 'Content updated and slides re-rendered',
        carouselId,
        slidesRendered: Object.values(slideUrlsByPlatform).flat().length,
      });
    }

    return NextResponse.json({
      message: 'Content updated (no re-render)',
      carouselId,
    });
  } catch (err) {
    console.error('[UpdateContent] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    );
  }
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === 'object'
    ) {
      result[key] = deepMerge(
        target[key] as Record<string, unknown>,
        source[key] as Record<string, unknown>,
      );
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
