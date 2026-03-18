import { PDFDocument } from 'pdf-lib';
import { launchBrowser, closeBrowser } from './browser';
import { renderCover } from '@/lib/templates/page-01-cover';
import { renderEditorial } from '@/lib/templates/page-02-editorial';
import { renderExecutiveBriefing } from '@/lib/templates/page-03-executive-briefing';
import { renderCoverStoryIntro } from '@/lib/templates/page-03-cover-story-intro';
import { renderCoverStoryAnalysis } from '@/lib/templates/page-04-cover-story-analysis';
import { renderCoverStoryImplications } from '@/lib/templates/page-05-cover-story-implications';
import { renderImplications } from '@/lib/templates/page-06-strategic-implications';
import { renderEnterprise } from '@/lib/templates/page-07-enterprise';
import { renderAiNativeOrg } from '@/lib/templates/page-10-ai-native-org';
import { renderBriefingPrompts } from '@/lib/templates/page-10-briefing-prompts';
import { renderIndustryWatch } from '@/lib/templates/page-08-industry-watch';
import { renderTools } from '@/lib/templates/page-09-tools';
import { renderPlaybooks } from '@/lib/templates/page-10-playbooks';
import { renderPlaybooksContinued } from '@/lib/templates/page-11-playbooks-continued';
import { renderStrategicSignals } from '@/lib/templates/page-12-strategic-signals';
import { renderWhyThisMatters } from '@/lib/templates/page-13-personalized-insight';
import { renderClosing } from '@/lib/templates/page-14-closing';
import { renderSectionDividerPage } from '@/lib/templates/page-section-divider';
import { monthName } from '@/lib/utils/format-date';
import { sanitiseDashes } from '@/lib/utils/sanitise-dashes';
import type { Issue } from '@/lib/types/issue';

const PAGE_NAMES = [
  'Cover',
  'Editorial Notes',
  'Executive Briefing',
  'Why This Matters',
  'Cover Story Divider',
  'Cover Story',
  'Cover Story Analysis',
  'Cover Story Implications',
  'Strategic Implications',
  'AI Native Organisation',
  'Enterprise AI Adoption',
  'Operator Briefing Prompts',
  'Industry Watch',
  'Tools Worth Watching',
  'Playbooks Divider',
  'Operator Playbooks',
  'More Playbooks',
  'Strategic Signals',
  'Closing',
];

async function renderPageToPdf(
  page: Awaited<ReturnType<Awaited<ReturnType<typeof launchBrowser>>['newPage']>>,
  html: string,
  pageName: string,
): Promise<Uint8Array> {
  try {
    await page.setContent(html, {
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

    return new Uint8Array(pdfBuffer);
  } catch (pageError) {
    console.error(`PDF rendering failed for ${pageName}:`, pageError);
    throw new Error(
      `Failed to render ${pageName}: ${pageError instanceof Error ? pageError.message : String(pageError)}`,
    );
  }
}

function buildPageHtmls(issue: Issue): string[] {
  const month = monthName(issue.month);
  const editionLabel =
    issue.cover_edition_label || `Edition ${String(issue.edition).padStart(2, '0')} | ${month} ${issue.year}`;
  const coverStory = issue.cover_story_json;

  const pages = [
    /* 1  */ renderCover({
      headline: issue.cover_headline,
      subtitle: issue.cover_subtitle,
      editionLabel,
      coverImageUrl: issue.cover_image_url,
      teaserSections: [
        'Executive Briefing',
        'Cover Story Analysis',
        'Strategic Implications',
        'Industry Watch',
        'Operator Playbooks',
        'Strategic Signals',
      ],
    }),
    /* 2  */ renderEditorial({
      note: issue.editorial_note || '',
      month,
      edition: issue.edition,
    }),
    /* 3  */ renderExecutiveBriefing({ items: issue.executive_briefing_json || [] }),
    /* 4  */ renderWhyThisMatters({
      content: issue.why_this_matters || '',
    }),
    /* 5  */ renderSectionDividerPage({ title: 'Cover Story' }),
    /* 6  */ renderCoverStoryIntro({
      headline: coverStory?.headline || issue.cover_headline,
      subheadline: coverStory?.subheadline || '',
      introduction: coverStory?.introduction || '',
      pullQuote: coverStory?.pull_quotes?.[0],
    }),
    /* 7  */ renderCoverStoryAnalysis({
      analysis: coverStory?.analysis || '',
      pullQuotes: coverStory?.pull_quotes?.slice(1, 3) || [],
    }),
    /* 8  */ renderCoverStoryImplications({
      strategicImplications: coverStory?.strategic_implications || '',
      pullQuotes: coverStory?.pull_quotes?.slice(3, 5) || [],
    }),
    /* 9  */ renderImplications({ items: issue.implications_json || [], pullQuote: coverStory?.pull_quotes?.[4] }),
    /* 10 */ renderAiNativeOrg({ data: issue.ai_native_org_json || null }),
    /* 11 */ renderEnterprise({ items: issue.enterprise_json || [], pullQuote: coverStory?.pull_quotes?.[5] }),
    /* 12 */ renderBriefingPrompts({ items: issue.briefing_prompts_json || [] }),
    /* 13 */ renderIndustryWatch({ items: issue.industry_watch_json || [] }),
    /* 14 */ renderTools({ items: issue.tools_json || [] }),
    /* 15 */ renderSectionDividerPage({ title: 'Operator Playbooks' }),
    /* 16 */ renderPlaybooks({ items: issue.playbooks_json || [], pullQuote: coverStory?.pull_quotes?.[3] }),
    /* 17 */ renderPlaybooksContinued({ items: issue.playbooks_json || [] }),
    /* 18 */ renderStrategicSignals({ items: issue.strategic_signals_json || [] }),
    /* 19 */ renderClosing({
      edition: issue.edition,
      month,
      year: issue.year,
    }),
  ];

  // Apply the same render-time dash sanitisation used by the viewer route
  return pages.map((html) => sanitiseDashes(html));
}

export async function generateStandardPdf(issue: Issue): Promise<Uint8Array> {
  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();
    const pageHtmls = buildPageHtmls(issue);
    const pdfBuffers: Uint8Array[] = [];

    for (let i = 0; i < pageHtmls.length; i++) {
      const buffer = await renderPageToPdf(page, pageHtmls[i], PAGE_NAMES[i] || `Page ${i + 1}`);
      pdfBuffers.push(buffer);
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

// Backward-compatible alias
export const generateMagazinePdf = generateStandardPdf;
