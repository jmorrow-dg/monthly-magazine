'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import MagazineViewer from './MagazineViewer';
import ViewerSkeleton from '@/components/viewer/ViewerSkeleton';
import type { IssueFormat } from '@/lib/types/issue';

type ViewerClientProps = {
  issueId: string;
};

type IssueMeta = {
  headline: string;
  subtitle: string | null;
  format: IssueFormat;
};

export default function ViewerClient({ issueId }: ViewerClientProps) {
  const [pageHtmls, setPageHtmls] = useState<(string | null)[]>([]);
  const [issueMeta, setIssueMeta] = useState<IssueMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadIssue() {
      try {
        const res = await fetch(`/api/issues/${issueId}/render`);
        if (!res.ok) throw new Error('Issue not found');
        const data = await res.json();
        setPageHtmls(data.pages || []);
        if (data.issue) {
          setIssueMeta({ headline: data.issue.headline, subtitle: data.issue.subtitle, format: data.issue.format || 'monthly' });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load issue');
      } finally {
        setLoading(false);
      }
    }

    loadIssue();
  }, [issueId]);

  if (loading) {
    return <ViewerSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center">
        <p className="text-[#C0392B] text-sm mb-4">{error}</p>
        <Link href="/issues" className="text-[#B8860B] text-sm hover:underline">
          Back to Archive
        </Link>
      </div>
    );
  }

  return (
    <MagazineViewer
      pageHtmls={pageHtmls}
      issueId={issueId}
      headline={issueMeta?.headline || ''}
      subtitle={issueMeta?.subtitle}
      format={issueMeta?.format || 'monthly'}
    />
  );
}
