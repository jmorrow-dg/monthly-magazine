import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getIssue, updateIssue, createQAReport } from '@/lib/supabase/queries';
import { runQAPipeline } from '@/lib/qa/pipeline';
import type { QACheckInput, SourceSignalSummary } from '@/lib/types/qa';
import type { Issue } from '@/lib/types/issue';

export const maxDuration = 120;

type RouteContext = { params: Promise<{ issueId: string }> };

export async function POST(_request: Request, context: RouteContext) {
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

    // Build QA check input from issue data
    const qaInput = buildQAInput(issue);

    // Run the full QA pipeline
    const report = await runQAPipeline(qaInput);

    // Store the report in the database
    const savedReport = await createQAReport(report);

    // Update issue summary fields
    await updateIssue(issueId, {
      qa_score: report.qa_score,
      qa_passed: report.passed,
      last_qa_run_at: new Date().toISOString(),
    } as Partial<Issue>);

    return NextResponse.json({
      success: true,
      report: savedReport,
    });
  } catch (error) {
    console.error('QA review failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'QA review failed' },
      { status: 500 },
    );
  }
}

function buildQAInput(issue: Issue): QACheckInput {
  // Build source signals from provenance (if available)
  // For now, source signals are empty unless fetched
  // The pipeline handles this gracefully (awards full grounding points when no signals)
  const sourceSignals: SourceSignalSummary[] = [];

  return {
    issue_id: issue.id,
    cover_story: issue.cover_story_json as Record<string, unknown> | null,
    implications: (issue.implications_json || []) as unknown as Record<string, unknown>[],
    enterprise: (issue.enterprise_json || []) as unknown as Record<string, unknown>[],
    industry_watch: (issue.industry_watch_json || []) as unknown as Record<string, unknown>[],
    tools: (issue.tools_json || []) as unknown as Record<string, unknown>[],
    playbooks: (issue.playbooks_json || []) as unknown as Record<string, unknown>[],
    strategic_signals: (issue.strategic_signals_json || []) as unknown as Record<string, unknown>[],
    briefing_prompts: (issue.briefing_prompts_json || []) as unknown as Record<string, unknown>[],
    executive_briefing: (issue.executive_briefing_json || []) as unknown as Record<string, unknown>[],
    ai_native_org: issue.ai_native_org_json as Record<string, unknown> | null,
    editorial_note: issue.editorial_note,
    why_this_matters: issue.why_this_matters,
    executive_summary: issue.executive_summary,
    beehiiv_summary: issue.beehiiv_summary,
    welcome_email_snippet: issue.welcome_email_snippet,
    linkedin_snippets: (issue.linkedin_snippets || null) as Record<string, unknown>[] | null,
    source_signals: sourceSignals,
  };
}
