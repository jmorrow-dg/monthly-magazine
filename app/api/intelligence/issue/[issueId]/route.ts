import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getIssue } from '@/lib/supabase/queries';
import { getIssueIntelligence } from '@/lib/supabase/intelligence-queries';

type RouteContext = { params: Promise<{ issueId: string }> };

/**
 * GET /api/intelligence/issue/[issueId]
 * Returns the full intelligence bundle for an issue:
 * evidence packs, claims, provenance, and facts.
 * Admin-only (authenticated).
 */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { issueId } = await context.params;

    // Validate UUID format to prevent Supabase errors
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(issueId)) {
      return NextResponse.json({ error: 'Invalid issue ID' }, { status: 400 });
    }

    const issue = await getIssue(issueId);
    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    const intelligence = await getIssueIntelligence(issueId);

    // Serialise the factsMap as a plain object
    const factsById: Record<string, unknown> = {};
    intelligence.factsMap.forEach((fact, id) => {
      factsById[id] = fact;
    });

    return NextResponse.json({
      issue: {
        id: issue.id,
        edition: issue.edition,
        month: issue.month,
        year: issue.year,
        cover_headline: issue.cover_headline,
        status: issue.status,
      },
      packs: intelligence.packs,
      claims: intelligence.claims,
      provenance: intelligence.provenance,
      facts: intelligence.facts,
      facts_by_id: factsById,
    });
  } catch (error) {
    console.error('Failed to fetch issue intelligence:', error);
    return NextResponse.json(
      { error: 'Failed to fetch intelligence data' },
      { status: 500 },
    );
  }
}
