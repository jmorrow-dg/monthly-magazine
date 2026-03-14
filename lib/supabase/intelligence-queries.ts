// ============================================================
// Phase 7: Intelligence Surfaces — Read-Only Query Helpers
// Reads from existing Phase 5 tables. No schema changes.
// ============================================================

import { getSupabase } from './client';
import type { EvidenceFact, IssueEvidencePack, IssueClaim, IssueSectionProvenance, MagazineSectionName } from '@/lib/types/evidence';

// ── Evidence Facts ─────────────────────────────────────────

/** Fetch all evidence facts for a given issue (via its evidence packs). */
export async function getEvidenceFactsForIssue(issueId: string): Promise<EvidenceFact[]> {
  const supabase = getSupabase();

  // First get fact IDs from the issue's evidence packs
  const packs = await getEvidencePacksForIssue(issueId);
  const allFactIds = packs.flatMap((p) => p.fact_ids);
  const uniqueIds = [...new Set(allFactIds)];

  if (uniqueIds.length === 0) return [];

  const { data, error } = await supabase
    .from('evidence_facts')
    .select('*')
    .in('id', uniqueIds)
    .order('confidence_score', { ascending: false });

  if (error) throw new Error(`Failed to fetch evidence facts: ${error.message}`);
  return (data || []) as EvidenceFact[];
}

/** Fetch evidence facts by their IDs. */
export async function getEvidenceFactsByIds(factIds: string[]): Promise<EvidenceFact[]> {
  if (factIds.length === 0) return [];
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('evidence_facts')
    .select('*')
    .in('id', factIds)
    .order('confidence_score', { ascending: false });

  if (error) throw new Error(`Failed to fetch evidence facts: ${error.message}`);
  return (data || []) as EvidenceFact[];
}

/** Fetch all evidence facts (paginated, for the signal explorer). */
export async function listEvidenceFacts(options?: {
  limit?: number;
  offset?: number;
  signalId?: string;
}): Promise<{ facts: EvidenceFact[]; total: number }> {
  const supabase = getSupabase();
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  let query = supabase
    .from('evidence_facts')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (options?.signalId) {
    query = query.eq('signal_id', options.signalId);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(`Failed to list evidence facts: ${error.message}`);
  return { facts: (data || []) as EvidenceFact[], total: count ?? 0 };
}

// ── Evidence Packs ─────────────────────────────────────────

/** Fetch all evidence packs for an issue. */
export async function getEvidencePacksForIssue(issueId: string): Promise<IssueEvidencePack[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('issue_evidence_packs')
    .select('*')
    .eq('issue_id', issueId)
    .order('section_key', { ascending: true });

  if (error) throw new Error(`Failed to fetch evidence packs: ${error.message}`);
  return (data || []) as IssueEvidencePack[];
}

// ── Claims ─────────────────────────────────────────────────

/** Fetch all claims for an issue, optionally filtered by section. */
export async function getClaimsForIssue(
  issueId: string,
  sectionKey?: MagazineSectionName,
): Promise<IssueClaim[]> {
  const supabase = getSupabase();

  let query = supabase
    .from('issue_claims')
    .select('*')
    .eq('issue_id', issueId)
    .order('created_at', { ascending: true });

  if (sectionKey) {
    query = query.eq('section_key', sectionKey);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch claims: ${error.message}`);
  return (data || []) as IssueClaim[];
}

// ── Provenance ─────────────────────────────────────────────

/** Fetch provenance records for an issue. */
export async function getProvenanceForIssue(issueId: string): Promise<IssueSectionProvenance[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('issue_section_provenance')
    .select('*')
    .eq('issue_id', issueId)
    .order('section_key', { ascending: true });

  if (error) throw new Error(`Failed to fetch provenance: ${error.message}`);
  return (data || []) as IssueSectionProvenance[];
}

// ── Signals (from shared ai_signals table) ─────────────────

export interface AISignalRow {
  id: string;
  title: string;
  summary: string;
  source: string;
  source_url: string | null;
  signal_date: string | null;
  category: string;
  tags: string[] | null;
  what_happened: string | null;
  why_it_matters: string | null;
  who_should_care: string | null;
  practical_implication: string | null;
  company: string | null;
  topic: string | null;
  composite_score: number | null;
  status: string;
  created_at: string;
}

/** Fetch signals from the shared ai_signals table (paginated). */
export async function listSignals(options?: {
  limit?: number;
  offset?: number;
  category?: string;
  search?: string;
}): Promise<{ signals: AISignalRow[]; total: number }> {
  const supabase = getSupabase();
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  let query = supabase
    .from('ai_signals')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (options?.category) {
    query = query.eq('category', options.category);
  }

  if (options?.search) {
    query = query.or(`title.ilike.%${options.search}%,summary.ilike.%${options.search}%`);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(`Failed to list signals: ${error.message}`);
  return { signals: (data || []) as AISignalRow[], total: count ?? 0 };
}

/** Fetch signals by their IDs. */
export async function getSignalsByIds(ids: string[]): Promise<AISignalRow[]> {
  if (ids.length === 0) return [];
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('ai_signals')
    .select('*')
    .in('id', ids);

  if (error) throw new Error(`Failed to fetch signals: ${error.message}`);
  return (data || []) as AISignalRow[];
}

// ── Aggregated Intelligence for an Issue ───────────────────

export interface IssueIntelligenceBundle {
  packs: IssueEvidencePack[];
  claims: IssueClaim[];
  provenance: IssueSectionProvenance[];
  facts: EvidenceFact[];
  /** Keyed by fact ID for fast lookup */
  factsMap: Map<string, EvidenceFact>;
}

/** Fetch all intelligence data for an issue in one call. */
export async function getIssueIntelligence(issueId: string): Promise<IssueIntelligenceBundle> {
  const [packs, claims, provenance] = await Promise.all([
    getEvidencePacksForIssue(issueId),
    getClaimsForIssue(issueId),
    getProvenanceForIssue(issueId),
  ]);

  // Collect all fact IDs from packs and claims
  const factIdSet = new Set<string>();
  packs.forEach((p) => p.fact_ids.forEach((id) => factIdSet.add(id)));
  claims.forEach((c) => c.supporting_fact_ids.forEach((id) => factIdSet.add(id)));

  const facts = await getEvidenceFactsByIds([...factIdSet]);
  const factsMap = new Map(facts.map((f) => [f.id, f]));

  return { packs, claims, provenance, facts, factsMap };
}
