'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function GenerateIssuePage() {
  const router = useRouter();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [edition, setEdition] = useState(1);
  const [headline, setHeadline] = useState('AI Intelligence Report');
  const [subtitle, setSubtitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-increment edition based on existing issues
  useEffect(() => {
    fetch('/api/issues')
      .then((r) => r.json())
      .then((data) => {
        const issues = data.issues || [];
        if (issues.length > 0) {
          const maxEdition = Math.max(...issues.map((i: { edition: number }) => i.edition));
          setEdition(maxEdition + 1);
        }
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/issues/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month,
          year,
          edition,
          cover_headline: headline,
          cover_subtitle: subtitle || null,
        }),
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
        {/* Month & Year */}
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

        {/* Edition */}
        <div>
          <label className="block text-[11px] text-[#888888] uppercase tracking-wider mb-1.5">Edition Number</label>
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
          {loading ? 'Creating...' : 'Create Issue'}
        </button>
      </form>
    </div>
  );
}
