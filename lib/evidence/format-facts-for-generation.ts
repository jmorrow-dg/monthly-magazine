// ============================================================
// Phase 5 Block 3: Format EvidenceFacts for Section Generation
// Converts persisted EvidenceFact rows into prompt-ready blocks
// for injection into section generation functions.
// ============================================================

import type { EvidenceFact, IssueEvidencePack, SectionEvidencePack, MagazineSectionName } from '@/lib/types/evidence';

/**
 * Convert persisted EvidenceFacts + IssueEvidencePack into a
 * SectionEvidencePack compatible with the existing generation functions.
 *
 * This bridges Phase 5 relational data back into the Phase 4 in-memory
 * format that formatEvidencePack() and generation functions expect.
 */
export function factsToSectionPack(
  pack: IssueEvidencePack,
  facts: EvidenceFact[],
): SectionEvidencePack {
  // Build a lookup for quick access
  const factMap = new Map(facts.map((f) => [f.id, f]));

  // Resolve fact_ids to evidence items in order
  const evidenceItems = pack.fact_ids
    .map((fid) => factMap.get(fid))
    .filter(Boolean)
    .map((fact, index) => ({
      id: `ev_fact_${fact!.id}_${index}`,
      source_type: 'signal' as const,
      source_id: fact!.signal_id,
      source_url: fact!.source_url,
      title: fact!.company
        ? `${fact!.company}: ${truncateText(fact!.fact_text, 80)}`
        : truncateText(fact!.fact_text, 100),
      evidence_text: fact!.fact_text,
      data_points: [], // Data points live in the Phase 4 layer
      company: fact!.company,
      category: fact!.topic || '',
      tags: [fact!.region].filter(Boolean) as string[],
      composite_score: fact!.confidence_score,
      signal_date: fact!.signal_date,
    }));

  return {
    section_name: pack.section_key as MagazineSectionName,
    evidence_items: evidenceItems,
    primary_narrative: null,
    section_relevance_score: evidenceItems.length > 0
      ? evidenceItems.reduce((sum, e) => sum + e.composite_score, 0) / evidenceItems.length
      : 0,
    metadata: {
      total_candidates: facts.length,
      selected_count: evidenceItems.length,
      min_relevance_threshold: 0,
      built_at: new Date().toISOString(),
    },
  };
}

/**
 * Build a lookup of section_key -> SectionEvidencePack from
 * persisted packs and facts.
 */
export function buildPackLookup(
  packs: IssueEvidencePack[],
  facts: EvidenceFact[],
): Map<MagazineSectionName, SectionEvidencePack> {
  const lookup = new Map<MagazineSectionName, SectionEvidencePack>();
  for (const pack of packs) {
    const sectionPack = factsToSectionPack(pack, facts);
    lookup.set(pack.section_key as MagazineSectionName, sectionPack);
  }
  return lookup;
}

function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + '...';
}
