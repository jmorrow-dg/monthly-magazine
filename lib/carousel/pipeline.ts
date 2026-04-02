/**
 * Carousel Generation Pipeline
 *
 * Orchestrates the full carousel creation flow:
 * 1. Select top signal from Intelligence Hub
 * 2. Generate slide copy via Claude
 * 3. Generate hero image via DALL-E 3
 * 4. Select personal photo from archive
 * 5. Render all slides as PNGs via Puppeteer
 * 6. Generate platform-specific captions
 * 7. Store carousel record in Supabase
 */

import { selectTopSignal } from './select-signal';
import { generateCarouselContent, generateCarouselCaptions } from './generate-content';
import { generateHeroImage, persistImage } from './generate-image';
import { selectPhoto, selectHeadshot } from './select-photo';
import { renderAllPlatforms } from './render';
import { notifyCarouselReady } from './notify';
import { checkWeeklyLimit } from './frequency';
import { getSupabase } from '@/lib/supabase/client';
import type {
  Carousel,
  CarouselGenerateInput,
  Platform,
} from './types';

const TARGET_PLATFORMS: Platform[] = ['linkedin', 'instagram', 'x', 'tiktok'];

export interface PipelineResult {
  success: boolean;
  carousel?: Carousel;
  error?: string;
}

/**
 * Run the full carousel generation pipeline.
 */
export async function generateCarousel(
  input: CarouselGenerateInput = {},
): Promise<PipelineResult> {
  const startTime = Date.now();

  try {
    // Step 0: Check weekly frequency limit
    const limitCheck = await checkWeeklyLimit();
    if (!limitCheck.allowed) {
      return { success: false, error: limitCheck.reason };
    }

    // Step 1: Select the best signal
    console.log('[Carousel] Step 1: Selecting signal...');
    const signal = await selectTopSignal(input.signalId);
    if (!signal) {
      return { success: false, error: 'No suitable signal found for carousel' };
    }
    console.log(`[Carousel] Selected: "${signal.title}" (score: ${signal.composite_score})`);

    // Step 2: Generate slide content
    console.log('[Carousel] Step 2: Generating slide content...');
    console.log('[Carousel] ANTHROPIC_API_KEY set:', !!process.env.ANTHROPIC_API_KEY);
    console.log('[Carousel] All API keys:', Object.keys(process.env).filter(k => k.includes('API') || k.includes('KEY')).join(', '));
    let content;
    try {
      content = await generateCarouselContent(
        signal,
        input.personalAngle,
        input.ctaVariant,
      );
    } catch (step2Err) {
      console.error('[Carousel] Step 2 detailed error:', step2Err);
      throw step2Err;
    }

    // Step 3: Generate hero image
    console.log('[Carousel] Step 3: Generating hero image...');
    const carouselId = crypto.randomUUID();
    const tempImageUrl = await generateHeroImage(content.hero.imagePrompt);
    const permanentImageUrl = await persistImage(tempImageUrl, carouselId, 'hero.png');
    content.hero.generatedImageUrl = permanentImageUrl;

    // Step 4: Select personal photo (slide 4) + headshot (slide 5)
    console.log('[Carousel] Step 4: Selecting personal photos...');
    const photoUrl = await selectPhoto(input.photoPath, content.personal.angle);
    const closerPhotoUrl = await selectHeadshot();

    // Step 5: Render slides for all platforms
    console.log('[Carousel] Step 5: Rendering slides...');
    const platformSlides = await renderAllPlatforms(
      carouselId,
      content,
      photoUrl,
      closerPhotoUrl,
      TARGET_PLATFORMS,
    );

    // Step 6: Generate captions
    console.log('[Carousel] Step 6: Generating captions...');
    const captions = await generateCarouselCaptions(signal, content);

    // Step 7: Store in Supabase
    console.log('[Carousel] Step 7: Storing carousel...');
    const now = new Date();
    const weekNumber = getWeekNumber(now);

    const carousel: Carousel = {
      id: carouselId,
      status: 'pending_review',
      sourceSignalId: signal.id,
      sourceSignalTitle: signal.title,
      sourceSignalCategory: signal.category,
      content,
      captions,
      slideUrls: platformSlides.get('linkedin') || [],
      platforms: TARGET_PLATFORMS,
      createdAt: now.toISOString(),
      approvedAt: null,
      weekNumber,
      year: now.getFullYear(),
    };

    await storeCarousel(carousel, photoUrl, platformSlides);

    // Step 8: Send Slack notification
    console.log('[Carousel] Step 8: Sending review notification...');
    await notifyCarouselReady(carousel).catch((err) => {
      console.error('[Carousel] Slack notification failed (non-fatal):', err);
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Carousel] Complete in ${duration}s. ID: ${carouselId}`);

    return { success: true, carousel };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Carousel] Pipeline failed:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Store carousel record in Supabase.
 */
async function storeCarousel(
  carousel: Carousel,
  photoPath: string,
  platformSlides: Map<Platform, string[]>,
): Promise<void> {
  const supabase = getSupabase();

  const slideUrlsByPlatform: Record<string, string[]> = {};
  for (const [platform, urls] of platformSlides) {
    slideUrlsByPlatform[platform] = urls;
  }

  const { error } = await supabase.from('carousels').insert({
    id: carousel.id,
    status: carousel.status,
    source_signal_id: carousel.sourceSignalId,
    source_signal_title: carousel.sourceSignalTitle,
    source_signal_category: carousel.sourceSignalCategory,
    content_json: carousel.content,
    captions_json: carousel.captions,
    slide_urls_by_platform: slideUrlsByPlatform,
    platforms: carousel.platforms,
    photo_path: photoPath,
    week_number: carousel.weekNumber,
    year: carousel.year,
    created_at: carousel.createdAt,
    approved_at: null,
  });

  if (error) {
    throw new Error(`Failed to store carousel: ${error.message}`);
  }
}

/**
 * Get ISO week number for a date.
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
