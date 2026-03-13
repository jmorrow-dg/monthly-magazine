import { redirect } from 'next/navigation';
import { getLatestPublishedIssue } from '@/lib/supabase/queries';

export const dynamic = 'force-dynamic';

/**
 * /latest — canonical redirect to the newest published AI Intelligence Report.
 *
 * Used in the Beehiiv welcome email so the link never goes stale.
 * Redirects to /issues/[issueId]/viewer for the most recent published issue.
 * Falls back to /issues if nothing is published yet.
 */
export default async function LatestRedirect() {
  const issue = await getLatestPublishedIssue();

  if (issue) {
    redirect(`/issues/${issue.id}/viewer`);
  }

  redirect('/issues');
}
