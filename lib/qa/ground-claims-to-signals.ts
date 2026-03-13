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
