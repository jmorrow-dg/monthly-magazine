import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getIssue } from '@/lib/supabase/queries';
import { renderCover } from '@/lib/templates/page-01-cover';
import { renderEditorial } from '@/lib/templates/page-02-editorial';
import { renderExecutiveBriefing } from '@/lib/templates/page-03-executive-briefing';
import { renderCoverStoryIntro } from '@/lib/templates/page-03-cover-story-intro';
import { renderCoverStoryAnalysis } from '@/lib/templates/page-04-cover-story-analysis';
import { renderCoverStoryImplications } from '@/lib/templates/page-05-cover-story-implications';
import { renderImplications } from '@/lib/templates/page-06-strategic-implications';
import { renderEnterprise } from '@/lib/templates/page-07-enterprise';
import { renderAiNativeOrg } from '@/lib/templates/page-10-ai-native-org';
import { renderBriefingAndTools } from '@/lib/templates/page-10-briefing-prompts';
import { renderIndustryWatch } from '@/lib/templates/page-08-industry-watch';
import { renderPlaybooks } from '@/lib/templates/page-10-playbooks';
import { renderStrategicSignals } from '@/lib/templates/page-12-strategic-signals';
import { renderWhyThisMatters } from '@/lib/templates/page-13-personalized-insight';
import { renderClosing } from '@/lib/templates/page-14-closing';
import { renderSectionDividerPage } from '@/lib/templates/page-section-divider';
import { renderAdoptionCurve } from '@/lib/templates/page-visual-adoption-curve';
import { renderCapabilityStack } from '@/lib/templates/page-visual-capability-stack';
import { renderAdoptionMap } from '@/lib/templates/page-visual-adoption-map';
import { renderTransformationPathway } from '@/lib/templates/page-visual-transformation-pathway';
import { renderGlobalLandscape } from '@/lib/templates/page-visual-global-landscape';
import {
  renderWeeklyCover,
  renderWeeklyContentsEditorial,
  renderWeeklyLeadStory,
  renderWeeklyKeySignals,
  renderWeeklyImplications,
  renderWeeklyEnterpriseIndustry,
  renderWeeklyExecutiveBriefing,
  renderWeeklyOperatorsToolkit,
  renderWeeklyStrategicOutlook,
  renderWeeklyClosing,
} from '@/lib/templates/weekly';
import { monthName, editionLabel as buildEditionLabel } from '@/lib/utils/format-date';
import { sanitiseDashes } from '@/lib/utils/sanitise-dashes';
import type { Issue } from '@/lib/types/issue';

type RouteContext = { params: Promise<{ issueId: string }> };

// In-memory render cache. Draft pages expire after 30s so edits appear quickly.
// Published pages are cached indefinitely (server restart clears).
const renderCache = new Map<string, { body: object; status: string; ts: number }>();
const DRAFT_TTL_MS = 30_000;

