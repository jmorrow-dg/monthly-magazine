'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { IssueFormat } from '@/lib/types/issue';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getMonday(d: Date): string {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - diff);
  return date.toISOString().split('T')[0];
}

function getSunday(monday: string): string {
  const d = new Date(monday);
  d.setDate(d.getDate() + 6);
  return d.toISOString().split('T')[0];
}

export default function GenerateIssuePage() {
  const router = useRouter();
  const now = new Date();
  const [format, setFormat] = useState<IssueFormat>('weekly');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [edition, setEdition] = useState(1);
  const [headline, setHeadline] = useState('Weekly AI Intelligence');
  const [subtitle, setSubtitle] = useState('');
  const [weekStart, setWeekStart] = useState(getMonday(now));
  const [weekEnd, setWeekEnd] = useState(getSunday(getMonday(now)));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-increment edition based on existing issues of this format
  useEffect(() => {
    fetch(`/api/issues?format=${format}`)
      .then((r) => r.json())
      .then((data) => {
        const issues = data.issues || [];
        if (issues.length > 0) {
          const maxEdition = Math.max(...issues.map((i: { edition: number }) => i.edition));
          setEdition(maxEdition + 1);
        } else {
          setEdition(1);
        }
      })
      .catch(() => {});
  }, [format]);

  // Update defaults when format changes
  useEffect(() => {
    if (format === 'weekly') {
      setHeadline('Weekly AI Intelligence');
    } else if (format === 'quarterly') {
      setHeadline('AI Intelligence Report: Quarterly Deep Dive');
    } else {
      setHeadline('AI Intelligence Report');
    }
  }, [format]);

  // Auto-compute week end when week start changes
  useEffect(() => {
    if (weekStart) {
      setWeekEnd(getSunday(weekStart));
    }
  }, [weekStart]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const body: Record<string, unknown> = {
        month,
        year,
        edition,
        cover_headline: headline,
        cover_subtitle: subtitle || null,
        format,
      };

      if (format === 'weekly') {
        body.week_start = weekStart;
        body.week_end = weekEnd;
      }

      const res = await fetch('/api/issues/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create issue');
      }

      const data = await res.json();
      router.push(`/admin/issues/${data.issue.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create issue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-xl">
      <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-white mb-2">New Issue</h1>
      <p className="text-[#888888] text-sm mb-8">Create a new magazine issue. You can add content after creation.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Format Selector */}
        <div>
          <label className="block text-[11px] text-[#888888] uppercase tracking-wider mb-1.5">Format</label>
          <div className="flex gap-2">
            {(['weekly', 'monthly', 'quarterly'] as IssueFormat[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors capitalize ${
                  format === f
                    ? 'bg-[#B8860B]/15 text-[#B8860B] border-[#B8860B]/30'
                    : 'bg-[#222222] text-[#888888] border-[#333333] hover:text-white hover:border-[#444444]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Week Range (weekly only) */}
        {format === 'weekly' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] text-[#888888] uppercase tracking-wider mb-1.5">Week Start (Monday)</label>
              <input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#222222] border border-[#333333] rounded-lg text-white text-sm focus:outline-none focus:border-[#B8860B]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#888888] uppercase tracking-wider mb-1.5">Week End (Sunday)</label>
              <input
                type="date"
                value={weekEnd}
                readOnly
                className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-[#333333] rounded-lg text-[#666666] text-sm cursor-not-allowed"
              />
            </div>
          </div>
        )}

        {/* Month & Year (monthly/quarterly) */}
        {format !== 'weekly' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] text-[#888888] uppercase tracking-wider mb-1.5">Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-[#222222] border border-[#333333] rounded-lg text-white text-sm focus:outline-none focus:border-[#B8860B]"
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-[#888888] uppercase tracking-wider mb-1.5">Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                min={2024}
                className="w-full px-3 py-2.5 bg-[#222222] border border-[#333333] rounded-lg text-white text-sm focus:outline-none focus:border-[#B8860B]"
              />
            </div>
          </div>
        )}

        {/* Edition */}
        <div>
          <label className="block text-[11px] text-[#888888] uppercase tracking-wider mb-1.5">
            Edition Number {format === 'weekly' && <span className="normal-case text-[#666666]">(auto W{edition})</span>}
          </label>
          <input
            type="number"
            value={edition}
            onChange={(e) => setEdition(Number(e.target.value))}
            min={1}
            className="w-full px-3 py-2.5 bg-[#222222] border border-[#333333] rounded-lg text-white text-sm focus:outline-none focus:border-[#B8860B]"
          />
        </div>

        {/* Cover Headline */}
        <div>
          <label className="block text-[11px] text-[#888888] uppercase tracking-wider mb-1.5">Cover Headline</label>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="AI Intelligence Report"
            className="w-full px-3 py-2.5 bg-[#222222] border border-[#333333] rounded-lg text-white text-sm focus:outline-none focus:border-[#B8860B]"
          />
        </div>

        {/* Cover Subtitle */}
        <div>
          <label className="block text-[11px] text-[#888888] uppercase tracking-wider mb-1.5">Cover Subtitle (optional)</label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Strategic insights for Australian operators"
            className="w-full px-3 py-2.5 bg-[#222222] border border-[#333333] rounded-lg text-white text-sm focus:outline-none focus:border-[#B8860B]"
          />
        </div>

        {error && <p className="text-[#C0392B] text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading || !headline}
          className="w-full py-3 bg-[#B8860B] text-white font-semibold rounded-lg hover:bg-[#D4A843] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Creating...' : `Create ${format.charAt(0).toUpperCase() + format.slice(1)} Issue`}
        </button>
      </form>
    </div>
  );
}
