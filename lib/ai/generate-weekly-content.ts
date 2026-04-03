// ============================================================
// Weekly Content Generation
// Shorter, more focused prompts for the 10-page weekly edition.
// Reuses types from the monthly edition where possible.
// ============================================================

import Anthropic from '@anthropic-ai/sdk';
import type {
  CoverStory,
  ImplicationItem,
  EnterpriseItem,
  IndustryWatchItem,
  ToolItem,
  PlaybookItem,
  StrategicSignalItem,
  BriefingPromptItem,
  ExecutiveTakeawayItem,
} from '@/lib/types/issue';
import type { SignalContext } from '@/lib/intelligence/types';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const WEEKLY_SYSTEM = `You are an AI strategist writing for the David & Goliath Weekly AI Intelligence Report, a concise weekly intelligence publication for operators, founders, and executives navigating AI adoption globally. Your tone is authoritative, insightful, and practical. You write in Australian English (organisation, optimise, analyse, etc.).

This is a WEEKLY edition covering only the past 7 days. Focus on what happened THIS WEEK. Be specific about recent developments, not general trends.

CRITICAL PUNCTUATION RULE: NEVER use em dashes (—), en dashes (–), or hyphens as punctuation (e.g. " - "). Use commas, semicolons, colons, or restructure the sentence instead.

Key constraints (shorter than monthly):
- Lead story introduction: approximately 200 words
- Lead story analysis: approximately 250 words
- Lead story pull quotes: 2 quotes maximum
- Implication descriptions: max 60 words each
- Enterprise descriptions: max 60 words each
- Industry watch descriptions: max 60 words each
- Tool descriptions: max 30 words each, verdicts max 20 words
- Playbook contexts: max 25 words, steps max 12 words each, outcomes max 15 words
- Strategic signal contexts: max 30 words, implications max 30 words
- Executive takeaway explanations: max 40 words each
- Editorial: approximately 60-80 words

Always return valid JSON matching the requested schema exactly.`;

function formatSignalBlock(ctx: SignalContext): string {
  const lines: string[] = [];

  lines.push(`SCORED INTELLIGENCE SIGNALS (${ctx.signals.length} signals from this week):`);
  ctx.signals.forEach((s, i) => {
    lines.push(`[Signal ${i + 1}] ${s.title} (Score: ${s.composite_score.toFixed(1)}, Category: ${s.category})`);
    lines.push(`  Summary: ${s.summary}`);
    lines.push(`  Why it matters: ${s.why_it_matters}`);
    if (s.practical_implication) {
      lines.push(`  Practical implication: ${s.practical_implication}`);
    }
    if (s.company) {
      lines.push(`  Company: ${s.company}`);
    }
    lines.push(`  Source: ${s.source} (${s.source_url})`);
    lines.push('');
  });

  return lines.join('\n');
}

async function generate<T>(prompt: string, maxTokens = 4096): Promise<T> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    system: WEEKLY_SYSTEM,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');

  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
  const jsonStr = (jsonMatch[1] || text).trim();

  return JSON.parse(jsonStr) as T;
}

/**
 * Generate weekly lead story (single page, not 3-page cover story).
 * Shorter: ~200 word intro + ~250 word analysis.
 */
export async function generateWeeklyLeadStory(
  signalContext: SignalContext,
  instructions?: string,
): Promise<CoverStory> {
  const prompt = `Based on the following intelligence signals from this week, write a concise lead story for a weekly AI intelligence report. Focus on THE single most significant development and its immediate implications.

${formatSignalBlock(signalContext)}

${instructions ? `Additional instructions: ${instructions}` : ''}

Return a JSON object:
{
  "headline": "string (compelling, max 12 words)",
  "subheadline": "string (supporting context, max 20 words)",
  "introduction": "string (approximately 200 words, what happened and why it matters)",
  "analysis": "string (approximately 250 words, deeper context and what operators should know)",
  "strategic_implications": "string (approximately 150 words, immediate actions to consider)",
  "pull_quotes": ["array of exactly 2 impactful quotes or statistics from the narrative"],
  "evidence": {
    "statement": "string (one concise supporting evidence statement, max 25 words)",
    "implication": "string (one sentence strategic implication, max 20 words)"
  }
}

Separate paragraphs with double newlines. Return ONLY the JSON object.`;

  return generate<CoverStory>(prompt, 4096);
}

/**
 * Generate weekly implications (2-3 items, not 4).
 */
