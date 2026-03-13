import { NextResponse } from 'next/server';
import { getIssueBySlug } from '@/lib/supabase/queries';

// ============================================================
// GET /api/issues/by-slug/[slug]
// Fetch an issue by its URL-friendly slug.
// Public route — only returns published issues.
// ============================================================

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const issue = await getIssueBySlug(slug);

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    // Only return published issues publicly
    if (issue.status !== 'published') {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    return NextResponse.json({ issue });
  } catch (error) {
    console.error('Failed to fetch issue by slug:', error);
    return NextResponse.json(
      { error: 'Failed to fetch issue' },
      { status: 500 },
    );
  }
}
