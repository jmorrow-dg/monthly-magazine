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
import { buildEvidencePipeline } from '@/lib/evidence/build-evidence-pipeline';
import type { EvidencePackBundle, MagazineSectionName, SectionEvidencePack } from '@/lib/types/evidence';
import { extractAndStoreFacts } from '@/lib/evidence/extract-facts';
import { buildSectionEvidencePacksFromFacts, storeEvidencePacks } from '@/lib/evidence/build-section-evidence-packs';
import { storeSectionProvenance } from '@/lib/evidence/section-provenance';
import { extractAndStoreClaims } from '@/lib/evidence/extract-and-store-claims';
import { runIssueQA } from '@/lib/qa/run-issue-qa';
import { createQAReport } from '@/lib/supabase/queries';
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
    let evidenceBundle: EvidencePackBundle | undefined;

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

      // Build signal context for generation functions (fallback when no evidence pack)
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

      // Build evidence pipeline (section-specific evidence packs)
      try {
        evidenceBundle = await buildEvidencePipeline(
          signalFeed.signals,
          clusterResponse.clusters || [],
          trendResponse.trends || [],
          issueId,
          monthYear,
        );
        console.log(`Evidence pipeline completed in ${evidenceBundle.pipeline_duration_ms}ms`);
      } catch (evidenceError) {
        console.error('Evidence pipeline failed (falling back to signal context):', evidenceError);
        // Continue without evidence packs; generation functions will use signalContext
      }

      // Phase 5: Extract and store evidence facts (non-fatal)
      try {
        const storedFacts = await extractAndStoreFacts(signalFeed.signals);
        if (storedFacts.length > 0) {
          const packPayloads = buildSectionEvidencePacksFromFacts(storedFacts, issueId);
          await storeEvidencePacks(issueId, packPayloads);
          console.log(`Phase 5: stored ${storedFacts.length} evidence facts and ${packPayloads.length} section packs`);
        }
      } catch (phase5Error) {
        console.error('Phase 5 evidence fact extraction failed (non-fatal):', phase5Error);
      }

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

    // Helper to get section-specific evidence pack
    const getPack = (section: MagazineSectionName): SectionEvidencePack | undefined =>
      evidenceBundle?.section_packs[section];

    // Step 1: Generate cover story first (everything else depends on it)
    const coverStory = await generateCoverStory(sources, instructions, signalContext, getPack('cover_story'));

    // Step 2: Generate implications, enterprise, industry watch, and tools in parallel
    const [implications, enterprise, industryWatch, tools] = await Promise.all([
      generateImplications(coverStory, instructions, signalContext, getPack('implications')),
      generateEnterprise(coverStory, instructions, signalContext, getPack('enterprise')),
      generateIndustryWatch(sources, coverStory, instructions, signalContext, getPack('industry_watch')),
      generateTools(sources, instructions, signalContext, getPack('tools')),
    ]);

    // Step 3: Generate remaining sections in parallel
    const [playbooks, strategicSignals, briefingPrompts, executiveBriefing, aiNativeOrg, editorial, whyThisMatters, regionalSignals, globalLandscape] = await Promise.all([
      generatePlaybooks(coverStory, instructions, signalContext, getPack('playbooks')),
      generateStrategicSignals(coverStory, implications, instructions, signalContext, getPack('strategic_signals')),
      generateBriefingPrompts(coverStory, implications, instructions, signalContext, getPack('briefing_prompts')),
      generateExecutiveBriefing(coverStory, implications, instructions, signalContext, getPack('executive_briefing')),
      generateAiNativeOrg(coverStory, implications, issue.edition, instructions, signalContext, getPack('ai_native_org')),
      generateEditorial(coverStory, implications, monthName(issue.month), issue.edition, instructions, signalContext, getPack('editorial')),
      generateWhyThisMatters(coverStory, implications, instructions, signalContext, getPack('why_this_matters')),
      generateRegionalSignals(coverStory, implications.map(i => i.title).join(', '), instructions, signalContext, getPack('regional_signals')),
      generateGlobalLandscape(coverStory, instructions, signalContext, getPack('global_landscape')),
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
      // Store evidence bundle for provenance and QA
      if (evidenceBundle) {
        updateData.evidence_pack_bundle = evidenceBundle;
      }
    } else {
      updateData.generation_mode = 'sources';
    }

    const updated = await updateIssue(issueId, updateData);

    // Phase 5: Post-generation claim extraction and provenance (non-fatal)
    if (mode === 'signals' && updated) {
      try {
        await extractAndStoreClaims(issueId, updated);
        await storeSectionProvenance(issueId, evidenceBundle);
        console.log('Phase 5: stored claims and provenance');
      } catch (phase5PostError) {
        console.error('Phase 5 post-generation failed (non-fatal):', phase5PostError);
      }
    }

    // Auto-trigger QA pipeline (non-fatal)
    let qaReport = null;
    try {
      if (updated) {
        const report = await runIssueQA(updated);
        await createQAReport(report);
        await updateIssue(issueId, {
          qa_score: report.qa_score,
          qa_passed: report.qa_passed,
          qa_status: report.qa_status,
          citation_coverage_score: report.citation_coverage_score,
          unsupported_claim_count: report.unsupported_claim_count,
          structural_error_count: report.structural_error_count,
          editorial_violation_count: report.editorial_violation_count,
          numerical_mismatch_count: report.numerical_mismatch_count,
          reasoning_flag_count: report.reasoning_flag_count,
          qa_summary: report.summary,
          last_qa_run_at: new Date().toISOString(),
        } as Partial<Issue>);
        qaReport = { qa_score: report.qa_score, qa_passed: report.qa_passed };
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
