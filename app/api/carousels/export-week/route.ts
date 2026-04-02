/**
 * POST /api/carousels/export-week
 *
 * Exports all carousels for a given week into a local folder structure.
 * Creates: output/Week_XX_YYYY/carousel_name/platform/slide-N.png + captions.
 *
 * Body: { weekNumber: number, year: number }
 */

import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/client';
import fs from 'fs';
import path from 'path';

function sanitise(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50)
    .replace(/_+$/, '');
}

export async function POST(request: Request) {
  try {
    const { weekNumber, year } = await request.json();

    if (!weekNumber || !year) {
      return NextResponse.json({ error: 'weekNumber and year are required' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Fetch all carousels for this week
    const { data: carousels, error } = await supabase
      .from('carousels')
      .select('*')
      .eq('week_number', weekNumber)
      .eq('year', year)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!carousels?.length) {
      return NextResponse.json({ error: `No carousels found for Week ${weekNumber}, ${year}` }, { status: 404 });
    }

    // Create the output folder
    const outputDir = path.join(process.cwd(), '..', 'carousel-output', `Week_${String(weekNumber).padStart(2, '0')}_${year}`);
    fs.mkdirSync(outputDir, { recursive: true });

    const results: Array<{ carousel: string; folder: string; slides: number; captions: number }> = [];

    for (let idx = 0; idx < carousels.length; idx++) {
      const carousel = carousels[idx];
      const content = carousel.content_json;
      const captions = carousel.captions_json;
      const slideUrls = carousel.slide_urls_by_platform || {};

      // Create carousel subfolder with number prefix for ordering
      const folderName = `${String(idx + 1).padStart(2, '0')}_${sanitise(content?.signal?.headline || carousel.source_signal_title)}`;
      const carouselDir = path.join(outputDir, folderName);
      fs.mkdirSync(carouselDir, { recursive: true });

      let totalSlides = 0;
      let totalCaptions = 0;

      // Download slides for each platform
      const platforms = carousel.platforms || ['linkedin', 'instagram', 'x', 'tiktok'];
      for (const platform of platforms) {
        const urls = slideUrls[platform] || [];
        if (!urls.length) continue;

        const platformDir = path.join(carouselDir, platform);
        fs.mkdirSync(platformDir, { recursive: true });

        for (let i = 0; i < urls.length; i++) {
          try {
            const response = await fetch(urls[i]);
            if (response.ok) {
              const buffer = Buffer.from(await response.arrayBuffer());
              fs.writeFileSync(path.join(platformDir, `slide-${i + 1}.png`), buffer);
              totalSlides++;
            }
          } catch (err) {
            console.error(`Failed to download slide ${i + 1} for ${platform}:`, err);
          }
        }
      }

      // Write captions
      if (captions) {
        const captionsDir = path.join(carouselDir, 'captions');
        fs.mkdirSync(captionsDir, { recursive: true });

        for (const [platform, caption] of Object.entries(captions)) {
          if (caption && typeof caption === 'string') {
            fs.writeFileSync(path.join(captionsDir, `${platform}.txt`), caption, 'utf-8');
            totalCaptions++;
          }
        }
      }

      // Write content summary
      const summary = [
        `Signal: ${carousel.source_signal_title}`,
        `Category: ${carousel.source_signal_category}`,
        `Content Type: ${content?.contentCategory || 'unknown'}`,
        `Status: ${carousel.status}`,
        `Created: ${carousel.created_at}`,
        '',
        `--- SLIDE 2: SIGNAL ---`,
        `Headline: ${content?.signal?.headline}`,
        `Highlight: ${content?.signal?.highlightWord}`,
        `Body: ${content?.signal?.body}`,
        '',
        `--- SLIDE 3: INSIGHT ---`,
        `Headline: ${content?.insight?.headline}`,
        ...(content?.insight?.bullets || []).map((b: string) => `  - ${b}`),
        '',
        `--- SLIDE 4: PERSONAL ---`,
        `Angle: ${content?.personal?.angle}`,
        `Text: ${content?.personal?.text}`,
        '',
        `--- SLIDE 5: CTA ---`,
        `Variant: ${content?.closer?.ctaVariant}`,
        `Text: ${content?.closer?.ctaText}`,
      ].join('\n');

      fs.writeFileSync(path.join(carouselDir, 'content-summary.txt'), summary, 'utf-8');

      results.push({
        carousel: content?.signal?.headline || carousel.source_signal_title,
        folder: folderName,
        slides: totalSlides,
        captions: totalCaptions,
      });
    }

    // Write week overview
    const overview = [
      `Week ${weekNumber}, ${year}`,
      `Generated: ${new Date().toISOString()}`,
      `Total carousels: ${carousels.length}`,
      '',
      'CAROUSELS:',
      ...results.map((r, i) => `  ${i + 1}. ${r.carousel} (${r.slides} slides, ${r.captions} captions)`),
    ].join('\n');

    fs.writeFileSync(path.join(outputDir, 'week-overview.txt'), overview, 'utf-8');

    return NextResponse.json({
      message: `Exported ${carousels.length} carousels to local folder`,
      outputPath: outputDir,
      week: weekNumber,
      year,
      carousels: results,
    });
  } catch (err) {
    console.error('[Export] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    );
  }
}
