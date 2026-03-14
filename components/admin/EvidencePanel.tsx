'use client';

import { useState } from 'react';
import type { EvidencePackBundle, SectionEvidencePack, MagazineSectionName } from '@/lib/types/evidence';

interface EvidencePanelProps {
  evidenceBundle: EvidencePackBundle | null;
}

const SECTION_LABELS: Record<MagazineSectionName, string> = {
  cover_story: 'Cover Story',
  implications: 'Implications',
  enterprise: 'Enterprise',
  industry_watch: 'Industry Watch',
  tools: 'Tools',
  playbooks: 'Playbooks',
  strategic_signals: 'Strategic Signals',
  briefing_prompts: 'Briefing Prompts',
  executive_briefing: 'Executive Briefing',
  ai_native_org: 'AI Native Org',
  editorial: 'Editorial',
  why_this_matters: 'Why This Matters',
  regional_signals: 'Regional Signals',
  global_landscape: 'Global Landscape',
};

function getRelevanceColor(score: number): string {
  if (score >= 0.6) return '#22C55E';
  if (score >= 0.3) return '#F59E0B';
  return '#94A3B8';
}

export default function EvidencePanel({ evidenceBundle }: EvidencePanelProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  if (!evidenceBundle) {
    return (
      <div style={{ padding: '16px', background: '#1C1C1E', borderRadius: '8px', marginTop: '16px' }}>
        <h3 style={{ color: '#B8860B', fontSize: '14px', fontWeight: 600, margin: 0 }}>
          Evidence Engine
        </h3>
        <p style={{ color: '#888', fontSize: '13px', marginTop: '8px' }}>
          No evidence bundle available. Evidence packs are generated automatically when using signals mode.
        </p>
      </div>
    );
  }

  const totalEvidence = Object.values(evidenceBundle.section_packs).reduce(
    (sum, pack) => sum + pack.evidence_items.length,
    0,
  );

  const sections = Object.entries(evidenceBundle.section_packs) as [MagazineSectionName, SectionEvidencePack][];

  return (
    <div style={{ padding: '16px', background: '#1C1C1E', borderRadius: '8px', marginTop: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ color: '#B8860B', fontSize: '14px', fontWeight: 600, margin: 0 }}>
          Evidence Engine
        </h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          style={{
            background: 'none',
            border: 'none',
            color: '#B8860B',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '12px' }}>
        <StatBox label="Evidence Items" value={String(totalEvidence)} />
        <StatBox label="Sections" value={`${sections.filter(([, p]) => p.evidence_items.length > 0).length}/14`} />
        <StatBox label="Pipeline" value={`${evidenceBundle.pipeline_duration_ms}ms`} />
      </div>

      {/* Source counts */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '11px', color: '#888' }}>
        <span>{evidenceBundle.source_signal_ids.length} signals</span>
        <span>{evidenceBundle.source_cluster_ids.length} clusters</span>
        <span>{evidenceBundle.source_trend_ids.length} trends</span>
      </div>

      {/* Section details */}
      {showDetails && (
        <div style={{ marginTop: '16px' }}>
          {sections.map(([sectionName, pack]) => (
            <SectionRow
              key={sectionName}
              sectionName={sectionName}
              pack={pack}
              isExpanded={expandedSection === sectionName}
              onToggle={() => setExpandedSection(expandedSection === sectionName ? null : sectionName)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: '#2A2A2E', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
      <div style={{ color: '#fff', fontSize: '16px', fontWeight: 600 }}>{value}</div>
      <div style={{ color: '#888', fontSize: '10px', marginTop: '2px' }}>{label}</div>
    </div>
  );
}

function SectionRow({
  sectionName,
  pack,
  isExpanded,
  onToggle,
}: {
  sectionName: MagazineSectionName;
  pack: SectionEvidencePack;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const label = SECTION_LABELS[sectionName] || sectionName;
  const relevanceColor = getRelevanceColor(pack.section_relevance_score);
  const hasItems = pack.evidence_items.length > 0;

  return (
    <div style={{ borderBottom: '1px solid #333', paddingBottom: '8px', marginBottom: '8px' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'none',
          border: 'none',
          padding: '4px 0',
          cursor: hasItems ? 'pointer' : 'default',
          opacity: hasItems ? 1 : 0.5,
        }}
      >
        <span style={{ color: '#fff', fontSize: '13px' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#888', fontSize: '11px' }}>
            {pack.evidence_items.length} items
          </span>
          <div
            style={{
              width: '40px',
              height: '4px',
              background: '#333',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.min(100, pack.section_relevance_score * 100)}%`,
                height: '100%',
                background: relevanceColor,
                borderRadius: '2px',
              }}
            />
          </div>
          {hasItems && (
            <span style={{ color: '#888', fontSize: '10px' }}>{isExpanded ? '▾' : '▸'}</span>
          )}
        </div>
      </button>

      {isExpanded && hasItems && (
        <div style={{ paddingLeft: '12px', marginTop: '8px' }}>
          {pack.primary_narrative && (
            <p style={{ color: '#B8860B', fontSize: '11px', fontStyle: 'italic', marginBottom: '8px' }}>
              {pack.primary_narrative.length > 150
                ? pack.primary_narrative.slice(0, 150) + '...'
                : pack.primary_narrative}
            </p>
          )}
          {pack.evidence_items.map((item, i) => (
            <div
              key={item.id}
              style={{
                background: '#2A2A2E',
                borderRadius: '4px',
                padding: '8px',
                marginBottom: '4px',
                fontSize: '11px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#fff', fontWeight: 500 }}>
                  [{i + 1}] {item.title.length > 60 ? item.title.slice(0, 60) + '...' : item.title}
                </span>
                <span style={{ color: '#B8860B', fontSize: '10px' }}>
                  {item.composite_score.toFixed(1)}
                </span>
              </div>
              <p style={{ color: '#aaa', margin: '0 0 4px 0', lineHeight: '1.4' }}>
                {item.evidence_text.length > 200
                  ? item.evidence_text.slice(0, 200) + '...'
                  : item.evidence_text}
              </p>
              {item.data_points.length > 0 && (
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {item.data_points.slice(0, 3).map((dp, j) => (
                    <span
                      key={j}
                      style={{
                        background: '#3A3A40',
                        color: '#B8860B',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontSize: '10px',
                      }}
                    >
                      {dp.value}
                    </span>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px', color: '#666', fontSize: '10px' }}>
                <span>{item.source_type}</span>
                {item.company && <span>{item.company}</span>}
                {item.source_url && (
                  <a
                    href={item.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#B8860B' }}
                  >
                    source
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
