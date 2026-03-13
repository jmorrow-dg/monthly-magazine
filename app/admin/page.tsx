'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import IssueStatusBadge from '@/components/admin/IssueStatusBadge';
import AdminDashboardSkeleton from '@/components/admin/AdminDashboardSkeleton';
import { shortMonthName } from '@/lib/utils/format-date';
import type { IssueSummary } from '@/lib/types/issue';

export default function AdminDashboard() {
  const [issues, setIssues] = useState<IssueSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/issues')
      .then((r) => r.json())
      .then((data) => setIssues(data.issues || []))
      .catch(() => setError('Failed to load issues.'))
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: issues.length,
    published: issues.filter((i) => i.status === 'published').length,
    drafts: issues.filter((i) => i.status === 'draft').length,
    inReview: issues.filter((i) => i.status === 'review').length,
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-[#888888] text-sm mt-1">AI Intelligence Report Management</p>
        </div>
        <Link
          href="/admin/generate"
          className="px-5 py-2.5 bg-[#B8860B] text-white text-sm font-semibold rounded-lg hover:bg-[#D4A843] transition-colors whitespace-nowrap flex-shrink-0"
        >
          New Issue
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Issues', value: stats.total, color: '#B8860B' },
          { label: 'Published', value: stats.published, color: '#22C55E' },
          { label: 'In Review', value: stats.inReview, color: '#3B82F6' },
          { label: 'Drafts', value: stats.drafts, color: '#888888' },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#222222] border border-[#333333] rounded-lg p-5">
            <div className="text-[11px] text-[#888888] uppercase tracking-wider mb-2">{stat.label}</div>
            <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Recent Issues */}
      <div className="bg-[#222222] border border-[#333333] rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-[#333333]">
          <h2 className="text-white font-semibold text-sm">Recent Issues</h2>
        </div>

        {loading ? (
          <AdminDashboardSkeleton />
        ) : error ? (
          <div className="py-12 text-center text-[#C0392B] text-sm">{error}</div>
        ) : issues.length === 0 ? (
          <div className="py-12 text-center text-[#888888] text-sm">No issues yet. Create your first issue.</div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[11px] text-[#888888] uppercase tracking-wider">
                <th className="px-5 py-3">Edition</th>
                <th className="px-5 py-3">Period</th>
                <th className="px-5 py-3">Headline</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {issues.slice(0, 10).map((issue) => (
                <tr key={issue.id} className="border-t border-[#333333] hover:bg-[#1C1C1C] transition-colors">
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
