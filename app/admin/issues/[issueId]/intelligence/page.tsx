'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import SectionIntelligenceBlock from '@/components/intelligence/SectionIntelligenceBlock';
import type {
  EvidenceFact,
  IssueEvidencePack,
  IssueClaim,
  IssueSectionProvenance,
  MagazineSectionName,
} from '@/lib/types/evidence';
import { ALL_SECTION_NAMES } from '@/lib/types/evidence';

type PageProps = {
  params: Promise<{ issueId: string }>;
};

interface IssueIntelligenceData {
  issue: {
    id: string;
    edition: number;
    month: number;
    year: number;
    cover_headline: string;
    status: string;
  };
  packs: IssueEvidencePack[];
  claims: IssueClaim[];
  provenance: IssueSectionProvenance[];
  facts: EvidenceFact[];
  facts_by_id: Record<string, EvidenceFact>;
}

const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function IssueIntelligencePage({ params }: PageProps) {
  const { issueId } = use(params);
  const [data, setData] = useState<IssueIntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/intelligence/issue/${issueId}`);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to load');
        }
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load intelligence data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [issueId]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[#333333] rounded w-64" />
          <div className="h-4 bg-[#333333] rounded w-96" />
          <div className="space-y-3 mt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-[#222222] rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <p className="text-[#C0392B] text-sm mb-4">{error || 'No data available'}</p>
        <Link href={`/admin/issues/${issueId}`} className="text-[#B8860B] text-sm hover:underline">
          &larr; Back to Editor
        </Link>
      </div>
    );
  }

  const { issue, packs, claims, provenance, facts_by_id } = data;
  const factsMap = new Map(Object.entries(facts_by_id));
  const totalClaims = claims.length;
  const totalFacts = data.facts.length;
  const groundedClaims = claims.filter((c) =>
    c.supporting_fact_ids.some((id) => factsMap.has(id)),
  ).length;

  // Group data by section
  const packsBySection = new Map<MagazineSectionName, IssueEvidencePack>();
  packs.forEach((p) => packsBySection.set(p.section_key, p));

  const claimsBySection = new Map<MagazineSectionName, IssueClaim[]>();
  claims.forEach((c) => {
    const list = claimsBySection.get(c.section_key) || [];
    list.push(c);
    claimsBySection.set(c.section_key, list);
  });

  const provenanceBySection = new Map<MagazineSectionName, IssueSectionProvenance>();
  provenance.forEach((p) => provenanceBySection.set(p.section_key, p));

  // Only show sections that have some intelligence data
  const activeSections = ALL_SECTION_NAMES.filter((key) => {
    const sectionClaims = claimsBySection.get(key) || [];
    const sectionPack = packsBySection.get(key);
    const sectionProvenance = provenanceBySection.get(key);
    return sectionClaims.length > 0 || (sectionPack?.fact_ids.length ?? 0) > 0 || (sectionProvenance?.source_signal_ids.length ?? 0) > 0;
  });

  const groundingPct = totalClaims > 0 ? Math.round((groundedClaims / totalClaims) * 100) : 0;

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Link
            href={`/admin/issues/${issueId}`}
            className="text-[#B8860B] text-xs hover:underline"
          >
            &larr; Editor
          </Link>
          <span className="text-[#333333]">|</span>
          <Link
            href="/admin/intelligence"
            className="text-[#B8860B] text-xs hover:underline"
          >
            Intelligence Hub
          </Link>
        </div>

        <h1 className="text-2xl font-[family-name:var(--font-playfair)] text-white mb-1">
          Intelligence View
        </h1>
        <p className="text-sm text-[#888888]">
          Edition {String(issue.edition).padStart(2, '0')} &middot; {MONTH_NAMES[issue.month]} {issue.year} &middot;{' '}
          <span className="text-[#B0B0B0]">{issue.cover_headline}</span>
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        <StatCard label="Claims" value={String(totalClaims)} />
        <StatCard label="Evidence Facts" value={String(totalFacts)} />
        <StatCard label="Grounded" value={`${groundingPct}%`} color={groundingPct >= 80 ? '#22C55E' : groundingPct >= 50 ? '#F59E0B' : '#C0392B'} />
        <StatCard label="Sections" value={`${activeSections.length}/14`} />
      </div>

      {/* Section intelligence blocks */}
      {activeSections.length === 0 ? (
        <div className="bg-[#222222] border border-[#333333] rounded-lg p-8 text-center">
          <p className="text-[#888888] text-sm">
            No intelligence data available for this issue.
          </p>
          <p className="text-[#666666] text-xs mt-2">
            Generate content using signals mode to populate evidence, claims, and provenance.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeSections.map((sectionKey) => (
            <SectionIntelligenceBlock
              key={sectionKey}
              sectionKey={sectionKey}
              pack={packsBySection.get(sectionKey) ?? null}
              claims={claimsBySection.get(sectionKey) ?? []}
              provenance={provenanceBySection.get(sectionKey) ?? null}
              factsMap={factsMap}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="bg-[#222222] border border-[#333333] rounded-lg p-3 text-center">
      <div
        className="text-lg font-semibold"
        style={{ color: color || '#FFFFFF' }}
      >
        {value}
      </div>
      <div className="text-[10px] text-[#888888] mt-0.5">{label}</div>
    </div>
  );
}
