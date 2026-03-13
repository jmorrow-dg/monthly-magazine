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
import { renderBriefingPrompts } from '@/lib/templates/page-10-briefing-prompts';
import { renderIndustryWatch } from '@/lib/templates/page-08-industry-watch';
import { renderTools } from '@/lib/templates/page-09-tools';
import { renderPlaybooks } from '@/lib/templates/page-10-playbooks';
import { renderPlaybooksContinued } from '@/lib/templates/page-11-playbooks-continued';
import { renderStrategicSignals } from '@/lib/templates/page-12-strategic-signals';
import { renderWhyThisMatters } from '@/lib/templates/page-13-personalized-insight';
import { renderClosing } from '@/lib/templates/page-14-closing';
import { renderSectionDividerPage } from '@/lib/templates/page-section-divider';
import { renderAdoptionCurve } from '@/lib/templates/page-visual-adoption-curve';
import { renderCapabilityStack } from '@/lib/templates/page-visual-capability-stack';
import { renderAdoptionMap } from '@/lib/templates/page-visual-adoption-map';
import { renderTransformationPathway } from '@/lib/templates/page-visual-transformation-pathway';
import { renderGlobalLandscape } from '@/lib/templates/page-visual-global-landscape';
import { monthName, editionLabel as buildEditionLabel } from '@/lib/utils/format-date';
import { sanitiseDashes } from '@/lib/utils/sanitise-dashes';

type RouteContext = { params: Promise<{ issueId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { issueId } = await context.params;
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

    const coverStory = issue.cover_story_json;

    // 24-page structure (5 data storytelling visuals)
    const pages = [
      /* 1  */ renderCover({ headline: issue.cover_headline, subtitle: issue.cover_subtitle, editionLabel: label, coverImageUrl: issue.cover_image_url }),
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
      /* 16 */ renderBriefingPrompts({ items: issue.briefing_prompts_json || [] }),
      /* 17 */ renderIndustryWatch({ items: issue.industry_watch_json || [] }),
      /* 18 */ renderTools({ items: issue.tools_json || [] }),
      /* 19 */ renderSectionDividerPage({ title: 'Operator Playbooks' }),
      /* 20 */ renderPlaybooks({ items: issue.playbooks_json || [], pullQuote: coverStory?.pull_quotes?.[3] }),
      /* 21 */ renderTransformationPathway(),
      /* 22 */ renderPlaybooksContinued({ items: issue.playbooks_json || [] }),
      /* 23 */ renderStrategicSignals({ items: issue.strategic_signals_json || [] }),
      /* 24 */ renderClosing({ edition: issue.edition, month, year: issue.year, shareInsight: issue.cover_headline }),
    ];

    // Render-time punctuation sanitisation (catches old content too)
    const cleanPages = pages.map((html) => sanitiseDashes(html));

    // Support ?pages=1 or ?pages=1,2 to return only specific pages
    const { searchParams } = new URL(request.url);
    const pagesParam = searchParams.get('pages');

    if (pagesParam) {
      const requested = pagesParam.split(',').map(Number);
      const filtered = requested.map((p) => cleanPages[p - 1] || null);
      return NextResponse.json({ pages: filtered });
    }

    return NextResponse.json({
      pages: cleanPages,
      issue: {
        headline: issue.cover_headline,
        subtitle: issue.cover_subtitle,
        status: issue.status,
      },
    });
  } catch (error) {
    console.error('Failed to render issue:', error);
    return NextResponse.json({ error: 'Failed to render issue' }, { status: 500 });
  }
}
