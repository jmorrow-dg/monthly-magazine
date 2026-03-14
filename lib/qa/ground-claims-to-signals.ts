// ============================================================
// Signal Grounding Engine: Maps extracted claims to source signals.
// Conservative matching to prioritise trust over false support.
// ============================================================

import type {
  ClaimReference,
  UnsupportedClaim,
  SourceSignalSummary,
  SourceTrendSummary,
  SupportStatus,
} from '../types/qa';
import type { ExtractedClaim } from './extract-claims';
import type { EvidencePackBundle, EvidenceFact, MagazineSectionName } from '@/lib/types/evidence';

export interface GroundingResult {
  citation_map: ClaimReference[];
  unsupported_claims: UnsupportedClaim[];
}

/**
 * Attempt to ground each claim against source signals and trends.
 * Returns a citation map and a list of unsupported claims.
 */
export function groundClaimsToSignals(
  claims: ExtractedClaim[],
  signals: SourceSignalSummary[],
  trends: SourceTrendSummary[],
): GroundingResult {
  const citationMap: ClaimReference[] = [];
  const unsupportedClaims: UnsupportedClaim[] = [];

  for (const claim of claims) {
    const result = matchClaimToSignals(claim, signals, trends);
    citationMap.push(result);

    if (result.support_status === 'unsupported') {
      unsupportedClaims.push({
        claim_text: claim.claim_text,
        section: claim.section,
        claim_type: claim.claim_type,
        reason: result.reason,
        confidence_score: result.confidence_score,
        suggested_action: 'Verify this claim against original source material or remove it.',
        severity: result.confidence_score < 0.2 ? 'error' : 'warning',
      });
    }
  }

  return { citation_map: citationMap, unsupported_claims: unsupportedClaims };
}

function matchClaimToSignals(
  claim: ExtractedClaim,
  signals: SourceSignalSummary[],
  trends: SourceTrendSummary[],
): ClaimReference {
  const claimLower = claim.claim_text.toLowerCase();
  const claimTokens = tokenise(claimLower);

  let bestSignalMatch: { signal: SourceSignalSummary; score: number } | null = null;
  const matchedSignalIds: string[] = [];
  const matchedUrls: string[] = [];

  for (const signal of signals) {
    const score = calculateMatchScore(claimTokens, claimLower, signal);
    if (score > 0.3) {
      matchedSignalIds.push(signal.id);
      if (signal.source_url) matchedUrls.push(signal.source_url);
      if (!bestSignalMatch || score > bestSignalMatch.score) {
        bestSignalMatch = { signal, score };
      }
    }
  }

  // Also check trends for strategic claims
  let trendBoost = 0;
  if (['trend', 'strategic_implication', 'adoption'].includes(claim.claim_type)) {
    for (const trend of trends) {
      const trendScore = calculateTrendMatchScore(claimTokens, claimLower, trend);
      if (trendScore > 0.25) {
        trendBoost = Math.max(trendBoost, trendScore * 0.3);
      }
    }
  }

  const totalScore = bestSignalMatch ? bestSignalMatch.score + trendBoost : trendBoost;
  const supportStatus = determineSupportStatus(totalScore, matchedSignalIds.length);

  return {
    claim_text: claim.claim_text,
    section: claim.section,
    claim_type: claim.claim_type,
    support_status: supportStatus,
    matched_signal_ids: matchedSignalIds,
    matched_source_urls: [...new Set(matchedUrls)],
    evidence_excerpt: bestSignalMatch
      ? truncate(bestSignalMatch.signal.summary, 200)
      : null,
    confidence_score: Math.min(1, totalScore),
    reason: generateReason(supportStatus, matchedSignalIds.length, bestSignalMatch?.signal),
  };
}

