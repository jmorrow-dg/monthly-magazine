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

type RouteContext = { params: Promise<{ issueId: string }> };

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

    const body = await request.json();
    const { sources, instructions } = body as { sources: string[]; instructions?: string };

    if (!sources || sources.length === 0) {
      return NextResponse.json({ error: 'At least one source is required' }, { status: 400 });
    }

    // Step 1: Generate cover story first (everything else depends on it)
    const coverStory = await generateCoverStory(sources, instructions);

    // Step 2: Generate implications, enterprise, industry watch, and tools in parallel
    const [implications, enterprise, industryWatch, tools] = await Promise.all([
      generateImplications(coverStory, instructions),
      generateEnterprise(coverStory, instructions),
      generateIndustryWatch(sources, coverStory, instructions),
      generateTools(sources, instructions),
    ]);

    // Step 3: Generate playbooks, strategic signals, briefing prompts, executive briefing, editorial, why this matters, regional signals, and global landscape in parallel
    const [playbooks, strategicSignals, briefingPrompts, executiveBriefing, aiNativeOrg, editorial, whyThisMatters, regionalSignals, globalLandscape] = await Promise.all([
      generatePlaybooks(coverStory, instructions),
      generateStrategicSignals(coverStory, implications, instructions),
      generateBriefingPrompts(coverStory, implications, instructions),
      generateExecutiveBriefing(coverStory, implications, instructions),
      generateAiNativeOrg(coverStory, implications, issue.edition, instructions),
      generateEditorial(coverStory, implications, monthName(issue.month), issue.edition, instructions),
      generateWhyThisMatters(coverStory, implications, instructions),
      generateRegionalSignals(coverStory, implications.map(i => i.title).join(', '), instructions),
      generateGlobalLandscape(coverStory, instructions),
    ]);

    // Post-generation: sanitise all dash characters
    const updated = await updateIssue(issueId, {
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
    });

    return NextResponse.json({ issue: updated });
  } catch (error) {
    console.error('AI generation failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 },
    );
  }
}
