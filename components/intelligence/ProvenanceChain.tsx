'use client';

import type { EvidenceFact, IssueClaim, IssueSectionProvenance } from '@/lib/types/evidence';

interface ProvenanceChainProps {
  claim: IssueClaim;
  facts: EvidenceFact[];
  provenance: IssueSectionProvenance | null;
}

/**
 * Visualises the traceability chain for a single claim:
 * Signal(s) -> Evidence Fact(s) -> Claim
 * Displayed as a compact vertical chain.
 */
export default function ProvenanceChain({ claim, facts, provenance }: ProvenanceChainProps) {
  const signalIds = provenance?.source_signal_ids ?? [];
  const uniqueSignalIds = [...new Set([
    ...signalIds,
    ...facts.map((f) => f.signal_id),
  ])];

  return (
    <div className="bg-[#1C1C1C] border border-[#2A2A2E] rounded-lg p-3">
      {/* Chain visualisation */}
      <div className="space-y-0">
        {/* Signals layer */}
        {uniqueSignalIds.length > 0 && (
          <ChainNode
            type="signal"
            label="Source Signals"
            count={uniqueSignalIds.length}
            detail={uniqueSignalIds.map((id) => id.slice(0, 12) + '...').join(', ')}
          />
        )}

        {/* Connector */}
        {uniqueSignalIds.length > 0 && facts.length > 0 && <ChainConnector />}

        {/* Facts layer */}
        {facts.length > 0 && (
          <ChainNode
            type="fact"
            label="Evidence Facts"
            count={facts.length}
            detail={facts.map((f) => f.fact_text.slice(0, 60) + '...').join(' | ')}
          />
        )}

        {/* Connector */}
        {facts.length > 0 && <ChainConnector />}

        {/* Claim layer */}
        <ChainNode
          type="claim"
          label="Claim"
          count={1}
          detail={claim.claim_text}
        />
      </div>
    </div>
  );
}

function ChainNode({
  type,
  label,
  count,
  detail,
}: {
  type: 'signal' | 'fact' | 'claim';
  label: string;
  count: number;
  detail: string;
}) {
  const colors: Record<string, { bg: string; border: string; text: string; dot: string }> = {
    signal: { bg: '#3B82F6', border: '#3B82F6', text: '#3B82F6', dot: '#3B82F6' },
    fact: { bg: '#B8860B', border: '#B8860B', text: '#B8860B', dot: '#B8860B' },
    claim: { bg: '#22C55E', border: '#22C55E', text: '#22C55E', dot: '#22C55E' },
  };

  const c = colors[type];

  return (
    <div className="flex items-start gap-2.5">
      <div
        className="w-2 h-2 rounded-full mt-1 shrink-0"
        style={{ backgroundColor: c.dot }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span
            className="text-[9px] uppercase tracking-wider font-medium"
            style={{ color: c.text }}
          >
            {label}
          </span>
          <span className="text-[9px] text-[#666666]">({count})</span>
        </div>
        <p className="text-[10px] text-[#888888] leading-relaxed mt-0.5 line-clamp-2">
          {detail}
        </p>
      </div>
    </div>
  );
}

function ChainConnector() {
  return (
    <div className="flex items-center pl-[3px] py-0.5">
      <div className="w-px h-3 bg-[#333333]" />
    </div>
  );
}
