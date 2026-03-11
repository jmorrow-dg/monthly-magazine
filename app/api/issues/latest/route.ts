import { NextResponse } from 'next/server';
import { getLatestPublishedIssue } from '@/lib/supabase/queries';

export async function GET() {
  try {
    const issue = await getLatestPublishedIssue();

    if (!issue) {
      return NextResponse.json({ issue: null });
    }

    return NextResponse.json({ issue });
  } catch (error) {
    console.error('Failed to fetch latest issue:', error);
    return NextResponse.json({ error: 'Failed to fetch latest issue' }, { status: 500 });
  }
}
