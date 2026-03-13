import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getIssue, updateIssue } from '@/lib/supabase/queries';
import { monthName } from '@/lib/utils/format-date';
import { sanitiseDashes, sanitiseDashesDeep } from '@/lib/utils/sanitise-dashes';
import {
  generateCoverStory,
  generateImplications,
  generateEnterprise,
  generateIndustryWatch,
  generateTools,
  generatePlaybooks,
  generateStrategicSignals,
  generateBriefingPrompts,
  generateExecutiveBriefing,
  generateAiNativeOrg,
  generateEditorial,
  generateWhyThisMatters,
  generateRegionalSignals,
  generateGlobalLandscape,
} from '@/lib/ai/generate-content';
import { fetchMonthlySignals } from '@/lib/intelligence/fetch-signals';
import { fetchMonthlyClusters, findCoverStoryCluster } from '@/lib/intelligence/fetch-clusters';
import { fetchMonthlyTrends, findTopTrend } from '@/lib/intelligence/fetch-trends';
import type { SignalContext } from '@/lib/intelligence/types';
import { runQAPipeline } from '@/lib/qa/pipeline';
import { createQAReport } from '@/lib/supabase/queries';
import type { QACheckInput, SourceSignalSummary } from '@/lib/types/qa';
import type { Issue } from '@/lib/types/issue';

export const maxDuration = 300;

type RouteContext = { params: Promise<{ issueId: string }> };

type RequestBody =
  | { mode?: 'sources'; sources: string[]; instructions?: string }
  | { mode: 'signals'; monthYear: string; instructions?: string };

