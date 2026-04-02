'use client';

import { useState, useEffect, useCallback } from 'react';

interface CarouselRecord {
  id: string;
  status: string;
  source_signal_title: string;
  source_signal_category: string;
  content_json: {
    hero: { headline: string; generatedImageUrl: string | null };
    signal: { headline: string; highlightWord: string; body: string };
    insight: { headline: string; bullets: string[] };
    personal: { angle: string; text: string };
    closer: { ctaVariant: string; ctaText: string | null };
  };
  captions_json: {
    linkedin: string;
    instagram: string;
    x: string;
    tiktok: string;
  };
  slide_urls_by_platform: Record<string, string[]>;
  platforms: string[];
  week_number: number;
  year: number;
  created_at: string;
  approved_at: string | null;
}

type StatusFilter = 'all' | 'pending_review' | 'approved' | 'rejected';
type CaptionPlatform = 'linkedin' | 'instagram' | 'x' | 'tiktok';

export default function CarouselsPage() {
  const [carousels, setCarousels] = useState<CarouselRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [selectedCarousel, setSelectedCarousel] = useState<CarouselRecord | null>(null);
  const [activePlatform, setActivePlatform] = useState<string>('linkedin');
  const [copiedCaption, setCopiedCaption] = useState(false);

  const fetchCarousels = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const res = await fetch(`/api/carousels${params}`);
      const data = await res.json();
      setCarousels(data.carousels || []);
    } catch (err) {
      console.error('Failed to fetch carousels:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchCarousels();
  }, [fetchCarousels]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/carousels/generate', { method: 'POST' });
      const data = await res.json();
      if (data.carousel) {
        await fetchCarousels();
      } else {
        alert(data.error || 'Generation failed');
      }
    } catch (err) {
      alert('Generation failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setGenerating(false);
    }
  };

  const handleAction = async (carouselId: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch(`/api/carousels/${carouselId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        await fetchCarousels();
        if (selectedCarousel?.id === carouselId) setSelectedCarousel(null);
      } else {
        const data = await res.json();
        alert(data.error || `${action} failed`);
      }
    } catch {
      alert(`${action} failed`);
    }
  };

  const copyCaption = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  const [exporting, setExporting] = useState<string | null>(null);

  const exportWeek = async (weekNumber: number, year: number) => {
    const key = `${weekNumber}-${year}`;
    setExporting(key);
    try {
      const res = await fetch('/api/carousels/export-week', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekNumber, year }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Exported ${data.carousels.length} carousels to:\n${data.outputPath}`);
      } else {
        alert(data.error || 'Export failed');
      }
    } catch {
      alert('Export failed');
    } finally {
      setExporting(null);
    }
  };

  /** Group carousels by week_number + year */
  const groupedByWeek = carousels.reduce<Record<string, { weekNumber: number; year: number; carousels: CarouselRecord[] }>>((acc, c) => {
    const key = `${c.year}-W${String(c.week_number).padStart(2, '0')}`;
    if (!acc[key]) {
      acc[key] = { weekNumber: c.week_number, year: c.year, carousels: [] };
    }
    acc[key].carousels.push(c);
    return acc;
  }, {});

  const sortedWeeks = Object.entries(groupedByWeek).sort((a, b) => b[0].localeCompare(a[0]));

  const downloadAllSlides = async (carousel: CarouselRecord, platform: string) => {
    const urls = carousel.slide_urls_by_platform?.[platform] || [];
    const signal = carousel.source_signal_title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    for (let i = 0; i < urls.length; i++) {
      const response = await fetch(urls[i]);
      const blob = await response.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${signal}_${platform}_slide-${i + 1}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      // Small delay between downloads to avoid browser blocking
      if (i < urls.length - 1) await new Promise(r => setTimeout(r, 300));
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'pending_review': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-white">
            Carousel Engine
          </h1>
          <p className="text-sm text-[#888888] mt-1">
            Generate carousels from Intelligence Hub signals. Download and distribute via Postbridge.
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-4 py-2 bg-[#B8860B] text-white text-sm font-medium rounded-md hover:bg-[#9A7209] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {generating ? 'Generating...' : 'Generate Carousel'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(['all', 'pending_review', 'approved', 'rejected'] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
              filter === s
                ? 'bg-[#B8860B]/10 text-[#B8860B] border-[#B8860B]/30'
                : 'bg-[#1C1C1C] text-[#888888] border-[#333333] hover:text-white'
            }`}
          >
            {s === 'all' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Carousel List */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="text-[#888888] text-sm">Loading carousels...</div>
          ) : carousels.length === 0 ? (
            <div className="bg-[#1C1C1C] border border-[#333333] rounded-lg p-8 text-center">
              <p className="text-[#888888] text-sm">No carousels found</p>
              <p className="text-[#666666] text-xs mt-1">Click &ldquo;Generate Carousel&rdquo; to create one</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedWeeks.map(([weekKey, group]) => (
                <div key={weekKey}>
                  {/* Week Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-semibold text-white">
                        Week {group.weekNumber}, {group.year}
                      </h3>
                      <span className="text-[10px] text-[#666666] bg-[#1C1C1C] px-2 py-0.5 rounded border border-[#333333]">
                        {group.carousels.length} carousel{group.carousels.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <button
                      onClick={() => exportWeek(group.weekNumber, group.year)}
                      disabled={exporting === `${group.weekNumber}-${group.year}`}
                      className="px-3 py-1.5 text-[11px] font-medium bg-[#1C1C1C] text-[#B8860B] border border-[#B8860B]/30 rounded-md hover:bg-[#B8860B]/10 disabled:opacity-50 transition-colors"
                    >
                      {exporting === `${group.weekNumber}-${group.year}` ? 'Exporting...' : 'Export Week'}
                    </button>
                  </div>

                  {/* Carousel Cards */}
                  <div className="space-y-2">
                    {group.carousels.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => { setSelectedCarousel(c); setActivePlatform('linkedin'); }}
                        className={`w-full text-left bg-[#1C1C1C] border rounded-lg p-3 transition-colors ${
                          selectedCarousel?.id === c.id
                            ? 'border-[#B8860B]/50'
                            : 'border-[#333333] hover:border-[#444444]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 text-[10px] font-medium rounded border ${statusColor(c.status)}`}>
                                {c.status.replace('_', ' ')}
                              </span>
                              <span className="text-[10px] text-[#666666]">
                                {c.source_signal_category}
                              </span>
                            </div>
                            <p className="text-sm text-white font-medium truncate">
                              {c.content_json.signal.headline}
                            </p>
                            <p className="text-xs text-[#888888] mt-0.5 truncate">
                              {c.source_signal_title}
                            </p>
                          </div>
                          {c.slide_urls_by_platform?.linkedin?.[0] && (
                            <img
                              src={c.slide_urls_by_platform.linkedin[0]}
                              alt=""
                              className="w-14 h-[4.5rem] object-cover rounded border border-[#333333] flex-shrink-0"
                            />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedCarousel && (
          <div className="w-[460px] flex-shrink-0 bg-[#1C1C1C] border border-[#333333] rounded-lg overflow-hidden">
            {/* Platform Selector */}
            <div className="p-4 border-b border-[#333333]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-white">Platform</h3>
                <div className="flex gap-1 bg-[#141414] rounded-md p-1">
                  {selectedCarousel.platforms.map((p) => (
                    <button
                      key={p}
                      onClick={() => setActivePlatform(p)}
                      className={`px-3 py-1.5 text-[11px] font-medium rounded transition-colors ${
                        activePlatform === p
                          ? 'bg-[#B8860B]/20 text-[#B8860B] border border-[#B8860B]/30'
                          : 'text-[#888888] hover:text-white border border-transparent'
                      }`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {(selectedCarousel.slide_urls_by_platform?.[activePlatform] || []).map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block flex-shrink-0 group relative"
                  >
                    <img
                      src={url}
                      alt={`Slide ${i + 1}`}
                      className="h-48 rounded border border-[#333333] group-hover:border-[#B8860B]/50 transition-colors"
                    />
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 text-[9px] bg-black/70 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      Open
                    </span>
                  </a>
                ))}
              </div>
              {/* Download slides */}
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadAllSlides(selectedCarousel, activePlatform)}
                    className="flex-1 px-3 py-2 text-xs font-medium bg-[#B8860B]/15 text-[#B8860B] border border-[#B8860B]/30 rounded-md hover:bg-[#B8860B]/25 transition-colors"
                  >
                    Download {activePlatform.charAt(0).toUpperCase() + activePlatform.slice(1)} Slides
                  </button>
                  {(selectedCarousel.slide_urls_by_platform?.[activePlatform] || []).map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      download={`slide-${i + 1}.png`}
                      className="px-2 py-1.5 text-[10px] bg-[#222222] text-[#B0B0B0] border border-[#333333] rounded hover:text-white hover:border-[#444444] transition-colors"
                    >
                      {i + 1}
                    </a>
                  ))}
                </div>
                <a
                  href={`/api/carousels/${selectedCarousel.id}/download`}
                  download
                  className="block w-full px-3 py-2.5 text-xs font-semibold text-center bg-[#B8860B] text-white rounded-md hover:bg-[#9A7209] transition-colors"
                >
                  Download All Platforms (ZIP)
                </a>
              </div>
            </div>

            {/* Content Details */}
            <div className="p-4 space-y-4 max-h-[340px] overflow-y-auto border-b border-[#333333]">
              <div>
                <label className="text-[10px] text-[#B8860B] uppercase tracking-widest">Signal Headline</label>
                <p className="text-sm text-white mt-1">{selectedCarousel.content_json.signal.headline}</p>
                <p className="text-xs text-[#888888] mt-1">{selectedCarousel.content_json.signal.body}</p>
              </div>

              <div>
                <label className="text-[10px] text-[#B8860B] uppercase tracking-widest">Why It Matters</label>
                <ul className="mt-1 space-y-1">
                  {selectedCarousel.content_json.insight.bullets.map((b, i) => (
                    <li key={i} className="text-xs text-[#B0B0B0] flex gap-2">
                      <span className="text-[#B8860B]">{'\u2022'}</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <label className="text-[10px] text-[#B8860B] uppercase tracking-widest">Personal Slide</label>
                <p className="text-xs text-[#B0B0B0] mt-1 italic">&ldquo;{selectedCarousel.content_json.personal.text}&rdquo;</p>
                <p className="text-[10px] text-[#666666] mt-1">Angle: {selectedCarousel.content_json.personal.angle.replace(/_/g, ' ')}</p>
              </div>

              <div>
                <label className="text-[10px] text-[#B8860B] uppercase tracking-widest">CTA</label>
                <p className="text-xs text-[#B0B0B0] mt-1">
                  {selectedCarousel.content_json.closer.ctaText || 'None (statement only)'}
                </p>
              </div>
            </div>

            {/* Caption section with copy */}
            <div className="p-4 border-b border-[#333333]">
              <div className="mb-2">
                <label className="text-[10px] text-[#B8860B] uppercase tracking-widest">
                  {activePlatform.charAt(0).toUpperCase() + activePlatform.slice(1)} Caption
                </label>
              </div>
              <pre className="text-xs text-[#B0B0B0] whitespace-pre-wrap font-[family-name:var(--font-inter)] bg-[#141414] rounded p-3 max-h-36 overflow-y-auto leading-relaxed">
                {selectedCarousel.captions_json[activePlatform as CaptionPlatform]}
              </pre>
              <button
                onClick={() => copyCaption(selectedCarousel.captions_json[activePlatform as CaptionPlatform])}
                className="mt-2 w-full px-3 py-2 text-xs font-medium bg-[#222222] text-[#B0B0B0] border border-[#333333] rounded-md hover:text-white hover:border-[#B8860B]/30 transition-colors"
              >
                {copiedCaption ? 'Copied!' : `Copy ${activePlatform} caption`}
              </button>
            </div>

            {/* Actions */}
            {selectedCarousel.status === 'pending_review' && (
              <div className="p-4 flex gap-2">
                <button
                  onClick={() => handleAction(selectedCarousel.id, 'approve')}
                  className="flex-1 px-3 py-2 bg-green-600/20 text-green-400 text-sm font-medium rounded-md border border-green-600/30 hover:bg-green-600/30 transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleAction(selectedCarousel.id, 'reject')}
                  className="flex-1 px-3 py-2 bg-red-600/20 text-red-400 text-sm font-medium rounded-md border border-red-600/30 hover:bg-red-600/30 transition-colors"
                >
                  Reject
                </button>
              </div>
            )}

            {selectedCarousel.status === 'approved' && (
              <div className="p-4 space-y-3">
                <p className="text-xs text-green-400 text-center">
                  Approved {selectedCarousel.approved_at ? new Date(selectedCarousel.approved_at).toLocaleString() : ''}
                </p>
                <div className="bg-[#141414] rounded-lg p-3 border border-[#333333]">
                  <label className="text-[10px] text-[#B8860B] uppercase tracking-widest block mb-2">Manual Post Workflow</label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[11px] text-[#B0B0B0]">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#B8860B]/20 text-[#B8860B] flex items-center justify-center text-[10px] font-bold">1</span>
                      Select platform above and click &ldquo;Download All Slides&rdquo;
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[#B0B0B0]">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#B8860B]/20 text-[#B8860B] flex items-center justify-center text-[10px] font-bold">2</span>
                      Copy the caption for that platform below
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[#B0B0B0]">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#B8860B]/20 text-[#B8860B] flex items-center justify-center text-[10px] font-bold">3</span>
                      Upload slides to Postbridge or post directly
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