export async function generateWeeklyImplications(
  leadStory: CoverStory,
  signalContext: SignalContext,
  instructions?: string,
): Promise<ImplicationItem[]> {
  const prompt = `Based on this week's lead story, identify 3 strategic implications for operators and executives:

Lead Story: ${leadStory.headline}
${leadStory.subheadline}

Key context:
${leadStory.introduction.slice(0, 300)}

Supporting signals:
${formatSignalBlock(signalContext)}

${instructions ? `Additional instructions: ${instructions}` : ''}

Return a JSON array of exactly 3 items:
[{
  "title": "string (max 15 words)",
  "description": "string (max 60 words)",
  "impact_level": "transformative" | "significant" | "emerging",
  "sector_relevance": ["string array of relevant sectors"],
  "source_signal": "string (concise signal source, max 10 words)",
  "data_point": "string (short data indicator)"
}]

Return ONLY the JSON array.`;

  return generate<ImplicationItem[]>(prompt);
}

/**
 * Generate weekly enterprise items (2 items for combined page).
 */
export async function generateWeeklyEnterprise(
  leadStory: CoverStory,
  signalContext: SignalContext,
  instructions?: string,
): Promise<EnterpriseItem[]> {
  const prompt = `Based on this week's developments, identify 2 enterprise AI adoption signals:

Lead Story: ${leadStory.headline}

Intelligence signals:
${formatSignalBlock(signalContext)}

${instructions ? `Additional instructions: ${instructions}` : ''}

Return a JSON array of exactly 2 items:
[{
  "title": "string (max 15 words)",
  "description": "string (max 60 words)",
  "adoption_stage": "early" | "growing" | "mainstream",
  "industry": "string",
  "source_signal": "string (concise signal source, max 10 words)",
  "data_point": "string (short data indicator)"
}]

Return ONLY the JSON array.`;

  return generate<EnterpriseItem[]>(prompt);
}

/**
 * Generate weekly industry watch items (2 items for combined page).
 */
export async function generateWeeklyIndustryWatch(
  leadStory: CoverStory,
  signalContext: SignalContext,
  instructions?: string,
): Promise<IndustryWatchItem[]> {
  const prompt = `Based on this week's developments, identify 2 industry-specific AI trends:

Lead Story Context: ${leadStory.headline}

Intelligence signals:
${formatSignalBlock(signalContext)}

${instructions ? `Additional instructions: ${instructions}` : ''}

Return a JSON array of exactly 2 items:
[{
  "industry": "string (specific industry sector)",
  "headline": "string (max 12 words)",
  "description": "string (max 60 words)",
  "trend_direction": "accelerating" | "emerging" | "stabilising" | "declining",
  "source_signal": "string (concise signal source, max 10 words)"
}]

Return ONLY the JSON array.`;

  return generate<IndustryWatchItem[]>(prompt);
}

/**
 * Generate weekly tools (2 items).
 */
export async function generateWeeklyTools(
  signalContext: SignalContext,
  instructions?: string,
): Promise<ToolItem[]> {
  const prompt = `Based on this week's AI developments, recommend exactly 2 AI tools worth watching:

Intelligence signals:
${formatSignalBlock(signalContext)}

${instructions ? `Additional instructions: ${instructions}` : ''}

Return a JSON array of exactly 2 items:
[{
  "name": "string",
  "description": "string (max 30 words)",
  "category": "string",
  "url": "string (URL if known, otherwise empty string)",
  "verdict": "string (max 20 words)",
  "source_signal": "string (concise signal source, max 10 words)"
}]

Return ONLY the JSON array.`;

  return generate<ToolItem[]>(prompt);
}

/**
 * Generate weekly playbook (1 item, "Play of the Week").
 */
export async function generateWeeklyPlaybook(
  leadStory: CoverStory,
  signalContext: SignalContext,
  instructions?: string,
): Promise<PlaybookItem[]> {
  const prompt = `Based on this week's lead story, create 1 practical "Play of the Week" that operators can implement immediately:

Lead Story: ${leadStory.headline}
${leadStory.subheadline}

Key context:
${leadStory.introduction.slice(0, 300)}

${instructions ? `Additional instructions: ${instructions}` : ''}

Return a JSON array of exactly 1 item:
[{
  "title": "string (max 12 words, action-oriented)",
  "context": "string (max 25 words)",
  "steps": ["string array, 3-4 steps, each max 12 words"],
  "outcome": "string (max 15 words)",
  "source_signal": "string (concise signal source, max 10 words)"
}]

Return ONLY the JSON array.`;

  return generate<PlaybookItem[]>(prompt);
}

/**
 * Generate weekly strategic signals (5 items for Key Signals page).
 */
