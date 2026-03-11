import type { Metadata } from 'next';
import { getIssue } from '@/lib/supabase/queries';
import { monthName as getMonthName } from '@/lib/utils/format-date';
import ViewerClient from '@/components/viewer/ViewerClient';

type PageProps = {
  params: Promise<{ issueId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { issueId } = await params;

  try {
    const issue = await getIssue(issueId);

    if (!issue || issue.status !== 'published') {
      return {
        title: 'Issue Not Found | David & Goliath AI Intelligence Report',
      };
    }

    const monthLabel = getMonthName(issue.month);
    const editionLabel = `Edition ${String(issue.edition).padStart(2, '0')}`;
    const title = `${issue.cover_headline} | ${editionLabel} | David & Goliath AI Intelligence Report`;
    const description = issue.cover_subtitle
      || `${monthLabel} ${issue.year} edition of the David & Goliath AI Intelligence Report. Strategic AI insights for Australian operators.`;

    return {
      title,
      description,
      openGraph: {
        title: `${issue.cover_headline} - ${editionLabel}`,
        description,
        type: 'article',
        siteName: 'David & Goliath',
        publishedTime: issue.published_at || undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: `${issue.cover_headline} - ${editionLabel}`,
        description,
      },
    };
  } catch {
    return {
      title: 'AI Intelligence Report | David & Goliath',
    };
  }
}

export default async function ViewerPage({ params }: PageProps) {
  const { issueId } = await params;
  return <ViewerClient issueId={issueId} />;
}
