/**
 * Carousel Rendering Pipeline
 *
 * Takes carousel content and renders each slide to PNG using Puppeteer.
 * Supports multiple platform dimensions with parallel rendering.
 *
 * Performance: All 4 platforms render concurrently on separate browser pages.
 * One browser launch, 4 parallel page renders, one browser close.
 */

import type { Browser, Page } from 'puppeteer-core';
import { launchBrowser, closeBrowser } from '@/lib/pdf/browser';
import { getSupabase } from '@/lib/supabase/client';
import { renderHeroSlide } from './templates/slide-hero';
import { renderSignalSlide } from './templates/slide-signal';
import { renderInsightSlide } from './templates/slide-insight';
import { renderPersonalSlide } from './templates/slide-personal';
import { renderCloserSlide } from './templates/slide-closer';
import type { CarouselContent, Platform } from './types';

interface RenderResult {
  slideUrls: string[];
  platform: Platform;
}

/**
 * Render slides for a single platform.
 * Accepts an optional shared browser instance for parallel rendering.
 * If no browser is provided, launches and closes its own (legacy behaviour).
 */
export async function renderCarouselSlides(
  carouselId: string,
  content: CarouselContent,
  platform: Platform,
  photoUrl: string,
  closerPhotoUrl: string,
  sharedBrowser?: Browser,
): Promise<RenderResult> {
  const dims = getDimensions(platform);
  const ownsBrowser = !sharedBrowser;
  const browser = sharedBrowser || await launchBrowser();

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: dims.width, height: dims.height });

    const slideHtmls = buildSlideHtmls(content, photoUrl, closerPhotoUrl, dims.width, dims.height, platform);
    const slideUrls: string[] = [];

    for (let i = 0; i < slideHtmls.length; i++) {
      const png = await renderSlideToPng(page, slideHtmls[i], `${platform}-slide-${i + 1}`);
      const url = await uploadSlide(carouselId, platform, i + 1, png);
      slideUrls.push(url);
    }

    await page.close();
    return { slideUrls, platform };
  } finally {
    // Only close the browser if we launched it ourselves
    if (ownsBrowser) {
      await closeBrowser().catch((err) => {
        console.error('Failed to close browser:', err);
      });
    }
  }
}

/**
 * Render all slides for all target platforms in parallel.
 *
 * Launches one browser, creates a separate page per platform,
 * renders all platforms concurrently, then closes the browser.
 * ~3-4x faster than sequential rendering.
 */
export async function renderAllPlatforms(
  carouselId: string,
  content: CarouselContent,
  photoUrl: string,
  closerPhotoUrl: string,
  platforms: Platform[],
): Promise<Map<Platform, string[]>> {
  const browser = await launchBrowser();

  try {
    const resultMap = new Map<Platform, string[]>();

    // Render in batches of 2 to balance speed vs memory.
    // Full parallelism (4 concurrent Puppeteer pages with large canvases)
    // can overwhelm local dev machines.
    const BATCH_SIZE = 2;
    for (let i = 0; i < platforms.length; i += BATCH_SIZE) {
      const batch = platforms.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map((platform) =>
          renderCarouselSlides(carouselId, content, platform, photoUrl, closerPhotoUrl, browser),
        ),
      );
      for (const result of results) {
        resultMap.set(result.platform, result.slideUrls);
      }
    }

    return resultMap;
  } finally {
    await closeBrowser().catch((err) => {
      console.error('Failed to close browser:', err);
    });
  }
}

/**
 * Build slide HTML for all slides.
 *
 * Platform-specific rules:
 * - X (Twitter): Max 4 images. Skip the personal slide (slide 4).
 *   X shows images in a grid, not a swipeable carousel, so 4 slides max.
 * - X and TikTok: No swipe hint arrows (not applicable on those platforms).
 * - LinkedIn and Instagram: Full 5-slide carousel with swipe hints.
 */
function buildSlideHtmls(
  content: CarouselContent,
  photoUrl: string,
  closerPhotoUrl: string,
  width: number,
  height: number,
  platform: Platform,
): string[] {
  const showSwipeHint = platform === 'linkedin' || platform === 'instagram';

  const slides: string[] = [
    renderHeroSlide(
      {
        imageUrl: content.hero.generatedImageUrl || '',
        category: content.hero.category,
        headline: content.hero.headline,
      },
      width,
      height,
    ),
    renderSignalSlide(
      {
        label: content.signal.label,
        headline: content.signal.headline,
        highlightWord: content.signal.highlightWord,
        body: content.signal.body,
      },
      width,
      height,
      showSwipeHint,
    ),
    renderInsightSlide(
      {
        label: content.insight.label,
        headline: content.insight.headline,
        bullets: content.insight.bullets,
      },
      width,
      height,
      showSwipeHint,
    ),
  ];

  // X (Twitter): Skip personal slide. Max 4 images in a grid.
  if (platform !== 'x') {
    slides.push(
      renderPersonalSlide(
        {
          photoUrl,
          text: content.personal.text,
          angle: content.personal.angle,
        },
        width,
        height,
      ),
    );
  }

  slides.push(
    renderCloserSlide(
      {
        ctaVariant: content.closer.ctaVariant,
        ctaText: content.closer.ctaText,
        photoUrl: closerPhotoUrl,
      },
      width,
      height,
    ),
  );

  return slides;
}

async function renderSlideToPng(
  page: Page,
  html: string,
  slideName: string,
): Promise<Uint8Array> {
  try {
    await page.setContent(html, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });

    // Wait for fonts and images to load
    await Promise.race([
      page.evaluate(() =>
        Promise.all([
          document.fonts.ready,
          ...Array.from(document.images).map(
            (img) =>
              new Promise((resolve) => {
                if (img.complete) resolve(true);
                else {
                  img.onload = () => resolve(true);
                  img.onerror = () => resolve(false);
                }
              }),
          ),
        ]),
      ),
      new Promise((resolve) => setTimeout(resolve, 8000)),
    ]);

    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: false,
      omitBackground: false,
    });

    return new Uint8Array(screenshot);
  } catch (err) {
    console.error(`Slide rendering failed for ${slideName}:`, err);
    throw new Error(
      `Failed to render ${slideName}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

async function uploadSlide(
  carouselId: string,
  platform: Platform,
  slideNumber: number,
  pngBuffer: Uint8Array,
): Promise<string> {
  const supabase = getSupabase();
  const storagePath = `carousels/${carouselId}/${platform}/slide-${slideNumber}.png`;

  const { error } = await supabase.storage
    .from('carousel-images')
    .upload(storagePath, pngBuffer, {
      contentType: 'image/png',
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload slide ${slideNumber}: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from('carousel-images')
    .getPublicUrl(storagePath);

  return urlData.publicUrl;
}

function getDimensions(platform: Platform): { width: number; height: number } {
  const dims: Record<Platform, { width: number; height: number }> = {
    linkedin: { width: 1080, height: 1350 },
    instagram: { width: 1080, height: 1350 },
    x: { width: 1200, height: 675 },
    tiktok: { width: 1080, height: 1920 },
  };

  return dims[platform];
}
