import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getIssue, updateIssue } from '@/lib/supabase/queries';
import { generateAllDerivatives } from '@/lib/ai/generate-derivatives';
import { sanitiseDashes, sanitiseDashesDeep } from '@/lib/utils/sanitise-dashes';

// ============================================================
// POST /api/issues/[issueId]/derivatives
// Generate or regenerate derivative artifacts for an issue.
// Can be called independently of the publish flow.
// ============================================================

export const maxDuration = 120;

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

    // Require content to exist before generating derivatives
    if (!issue.cover_story_json) {
      return NextResponse.json(
        { error: 'Issue must have generated content before creating derivatives' },
        { status: 400 },
      );
    }

    const derivatives = await generateAllDerivatives(issue);

    const updated = await updateIssue(issueId, {
      executive_summary: sanitiseDashes(derivatives.executive_summary),
      beehiiv_summary: sanitiseDashes(derivatives.beehiiv_summary),
      welcome_email_snippet: sanitiseDashes(derivatives.welcome_email_snippet),
      linkedin_snippets: sanitiseDashesDeep(derivatives.linkedin_snippets),
    });

    return NextResponse.json({
      issue: updated,
      derivatives: {
        executive_summary: derivatives.executive_summary,
        beehiiv_summary: derivatives.beehiiv_summary,
        welcome_email_snippet: derivatives.welcome_email_snippet,
        linkedin_snippets: derivatives.linkedin_snippets,
      },
    });
  } catch (error) {
    console.error('Derivative generation failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Derivative generation failed' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/issues/[issueId]/derivatives
 * Fetch existing derivative artifacts for an issue.
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const { issueId } = await context.params;
    const issue = await getIssue(issueId);

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    return NextResponse.json({
      executive_summary: issue.executive_summary,
      beehiiv_summary: issue.beehiiv_summary,
      welcome_email_snippet: issue.welcome_email_snippet,
      linkedin_snippets: issue.linkedin_snippets,
      has_derivatives: !!(issue.executive_summary || issue.beehiiv_summary),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch derivatives' },
      { status: 500 },
    );
  }
}
