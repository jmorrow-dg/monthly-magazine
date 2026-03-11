import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getIssue, updateIssue, deleteIssue, getIssuePages } from '@/lib/supabase/queries';
import { updateIssueSchema } from '@/lib/schemas/issue.schema';
import { isValidTransition, getTransitionError } from '@/lib/utils/status-transitions';
import type { IssueStatus } from '@/lib/types/issue';

type RouteContext = { params: Promise<{ issueId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { issueId } = await context.params;
    const issue = await getIssue(issueId);

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    const authenticated = await isAuthenticated();

    // Public users can only see published issues
    if (!authenticated && issue.status !== 'published') {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    const pages = await getIssuePages(issueId);

    return NextResponse.json({ issue, pages });
  } catch (error) {
    console.error('Failed to fetch issue:', error);
    return NextResponse.json({ error: 'Failed to fetch issue' }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  try {
    const { issueId } = await context.params;
    const body = await request.json();
    const parsed = updateIssueSchema.parse(body);

    // Validate status transitions
    if (parsed.status) {
      const currentIssue = await getIssue(issueId);
      if (!currentIssue) {
        return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
      }

      if (!isValidTransition(currentIssue.status as IssueStatus, parsed.status as IssueStatus)) {
        return NextResponse.json(
          { error: getTransitionError(currentIssue.status as IssueStatus, parsed.status as IssueStatus) },
          { status: 400 }
        );
      }

      // Set published_at when transitioning to published
      if (parsed.status === 'published') {
        (parsed as Record<string, unknown>).published_at = new Date().toISOString();
      }
    }

    const issue = await updateIssue(issueId, parsed);
    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    return NextResponse.json({ issue });
  } catch (error) {
    console.error('Failed to update issue:', error);
    const message = error instanceof Error ? error.message : 'Failed to update issue';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
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

    if (!['draft', 'review'].includes(issue.status)) {
      return NextResponse.json({ error: 'Can only delete draft or review issues' }, { status: 400 });
    }

    await deleteIssue(issueId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete issue:', error);
    return NextResponse.json({ error: 'Failed to delete issue' }, { status: 500 });
  }
}
