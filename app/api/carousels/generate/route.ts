/**
 * POST /api/carousels/generate
 *
 * Triggers the carousel generation pipeline.
 * Returns the generated carousel with slide URLs and captions.
 */

import { NextResponse } from 'next/server';
import { generateCarousel } from '@/lib/carousel/pipeline';
import type { CarouselGenerateInput } from '@/lib/carousel/types';

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as CarouselGenerateInput;

    const result = await generateCarousel(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({
      carousel: result.carousel,
      message: 'Carousel generated and queued for review',
    });
  } catch (err) {
    console.error('Carousel generation error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    );
  }
}
