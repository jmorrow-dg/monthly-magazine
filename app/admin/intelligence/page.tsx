'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface IssueSummary {
  id: string;
  edition: number;
  month: number;
  year: number;
  cover_headline: string;
  status: string;
}

interface DashboardStats {
  totalSignals: number;
  totalIssues: number;
  issues: IssueSummary[];
  signalsByCategory: Record<string, number>;
}

const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const STATUS_COLORS: Record<string, string> = {
  draft: '#F59E0B',
  review: '#3B82F6',
  approved: '#8B5CF6',
  published: '#22C55E',
  archived: '#666666',
};

export default function IntelligenceDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Fetch signals summary and issues in parallel
        const [signalsRes, issuesRes] = await Promise.all([
          fetch('/api/intelligence/signals?limit=1&offset=0'),
          fetch('/api/issues'),
        ]);

        const signalsData = signalsRes.ok ? await signalsRes.json() : { total: 0 };
        const issuesRaw = issuesRes.ok ? await issuesRes.json() : [];
        // /api/issues returns { issues: [...] } or a raw array depending on endpoint
        const issuesData = Array.isArray(issuesRaw) ? issuesRaw : (issuesRaw.issues ?? []);

        // Fetch category breakdown
        const categories = ['Model Releases', 'Agent Systems', 'Enterprise AI', 'AI Infrastructure', 'AI Security', 'AI Strategy'];
        const catCounts: Record<string, number> = {};

        await Promise.all(
          categories.map(async (cat) => {
            try {
              const res = await fetch(`/api/intelligence/signals?limit=1&offset=0&category=${encodeURIComponent(cat)}`);
              if (res.ok) {
                const data = await res.json();
                catCounts[cat] = data.total;
              }
            } catch {
              catCounts[cat] = 0;
            }
          }),
        );

        setStats({
          totalSignals: signalsData.total,
          totalIssues: Array.isArray(issuesData) ? issuesData.length : 0,
          issues: Array.isArray(issuesData)
            ? issuesData.map((i: IssueSummary) => ({
                id: i.id,
                edition: i.edition,
                month: i.month,
                year: i.year,
                cover_headline: i.cover_headline,
                status: i.status,
              }))
            : [],
          signalsByCategory: catCounts,
        });
      } catch {
        // Fail silently with empty state
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[#333333] rounded w-64" />
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-[#222222] rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-[family-name:var(--font-playfair)] text-white mb-1">
          Intelligence Hub
        </h1>
        <p className="text-sm text-[#888888]">
          Explore signals, evidence, and claims across all generated issues.
        </p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <Link href="/admin/intelligence/signals" className="block">
          <div className="bg-[#222222] border border-[#333333] rounded-lg p-4 hover:border-[#B8860B]/30 transition-colors">
            <div className="text-2xl font-semibold text-white">{stats?.totalSignals ?? 0}</div>
            <div className="text-[10px] text-[#888888] mt-1">Signals Ingested</div>
            <div className="text-[10px] text-[#B8860B] mt-2">Browse signals &rarr;</div>
          </div>
        </Link>
        <div className="bg-[#222222] border border-[#333333] rounded-lg p-4">
          <div className="text-2xl font-semibold text-white">{stats?.totalIssues ?? 0}</div>
          <div className="text-[10px] text-[#888888] mt-1">Magazine Issues</div>
        </div>
        <div className="bg-[#222222] border border-[#333333] rounded-lg p-4">
          <div className="text-2xl font-semibold text-white">
            {Object.values(stats?.signalsByCategory ?? {}).reduce((a, b) => a + b, 0) > 0
              ? Object.keys(stats?.signalsByCategory ?? {}).filter((k) => (stats?.signalsByCategory[k] ?? 0) > 0).length
              : 0}
          </div>
          <div className="text-[10px] text-[#888888] mt-1">Active Categories</div>
        </div>
      </div>

      {/* Category breakdown */}
      {stats?.signalsByCategory && Object.keys(stats.signalsByCategory).length > 0 && (
        <div className="mb-8">
          <h2 className="text-[11px] text-[#888888] uppercase tracking-wider font-semibold mb-3">
            Signals by Category
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(stats.signalsByCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, count]) => (
                <Link
                  key={cat}
                  href={`/admin/intelligence/signals?category=${encodeURIComponent(cat)}`}
                  className="flex items-center justify-between bg-[#1C1C1C] border border-[#2A2A2E] rounded-lg px-3 py-2 hover:border-[#B8860B]/30 transition-colors"
                >
                  <span className="text-[12px] text-[#B0B0B0]">{cat}</span>
                  <span className="text-[12px] font-semibold text-white">{count}</span>
                </Link>
              ))}
          </div>
        </div>
      )}

      {/* Issues with intelligence */}
      <div>
        <h2 className="text-[11px] text-[#888888] uppercase tracking-wider font-semibold mb-3">
          Issues
        </h2>
        {!stats?.issues.length ? (
          <div className="bg-[#222222] border border-[#333333] rounded-lg p-6 text-center">
            <p className="text-[#888888] text-sm">No issues found.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.issues.map((issue) => (
              <div
                key={issue.id}
                className="flex items-center justify-between bg-[#222222] border border-[#333333] rounded-lg px-4 py-3 hover:border-[#B8860B]/20 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[12px] font-semibold text-white shrink-0">
                    #{String(issue.edition).padStart(2, '0')}
                  </span>
                  <span className="text-[11px] text-[#888888] shrink-0">
                    {MONTH_NAMES[issue.month]} {issue.year}
                  </span>
                  <span className="text-[12px] text-[#B0B0B0] truncate">
                    {issue.cover_headline}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className="text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider"
                    style={{
                      color: STATUS_COLORS[issue.status] || '#888888',
                      backgroundColor: `${STATUS_COLORS[issue.status] || '#888888'}15`,
                    }}
                  >
                    {issue.status}
                  </span>
                  <Link
                    href={`/admin/issues/${issue.id}/intelligence`}
                    className="text-[10px] text-[#B8860B] hover:underline"
                  >
                    View Intelligence
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
