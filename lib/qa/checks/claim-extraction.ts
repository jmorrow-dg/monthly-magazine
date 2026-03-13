// ============================================================
// QA Check: Claim Extraction & Factual Grounding (max 25 points)
// Uses Claude to extract factual claims and map them to source signals.
// ============================================================

import Anthropic from '@anthropic-ai/sdk';
import type { QACheckInput, QACheckResult, QAViolation, ExtractedClaim } from '../../types/qa';

export async function checkClaimExtraction(input: QACheckInput): Promise<QACheckResult> {
  const violations: QAViolation[] = [];

  // If no source signals available (sources mode), award full grounding points
  if (!input.source_signals || input.source_signals.length === 0) {
    return {
      category: 'factual_grounding',
      score: 25,
      max_score: 25,
      violations: [],
      claims: [],
    };
  }

  // Build content block from all sections
  const contentBlock = buildContentBlock(input);
  const signalBlock = buildSignalBlock(input);

  const anthropic = new Anthropic();

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: `You are a fact-checking editor. Your task is to extract every factual claim from magazine content and determine whether each claim is grounded in the provided source signals.

A "factual claim" is any statement that asserts something specific happened, a number, a company action, a product release, a statistic, a trend direction, or a named entity doing something concrete.

Do NOT treat editorial opinions, general strategic commentary, or calls to action as factual claims.

For each claim, determine:
- Whether it is grounded (supported by at least one source signal)
- Which source signal ID supports it (if grounded)
- Your confidence in the grounding (0.0 to 1.0)`,
    messages: [
      {
        role: 'user',
        content: `Here are the source signals this magazine issue was built from:

${signalBlock}

Here is the magazine content to fact-check:

${contentBlock}

Extract every factual claim and check against the source signals.

Return a JSON array. Each claim:
{
  "claim_text": "the specific factual claim",
  "section": "which section it came from",
  "field": "which field within the section",
  "grounded": true/false,
  "source_signal_id": "uuid of supporting signal or null",
  "confidence": 0.0-1.0
}

Return ONLY the JSON array, no other text.`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\[[\s\S]*\]/);

  if (!jsonMatch) {
    // If parsing fails, return partial score with a warning
    violations.push({
      check: 'factual_grounding',
      severity: 'warning',
      section: 'System',
      field: 'claim_extraction',
      message: 'Failed to parse claim extraction response from Claude. Grounding check incomplete.',
      suggestion: 'Re-run QA review to retry claim extraction.',
    });

    return {
      category: 'factual_grounding',
      score: 15, // Partial credit
      max_score: 25,
      violations,
      claims: [],
    };
  }

  let claims: ExtractedClaim[];
  try {
    claims = JSON.parse(jsonMatch[0]);
  } catch {
    violations.push({
      check: 'factual_grounding',
      severity: 'warning',
      section: 'System',
      field: 'claim_extraction',
      message: 'Failed to parse claim extraction JSON. Grounding check incomplete.',
      suggestion: 'Re-run QA review to retry claim extraction.',
    });

    return {
      category: 'factual_grounding',
      score: 15,
      max_score: 25,
      violations,
      claims: [],
    };
  }

  // Score based on grounding ratio
  const totalClaims = claims.length;
  const groundedClaims = claims.filter(c => c.grounded).length;
  const unsupportedClaims = totalClaims - groundedClaims;
  const groundingRatio = totalClaims > 0 ? groundedClaims / totalClaims : 1;

  // Report unsupported claims as violations
  for (const claim of claims) {
    if (!claim.grounded) {
      violations.push({
        check: 'factual_grounding',
        severity: claim.confidence < 0.3 ? 'error' : 'warning',
        section: claim.section,
        field: claim.field,
        message: `Unsupported claim: "${claim.claim_text}"`,
        suggestion: 'Verify this claim against source material or remove it.',
      });
    }
  }

  // Score: 25 points * grounding ratio, with floor at 0
  const score = Math.round(25 * groundingRatio * 100) / 100;

  return {
    category: 'factual_grounding',
    score,
    max_score: 25,
    violations,
    claims,
  };
}

function buildContentBlock(input: QACheckInput): string {
  const sections: string[] = [];

  if (input.cover_story) {
    const cs = input.cover_story as Record<string, unknown>;
    sections.push(`[COVER STORY]\nHeadline: ${cs.headline || ''}\nSubheadline: ${cs.subheadline || ''}\nIntroduction: ${cs.introduction || ''}\nAnalysis: ${cs.analysis || ''}\nStrategic Implications: ${cs.strategic_implications || ''}`);
  }

  const arrayLabel = (name: string, items: Record<string, unknown>[]) => {
    if (items.length === 0) return;
    const block = items.map((item, i) => {
      return Object.entries(item)
        .filter(([, v]) => typeof v === 'string')
        .map(([k, v]) => `  ${k}: ${v}`)
        .join('\n');
    }).join('\n---\n');
    sections.push(`[${name.toUpperCase()}]\n${block}`);
  };

  arrayLabel('Implications', input.implications);
  arrayLabel('Enterprise', input.enterprise);
  arrayLabel('Industry Watch', input.industry_watch);
  arrayLabel('Tools', input.tools);
  arrayLabel('Playbooks', input.playbooks);
  arrayLabel('Strategic Signals', input.strategic_signals);

  if (input.editorial_note) {
    sections.push(`[EDITORIAL NOTE]\n${input.editorial_note}`);
  }
  if (input.why_this_matters) {
    sections.push(`[WHY THIS MATTERS]\n${input.why_this_matters}`);
  }

  return sections.join('\n\n');
}

function buildSignalBlock(input: QACheckInput): string {
  return input.source_signals
    .map(
      (s, i) =>
        `[Signal ${i + 1}] ID: ${s.id}\n` +
        `  Title: ${s.title}\n` +
        `  Summary: ${s.summary}\n` +
        `  Why it matters: ${s.why_it_matters || 'N/A'}\n` +
        `  Company: ${s.company || 'N/A'}\n` +
        `  Category: ${s.category}\n` +
        `  Source: ${s.source}\n` +
        `  Practical implication: ${s.practical_implication || 'N/A'}`,
    )
    .join('\n\n');
}