function calculateMatchScore(
  claimTokens: string[],
  claimLower: string,
  signal: SourceSignalSummary,
): number {
  let score = 0;

  const signalText = [
    signal.title,
    signal.summary,
    signal.why_it_matters || '',
    signal.practical_implication || '',
    signal.company || '',
  ].join(' ').toLowerCase();

  const signalTokens = tokenise(signalText);

  // Token overlap (weighted by importance)
  const importantTokens = claimTokens.filter(t => t.length > 3 && !STOP_WORDS.has(t));
  const matchCount = importantTokens.filter(t => signalTokens.includes(t)).length;
  const overlapRatio = importantTokens.length > 0 ? matchCount / importantTokens.length : 0;
  score += overlapRatio * 0.4;

  // Company name match (strong signal)
  if (signal.company) {
    const companyLower = signal.company.toLowerCase();
    if (claimLower.includes(companyLower)) {
      score += 0.25;
    }
  }

  // Shared entities (capitalised words)
  const claimEntities = extractEntities(claimLower);
  const signalEntities = extractEntities(signalText);
  const sharedEntities = claimEntities.filter(e => signalEntities.includes(e));
  if (sharedEntities.length > 0) {
    score += Math.min(0.2, sharedEntities.length * 0.1);
  }

  // Date proximity
  if (signal.signal_date) {
    const signalYear = signal.signal_date.slice(0, 4);
    const signalMonth = signal.signal_date.slice(5, 7);
    if (claimLower.includes(signalYear)) score += 0.05;
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'];
    const monthIdx = parseInt(signalMonth, 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12 && claimLower.includes(monthNames[monthIdx])) {
      score += 0.05;
    }
  }

  // Tag overlap
  if (signal.tags && signal.tags.length > 0) {
    const tagMatches = signal.tags.filter(t => claimLower.includes(t.toLowerCase()));
    score += Math.min(0.1, tagMatches.length * 0.05);
  }

  return score;
}

function calculateTrendMatchScore(
  claimTokens: string[],
  claimLower: string,
  trend: SourceTrendSummary,
): number {
  const trendText = [
    trend.title,
    trend.description,
    trend.strategic_summary || '',
    trend.implication_for_operators || '',
  ].join(' ').toLowerCase();

  const trendTokens = tokenise(trendText);
  const importantTokens = claimTokens.filter(t => t.length > 3 && !STOP_WORDS.has(t));
  const matchCount = importantTokens.filter(t => trendTokens.includes(t)).length;
  return importantTokens.length > 0 ? matchCount / importantTokens.length : 0;
}

function determineSupportStatus(score: number, matchCount: number): SupportStatus {
  if (score >= 0.5 && matchCount >= 1) return 'supported';
  if (score >= 0.3 && matchCount >= 1) return 'partially_supported';
  if (score < 0.15) return 'unsupported';
  return 'unverifiable';
}

function generateReason(
  status: SupportStatus,
  matchCount: number,
  bestSignal?: SourceSignalSummary,
): string {
  switch (status) {
    case 'supported':
      return `Grounded in ${matchCount} source signal${matchCount > 1 ? 's' : ''}${bestSignal ? `, strongest match: "${truncate(bestSignal.title, 60)}"` : ''}.`;
    case 'partially_supported':
      return `Partially supported by ${matchCount} signal${matchCount > 1 ? 's' : ''}, but claim may extend beyond source evidence.`;
    case 'unsupported':
      return 'No matching signals found. Claim may be hallucinated or sourced from outside provided signals.';
    case 'unverifiable':
      return 'Cannot confidently verify. Claim may require manual source check.';
    default:
      return '';
  }
}

function tokenise(text: string): string[] {
  return text.toLowerCase().split(/\W+/).filter(t => t.length > 1);
}

function extractEntities(text: string): string[] {
  const matches = text.match(/\b[a-z]{3,}\b/g) || [];
  return [...new Set(matches)].filter(m => !STOP_WORDS.has(m));
}

function truncate(text: string, maxLen: number): string {
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
  'her', 'was', 'one', 'our', 'out', 'has', 'have', 'been', 'this', 'that',
  'with', 'will', 'from', 'they', 'were', 'more', 'when', 'than', 'what',
  'also', 'into', 'most', 'its', 'over', 'such', 'very', 'just', 'about',
  'which', 'their', 'would', 'there', 'could', 'other', 'these', 'where',
  'being', 'each', 'some', 'them', 'then', 'does', 'should',
]);

// ── Evidence-Based Grounding ────────────────────────────────

/**
 * Section name mapping for QA claim sections to evidence pack section names.
 * QA sections use display names; evidence packs use snake_case.
 */
const QA_SECTION_TO_EVIDENCE: Record<string, MagazineSectionName> = {
  'Cover Story': 'cover_story',
  'cover_story': 'cover_story',
  'Implications': 'implications',
  'implications': 'implications',
  'Enterprise': 'enterprise',
  'enterprise': 'enterprise',
  'Industry Watch': 'industry_watch',
  'industry_watch': 'industry_watch',
  'Tools': 'tools',
  'tools': 'tools',
  'Playbooks': 'playbooks',
  'playbooks': 'playbooks',
  'Strategic Signals': 'strategic_signals',
  'strategic_signals': 'strategic_signals',
  'Briefing Prompts': 'briefing_prompts',
  'briefing_prompts': 'briefing_prompts',
  'Executive Briefing': 'executive_briefing',
  'executive_briefing': 'executive_briefing',
  'AI Native Org': 'ai_native_org',
  'ai_native_org': 'ai_native_org',
  'Editorial': 'editorial',
  'editorial': 'editorial',
  'Why This Matters': 'why_this_matters',
  'why_this_matters': 'why_this_matters',
  'Regional Signals': 'regional_signals',
  'regional_signals': 'regional_signals',
  'Global Landscape': 'global_landscape',
  'global_landscape': 'global_landscape',
};

