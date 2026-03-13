import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getLatestQAReport } from '@/lib/supabase/queries';

type RouteContext = { params: Promise<{ issueId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  try {
    const { issueId } = await context.params;
    const report = await getLatestQAReport(issueId);

    if (!report) {
      return NextResponse.json({ report: null });
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error('Failed to fetch QA report:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch QA report' },
      { status: 500 },
    );
  }
}
