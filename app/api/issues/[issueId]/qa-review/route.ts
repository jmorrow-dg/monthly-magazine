import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getIssue, updateIssue, createQAReport } from '@/lib/supabase/queries';
import { runIssueQA } from '@/lib/qa/run-issue-qa';
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

    // Run the full QA pipeline
    const report = await runIssueQA(issue);

    // Store the report in the database
    const savedReport = await createQAReport(report);

    // Update issue summary fields
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
