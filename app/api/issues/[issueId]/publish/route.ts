import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getIssue, updateIssue, updateIssueStatus, setLatestIssue } from '@/lib/supabase/queries';
import { generateAllDerivatives } from '@/lib/ai/generate-derivatives';
import { sanitiseDashes, sanitiseDashesDeep } from '@/lib/utils/sanitise-dashes';

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

    if (issue.status !== 'approved') {
      return NextResponse.json(
        { error: 'Issue must be approved before publishing' },
        { status: 400 },
      );
    }

    // Check for optional query params
    let url: URL | null = null;
    try {
      url = new URL(request.url);
    } catch {
      // ignore
    }
    const skipDerivatives = url?.searchParams.get('skip_derivatives') === 'true';

    // Transition to published
    const updated = await updateIssueStatus(issueId, 'published');

    // Set this issue as the latest
    await setLatestIssue(issueId);

    // Generate derivative artifacts (unless skipped)
    if (!skipDerivatives && updated) {
      try {
        const derivatives = await generateAllDerivatives(updated);

        await updateIssue(issueId, {
          executive_summary: sanitiseDashes(derivatives.executive_summary),
          beehiiv_summary: sanitiseDashes(derivatives.beehiiv_summary),
          welcome_email_snippet: sanitiseDashes(derivatives.welcome_email_snippet),
          linkedin_snippets: sanitiseDashesDeep(derivatives.linkedin_snippets),
        });
      } catch (derivativeError) {
        // Log but don't fail the publish — derivatives are non-critical
        console.error('Derivative generation failed (non-fatal):', derivativeError);
      }
    }

    // Re-fetch to include latest updates
    const final = await getIssue(issueId);

    return NextResponse.json({ issue: final });
  } catch (error) {
    console.error('Failed to publish issue:', error);
    return NextResponse.json({ error: 'Failed to publish issue' }, { status: 500 });
  }
}
