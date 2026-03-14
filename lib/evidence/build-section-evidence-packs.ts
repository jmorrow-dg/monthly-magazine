// ============================================================
// Phase 5 Block 2: Section Evidence Pack Builder
// Selects, ranks, and groups EvidenceFacts into per-section packs.
// Persists packs to the issue_evidence_packs table.
// ============================================================

import type { EvidenceFact, IssueEvidencePack, MagazineSectionName } from '@/lib/types/evidence';
import { SECTION_CATEGORY_MAP } from '@/lib/evidence/config';
import { getSupabase } from '@/lib/supabase/client';

/** Sections that receive evidence packs (per spec). */
const PACK_SECTIONS: MagazineSectionName[] = [
  'cover_story',
  'implications',
  'enterprise',
  'industry_watch',
  'playbooks',
  'strategic_signals',
  'executive_briefing',
];

/** Max facts per section pack. */
const MAX_FACTS_PER_SECTION: Record<string, number> = {
  cover_story: 10,
  implications: 8,
  enterprise: 8,
  industry_watch: 8,
  playbooks: 6,
  strategic_signals: 6,
  executive_briefing: 6,
};

// ── Ranking ─────────────────────────────────────────────────

interface ScoredFact {
  fact: EvidenceFact;
  score: number;
}

/**
 * Score a fact for relevance to a given section.
 * Uses signal score, recency, and topic alignment.
 */
function scoreFact(fact: EvidenceFact, section: MagazineSectionName): number {
  let score = 0;

  // Signal confidence (0-1 range, weight 0.4)
  score += Math.min(1, fact.confidence_score) * 0.4;

  // Topic/category alignment (weight 0.35)
  const preferredCategories = SECTION_CATEGORY_MAP[section] || [];
  if (fact.topic) {
    const topicLower = fact.topic.toLowerCase();
    const idx = preferredCategories.findIndex(
      (c) => c.toLowerCase() === topicLower,
    );
    if (idx === 0) score += 0.35;
    else if (idx > 0) score += 0.35 * (1 - idx * 0.15);
  }

  // Recency (weight 0.25)
  if (fact.signal_date) {
    const now = Date.now();
    const factDate = new Date(fact.signal_date).getTime();
    const daysOld = (now - factDate) / (1000 * 60 * 60 * 24);
    const recency = Math.max(0, 1 - daysOld / 90); // 90-day decay
    score += recency * 0.25;
  } else {
    score += 0.125; // undated gets half recency weight
  }

  return score;
}

/**
 * Rank all facts for a section, return top N.
 */
function rankFactsForSection(
  facts: EvidenceFact[],
  section: MagazineSectionName,
): EvidenceFact[] {
  const scored: ScoredFact[] = facts.map((fact) => ({
    fact,
    score: scoreFact(fact, section),
  }));

  scored.sort((a, b) => b.score - a.score);

  const limit = MAX_FACTS_PER_SECTION[section] || 6;
  return scored.slice(0, limit).map((s) => s.fact);
}

// ── Pack Building ───────────────────────────────────────────

/**
 * Build section evidence packs from persisted facts.
 * Returns in-memory pack objects (call storeEvidencePacks to persist).
 */
export function buildSectionEvidencePacksFromFacts(
  facts: EvidenceFact[],
  issueId: string,
): Array<Omit<IssueEvidencePack, 'id' | 'created_at'>> {
  const packs: Array<Omit<IssueEvidencePack, 'id' | 'created_at'>> = [];

  for (const section of PACK_SECTIONS) {
    const ranked = rankFactsForSection(facts, section);

    // Extract priority companies (unique, top 5)
    const companies = [...new Set(
      ranked.map((f) => f.company).filter(Boolean) as string[],
    )].slice(0, 5);

    // Extract priority topics (unique, top 5)
    const topics = [...new Set(
      ranked.map((f) => f.topic).filter(Boolean) as string[],
    )].slice(0, 5);

    // Collect reference URLs (unique, prefer primary sources, limit 8)
    const urls = [...new Set(
      ranked.map((f) => f.source_url).filter(Boolean) as string[],
    )].slice(0, 8);

    packs.push({
      issue_id: issueId,
      section_key: section,
      fact_ids: ranked.map((f) => f.id),
      priority_companies: companies,
      priority_topics: topics,
      reference_urls: urls,
    });
  }

  return packs;
}

/**
 * Persist section evidence packs to the database.
 * Idempotent: deletes existing packs for the issue before inserting.
 */
export async function storeEvidencePacks(
  issueId: string,
  packs: Array<Omit<IssueEvidencePack, 'id' | 'created_at'>>,
): Promise<IssueEvidencePack[]> {
  if (packs.length === 0) return [];

  const supabase = getSupabase();

  // Remove existing packs for this issue
  await supabase
    .from('issue_evidence_packs')
    .delete()
    .eq('issue_id', issueId);

  const { data, error } = await supabase
    .from('issue_evidence_packs')
    .insert(packs)
    .select();

  if (error) {
    throw new Error(`Failed to store evidence packs: ${error.message}`);
  }

  return (data || []) as IssueEvidencePack[];
}

/**
 * Retrieve evidence packs for an issue.
 */
export async function getEvidencePacks(
  issueId: string,
): Promise<IssueEvidencePack[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('issue_evidence_packs')
    .select('*')
    .eq('issue_id', issueId)
    .order('section_key');

  if (error) throw new Error(`Failed to fetch evidence packs: ${error.message}`);
  return (data || []) as IssueEvidencePack[];
}