export async function generateWeeklyStrategicSignals(
  leadStory: CoverStory,
  implications: ImplicationItem[],
  signalContext: SignalContext,
  instructions?: string,
): Promise<StrategicSignalItem[]> {
  const prompt = `Based on this week's developments, identify exactly 5 key signals that operators should be tracking. These are the most important developments from the past 7 days.

Lead Story: ${leadStory.headline}

Implications:
${implications.map((i) => `- ${i.title}: ${i.description}`).join('\n')}

Intelligence signals:
${formatSignalBlock(signalContext)}

${instructions ? `Additional instructions: ${instructions}` : ''}

Return a JSON array of exactly 5 items:
[{
  "signal": "string (max 12 words, the signal observed this week)",
  "context": "string (max 30 words, why this signal matters)",
  "implication": "string (max 30 words, what operators should consider)",
  "source_signal": "string (concise signal source, max 10 words)"
}]

Return ONLY the JSON array.`;

  return generate<StrategicSignalItem[]>(prompt);
}

/**
 * Generate weekly briefing prompts (2 items for toolkit page).
 */
export async function generateWeeklyBriefingPrompts(
  leadStory: CoverStory,
  signalContext: SignalContext,
  instructions?: string,
): Promise<BriefingPromptItem[]> {
  const prompt = `Based on this week's lead story, create 2 leadership discussion prompts:

Lead Story: ${leadStory.headline}
${leadStory.subheadline}

${instructions ? `Additional instructions: ${instructions}` : ''}

Return a JSON array of exactly 2 items:
[{
  "question": "string (thought-provoking question for leadership teams)",
  "context": "string (max 40 words, why this question matters this week)"
}]

Return ONLY the JSON array.`;

  return generate<BriefingPromptItem[]>(prompt);
}

/**
 * Generate weekly executive briefing (4 takeaways).
 */
export async function generateWeeklyExecutiveBriefing(
  leadStory: CoverStory,
  implications: ImplicationItem[],
  signalContext: SignalContext,
  instructions?: string,
): Promise<ExecutiveTakeawayItem[]> {
  const prompt = `Based on this week's lead story and implications, write 4 executive takeaways. Each should be a crisp, actionable insight for C-suite leaders.

Lead Story: ${leadStory.headline}
${leadStory.introduction.slice(0, 300)}

Implications:
${implications.map((i) => `- ${i.title}`).join('\n')}

${instructions ? `Additional instructions: ${instructions}` : ''}

Return a JSON array of exactly 4 items:
[{
  "headline": "string (max 8 words)",
  "explanation": "string (max 40 words)",
  "source_signal": "string (concise signal source, max 10 words)"
}]

Return ONLY the JSON array.`;

  return generate<ExecutiveTakeawayItem[]>(prompt);
}

/**
 * Generate weekly editorial (60-80 words).
 */
export async function generateWeeklyEditorial(
  leadStory: CoverStory,
  weekRange: string,
  instructions?: string,
): Promise<string> {
  const prompt = `Write a brief editorial note (60-80 words) for the David & Goliath Weekly AI Intelligence Report covering the week of ${weekRange}.

This week's lead story: ${leadStory.headline}
${leadStory.subheadline}

The editorial should briefly frame what mattered this week and why it matters to operators. Sign off as "Josh Morrow, Founder".

${instructions ? `Additional instructions: ${instructions}` : ''}

Return ONLY a JSON string (the editorial text). No object wrapping.`;

  return generate<string>(prompt, 1024);
}

/**
 * Generate weekly forward-looking signals (3 items for Strategic Outlook page).
 */
export async function generateWeeklyOutlookSignals(
  leadStory: CoverStory,
  strategicSignals: StrategicSignalItem[],
  signalContext: SignalContext,
  instructions?: string,
): Promise<StrategicSignalItem[]> {
  const prompt = `Based on this week's developments, identify 3 forward-looking signals to watch NEXT week. These should be upcoming developments, announcements, or trends that are likely to unfold.

This week's lead story: ${leadStory.headline}
Key signals observed:
${strategicSignals.map((s) => `- ${s.signal}: ${s.context}`).join('\n')}

${instructions ? `Additional instructions: ${instructions}` : ''}

Return a JSON array of exactly 3 items:
[{
  "signal": "string (max 12 words, what to watch next week)",
  "context": "string (max 30 words, why this is worth watching)",
  "implication": "string (max 30 words, potential impact if this unfolds)",
  "source_signal": "string (concise signal source, max 10 words)"
}]

Return ONLY the JSON array.`;

  return generate<StrategicSignalItem[]>(prompt);
}
