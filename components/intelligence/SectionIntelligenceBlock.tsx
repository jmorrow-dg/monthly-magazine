'use client';

import { useState } from 'react';
import type { IssueEvidencePack, IssueClaim, IssueSectionProvenance, EvidenceFact, MagazineSectionName } from '@/lib/types/evidence';
import ClaimCard from './ClaimCard';
import EvidenceCard from './EvidenceCard';

const SECTION_LABELS: Record<MagazineSectionName, string> = {
  cover_story: 'Cover Story',
  implications: 'Strategic Implications',
  enterprise: 'Enterprise AI',
  industry_watch: 'Industry Watch',
  tools: 'Tools & Platforms',
  playbooks: 'Operator Playbooks',
  strategic_signals: 'Strategic Signals',
  briefing_prompts: 'Briefing Prompts',
  executive_briefing: 'Executive Briefing',
  ai_native_org: 'AI Native Organisation',
  editorial: 'Editorial Note',
  why_this_matters: 'Why This Matters',
  regional_signals: 'Regional Signals',
  global_landscape: 'Global Landscape',
};

interface SectionIntelligenceBlockProps {
  sectionKey: MagazineSectionName;
  pack: IssueEvidencePack | null;
  claims: IssueClaim[];
  provenance: IssueSectionProvenance | null;
  factsMap: Map<string, EvidenceFact>;
}

type TabView = 'claims' | 'evidence' | 'provenance';

/**
 * Displays the intelligence layer for a single magazine section:
 * claims, supporting evidence facts, and provenance chain.
 */
export default function SectionIntelligenceBlock({
  sectionKey,
  pack,
  claims,
  provenance,
  factsMap,
}: SectionIntelligenceBlockProps) {
  const [activeTab, setActiveTab] = useState<TabView>('claims');
  const label = SECTION_LABELS[sectionKey] || sectionKey;

  const claimCount = claims.length;
  const factCount = pack?.fact_ids.length ?? 0;
  const sourceCount = provenance?.source_signal_ids.length ?? 0;

  // No intelligence data at all
  if (claimCount === 0 && factCount === 0 && sourceCount === 0) {
    return null;
  }

  const resolvedFacts = (pack?.fact_ids ?? [])
    .map((id) => factsMap.get(id))
    .filter((f): f is EvidenceFact => !!f);

  const tabs: { key: TabView; label: string; count: number }[] = [
    { key: 'claims', label: 'Claims', count: claimCount },
    { key: 'evidence', label: 'Evidence', count: factCount },
    { key: 'provenance', label: 'Sources', count: sourceCount },
  ];

  return (
    <div className="bg-[#222222] border border-[#333333] rounded-lg overflow-hidden">
      {/* Section header */}
      <div className="px-4 py-3 border-b border-[#333333] flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-white">{label}</h3>
        <div className="flex items-center gap-3 text-[10px] text-[#888888]">
          <span>{claimCount} claim{claimCount !== 1 ? 's' : ''}</span>
          <span>{factCount} fact{factCount !== 1 ? 's' : ''}</span>
          <span>{sourceCount} source{sourceCount !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-[#333333]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 text-[10px] uppercase tracking-wider transition-colors ${
              activeTab === tab.key
                ? 'text-[#B8860B] border-b-2 border-[#B8860B] bg-[#B8860B]/5'
                : 'text-[#888888] hover:text-white'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-3 max-h-96 overflow-y-auto">
        {activeTab === 'claims' && (
          <div className="space-y-2">
            {claims.length === 0 ? (
              <p className="text-[11px] text-[#666666] text-center py-4">
                No claims extracted for this section.
              </p>
            ) : (
              claims.map((claim) => {
                const supportingFacts = claim.supporting_fact_ids
                  .map((id) => factsMap.get(id))
                  .filter((f): f is EvidenceFact => !!f);
                return (
                  <ClaimCard key={claim.id} claim={claim} supportingFacts={supportingFacts} />
                );
              })
            )}
          </div>
        )}

        {activeTab === 'evidence' && (
          <div className="space-y-2">
            {resolvedFacts.length === 0 ? (
              <p className="text-[11px] text-[#666666] text-center py-4">
                No evidence facts for this section.
              </p>
            ) : (
              resolvedFacts.map((fact) => (
                <EvidenceCard key={fact.id} fact={fact} />
              ))
            )}
          </div>
        )}

        {activeTab === 'provenance' && (
          <div className="space-y-3">
            {!provenance ? (
              <p className="text-[11px] text-[#666666] text-center py-4">
                No provenance data for this section.
              </p>
            ) : (
              <>
                {/* Signal sources */}
                {provenance.source_signal_ids.length > 0 && (
                  <div>
                    <div className="text-[9px] text-[#888888] uppercase tracking-wider mb-1.5">
                      Source Signals ({provenance.source_signal_ids.length})
                    </div>
                    <div className="space-y-1">
                      {provenance.source_signal_ids.map((id) => (
                        <div
                          key={id}
                          className="text-[10px] text-[#B0B0B0] bg-[#1C1C1C] rounded px-2.5 py-1.5 font-mono truncate"
                        >
                          {id}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reference URLs */}
                {provenance.reference_urls.length > 0 && (
                  <div>
                    <div className="text-[9px] text-[#888888] uppercase tracking-wider mb-1.5">
                      References ({provenance.reference_urls.length})
                    </div>
                    <div className="space-y-1">
                      {provenance.reference_urls.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-[10px] text-[#3B82F6] hover:underline bg-[#1C1C1C] rounded px-2.5 py-1.5 truncate"
                        >
                          {url}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Supporting facts */}
                {provenance.supporting_fact_ids.length > 0 && (
                  <div>
                    <div className="text-[9px] text-[#888888] uppercase tracking-wider mb-1.5">
                      Supporting Facts ({provenance.supporting_fact_ids.length})
                    </div>
                    <div className="space-y-1">
                      {provenance.supporting_fact_ids.map((id) => {
                        const fact = factsMap.get(id);
                        return fact ? (
                          <EvidenceCard key={id} fact={fact} compact />
                        ) : (
                          <div
                            key={id}
                            className="text-[10px] text-[#666666] bg-[#1C1C1C] rounded px-2.5 py-1.5 font-mono"
                          >
                            {id}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
