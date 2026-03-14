'use client';

import type { EvidenceFact } from '@/lib/types/evidence';

interface EvidenceCardProps {
  fact: EvidenceFact;
  /** Compact mode for inline use within claim cards */
  compact?: boolean;
}

function getConfidenceColor(score: number): string {
  if (score >= 0.8) return '#22C55E';
  if (score >= 0.5) return '#F59E0B';
  return '#94A3B8';
}

/**
 * Displays a single evidence fact with source, confidence, and metadata.
 * Building block for the Issue Intelligence View and Claim Cards.
 */
export default function EvidenceCard({ fact, compact = false }: EvidenceCardProps) {
  const confidenceColor = getConfidenceColor(fact.confidence_score);
  const confidencePct = Math.round(fact.confidence_score * 100);

  if (compact) {
    return (
      <div className="bg-[#1C1C1C] rounded p-2.5 border border-[#2A2A2E]">
        <p className="text-[11px] text-[#B0B0B0] leading-relaxed mb-1.5">
          {fact.fact_text}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#2A2A2E] text-[#888888]">
            {fact.source_name}
          </span>
          {fact.company && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#B8860B]/10 text-[#B8860B]">
              {fact.company}
            </span>
          )}
          <span className="text-[9px]" style={{ color: confidenceColor }}>
            {confidencePct}%
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#222222] border border-[#333333] rounded-lg p-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {fact.topic && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#3B82F6]/10 text-[#3B82F6] uppercase tracking-wider shrink-0">
              {fact.topic}
            </span>
          )}
          {fact.company && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#B8860B]/10 text-[#B8860B] shrink-0">
              {fact.company}
            </span>
          )}
          {fact.region && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#8B5CF6]/10 text-[#8B5CF6] shrink-0">
              {fact.region}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: confidenceColor }}
          />
          <span className="text-[10px] font-medium" style={{ color: confidenceColor }}>
            {confidencePct}%
          </span>
        </div>
      </div>

      {/* Fact text */}
      <p className="text-[13px] text-[#E0E0E0] leading-relaxed mb-3">
        {fact.fact_text}
      </p>

      {/* Source row */}
      <div className="flex items-center justify-between text-[10px] text-[#666666]">
        <div className="flex items-center gap-2">
          <span className="text-[#888888]">{fact.source_name}</span>
          {fact.source_url && (
            <a
              href={fact.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#B8860B] hover:underline"
            >
              View source
            </a>
          )}
        </div>
        {fact.signal_date && (
          <span>{new Date(fact.signal_date).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  );
}
