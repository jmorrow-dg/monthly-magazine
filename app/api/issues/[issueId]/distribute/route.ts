import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getIssue } from '@/lib/supabase/queries';
import { sendIssueToSubscribers } from '@/lib/email/send';

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

    if (issue.status !== 'published') {
      return NextResponse.json({ error: 'Only published issues can be distributed' }, { status: 400 });
    }

    const result = await sendIssueToSubscribers(issue);

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Distribution failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Distribution failed' },
      { status: 500 },
    );
  }
}
