import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getIssue, updateIssueStatus } from '@/lib/supabase/queries';

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

    if (issue.status !== 'approved') {
      return NextResponse.json(
        { error: 'Issue must be approved before publishing' },
        { status: 400 }
      );
    }

    const updated = await updateIssueStatus(issueId, 'published');

    return NextResponse.json({ issue: updated });
  } catch (error) {
    console.error('Failed to publish issue:', error);
    return NextResponse.json({ error: 'Failed to publish issue' }, { status: 500 });
  }
}
