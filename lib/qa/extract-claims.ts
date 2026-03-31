// ============================================================
// Claim Extraction: Extracts substantive factual claims from content.
// Uses hybrid approach: sentence segmentation + filtering + optional LLM.
// ============================================================

import Anthropic from '@anthropic-ai/sdk';
import type { ExtractedSection, ClaimType, ClaimNature } from '../types/qa';

export interface ExtractedClaim {
  claim_text: string;
  section: string;
  claim_type: ClaimType;
  claim_nature: ClaimNature;
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
      system: `You are a fact-checking editor. Extract every substantive claim from the provided magazine content.

A factual claim is a statement that asserts something specific: an event, a launch, a statistic, a company action, a trend, an adoption pattern, a funding event, a partnership, a strategic implication, or a regional movement.

Do NOT extract:
- Pure opinions or subjective assessments
- Rhetorical questions
- Section headers or labels

For each claim, classify its type as one of: event, launch, funding, partnership, statistic, adoption, trend, strategic_implication, regional_movement, company_action

Also classify each claim's nature:
- "factual": Asserts a verifiable fact (e.g. "OpenAI raised $6.6 billion", "GDPR requires transparency controls")
- "prescriptive": Gives advice, recommendations, or action steps (e.g. "Implement bias testing protocols", "Deploy access controls", "Consider establishing governance frameworks")
- "editorial": Commentary, framing, or analysis that doesn't assert specific facts (e.g. "This represents a significant shift", "The implications are far-reaching")`,
      messages: [{
        role: 'user',
        content: `Extract all substantive claims from this content:\n\n${sectionBlock}\n\nReturn a JSON array:\n[{"claim_text": "the specific claim", "section": "section label", "claim_type": "type", "claim_nature": "factual|prescriptive|editorial"}]\n\nReturn ONLY the JSON array, no other text.`,
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]) as ExtractedClaim[];
    // Ensure claim_nature is always set
    return parsed.map(c => ({
      ...c,
      claim_nature: (['factual', 'prescriptive', 'editorial'] as ClaimNature[]).includes(c.claim_nature)
        ? c.claim_nature
        : classifyClaimNature(c.claim_text, c.section),
    }));
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
        claim_nature: classifyClaimNature(trimmed, section.section_key),
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

// ── Sections that are inherently advisory ────────────────────
const PRESCRIPTIVE_SECTIONS = new Set([
  'playbooks', 'briefing_prompts', 'Operator Playbooks', 'Briefing Prompts',
]);

// ── Imperative / advisory verb patterns ──────────────────────
const PRESCRIPTIVE_PATTERNS = [
  /^(implement|deploy|establish|build|create|develop|adopt|monitor|evaluate|assess|audit|design|integrate|prioritise|prioritize|consider|ensure|leverage|utilise|utilize|explore|plan|prepare|review|set up|configure)/i,
  /\b(should|must|need to|recommend|advise|consider|ensure that|it is essential|it is critical|it is important|organisations should|teams should|leaders should|operators should)\b/i,
  /\b(action item|next step|key takeaway|best practice|framework for|playbook|checklist)\b/i,
];

const EDITORIAL_PATTERNS = [
  /^(this represents|this signals|this marks|this suggests|this demonstrates|this highlights|this underscores|the implications|what this means|notably|importantly|critically|significantly)\b/i,
  /\b(remains to be seen|time will tell|worth watching|bears monitoring|stay tuned)\b/i,
];

/**
 * Classify whether a claim is factual, prescriptive (advice), or editorial (commentary).
 */
function classifyClaimNature(claimText: string, sectionKey: string): ClaimNature {
  // Sections that are inherently advisory
  if (PRESCRIPTIVE_SECTIONS.has(sectionKey)) {
    return 'prescriptive';
  }

  // Check for prescriptive language patterns
  for (const pattern of PRESCRIPTIVE_PATTERNS) {
    if (pattern.test(claimText)) return 'prescriptive';
  }

  // Check for editorial commentary patterns
  for (const pattern of EDITORIAL_PATTERNS) {
    if (pattern.test(claimText)) return 'editorial';
  }

  return 'factual';
}
