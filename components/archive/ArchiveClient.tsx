'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ArchiveSkeleton from '@/components/archive/ArchiveSkeleton';
import CoverPreview from '@/components/archive/CoverPreview';
import EmptyState from '@/components/shared/EmptyState';
import { monthName } from '@/lib/utils/format-date';
import type { IssueSummary } from '@/lib/types/issue';

export default function ArchiveClient() {
  const [issues, setIssues] = useState<IssueSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/issues?status=published')
      .then((r) => r.json())
      .then((data) => setIssues(data.issues || []))
      .catch(() => setError('Failed to load issues. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#141414]">
      {/* Header */}
      <header className="border-b border-[#333333]">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/images/dg-logo.png" alt="DG" width={32} height={32} />
            <div>
              <div className="font-[family-name:var(--font-playfair)] text-sm font-bold text-white">David & Goliath</div>
              <div className="text-[10px] text-[#B8860B] uppercase tracking-widest">AI Intelligence Report</div>
            </div>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-white mb-2">Archive</h1>
          <p className="text-[#888888] text-sm">All published editions of the AI Intelligence Report.</p>
        </div>

        {loading ? (
          <ArchiveSkeleton />
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-[#C0392B] text-sm mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="text-[#B8860B] text-sm hover:underline">Retry</button>
          </div>
        ) : issues.length === 0 ? (
          <EmptyState title="No published issues yet" description="Check back soon for the first edition." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {issues.map((issue) => (
              <Link
                key={issue.id}
                href={`/issues/${issue.id}/viewer`}
                className="group bg-[#222222] border border-[#333333] rounded-lg overflow-hidden hover:border-[#B8860B]/50 transition-all hover:shadow-lg hover:shadow-[#B8860B]/5"
              >
                {/* Cover preview */}
                <CoverPreview
                  issueId={issue.id}
                  fallback={
                    <div className="h-full flex items-center justify-center relative">
                      <div className="text-center">
                        <div className="font-[family-name:var(--font-playfair)] text-lg font-bold text-white/80 group-hover:text-white transition-colors">
                          Edition {String(issue.edition).padStart(2, '0')}
                        </div>
                        <div className="text-[10px] text-[#B8860B] uppercase tracking-widest mt-1">
                          {monthName(issue.month)} {issue.year}
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#B8860B] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  }
                />

                <div className="p-4">
                  <h3 className="text-white font-semibold text-sm mb-1 group-hover:text-[#B8860B] transition-colors">
                    {issue.cover_headline}
                  </h3>
                  {issue.cover_subtitle && (
                    <p className="text-[#888888] text-xs line-clamp-2">{issue.cover_subtitle}</p>
                  )}
                  <div className="mt-3 text-[10px] text-[#666666]">
                    {issue.published_at ? new Date(issue.published_at).toLocaleDateString() : ''}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
