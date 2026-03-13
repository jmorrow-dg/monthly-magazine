import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getQAHistory } from '@/lib/supabase/queries';

type RouteContext = { params: Promise<{ issueId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  try {
    const { issueId } = await context.params;
    const reports = await getQAHistory(issueId);

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Failed to fetch QA history:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch QA history' },
      { status: 500 },
    );
  }
}
