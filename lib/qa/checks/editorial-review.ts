// ============================================================
// QA Check: Editorial Review / Reasoning Validity (max 10 points)
// Uses Claude to identify weak reasoning, unsupported conclusions,
// logical gaps, and overgeneralisation.
// ============================================================

import Anthropic from '@anthropic-ai/sdk';
import type { QACheckInput, QACheckResult, QAViolation, ExtractedClaim } from '../../types/qa';

export async function checkEditorialReview(
  input: QACheckInput,
  extractedClaims: ExtractedClaim[],
): Promise<QACheckResult> {
  const violations: QAViolation[] = [];

  const contentSummary = buildContentSummary(input);
  const claimsSummary = buildClaimsSummary(extractedClaims);

  const anthropic = new Anthropic();

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3072,
    system: `You are an editorial quality reviewer for a professional AI strategy magazine.
Your task is to identify reasoning weaknesses in the content.

Look for:
1. Unsupported conclusions (claims that leap beyond the evidence)
2. Logical gaps (where A is stated, then C is concluded, but B is missing)
3. Overgeneralisation (e.g. "all enterprises" when only one example is cited)
4. Contradictions between sections
5. Vague or weasel language that undermines credibility ("some experts say", "it is believed")

Write in Australian English. Do not flag editorial opinions or forward-looking strategic commentary as issues.`,
    messages: [
      {
        role: 'user',
        content: `Review this magazine content for reasoning quality issues.

CONTENT:
${contentSummary}

EXTRACTED CLAIMS (for reference):
${claimsSummary}

Return a JSON object:
{
  "reasoning_score": 0-10 (10 = flawless reasoning, 0 = major issues),
  "issues": [
    {
      "section": "section name",
      "field": "field name",
      "issue_type": "unsupported_conclusion" | "logical_gap" | "overgeneralisation" | "contradiction" | "vague_language",
      "severity": "error" | "warning" | "info",
      "message": "description of the issue",
      "suggestion": "how to fix it"
    }
  ]
}

Return ONLY the JSON object, no other text.`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    violations.push({
      check: 'reasoning_validity',
      severity: 'warning',
      section: 'System',
      field: 'editorial_review',
      message: 'Failed to parse editorial review response. Reasoning check incomplete.',
      suggestion: 'Re-run QA review to retry editorial review.',
    });

    return {
      category: 'reasoning_validity',
      score: 6, // Partial credit
      max_score: 10,
      violations,
    };
  }

  let parsed: { reasoning_score: number; issues: Array<{
    section: string;
    field: string;
    issue_type: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
    suggestion: string;
  }> };

  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    violations.push({
      check: 'reasoning_validity',
      severity: 'warning',
      section: 'System',
      field: 'editorial_review',
      message: 'Failed to parse editorial review JSON. Reasoning check incomplete.',
      suggestion: 'Re-run QA review to retry editorial review.',
    });

    return {
      category: 'reasoning_validity',
      score: 6,
      max_score: 10,
      violations,
    };
  }

  // Convert issues to violations
  for (const issue of parsed.issues) {
    violations.push({
      check: 'reasoning_validity',
      severity: issue.severity,
      section: issue.section,
      field: issue.field,
      message: `[${issue.issue_type}] ${issue.message}`,
      suggestion: issue.suggestion,
    });
  }

  // Use Claude's score, clamped to 0-10
  const score = Math.max(0, Math.min(10, parsed.reasoning_score));

  return {
    category: 'reasoning_validity',
    score,
    max_score: 10,
    violations,
  };
}

function buildContentSummary(input: QACheckInput): string {
  const parts: string[] = [];

  if (input.cover_story) {
    const cs = input.cover_story as Record<string, unknown>;
    parts.push(`[COVER STORY] ${cs.headline || ''}\n${cs.introduction || ''}\n${cs.analysis || ''}`);
  }

  const addArray = (name: string, items: Record<string, unknown>[]) => {
    if (items.length === 0) return;
    const summaries = items.map(item => {
      const title = item.title || item.headline || item.signal || item.name || '';
      const desc = item.description || item.explanation || item.context || item.summary || '';
      return `  - ${title}: ${desc}`;
    }).join('\n');
    parts.push(`[${name}]\n${summaries}`);
  };

  addArray('IMPLICATIONS', input.implications);
  addArray('ENTERPRISE', input.enterprise);
  addArray('INDUSTRY WATCH', input.industry_watch);
  addArray('STRATEGIC SIGNALS', input.strategic_signals);

  if (input.editorial_note) {
    parts.push(`[EDITORIAL NOTE]\n${input.editorial_note}`);
  }

  return parts.join('\n\n');
}

function buildClaimsSummary(claims: ExtractedClaim[]): string {
  if (claims.length === 0) return 'No claims extracted.';

  return claims
    .map(c => `- [${c.grounded ? 'GROUNDED' : 'UNSUPPORTED'}] "${c.claim_text}" (${c.section}/${c.field})`)
    .join('\n');
}