export async function GET(request: Request, context: RouteContext) {
  try {
    const { issueId } = await context.params;

    // Check in-memory cache first (skip for partial ?pages= requests)
    const { searchParams } = new URL(request.url);
    const pagesParam = searchParams.get('pages');
    const cached = renderCache.get(issueId);
    if (cached && !pagesParam) {
      const stale = cached.status !== 'published' && Date.now() - cached.ts > DRAFT_TTL_MS;
      if (!stale) {
        const cacheControl =
          cached.status === 'published'
            ? 'public, max-age=3600, stale-while-revalidate=86400'
            : 'private, max-age=5, stale-while-revalidate=30';
        return NextResponse.json(cached.body, {
          headers: { 'Cache-Control': cacheControl, 'X-Render-Cache': 'HIT' },
        });
      }
    }

    const issue = await getIssue(issueId);

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    const authenticated = await isAuthenticated();

    // Public users can only view published issues; admin can view all except archived
    if (!authenticated && issue.status !== 'published') {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    if (issue.status === 'archived') {
      return NextResponse.json({ error: 'Issue not available' }, { status: 404 });
    }

    const month = monthName(issue.month);
    const label = issue.cover_edition_label || buildEditionLabel(issue.edition, issue.month, issue.year);

    const pages = issue.format === 'weekly'
      ? renderWeeklyPages(issue, label)
      : renderMonthlyPages(issue, month, label);

    // Render-time punctuation sanitisation (catches old content too)
    const cleanPages = pages.map((html) => sanitiseDashes(html));

    // Support ?pages=1 or ?pages=1,2 to return only specific pages
    if (pagesParam) {
      const requested = pagesParam.split(',').map(Number);
      const filtered = requested.map((p) => cleanPages[p - 1] || null);
      return NextResponse.json({ pages: filtered });
    }

    const body = {
      pages: cleanPages,
      issue: {
        headline: issue.cover_headline,
        subtitle: issue.cover_subtitle,
        status: issue.status,
        format: issue.format || 'monthly',
      },
    };

    // Store in memory cache
    renderCache.set(issueId, { body, status: issue.status, ts: Date.now() });

    // Published issues are immutable: cache aggressively at browser + CDN level.
    // Draft/review issues get a short stale-while-revalidate window so edits
    // show up quickly but repeat loads within a few seconds hit the cache.
    const cacheControl =
      issue.status === 'published'
        ? 'public, max-age=3600, stale-while-revalidate=86400'
        : 'private, max-age=5, stale-while-revalidate=30';

    return NextResponse.json(body, {
      headers: { 'Cache-Control': cacheControl, 'X-Render-Cache': 'MISS' },
    });
  } catch (error) {
    console.error('Failed to render issue:', error);
    return NextResponse.json({ error: 'Failed to render issue' }, { status: 500 });
  }
}

// ── Monthly/Quarterly page assembly (22 pages) ──────────────────

function renderMonthlyPages(issue: Issue, month: string, label: string): string[] {
  const coverStory = issue.cover_story_json;

  return [
    /* 1  */ renderCover({
      headline: issue.cover_headline,
      subtitle: issue.cover_subtitle,
      editionLabel: label,
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
    /* 2  */ renderEditorial({ note: issue.editorial_note || '', month, edition: issue.edition }),
    /* 3  */ renderExecutiveBriefing({ items: issue.executive_briefing_json || [], coverHeadline: issue.cover_headline }),
    /* 4  */ renderGlobalLandscape({ regions: issue.global_landscape_json?.regions }),
    /* 5  */ renderWhyThisMatters({ content: issue.why_this_matters || '' }),
    /* 6  */ renderSectionDividerPage({ title: 'Cover Story', subtitle: issue.cover_headline }),
    /* 7  */ renderCoverStoryIntro({
      headline: coverStory?.headline || issue.cover_headline,
      subheadline: coverStory?.subheadline || '',
      introduction: coverStory?.introduction || '',
      pullQuote: coverStory?.pull_quotes?.[0],
    }),
    /* 8  */ renderCoverStoryAnalysis({
      analysis: coverStory?.analysis || '',
      pullQuotes: coverStory?.pull_quotes?.slice(1, 3) || [],
    }),
    /* 9  */ renderCoverStoryImplications({
      strategicImplications: coverStory?.strategic_implications || '',
      pullQuotes: coverStory?.pull_quotes?.slice(3, 5) || [],
      evidence: coverStory?.evidence,
    }),
    /* 10 */ renderImplications({ items: issue.implications_json || [], pullQuote: coverStory?.pull_quotes?.[4], regionalSignals: issue.regional_signals_json?.implications }),
    /* 11 */ renderAdoptionCurve(),
    /* 12 */ renderAiNativeOrg({ data: issue.ai_native_org_json || null }),
    /* 13 */ renderCapabilityStack(),
    /* 14 */ renderEnterprise({ items: issue.enterprise_json || [], pullQuote: coverStory?.pull_quotes?.[5], regionalSignals: issue.regional_signals_json?.enterprise }),
    /* 15 */ renderAdoptionMap(),
    /* 16 */ renderBriefingAndTools({ items: issue.briefing_prompts_json || [], tools: issue.tools_json || [] }),
    /* 17 */ renderIndustryWatch({ items: issue.industry_watch_json || [] }),
    /* 18 */ renderSectionDividerPage({ title: 'Operator Playbooks' }),
    /* 19 */ renderPlaybooks({ items: issue.playbooks_json || [], pullQuote: coverStory?.pull_quotes?.[3] }),
    /* 20 */ renderTransformationPathway(),
    /* 21 */ renderStrategicSignals({ items: issue.strategic_signals_json || [] }),
    /* 22 */ renderClosing({ edition: issue.edition, month, year: issue.year, shareInsight: issue.cover_headline }),
  ];
}

// ── Weekly page assembly (10 pages) ─────────────────────────────

function renderWeeklyPages(issue: Issue, label: string): string[] {
  const weekRange = issue.week_start && issue.week_end
    ? `${formatWeekDate(issue.week_start)} - ${formatWeekDate(issue.week_end)}`
    : monthName(issue.month) + ' ' + issue.year;

  const coverStory = issue.cover_story_json;
  const leadBody = coverStory
    ? [coverStory.introduction, coverStory.analysis].filter(Boolean).join('\n\n')
    : '';

  // Collect regional signals for outlook page
  const allRegionalSignals = [
    ...(issue.regional_signals_json?.implications || []),
    ...(issue.regional_signals_json?.enterprise || []),
  ];

  return [
    /* 1  */ renderWeeklyCover({
      headline: issue.cover_headline,
      subtitle: issue.cover_subtitle,
      editionLabel: label,
      weekRange,
      coverImageUrl: issue.cover_image_url,
    }),
    /* 2  */ renderWeeklyContentsEditorial({
      editorial: issue.editorial_note || '',
      weekRange,
      edition: issue.edition,
    }),
    /* 3  */ renderWeeklyLeadStory({
      headline: coverStory?.headline || issue.cover_headline,
      subheadline: coverStory?.subheadline,
      body: leadBody,
      pullQuote: coverStory?.pull_quotes?.[0],
    }),
    /* 4  */ renderWeeklyKeySignals({
      items: (issue.strategic_signals_json || []).slice(0, 5).map(s => ({
        headline: s.signal,
        summary: s.context,
        category: 'AI Strategy',
        source_signal: s.source_signal,
      })),
    }),
    /* 5  */ renderWeeklyImplications({
      items: issue.implications_json || [],
      pullQuote: coverStory?.pull_quotes?.[1],
    }),
    /* 6  */ renderWeeklyEnterpriseIndustry({
      enterprise: issue.enterprise_json || [],
      industryWatch: issue.industry_watch_json || [],
    }),
    /* 7  */ renderWeeklyExecutiveBriefing({
      items: issue.executive_briefing_json || [],
    }),
    /* 8  */ renderWeeklyOperatorsToolkit({
      playbook: issue.playbooks_json?.[0] || null,
      tools: issue.tools_json || [],
      prompts: issue.briefing_prompts_json || [],
    }),
    /* 9  */ renderWeeklyStrategicOutlook({
      signals: issue.strategic_signals_json || [],
      regionalSignals: allRegionalSignals.slice(0, 3),
    }),
    /* 10 */ renderWeeklyClosing({
      edition: issue.edition,
      weekRange,
      year: issue.year,
    }),
  ];
}

function formatWeekDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}