/**
 * Ground claims using structured evidence packs.
 *
 * For each claim, first searches the section's curated evidence pack
 * (small, relevant set). If no match found there, falls back to
 * the full signal/trend matching.
 *
 * Creates a verifiable chain: claim -> evidence_item -> source_signal.
 */
export function groundClaimsToEvidence(
  claims: ExtractedClaim[],
  evidenceBundle: EvidencePackBundle,
  signals: SourceSignalSummary[],
  trends: SourceTrendSummary[],
): GroundingResult {
  const citationMap: ClaimReference[] = [];
  const unsupportedClaims: UnsupportedClaim[] = [];

  for (const claim of claims) {
    // Map claim section to evidence pack section
    const evidenceSection = QA_SECTION_TO_EVIDENCE[claim.section];
    const sectionPack = evidenceSection
      ? evidenceBundle.section_packs[evidenceSection]
      : undefined;

    let result: ClaimReference | null = null;

    // Try matching against evidence pack first (curated, small set)
    if (sectionPack && sectionPack.evidence_items.length > 0) {
      result = matchClaimToEvidenceItems(claim, sectionPack);
    }

    // Fallback to full signal matching if no evidence match found
    if (!result || result.support_status === 'unsupported' || result.support_status === 'unverifiable') {
      result = matchClaimToSignals(claim, signals, trends);
    }

    citationMap.push(result);

    if (result.support_status === 'unsupported') {
      unsupportedClaims.push({
        claim_text: claim.claim_text,
        section: claim.section,
        claim_type: claim.claim_type,
        reason: result.reason,
        confidence_score: result.confidence_score,
        suggested_action: 'Verify this claim against original source material or remove it.',
        severity: result.confidence_score < 0.2 ? 'error' : 'warning',
      });
    }
  }

  return { citation_map: citationMap, unsupported_claims: unsupportedClaims };
}

/**
 * Match a claim against the evidence items in its section's evidence pack.
 */
function matchClaimToEvidenceItems(
  claim: ExtractedClaim,
  sectionPack: { evidence_items: Array<{ id: string; source_id: string; source_url: string | null; title: string; evidence_text: string; company: string | null; tags: string[]; data_points: Array<{ value: string }> }> },
): ClaimReference {
  const claimLower = claim.claim_text.toLowerCase();
  const claimTokens = tokenise(claimLower);
  const importantTokens = claimTokens.filter(t => t.length > 3 && !STOP_WORDS.has(t));

  let bestMatch: { evidenceId: string; sourceId: string; sourceUrl: string | null; score: number; excerpt: string } | null = null;
  const matchedSignalIds: string[] = [];
  const matchedUrls: string[] = [];

  for (const item of sectionPack.evidence_items) {
    const evidenceText = [item.title, item.evidence_text].join(' ').toLowerCase();
    const evidenceTokens = tokenise(evidenceText);

    // Token overlap
    const matchCount = importantTokens.filter(t => evidenceTokens.includes(t)).length;
    let score = importantTokens.length > 0 ? (matchCount / importantTokens.length) * 0.5 : 0;

    // Company match
    if (item.company && claimLower.includes(item.company.toLowerCase())) {
      score += 0.25;
    }

    // Data point match (if claim contains a number that's in the evidence)
    for (const dp of item.data_points || []) {
      if (claimLower.includes(dp.value.toLowerCase())) {
        score += 0.2;
        break;
      }
    }

    if (score > 0.3) {
      matchedSignalIds.push(item.source_id);
      if (item.source_url) matchedUrls.push(item.source_url);
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = {
          evidenceId: item.id,
          sourceId: item.source_id,
          sourceUrl: item.source_url,
          score,
          excerpt: truncate(item.evidence_text, 200),
        };
      }
    }
  }

  const totalScore = bestMatch?.score ?? 0;
  const supportStatus = determineSupportStatus(totalScore, matchedSignalIds.length);

  return {
    claim_text: claim.claim_text,
    section: claim.section,
    claim_type: claim.claim_type,
    support_status: supportStatus,
    matched_signal_ids: [...new Set(matchedSignalIds)],
    matched_source_urls: [...new Set(matchedUrls)],
    evidence_excerpt: bestMatch?.excerpt || null,
    confidence_score: Math.min(1, totalScore),
    reason: supportStatus === 'supported' || supportStatus === 'partially_supported'
      ? `Grounded in evidence pack (${matchedSignalIds.length} evidence item${matchedSignalIds.length > 1 ? 's' : ''}).`
      : 'No matching evidence found in section evidence pack.',
  };
}

