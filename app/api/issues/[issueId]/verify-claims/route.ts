import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { isAuthenticated } from '@/lib/auth';
import { getIssue } from '@/lib/supabase/queries';
import { getLatestQAReport } from '@/lib/supabase/queries';
import { fetchSignalsByIds } from '@/lib/intelligence/fetch-signals-by-ids';
import { fetchTrendsByIds } from '@/lib/intelligence/fetch-trends-by-ids';

export const maxDuration = 120;

type RouteContext = { params: Promise<{ issueId: string }> };

export interface ClaimVerdict {
  claim_text: string;
  section: string;
  verdict: 'hallucinated' | 'grounded' | 'partially_grounded' | 'uncertain';
  explanation: string;
  matching_signal_title: string | null;
  suggested_fix: string | null;
}

export async function POST(_request: Request, context: RouteContext) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  try {
    const { issueId } = await context.params;
    const [issue, qaReport] = await Promise.all([
      getIssue(issueId),
      getLatestQAReport(issueId),
    ]);

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    if (!qaReport) {
      return NextResponse.json({ error: 'No QA report found. Run QA Review first.' }, { status: 400 });
    }

    // Collect all flagged claims from the QA report
    const flaggedClaims: { claim_text: string; section: string; source: string }[] = [];

    // Unsupported claims
    if (Array.isArray(qaReport.unsupported_claims)) {
      for (const c of qaReport.unsupported_claims) {
        flaggedClaims.push({
          claim_text: c.claim_text || '',
          section: c.section || '',
          source: 'unsupported_claim',
        });
      }
    }

    // Reasoning issues (LLM review findings) - only errors and warnings
    if (Array.isArray(qaReport.llm_review_findings)) {
      for (const f of qaReport.llm_review_findings) {
        if (f.severity === 'error' || f.severity === 'warning') {
          flaggedClaims.push({
            claim_text: f.message || '',
            section: f.section || '',
            source: 'reasoning_flag',
          });
        }
      }
    }

    if (flaggedClaims.length === 0) {
      return NextResponse.json({ verdicts: [], summary: 'No flagged claims to verify.' });
    }

    // Fetch source signals and trends
    const [signals, trends] = await Promise.all([
      issue.source_signal_ids?.length
        ? fetchSignalsByIds(issue.source_signal_ids).catch(() => [])
        : Promise.resolve([]),
      issue.source_trend_ids?.length
        ? fetchTrendsByIds(issue.source_trend_ids).catch(() => [])
        : Promise.resolve([]),
    ]);

    // Build comprehensive signal context for LLM
    const signalContext = signals.map(s =>
      `[Signal: ${s.title}]\nCompany: ${s.company || 'N/A'}\nCategory: ${s.category}\nDate: ${s.signal_date || 'N/A'}\nSummary: ${s.summary}\nWhy it matters: ${s.why_it_matters || ''}\nPractical implication: ${s.practical_implication || ''}\nSource: ${s.source_url || s.source || ''}`,
    ).join('\n\n---\n\n');

    const trendContext = trends.map(t =>
      `[Trend: ${t.title}]\nDescription: ${t.description}\nStrategic summary: ${t.strategic_summary || ''}\nImplication: ${t.implication_for_operators || ''}`,
    ).join('\n\n---\n\n');

    const claimsBlock = flaggedClaims.map((c, i) =>
      `[Claim ${i + 1}] (Section: ${c.section}, Source: ${c.source})\n${c.claim_text}`,
    ).join('\n\n');

    // Use Claude to do deep semantic verification
    const verdicts = await verifyClaimsViaLLM(claimsBlock, signalContext, trendContext, flaggedClaims.length);

    // Map verdicts back to claims
    const results: ClaimVerdict[] = flaggedClaims.map((claim, i) => {
      const verdict = verdicts[i];
      return {
        claim_text: claim.claim_text,
        section: claim.section,
        verdict: verdict?.verdict || 'uncertain',
        explanation: verdict?.explanation || 'Could not verify.',
        matching_signal_title: verdict?.matching_signal_title || null,
        suggested_fix: verdict?.suggested_fix || null,
      };
    });

    const hallucinatedCount = results.filter(r => r.verdict === 'hallucinated').length;
    const groundedCount = results.filter(r => r.verdict === 'grounded' || r.verdict === 'partially_grounded').length;
    const uncertainCount = results.filter(r => r.verdict === 'uncertain').length;

    return NextResponse.json({
      verdicts: results,
      summary: `Verified ${results.length} flagged claims: ${hallucinatedCount} hallucinated, ${groundedCount} grounded (false positives), ${uncertainCount} uncertain.`,
      counts: { hallucinated: hallucinatedCount, grounded: groundedCount, uncertain: uncertainCount },
    });
  } catch (error) {
    console.error('Claim verification failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Verification failed' },
      { status: 500 },
    );
  }
}

async function verifyClaimsViaLLM(
  claimsBlock: string,
  signalContext: string,
  trendContext: string,
  claimCount: number,
): Promise<Array<{ verdict: 'hallucinated' | 'grounded' | 'partially_grounded' | 'uncertain'; explanation: string; matching_signal_title: string | null; suggested_fix: string | null }>> {
  const anthropic = new Anthropic();

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    system: `You are a senior fact-checker verifying claims in an AI strategy magazine. You have access to the COMPLETE set of source signals and trends that were used to generate this magazine.

Your job: For each flagged claim, determine whether it is genuinely hallucinated (made up by the AI content generator) or actually grounded in the provided source signals/trends.

IMPORTANT RULES:
- A claim is "grounded" if the source signals contain the specific information being claimed, even if paraphrased or synthesised
- A claim is "partially_grounded" if the general topic is in the signals but specific details (exact numbers, model version names, dates) are not verifiable
- A claim is "hallucinated" if no source signal supports it AND it contains specific details that appear fabricated (e.g. specific model version numbers, exact funding amounts, specific regulatory names that don't appear anywhere in the signals)
- A claim is "uncertain" if you cannot confidently determine either way
- Prescriptive advice ("implement X", "deploy Y") should always be marked as "grounded" since it's editorial recommendation, not a factual claim

For hallucinated claims, provide a specific suggested_fix that describes what should be changed or removed.

BE PRECISE: Only mark something as "hallucinated" if you are confident it's fabricated. When in doubt, prefer "uncertain" or "partially_grounded".`,
    messages: [{
      role: 'user',
      content: `Here are the flagged claims to verify:

${claimsBlock}

---

SOURCE SIGNALS (complete set):

${signalContext}

---

SOURCE TRENDS:

${trendContext}

---

For each of the ${claimCount} claims above, return a JSON array with one entry per claim (in the same order):
[{"verdict": "hallucinated|grounded|partially_grounded|uncertain", "explanation": "why this verdict", "matching_signal_title": "title of matching signal or null", "suggested_fix": "what to change if hallucinated, or null"}]

Return ONLY the JSON array, no other text.`,
    }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
