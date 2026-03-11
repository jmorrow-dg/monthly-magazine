import { PDFDocument } from 'pdf-lib';
import { launchBrowser, closeBrowser } from './browser';
import { renderCover } from '@/lib/templates/page-01-cover';
import { renderEditorial } from '@/lib/templates/page-02-editorial';
import { renderDevelopments } from '@/lib/templates/page-03-developments';
import { renderImplications } from '@/lib/templates/page-04-implications';
import { renderEnterprise } from '@/lib/templates/page-05-enterprise';
import { renderTools } from '@/lib/templates/page-06-tools';
import { renderPlaybooks } from '@/lib/templates/page-07-playbooks';
import { renderClosing } from '@/lib/templates/page-08-closing';
import { monthName } from '@/lib/utils/format-date';
import type { Issue } from '@/lib/types/issue';

const PAGE_NAMES = [
  'Cover',
  'Editorial Notes',
  'Major AI Developments',
  'Strategic Implications',
  'Enterprise AI Adoption',
  'Tools Worth Watching',
  'Operator Playbooks',
  'Closing',
];

export async function generateMagazinePdf(issue: Issue): Promise<Uint8Array> {
  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();

    const month = monthName(issue.month);
    const editionLabel = issue.cover_edition_label || `Edition ${String(issue.edition).padStart(2, '0')} | ${month} ${issue.year}`;

    const pageHtmls = [
      renderCover({
        headline: issue.cover_headline,
        subtitle: issue.cover_subtitle,
        editionLabel,
        coverImageUrl: issue.cover_image_url,
      }),
      renderEditorial({
        note: issue.editorial_note || '',
        month,
        edition: issue.edition,
      }),
      renderDevelopments({ items: issue.developments_json || [] }),
      renderImplications({ items: issue.implications_json || [] }),
      renderEnterprise({ items: issue.enterprise_json || [] }),
      renderTools({ items: issue.tools_json || [] }),
      renderPlaybooks({ items: issue.playbooks_json || [] }),
      renderClosing({
        edition: issue.edition,
        month,
        year: issue.year,
      }),
    ];

    const pdfBuffers: Uint8Array[] = [];

    for (let i = 0; i < pageHtmls.length; i++) {
      try {
        await page.setContent(pageHtmls[i], {
          waitUntil: 'domcontentloaded',
          timeout: 15000,
        });

        await Promise.race([
          page.evaluate(() => document.fonts.ready),
          new Promise((resolve) => setTimeout(resolve, 5000)),
        ]);

        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          preferCSSPageSize: false,
          margin: { top: 0, right: 0, bottom: 0, left: 0 },
        });

        pdfBuffers.push(new Uint8Array(pdfBuffer));
      } catch (pageError) {
        const pageName = PAGE_NAMES[i] || `Page ${i + 1}`;
        console.error(`PDF rendering failed for ${pageName}:`, pageError);
        throw new Error(
          `Failed to render ${pageName}: ${pageError instanceof Error ? pageError.message : String(pageError)}`
        );
      }
    }

    await page.close();

    const mergedDoc = await PDFDocument.create();

    for (const buffer of pdfBuffers) {
      const donor = await PDFDocument.load(buffer);
      const [copiedPage] = await mergedDoc.copyPages(donor, [0]);
      mergedDoc.addPage(copiedPage);
    }

    return mergedDoc.save();
  } finally {
    await closeBrowser().catch((err) => {
      console.error('Failed to close browser:', err);
    });
  }
}
