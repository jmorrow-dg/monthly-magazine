'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import IssueStatusBadge from '@/components/admin/IssueStatusBadge';
import { SkeletonBlock } from '@/components/shared/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import { shortMonthName } from '@/lib/utils/format-date';
import type { IssueSummary, IssueStatus } from '@/lib/types/issue';
const FILTERS: { label: string; value: IssueStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Review', value: 'review' },
  { label: 'Approved', value: 'approved' },
  { label: 'Published', value: 'published' },
  { label: 'Archived', value: 'archived' },
];

export default function IssueListPage() {
  const [issues, setIssues] = useState<IssueSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<IssueStatus | 'all'>('all');

  useEffect(() => {
    const params = filter !== 'all' ? `?status=${filter}` : '';
    setError('');
    fetch(`/api/issues${params}`)
      .then((r) => r.json())
      .then((data) => setIssues(data.issues || []))
      .catch(() => setError('Failed to load issues.'))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-white">Issues</h1>
        <Link
          href="/admin/generate"
          className="px-5 py-2.5 bg-[#B8860B] text-white text-sm font-semibold rounded-lg hover:bg-[#D4A843] transition-colors whitespace-nowrap"
        >
          New Issue
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => { setFilter(f.value); setLoading(true); }}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === f.value
                ? 'bg-[#B8860B]/15 text-[#B8860B] border border-[#B8860B]/30'
                : 'text-[#888888] hover:text-white hover:bg-[#222222]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#222222] border border-[#333333] rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-8">
                <SkeletonBlock className="h-3 w-10" />
                <SkeletonBlock className="h-3 w-16" />
                <SkeletonBlock className="h-3 flex-1" />
                <SkeletonBlock className="h-5 w-16 rounded-full" />
                <SkeletonBlock className="h-3 w-20" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-12 text-center text-[#C0392B] text-sm">{error}</div>
        ) : issues.length === 0 ? (
          <EmptyState title="No issues found" description="Try a different filter or create a new issue." />
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[11px] text-[#888888] uppercase tracking-wider border-b border-[#333333]">
                <th className="px-5 py-3">Edition</th>
                <th className="px-5 py-3">Period</th>
                <th className="px-5 py-3">Headline</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr key={issue.id} className="border-t border-[#2a2a2a] hover:bg-[#1C1C1C] transition-colors">
                  <td className="px-5 py-3">
                    <Link href={`/admin/issues/${issue.id}`} className="text-[#B8860B] font-semibold text-sm hover:underline">
                      #{String(issue.edition).padStart(2, '0')}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-sm text-[#B0B0B0]">{shortMonthName(issue.month)} {issue.year}</td>
                  <td className="px-5 py-3 text-sm text-white">{issue.cover_headline}</td>
                  <td className="px-5 py-3"><IssueStatusBadge status={issue.status} /></td>
                  <td className="px-5 py-3 text-xs text-[#666666]">{new Date(issue.updated_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
