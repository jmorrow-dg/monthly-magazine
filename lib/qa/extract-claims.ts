// ============================================================
// Claim Extraction: Extracts substantive factual claims from content.
// Uses hybrid approach: sentence segmentation + filtering + optional LLM.
// ============================================================

import Anthropic from '@anthropic-ai/sdk';
import type { ExtractedSection, ClaimType } from '../types/qa';

export interface ExtractedClaim {
  claim_text: string;
  section: string;
  claim_type: ClaimType;
}

/**
 * Extract factual claims from all issue sections.
 * High value sections (cover story, editorial) use LLM extraction.
 * Other sections use rule-based extraction.
 */
export async function extractClaims(
  sections: ExtractedSection[],
): Promise<ExtractedClaim[]> {
  const allClaims: ExtractedClaim[] = [];

  // High value sections get LLM extraction
  const highValueKeys = new Set([
    'cover_story', 'editorial_note', 'why_this_matters',
    'executive_summary', 'implications', 'enterprise',
  ]);

  const highValueSections = sections.filter(s => highValueKeys.has(s.section_key));
  const otherSections = sections.filter(s => !highValueKeys.has(s.section_key));

  // LLM extraction for high value sections
  if (highValueSections.length > 0) {
    const llmClaims = await extractClaimsViaLLM(highValueSections);
    allClaims.push(...llmClaims);
  }

  // Rule-based extraction for remaining sections
  for (const section of otherSections) {
    const ruleClaims = extractClaimsRuleBased(section);
    allClaims.push(...ruleClaims);
  }

  return allClaims;
}

/**
 * LLM-based claim extraction for high value sections.
 */
async function extractClaimsViaLLM(
  sections: ExtractedSection[],
): Promise<ExtractedClaim[]> {
  const anthropic = new Anthropic();

  const sectionBlock = sections
    .map(s => `[${s.section_label}]\n${s.raw_text}`)
    .join('\n\n---\n\n');

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: `You are a fact-checking editor. Extract every substantive factual claim from the provided magazine content.

A factual claim is a statement that asserts something specific: an event, a launch, a statistic, a company action, a trend, an adoption pattern, a funding event, a partnership, a strategic implication, or a regional movement.

Do NOT extract:
- Pure opinions or subjective assessments
- Calls to action
- General strategic advice without factual basis
- Rhetorical questions
- Section headers or labels

For each claim, classify its type as one of: event, launch, funding, partnership, statistic, adoption, trend, strategic_implication, regional_movement, company_action`,
      messages: [{
        role: 'user',
        content: `Extract all substantive factual claims from this content:\n\n${sectionBlock}\n\nReturn a JSON array:\n[{"claim_text": "the specific claim", "section": "section label", "claim_type": "type"}]\n\nReturn ONLY the JSON array, no other text.`,
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    return JSON.parse(jsonMatch[0]) as ExtractedClaim[];
  } catch (error) {
    console.error('LLM claim extraction failed:', error);
    // Fallback to rule-based for all sections
    return sections.flatMap(s => extractClaimsRuleBased(s));
  }
}

/**
 * Rule-based claim extraction using sentence segmentation and pattern matching.
 */
function extractClaimsRuleBased(section: ExtractedSection): ExtractedClaim[] {
  const claims: ExtractedClaim[] = [];
  const sentences = segmentSentences(section.raw_text);

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (trimmed.length < 20) continue;

    // Skip labels, headers, and field names
    if (/^[a-z_]+:/i.test(trimmed) && trimmed.length < 60) continue;
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) continue;

    const claimType = classifySentence(trimmed);
    if (claimType) {
      claims.push({
        claim_text: trimmed,
        section: section.section_label,
        claim_type: claimType,
      });
    }
  }

  return claims;
}

function segmentSentences(text: string): string[] {
  // Split on sentence boundaries, preserving abbreviations
  return text
    .replace(/\n+/g, '. ')
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .filter(s => s.trim().length > 0);
}

function classifySentence(sentence: string): ClaimType | null {
  const lower = sentence.toLowerCase();

  // Skip clearly non-factual sentences
  if (/^(consider|try|ensure|make sure|think about|we recommend)/i.test(sentence)) return null;
  if (/\?$/.test(sentence)) return null; // questions

  // Pattern matching for claim types
  if (/\b(launch|released|announced|unveiled|introduced|deployed)\b/i.test(sentence)) return 'launch';
  if (/\b(raised|funding|invested|series [a-d]|valuation)\b/i.test(sentence)) return 'funding';
  if (/\b(partner|collaboration|alliance|joint)\b/i.test(sentence)) return 'partnership';
  if (/\b(\d+%|\d+\s*percent|billion|million|trillion)\b/i.test(sentence)) return 'statistic';
  if (/\b(adopt|deployment|implement|rollout|integrated)\b/i.test(sentence)) return 'adoption';
  if (/\b(trend|shift|movement|accelerat|emerg|declin)\b/i.test(sentence)) return 'trend';
  if (/\b(region|country|europe|asia|north america|australia|global)\b/i.test(lower)) return 'regional_movement';
  if (/\b(implication|strategic|consequence|impact|transform)\b/i.test(sentence)) return 'strategic_implication';

  // Company actions (mentions a capitalised entity doing something)
  if (/\b[A-Z][a-zA-Z]+\b.*\b(announced|launched|expanded|acquired|hired|opened|closed)\b/i.test(sentence)) return 'company_action';

  // Events (date references)
  if (/\b(january|february|march|april|may|june|july|august|september|october|november|december|202[4-9])\b/i.test(sentence)) return 'event';

  return null;
}
