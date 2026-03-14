'use client';

import { useState } from 'react';
import type { IssueClaim, EvidenceFact } from '@/lib/types/evidence';
import EvidenceCard from './EvidenceCard';

interface ClaimCardProps {
  claim: IssueClaim;
  /** Pre-resolved supporting facts (looked up from factsMap) */
  supportingFacts: EvidenceFact[];
}

/**
 * Displays a claim extracted from a magazine section,
 * with expandable supporting evidence facts.
 */
export default function ClaimCard({ claim, supportingFacts }: ClaimCardProps) {
  const [expanded, setExpanded] = useState(false);
  const hasEvidence = supportingFacts.length > 0;
  const isGrounded = hasEvidence;

  return (
    <div className="bg-[#1C1C1C] border border-[#2A2A2E] rounded-lg overflow-hidden">
      {/* Claim header */}
      <button
        onClick={() => hasEvidence && setExpanded(!expanded)}
        className="w-full text-left p-3 flex items-start gap-3"
        style={{ cursor: hasEvidence ? 'pointer' : 'default' }}
      >
        {/* Grounding indicator */}
        <div className="shrink-0 mt-0.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: isGrounded ? '#22C55E' : '#C0392B',
            }}
            title={isGrounded ? 'Evidence-grounded' : 'No supporting evidence'}
          />
        </div>

        {/* Claim text */}
        <div className="flex-1 min-w-0">
          <p className="text-[12px] text-[#E0E0E0] leading-relaxed">
            {claim.claim_text}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[9px] text-[#888888]">
              {supportingFacts.length} supporting fact{supportingFacts.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Expand arrow */}
        {hasEvidence && (
          <span className="text-[10px] text-[#666666] shrink-0 mt-0.5">
            {expanded ? '\u25B2' : '\u25BC'}
          </span>
        )}
      </button>

      {/* Expanded evidence */}
      {expanded && hasEvidence && (
        <div className="px-3 pb-3 space-y-1.5 border-t border-[#2A2A2E] pt-2">
          <div className="text-[9px] text-[#888888] uppercase tracking-wider mb-1">
            Supporting Evidence
          </div>
          {supportingFacts.map((fact) => (
            <EvidenceCard key={fact.id} fact={fact} compact />
          ))}
        </div>
      )}
    </div>
  );
}
