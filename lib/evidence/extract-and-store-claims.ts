// ============================================================
// Phase 5 Block 4: Claim Extraction and Storage
// Extracts factual claims from generated sections and maps them
// to supporting evidence facts. Persists to issue_claims table.
// ============================================================

import type { Issue } from '@/lib/types/issue';
import type { IssueClaim, MagazineSectionName } from '@/lib/types/evidence';
import { getSupabase } from '@/lib/supabase/client';
import { getFactsBySignalIds } from '@/lib/evidence/extract-facts';

/**
 * Section content extractors: pull raw text from each issue JSON section.
 */
function extractSectionTexts(issue: Issue): Array<{ section_key: MagazineSectionName; text: string }> {
  const sections: Array<{ section_key: MagazineSectionName; text: string }> = [];

  // Cover story
  if (issue.cover_story_json) {
    const cs = issue.cover_story_json;
    const parts = [cs.headline, cs.subheadline, cs.introduction, cs.analysis, cs.strategic_implications]
      .filter(Boolean);
    if (parts.length > 0) {
      sections.push({ section_key: 'cover_story', text: parts.join(' ') });
    }
  }

  // Array sections
  const arraySections: Array<{ key: MagazineSectionName; data: Array<Record<string, unknown>> | null; textFields: string[] }> = [
    { key: 'implications', data: issue.implications_json as Array<Record<string, unknown>> | null, textFields: ['title', 'description'] },
    { key: 'enterprise', data: issue.enterprise_json as Array<Record<string, unknown>> | null, textFields: ['title', 'description'] },
    { key: 'industry_watch', data: issue.industry_watch_json as Array<Record<string, unknown>> | null, textFields: ['headline', 'description'] },
    { key: 'strategic_signals', data: issue.strategic_signals_json as Array<Record<string, unknown>> | null, textFields: ['signal', 'context', 'implication'] },
    { key: 'executive_briefing', data: issue.executive_briefing_json as Array<Record<string, unknown>> | null, textFields: ['headline', 'explanation'] },
    { key: 'playbooks', data: issue.playbooks_json as Array<Record<string, unknown>> | null, textFields: ['title', 'context', 'outcome'] },
  ];

  for (const { key, data, textFields } of arraySections) {
    if (!data || !Array.isArray(data)) continue;
    const text = data
      .map((item) => textFields.map((f) => item[f]).filter(Boolean).join(' '))
      .join(' ');
    if (text.trim()) {
      sections.push({ section_key: key, text });
    }
  }

  return sections;
}

/**
 * Simple sentence-level claim extraction (deterministic, no LLM).
 * Extracts sentences that contain factual indicators.
 */
function extractClaimsFromText(text: string): string[] {
  const sentences = text
    .replace(/\n+/g, '. ')
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length >= 20);

  return sentences.filter((s) => {
    // Must contain factual indicators
    return /\b(launch|releas|announc|partner|rais|billion|million|percent|%|\d+x|acquir|deploy|adopt|implement|expand)\b/i.test(s);
  });
}

/**
 * Map a claim to supporting evidence facts using token overlap.
 */
function mapClaimToFacts(
  claimText: string,
  facts: Array<{ id: string; fact_text: string; company: string | null }>,
): string[] {
  const claimLower = claimText.toLowerCase();
  const claimTokens = claimLower.split(/\W+/).filter((t) => t.length > 3);
  const supporting: string[] = [];

  for (const fact of facts) {
    const factLower = fact.fact_text.toLowerCase();
    const factTokens = factLower.split(/\W+/).filter((t) => t.length > 3);

    // Token overlap
    const matched = claimTokens.filter((t) => factTokens.includes(t));
    let score = claimTokens.length > 0 ? matched.length / claimTokens.length : 0;

    // Company match boost
    if (fact.company && claimLower.includes(fact.company.toLowerCase())) {
      score += 0.3;
    }

    if (score > 0.25) {
      supporting.push(fact.id);
    }
  }

  return supporting;
}

/**
 * Extract claims from a generated issue and persist to issue_claims.
 * Maps each claim to supporting evidence facts.
 */
export async function extractAndStoreClaims(
  issueId: string,
  issue: Issue,
): Promise<IssueClaim[]> {
  const supabase = getSupabase();

  // Get available evidence facts for this issue's signals
  const signalIds = issue.source_signal_ids || [];
  const facts = await getFactsBySignalIds(signalIds);

  if (facts.length === 0) return [];

  // Extract section texts and claims
  const sectionTexts = extractSectionTexts(issue);
  const claimRows: Array<Omit<IssueClaim, 'id' | 'created_at'>> = [];

  for (const { section_key, text } of sectionTexts) {
    const claims = extractClaimsFromText(text);
    for (const claimText of claims) {
      const supportingFactIds = mapClaimToFacts(claimText, facts);
      claimRows.push({
        issue_id: issueId,
        section_key,
        claim_text: claimText.slice(0, 500), // cap at 500 chars
        supporting_fact_ids: supportingFactIds,
      });
    }
  }

  if (claimRows.length === 0) return [];

  // Remove existing claims for this issue (idempotent)
  await supabase.from('issue_claims').delete().eq('issue_id', issueId);

  // Insert in batches
  const allInserted: IssueClaim[] = [];
  const batchSize = 50;
  for (let i = 0; i < claimRows.length; i += batchSize) {
    const batch = claimRows.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('issue_claims')
      .insert(batch)
      .select();

    if (error) {
      throw new Error(`Failed to store claims: ${error.message}`);
    }
    if (data) allInserted.push(...(data as IssueClaim[]));
  }

  return allInserted;
}

/**
 * Fetch all claims for an issue.
 */
export async function getIssueClaims(issueId: string): Promise<IssueClaim[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('issue_claims')
    .select('*')
    .eq('issue_id', issueId)
    .order('section_key');

  if (error) throw new Error(`Failed to fetch claims: ${error.message}`);
  return (data || []) as IssueClaim[];
}
