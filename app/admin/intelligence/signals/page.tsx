'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import SignalCard from '@/components/intelligence/SignalCard';
import type { AISignalRow } from '@/lib/supabase/intelligence-queries';

const CATEGORIES = [
  'All',
  'Model Releases',
  'Agent Systems',
  'Enterprise AI',
  'AI Infrastructure',
  'AI Security',
  'AI Strategy',
];

const PAGE_SIZE = 20;

export default function SignalExplorerPage() {
  const [signals, setSignals] = useState<AISignalRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [offset, setOffset] = useState(0);

  const fetchSignals = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offset),
      });
      if (category !== 'All') params.set('category', category);
      if (search) params.set('search', search);

      const res = await fetch(`/api/intelligence/signals?${params}`);
      if (!res.ok) throw new Error('Failed to fetch signals');
      const data = await res.json();
      setSignals(data.signals);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load signals');
    } finally {
      setLoading(false);
    }
  }, [category, search, offset]);

  useEffect(() => {
    fetchSignals();
  }, [fetchSignals]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setOffset(0);
    setSearch(searchInput);
  }

  function handleCategoryChange(cat: string) {
    setCategory(cat);
    setOffset(0);
  }

  const hasMore = offset + signals.length < total;
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <Link
            href="/admin/intelligence"
            className="text-[#B8860B] text-xs hover:underline"
          >
            &larr; Intelligence Hub
          </Link>
        </div>
        <h1 className="text-2xl font-[family-name:var(--font-playfair)] text-white mb-1">
          Signal Explorer
        </h1>
        <p className="text-sm text-[#888888]">
          Browse and inspect intelligence signals stored in the system.
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search signals by title or summary..."
            className="flex-1 bg-[#1C1C1C] text-white text-sm px-4 py-2.5 rounded-lg border border-[#333333] focus:border-[#B8860B] focus:outline-none placeholder:text-[#666666]"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-[#B8860B]/15 text-[#B8860B] text-sm font-medium rounded-lg border border-[#B8860B]/30 hover:bg-[#B8860B]/25 transition-colors"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setSearchInput(''); setOffset(0); }}
              className="px-3 py-2.5 text-[#888888] text-sm hover:text-white transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {/* Category filter */}
      <div className="flex gap-1.5 mb-6 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`px-3 py-1.5 text-[10px] rounded-full uppercase tracking-wider transition-colors ${
              category === cat
                ? 'bg-[#B8860B]/15 text-[#B8860B] border border-[#B8860B]/30'
                : 'bg-[#1C1C1C] text-[#888888] border border-[#333333] hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] text-[#888888]">
          {total} signal{total !== 1 ? 's' : ''} found
          {search && <span> for &ldquo;{search}&rdquo;</span>}
          {category !== 'All' && <span> in {category}</span>}
        </p>
        {totalPages > 1 && (
          <p className="text-[11px] text-[#666666]">
            Page {currentPage} of {totalPages}
          </p>
        )}
      </div>

      {/* Signal list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse h-24 bg-[#222222] rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-[#222222] border border-[#333333] rounded-lg p-8 text-center">
          <p className="text-[#C0392B] text-sm">{error}</p>
        </div>
      ) : signals.length === 0 ? (
        <div className="bg-[#222222] border border-[#333333] rounded-lg p-8 text-center">
          <p className="text-[#888888] text-sm">No signals found.</p>
          <p className="text-[#666666] text-xs mt-1">
            Signals are ingested from the Intelligence Hub on the marketing website.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {signals.map((signal) => (
            <SignalCard key={signal.id} signal={signal} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            disabled={offset === 0}
            className="px-3 py-1.5 text-xs text-[#B8860B] hover:underline disabled:text-[#666666] disabled:no-underline"
          >
            &larr; Previous
          </button>
          <span className="text-[11px] text-[#888888]">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setOffset(offset + PAGE_SIZE)}
            disabled={!hasMore}
            className="px-3 py-1.5 text-xs text-[#B8860B] hover:underline disabled:text-[#666666] disabled:no-underline"
          >
            Next &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
