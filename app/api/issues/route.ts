import { NextResponse } from 'next/server';
import { listIssues } from '@/lib/supabase/queries';
import { isAuthenticated } from '@/lib/auth';
import type { IssueStatus, IssueFormat } from '@/lib/types/issue';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') as IssueStatus | null;
    const formatFilter = searchParams.get('format') as IssueFormat | null;

    const authenticated = await isAuthenticated();

    // Public users only see published issues
    if (!authenticated) {
      const issues = await listIssues('published', formatFilter || undefined);
      return NextResponse.json({ issues });
    }

    const issues = await listIssues(statusFilter || undefined, formatFilter || undefined);
    return NextResponse.json({ issues });
  } catch (error) {
    console.error('Failed to list issues:', error);
    return NextResponse.json({ error: 'Failed to list issues' }, { status: 500 });
  }
}
