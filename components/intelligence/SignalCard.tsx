'use client';

import { useState } from 'react';
import type { AISignalRow } from '@/lib/supabase/intelligence-queries';

interface SignalCardProps {
  signal: AISignalRow;
  /** If true, shows expanded details by default */
  defaultExpanded?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Model Releases': '#8B5CF6',
  'Agent Systems': '#3B82F6',
  'Enterprise AI': '#B8860B',
  'AI Infrastructure': '#22C55E',
  'AI Security': '#C0392B',
  'AI Strategy': '#F59E0B',
};

function getScoreColor(score: number | null): string {
  if (!score) return '#666666';
  if (score >= 7) return '#22C55E';
  if (score >= 4) return '#F59E0B';
  return '#94A3B8';
}

/**
 * Displays a signal from the ai_signals table.
 * Expandable to show full details (what happened, why it matters, etc.)
 */
export default function SignalCard({ signal, defaultExpanded = false }: SignalCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const categoryColor = CATEGORY_COLORS[signal.category] || '#888888';

  return (
    <div className="bg-[#222222] border border-[#333333] rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4"
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-medium"
              style={{
                backgroundColor: `${categoryColor}15`,
                color: categoryColor,
              }}
            >
              {signal.category}
            </span>
            {signal.company && (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#B8860B]/10 text-[#B8860B]">
                {signal.company}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {signal.composite_score !== null && (
              <span
                className="text-[11px] font-semibold"
                style={{ color: getScoreColor(signal.composite_score) }}
              >
                {signal.composite_score.toFixed(1)}
              </span>
            )}
            <span className="text-[10px] text-[#666666]">
              {expanded ? '\u25B2' : '\u25BC'}
            </span>
          </div>
        </div>

        <h4 className="text-[13px] font-medium text-white leading-snug mb-1">
          {signal.title}
        </h4>
        <p className="text-[11px] text-[#B0B0B0] leading-relaxed line-clamp-2">
          {signal.summary}
        </p>

        {/* Footer meta */}
        <div className="flex items-center gap-3 mt-2 text-[9px] text-[#666666]">
          <span>{signal.source}</span>
          {signal.signal_date && (
            <span>{new Date(signal.signal_date).toLocaleDateString()}</span>
          )}
          {signal.topic && <span>{signal.topic}</span>}
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-[#333333] pt-3">
          {signal.what_happened && (
            <DetailBlock label="What Happened" text={signal.what_happened} />
          )}
          {signal.why_it_matters && (
            <DetailBlock label="Why It Matters" text={signal.why_it_matters} />
          )}
          {signal.who_should_care && (
            <DetailBlock label="Who Should Care" text={signal.who_should_care} />
          )}
          {signal.practical_implication && (
            <DetailBlock label="Practical Implication" text={signal.practical_implication} />
          )}

          {/* Tags */}
          {signal.tags && signal.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {signal.tags.map((tag, i) => (
                <span
                  key={i}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-[#2A2A2E] text-[#888888]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Source link */}
          {signal.source_url && (
            <a
              href={signal.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-[10px] text-[#B8860B] hover:underline"
            >
              View original source &rarr;
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function DetailBlock({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <div className="text-[9px] text-[#888888] uppercase tracking-wider mb-0.5">
        {label}
      </div>
      <p className="text-[11px] text-[#B0B0B0] leading-relaxed">{text}</p>
    </div>
  );
}