export async function POST(request: Request, context: RouteContext) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  try {
    const { issueId } = await context.params;
    const issue = await getIssue(issueId);

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    const body = (await request.json()) as RequestBody;
    const instructions = body.instructions;

    // Determine generation mode
    const mode = body.mode || 'sources';

    let sources: string[] = [];
    let signalContext: SignalContext | undefined;
    let sourceSignalIds: string[] | undefined;
    let sourceClusterIds: string[] | undefined;
    let sourceTrendIds: string[] | undefined;

    if (mode === 'signals') {
      const { monthYear } = body as { monthYear: string };
      if (!monthYear || !/^\d{4}-\d{2}$/.test(monthYear)) {
        return NextResponse.json(
          { error: 'monthYear is required in YYYY-MM format for signals mode' },
          { status: 400 },
        );
      }

      // Fetch scored signals, clusters, and trends from the Intelligence Hub
      const [signalFeed, clusterResponse, trendResponse] = await Promise.all([
        fetchMonthlySignals(monthYear),
        fetchMonthlyClusters(monthYear).catch(() => ({ success: false, clusters: [], total: 0, month_year: monthYear })),
        fetchMonthlyTrends(monthYear).catch(() => ({ success: false, trends: [], total: 0, month_year: monthYear })),
      ]);

      if (!signalFeed.signals || signalFeed.signals.length === 0) {
        return NextResponse.json(
          { error: `No scored signals found for ${monthYear}. Ensure signals have been captured and scored in the Intelligence Hub.` },
          { status: 404 },
        );
      }

      // Find the cover story cluster or top trend
      const coverCluster = findCoverStoryCluster(clusterResponse.clusters || []);
      const topTrend = findTopTrend(trendResponse.trends || []);

      // Build signal context for generation functions
      // Prefer trend data over cluster data when available (richer context)
      signalContext = {
        signals: signalFeed.signals.map((s) => ({
          title: s.title,
          summary: s.summary,
          why_it_matters: s.why_it_matters || '',
          category: s.category,
          composite_score: s.composite_score ?? 0,
          source: s.source,
          source_url: s.source_url || '',
          company: s.company || null,
          practical_implication: s.practical_implication || null,
        })),
        cluster: topTrend
          ? {
              title: topTrend.title,
              theme: topTrend.description,
              narrative_summary: [
                topTrend.strategic_summary,
                topTrend.implication_for_operators,
              ].filter(Boolean).join(' '),
            }
          : coverCluster
            ? {
                title: coverCluster.title,
                theme: coverCluster.theme,
                narrative_summary: coverCluster.narrative_summary || '',
              }
            : undefined,
        trends: (trendResponse.trends || []).map((t) => ({
          title: t.title,
          description: t.description,
          strategic_summary: t.strategic_summary || '',
          implication_for_operators: t.implication_for_operators || '',
          region_scope: t.region_scope,
          sector_scope: t.sector_scope,
          confidence_score: t.confidence_score ?? 0,
        })),
      };

      // Track source IDs for provenance
      sourceSignalIds = signalFeed.signals.map((s) => s.id);
      sourceClusterIds = (clusterResponse.clusters || []).map((c) => c.id);
      sourceTrendIds = (trendResponse.trends || []).map((t) => t.id);

      // Use source URLs as fallback sources array (for any functions that need it)
      sources = signalFeed.signals
        .filter((s): s is typeof s & { source_url: string } => !!s.source_url)
        .map((s) => s.source_url);
    } else {
      // Original sources mode
      const { sources: rawSources } = body as { sources: string[] };
      if (!rawSources || rawSources.length === 0) {
        return NextResponse.json({ error: 'At least one source is required' }, { status: 400 });
      }
      sources = rawSources;
    }

    // Step 1: Generate cover story first (everything else depends on it)
    const coverStory = await generateCoverStory(sources, instructions, signalContext);

    // Step 2: Generate implications, enterprise, industry watch, and tools in parallel
    const [implications, enterprise, industryWatch, tools] = await Promise.all([
      generateImplications(coverStory, instructions, signalContext),
      generateEnterprise(coverStory, instructions, signalContext),
      generateIndustryWatch(sources, coverStory, instructions, signalContext),
      generateTools(sources, instructions, signalContext),
    ]);

    // Step 3: Generate remaining sections in parallel
    const [playbooks, strategicSignals, briefingPrompts, executiveBriefing, aiNativeOrg, editorial, whyThisMatters, regionalSignals, globalLandscape] = await Promise.all([
      generatePlaybooks(coverStory, instructions, signalContext),
      generateStrategicSignals(coverStory, implications, instructions, signalContext),
      generateBriefingPrompts(coverStory, implications, instructions, signalContext),
      generateExecutiveBriefing(coverStory, implications, instructions, signalContext),
      generateAiNativeOrg(coverStory, implications, issue.edition, instructions, signalContext),
      generateEditorial(coverStory, implications, monthName(issue.month), issue.edition, instructions, signalContext),
      generateWhyThisMatters(coverStory, implications, instructions, signalContext),
      generateRegionalSignals(coverStory, implications.map(i => i.title).join(', '), instructions, signalContext),
      generateGlobalLandscape(coverStory, instructions, signalContext),
    ]);

    // Post-generation: sanitise all dash characters and save
    const updateData: Record<string, unknown> = {
      cover_story_json: sanitiseDashesDeep(coverStory),
      implications_json: sanitiseDashesDeep(implications),
      enterprise_json: sanitiseDashesDeep(enterprise),
      industry_watch_json: sanitiseDashesDeep(industryWatch),
      tools_json: sanitiseDashesDeep(tools),
      playbooks_json: sanitiseDashesDeep(playbooks),
      strategic_signals_json: sanitiseDashesDeep(strategicSignals),
      briefing_prompts_json: sanitiseDashesDeep(briefingPrompts),
      executive_briefing_json: sanitiseDashesDeep(executiveBriefing),
      ai_native_org_json: sanitiseDashesDeep(aiNativeOrg),
      editorial_note: sanitiseDashes(editorial),
      why_this_matters: sanitiseDashes(whyThisMatters),
      global_landscape_json: sanitiseDashesDeep({ regions: globalLandscape }),
      regional_signals_json: sanitiseDashesDeep(regionalSignals),
    };

    // Store provenance data when using signals mode
    if (mode === 'signals') {
      updateData.generation_mode = 'signals';
      updateData.source_signal_ids = sourceSignalIds;
      updateData.source_cluster_ids = sourceClusterIds;
      updateData.source_trend_ids = sourceTrendIds;
    } else {
      updateData.generation_mode = 'sources';
    }

    const updated = await updateIssue(issueId, updateData);

    // Auto-trigger QA pipeline (non-fatal)
    let qaReport = null;
    try {
      if (updated) {
        // Build source signals for grounding checks
        const sourceSignals: SourceSignalSummary[] = signalContext
          ? signalContext.signals.map((s) => ({
              id: '',
              title: s.title,
              summary: s.summary,
              why_it_matters: s.why_it_matters || null,
              company: s.company || null,
              category: s.category,
              source: s.source,
              source_url: s.source_url || null,
              practical_implication: s.practical_implication || null,
            }))
          : [];

        const qaInput: QACheckInput = {
          issue_id: issueId,
          cover_story: updated.cover_story_json as Record<string, unknown> | null,
          implications: (updated.implications_json || []) as unknown as Record<string, unknown>[],
          enterprise: (updated.enterprise_json || []) as unknown as Record<string, unknown>[],
          industry_watch: (updated.industry_watch_json || []) as unknown as Record<string, unknown>[],
          tools: (updated.tools_json || []) as unknown as Record<string, unknown>[],
          playbooks: (updated.playbooks_json || []) as unknown as Record<string, unknown>[],
          strategic_signals: (updated.strategic_signals_json || []) as unknown as Record<string, unknown>[],
          briefing_prompts: (updated.briefing_prompts_json || []) as unknown as Record<string, unknown>[],
          executive_briefing: (updated.executive_briefing_json || []) as unknown as Record<string, unknown>[],
          ai_native_org: updated.ai_native_org_json as Record<string, unknown> | null,
          editorial_note: updated.editorial_note,
          why_this_matters: updated.why_this_matters,
          executive_summary: updated.executive_summary,
          beehiiv_summary: updated.beehiiv_summary,
          welcome_email_snippet: updated.welcome_email_snippet,
          linkedin_snippets: (updated.linkedin_snippets || null) as Record<string, unknown>[] | null,
          source_signals: sourceSignals,
        };

        const report = await runQAPipeline(qaInput);
        await createQAReport(report);
        await updateIssue(issueId, {
          qa_score: report.qa_score,
          qa_passed: report.passed,
          last_qa_run_at: new Date().toISOString(),
        } as Partial<Issue>);
        qaReport = { qa_score: report.qa_score, qa_passed: report.passed };
      }
    } catch (qaError) {
      console.error('QA auto-trigger failed (non-fatal):', qaError);
    }

    return NextResponse.json({ issue: updated, mode, qa: qaReport });
  } catch (error) {
    console.error('AI generation failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 },
    );
  }
}
