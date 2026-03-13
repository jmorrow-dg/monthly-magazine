'use client';

import { useState, useEffect } from 'react';

type AIGeneratePanelProps = {
  issueId: string;
  onGenerated: () => void;
};

type GenerationMode = 'sources' | 'signals';

type SignalPreview = {
  title: string;
  category: string;
  composite_score: number;
};

export default function AIGeneratePanel({ issueId, onGenerated }: AIGeneratePanelProps) {
  const [mode, setMode] = useState<GenerationMode>('sources');
  const [sources, setSources] = useState('');
  const [monthYear, setMonthYear] = useState('');
  const [instructions, setInstructions] = useState('');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Signal preview state
  const [signalPreview, setSignalPreview] = useState<SignalPreview[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState('');

  // Set default month to current month
  useEffect(() => {
    if (!monthYear) {
      const now = new Date();
      setMonthYear(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    }
  }, [monthYear]);

  // Fetch signal preview when month changes in signals mode
  useEffect(() => {
    if (mode !== 'signals' || !monthYear || !/^\d{4}-\d{2}$/.test(monthYear)) {
      setSignalPreview([]);
      return;
    }

    let cancelled = false;
    setLoadingPreview(true);
    setPreviewError('');

    fetch(`/api/intelligence/signal-preview?month_year=${encodeURIComponent(monthYear)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Could not load signal preview');
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setSignalPreview(data.signals || []);
          setLoadingPreview(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setPreviewError(err.message);
          setSignalPreview([]);
          setLoadingPreview(false);
        }
      });

    return () => { cancelled = true; };
  }, [mode, monthYear]);

  async function handleGenerate() {
    if (mode === 'sources') {
      const sourceLines = sources
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      if (sourceLines.length === 0) {
        setError('Please add at least one source (URL or text snippet).');
        return;
      }
    }

    if (mode === 'signals' && (!monthYear || !/^\d{4}-\d{2}$/.test(monthYear))) {
      setError('Please select a valid month.');
      return;
    }

    setGenerating(true);
    setError('');
    setProgress(
      mode === 'signals'
        ? 'Fetching intelligence signals and generating content... This may take up to 90 seconds.'
        : 'Generating content with Claude... This may take up to 60 seconds.',
    );

    try {
      const body =
        mode === 'signals'
          ? {
              mode: 'signals' as const,
              monthYear,
              instructions: instructions.trim() || undefined,
            }
          : {
              mode: 'sources' as const,
              sources: sources
                .split('\n')
                .map((s) => s.trim())
                .filter(Boolean),
              instructions: instructions.trim() || undefined,
            };

      const res = await fetch(`/api/issues/${issueId}/ai-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Generation failed');
      }

      setProgress('');
      setSources('');
      setInstructions('');
      setIsOpen(false);
      onGenerated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
      setProgress('');
    } finally {
      setGenerating(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-[#B8860B]/10 to-[#8B5CF6]/10 border border-[#B8860B]/30 rounded-lg text-sm font-semibold text-[#B8860B] hover:from-[#B8860B]/20 hover:to-[#8B5CF6]/20 hover:border-[#B8860B]/50 transition-all"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
        Generate Content with AI
      </button>
    );
  }

  const canGenerate =
    mode === 'signals'
      ? !!monthYear && /^\d{4}-\d{2}$/.test(monthYear)
      : !!sources.trim();

  return (
    <div className="bg-gradient-to-br from-[#1C1C1C] to-[#222222] border border-[#B8860B]/30 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#333333]">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B8860B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <h3 className="text-sm font-semibold text-[#B8860B]">AI Content Generation</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-[#888888] hover:text-white text-xs transition-colors"
          disabled={generating}
        >
          Close
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Mode Toggle */}
        <div>
          <label className="block text-[10px] text-[#888888] uppercase tracking-wider mb-1.5">
            Generation Mode
          </label>
          <div className="flex rounded-lg overflow-hidden border border-[#333333]">
            <button
              onClick={() => setMode('signals')}
              disabled={generating}
              className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                mode === 'signals'
                  ? 'bg-[#B8860B] text-white'
                  : 'bg-[#141414] text-[#888888] hover:text-white'
              }`}
            >
              From Intelligence Signals
            </button>
            <button
              onClick={() => setMode('sources')}
              disabled={generating}
              className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                mode === 'sources'
                  ? 'bg-[#B8860B] text-white'
                  : 'bg-[#141414] text-[#888888] hover:text-white'
              }`}
            >
              From Source URLs
            </button>
          </div>
        </div>

        {/* Mode-specific inputs */}
        {mode === 'signals' ? (
          <div>
            <label className="block text-[10px] text-[#888888] uppercase tracking-wider mb-1.5">
              Month <span className="text-[#C0392B]">*</span>
            </label>
            <input
              type="month"
              value={monthYear}
              onChange={(e) => setMonthYear(e.target.value)}
              className="w-full px-3 py-2 bg-[#141414] border border-[#333333] rounded text-white text-sm focus:outline-none focus:border-[#B8860B]"
              disabled={generating}
            />
            <p className="text-[10px] text-[#666666] mt-1">
              Signals from the Intelligence Hub will be used as source material.
            </p>

            {/* Signal preview */}
            {loadingPreview && (
              <div className="mt-2 text-xs text-[#888888]">Loading signal preview...</div>
            )}
            {previewError && (
              <div className="mt-2 text-xs text-[#C0392B]">{previewError}</div>
            )}
            {signalPreview.length > 0 && (
              <div className="mt-2 bg-[#141414] border border-[#333333]/50 rounded p-2 max-h-36 overflow-y-auto">
                <div className="text-[10px] text-[#B8860B] uppercase tracking-wider mb-1">
                  {signalPreview.length} signals available
                </div>
                {signalPreview.slice(0, 8).map((s, i) => (
                  <div key={i} className="flex items-center gap-2 py-0.5 text-[10px]">
                    <span className="text-[#B8860B] font-mono w-6 text-right flex-shrink-0">
                      {s.composite_score.toFixed(1)}
                    </span>
                    <span className="text-[#666666] flex-shrink-0 w-20 truncate">{s.category}</span>
                    <span className="text-[#CCCCCC] truncate">{s.title}</span>
                  </div>
                ))}
                {signalPreview.length > 8 && (
                  <div className="text-[10px] text-[#666666] pt-1">
                    + {signalPreview.length - 8} more signals
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-[10px] text-[#888888] uppercase tracking-wider mb-1.5">
              Source Material <span className="text-[#C0392B]">*</span>
            </label>
            <textarea
              value={sources}
              onChange={(e) => setSources(e.target.value)}
              rows={5}
              placeholder={"Paste URLs or text snippets, one per line:\nhttps://techcrunch.com/article-about-ai...\nhttps://blog.openai.com/new-release...\nKey point: Enterprise AI adoption grew 40% in Q1"}
              className="w-full px-3 py-2 bg-[#141414] border border-[#333333] rounded text-white text-sm focus:outline-none focus:border-[#B8860B] resize-y placeholder-[#555555] leading-relaxed"
              disabled={generating}
            />
            <p className="text-[10px] text-[#666666] mt-1">
              Add URLs to articles or paste text snippets. AI will use these as source material.
            </p>
          </div>
        )}

        {/* Instructions */}
        <div>
          <label className="block text-[10px] text-[#888888] uppercase tracking-wider mb-1.5">
            Additional Instructions <span className="text-[#666666]">(optional)</span>
          </label>
          <input
            type="text"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="e.g. Focus on healthcare sector, emphasise security themes..."
            className="w-full px-3 py-2 bg-[#141414] border border-[#333333] rounded text-white text-sm focus:outline-none focus:border-[#B8860B] placeholder-[#555555]"
            disabled={generating}
          />
        </div>

        {/* Status messages */}
        {progress && (
          <div className="flex items-center gap-2 text-xs text-[#B8860B] bg-[#B8860B]/10 border border-[#B8860B]/20 rounded-lg px-3 py-2.5">
            <svg className="animate-spin h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
            </svg>
            {progress}
          </div>
        )}

        {error && (
          <div className="text-xs text-[#C0392B] bg-[#C0392B]/10 border border-[#C0392B]/20 rounded-lg px-3 py-2.5">
            {error}
          </div>
        )}

        {/* Warning */}
        <div className="text-[10px] text-[#666666] bg-[#141414] rounded px-3 py-2 border border-[#333333]/50">
          This will generate all sections (cover story, implications, enterprise, industry watch, tools, playbooks, strategic signals, editorial, and &ldquo;Why This Matters&rdquo;) and overwrite any existing content. Review the generated content carefully before publishing.
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={generating || !canGenerate}
          className="w-full py-2.5 text-sm font-semibold rounded-lg transition-all disabled:opacity-40 bg-[#B8860B] text-white hover:bg-[#D4A843] disabled:hover:bg-[#B8860B]"
        >
          {generating
            ? 'Generating...'
            : mode === 'signals'
              ? 'Generate from Intelligence Signals'
              : 'Generate All Sections'}
        </button>
      </div>
    </div>
  );
}