// ── Phase 5: Fact-Based Grounding ────────────────────────

/**
 * Ground claims against persisted EvidenceFact rows.
 *
 * Preferred when Phase 5 facts are available. Falls back to
 * Phase 4 evidence bundle or raw signal matching.
 */
export function groundClaimsToFacts(
  claims: ExtractedClaim[],
  facts: EvidenceFact[],
  signals: SourceSignalSummary[],
  trends: SourceTrendSummary[],
): GroundingResult {
  if (facts.length === 0) {
    return groundClaimsToSignals(claims, signals, trends);
  }

  const citationMap: ClaimReference[] = [];
  const unsupportedClaims: UnsupportedClaim[] = [];

  for (const claim of claims) {
    const result = matchClaimToFacts(claim, facts);

    // Fallback to signal matching if no fact match
    const finalResult = (result.support_status === 'unsupported' || result.support_status === 'unverifiable')
      ? matchClaimToSignals(claim, signals, trends)
      : result;

    citationMap.push(finalResult);

    if (finalResult.support_status === 'unsupported') {
      unsupportedClaims.push({
        claim_text: claim.claim_text,
        section: claim.section,
        claim_type: claim.claim_type,
        reason: finalResult.reason,
        confidence_score: finalResult.confidence_score,
        suggested_action: 'Verify this claim against original source material or remove it.',
        severity: finalResult.confidence_score < 0.2 ? 'error' : 'warning',
      });
    }
  }

  return { citation_map: citationMap, unsupported_claims: unsupportedClaims };
}

function matchClaimToFacts(
  claim: ExtractedClaim,
  facts: EvidenceFact[],
): ClaimReference {
  const claimLower = claim.claim_text.toLowerCase();
  const claimTokens = tokenise(claimLower);
  const importantTokens = claimTokens.filter((t) => t.length > 3 && !STOP_WORDS.has(t));

  let bestMatch: { fact: EvidenceFact; score: number } | null = null;
  const matchedSignalIds: string[] = [];
  const matchedUrls: string[] = [];

  for (const fact of facts) {
    const factText = fact.fact_text.toLowerCase();
    const factTokens = tokenise(factText);

    // Token overlap (weight 0.45)
    const matched = importantTokens.filter((t) => factTokens.includes(t));
    let score = importantTokens.length > 0 ? (matched.length / importantTokens.length) * 0.45 : 0;

    // Company match (weight 0.3)
    if (fact.company && claimLower.includes(fact.company.toLowerCase())) {
      score += 0.3;
    }

    // Topic match (weight 0.15)
    if (fact.topic && claimLower.includes(fact.topic.toLowerCase())) {
      score += 0.15;
    }

    // Numeric overlap (weight 0.1)
    const claimNumbers = claimLower.match(/\d+(?:\.\d+)?/g) ?? ([] as string[]);
    const factNumbers = factText.match(/\d+(?:\.\d+)?/g) ?? ([] as string[]);
    if (claimNumbers.some((n: string) => factNumbers.includes(n))) {
      score += 0.1;
    }

    if (score > 0.25) {
      matchedSignalIds.push(fact.signal_id);
      if (fact.source_url) matchedUrls.push(fact.source_url);
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { fact, score };
      }
    }
  }

  const totalScore = bestMatch?.score ?? 0;
  const supportStatus = determineSupportStatus(totalScore, matchedSignalIds.length);

  return {
    claim_text: claim.claim_text,
    section: claim.section,
    claim_type: claim.claim_type,
    support_status: supportStatus,
    matched_signal_ids: [...new Set(matchedSignalIds)],
    matched_source_urls: [...new Set(matchedUrls)],
    evidence_excerpt: bestMatch ? truncate(bestMatch.fact.fact_text, 200) : null,
    confidence_score: Math.min(1, totalScore),
    reason: supportStatus === 'supported' || supportStatus === 'partially_supported'
      ? `Grounded in ${matchedSignalIds.length} evidence fact${matchedSignalIds.length > 1 ? 's' : ''} (Phase 5).`
      : 'No matching evidence facts found.',
  };
}
