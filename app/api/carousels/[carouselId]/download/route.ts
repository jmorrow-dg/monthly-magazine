/**
 * GET /api/carousels/[carouselId]/download
 *
 * Downloads a single carousel as a ZIP file containing all platforms,
 * slides, captions, and a content summary. One click, one file.
 */

import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/client';
import JSZip from 'jszip';

function sanitise(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 40)
    .replace(/_+$/, '');
}

export async function GET(
  _request: Request,
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

    const content = carousel.content_json;
    const captions = carousel.captions_json;
    const slideUrls = carousel.slide_urls_by_platform || {};
    const platforms = carousel.platforms || ['linkedin', 'instagram', 'x', 'tiktok'];
    const headline = sanitise(content?.signal?.headline || carousel.source_signal_title);

    const zip = new JSZip();

    // Download and add slides for each platform
    for (const platform of platforms) {
      const urls = slideUrls[platform] || [];
      for (let i = 0; i < urls.length; i++) {
        try {
          const response = await fetch(urls[i]);
          if (response.ok) {
            const buffer = await response.arrayBuffer();
            zip.file(`${platform}/slide-${i + 1}.png`, buffer);
          }
        } catch {
          // Skip failed downloads
        }
      }
    }

    // Add captions
    if (captions) {
      for (const [platform, caption] of Object.entries(captions)) {
        if (caption && typeof caption === 'string') {
          zip.file(`captions/${platform}.txt`, caption);
        }
      }
    }

    // Add content summary
    const summary = [
      `Signal: ${carousel.source_signal_title}`,
      `Category: ${carousel.source_signal_category}`,
      `Content Type: ${content?.contentCategory || 'unknown'}`,
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

    zip.file('content-summary.txt', summary);

    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });

    return new Response(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${headline}.zip"`,
      },
    });
  } catch (err) {
    console.error('[Download] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    );
  }
}
