// ============================================================
// Phase 5 Block 5: Section Provenance
// Stores which evidence supported each generated section.
// Provides a complete audit trail: section → evidence_pack → facts → signals.
// ============================================================

import type { EvidencePackBundle, IssueSectionProvenance, MagazineSectionName } from '@/lib/types/evidence';
import { getSupabase } from '@/lib/supabase/client';
import { getEvidencePacks } from '@/lib/evidence/build-section-evidence-packs';

/** Sections that get provenance records. */
const PROVENANCE_SECTIONS: MagazineSectionName[] = [
  'cover_story',
  'implications',
  'enterprise',
  'industry_watch',
  'playbooks',
  'strategic_signals',
  'executive_briefing',
];

/**
 * Build and store provenance records for all generated sections.
 *
 * Uses both the Phase 4 evidence bundle (for signal/URL data) and
 * the Phase 5 issue_evidence_packs (for fact_ids and pack references).
 */
export async function storeSectionProvenance(
  issueId: string,
  evidenceBundle?: EvidencePackBundle,
): Promise<IssueSectionProvenance[]> {
  const supabase = getSupabase();

  // Fetch the Phase 5 persisted packs
  const packs = await getEvidencePacks(issueId);
  const packMap = new Map(packs.map((p) => [p.section_key, p]));

  const provenanceRows: Array<Omit<IssueSectionProvenance, 'id' | 'created_at'>> = [];

  for (const section of PROVENANCE_SECTIONS) {
    const pack = packMap.get(section);
    const bundlePack = evidenceBundle?.section_packs[section];

    // Collect source signal IDs from either Phase 5 pack or Phase 4 bundle
    const sourceSignalIds: string[] = [];
    if (bundlePack) {
      for (const item of bundlePack.evidence_items) {
        if (item.source_type === 'signal' && !sourceSignalIds.includes(item.source_id)) {
          sourceSignalIds.push(item.source_id);
        }
      }
    }

    // Collect reference URLs
    const referenceUrls: string[] = pack?.reference_urls || [];
    if (bundlePack && referenceUrls.length === 0) {
      for (const item of bundlePack.evidence_items) {
        if (item.source_url && !referenceUrls.includes(item.source_url)) {
          referenceUrls.push(item.source_url);
        }
      }
    }

    provenanceRows.push({
      issue_id: issueId,
      section_key: section,
      evidence_pack_id: pack?.id || null,
      source_signal_ids: sourceSignalIds,
      supporting_fact_ids: pack?.fact_ids || [],
      reference_urls: referenceUrls.slice(0, 10), // Cap at 10
    });
  }

  if (provenanceRows.length === 0) return [];

  // Remove existing provenance for this issue (idempotent)
  await supabase
    .from('issue_section_provenance')
    .delete()
    .eq('issue_id', issueId);

  const { data, error } = await supabase
    .from('issue_section_provenance')
    .insert(provenanceRows)
    .select();

  if (error) {
    throw new Error(`Failed to store section provenance: ${error.message}`);
  }

  return (data || []) as IssueSectionProvenance[];
}

/**
 * Retrieve provenance records for an issue.
 */
export async function getSectionProvenance(
  issueId: string,
): Promise<IssueSectionProvenance[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('issue_section_provenance')
    .select('*')
    .eq('issue_id', issueId)
    .order('section_key');

  if (error) throw new Error(`Failed to fetch provenance: ${error.message}`);
  return (data || []) as IssueSectionProvenance[];
}

/**
 * Get provenance for a specific section.
 */
export async function getSectionProvenanceByKey(
  issueId: string,
  sectionKey: MagazineSectionName,
): Promise<IssueSectionProvenance | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('issue_section_provenance')
    .select('*')
    .eq('issue_id', issueId)
    .eq('section_key', sectionKey)
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch section provenance: ${error.message}`);
  }
  return data as IssueSectionProvenance;
}
