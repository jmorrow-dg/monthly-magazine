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
  AiNativeOrgData,
  RegionalSignal,
} from '@/lib/types/issue';
import type { GlobalLandscapeRegion } from '@/lib/templates/page-visual-global-landscape';
import type { SignalContext } from '@/lib/intelligence/types';
import type { SectionEvidencePack } from '@/lib/types/evidence';
import { formatEvidencePack } from '@/lib/evidence/format-evidence-pack';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM = `You are an AI strategist writing for the David & Goliath AI Intelligence Report, a premium monthly intelligence publication for operators, founders, and executives navigating AI adoption globally. Your tone is authoritative, insightful, and practical. You write in Australian English (organisation, optimise, analyse, etc.). Draw signals from major AI labs, enterprise technology companies, global startups, infrastructure providers, and regulatory developments across North America, Europe, Asia, and emerging markets.

CRITICAL PUNCTUATION RULE: NEVER use em dashes (—), en dashes (–), or hyphens as punctuation (e.g. " - "). Use commas, semicolons, colons, or restructure the sentence instead. This applies to all text including pull quotes, descriptions, and editorial content.

Key constraints:
- Cover story introduction: approximately 500 words
- Cover story analysis: approximately 650 words
- Cover story strategic implications: approximately 500 words
- Cover story pull quotes: 4-6 quotes
- Implication descriptions: max 80 words each
- Enterprise descriptions: max 80 words each
- Industry watch descriptions: max 80 words each
- Tool descriptions: max 40 words each, verdicts max 25 words
- Playbook contexts: max 30 words, steps max 15 words each, outcomes max 20 words
- Strategic signal contexts: max 40 words, implications max 40 words
- Briefing prompt explanations: max 60 words each
- Executive takeaway headlines: max 10 words each, explanations max 60 words each
- AI Native Organisation signal explanations: max 50 words each
- AI Native Organisation layer focus: max 120 words
- Editorial: approximately 80-120 words

Always return valid JSON matching the requested schema exactly.`;

/**
 * Format signal context into a prompt-friendly block.
 * When signals are available, they replace raw source URLs with richer,
 * pre-analysed intelligence data.
 */
function formatSignalBlock(ctx: SignalContext): string {
  const lines: string[] = [];

  if (ctx.cluster) {
    lines.push(`CLUSTER THEME: ${ctx.cluster.title}`);
    lines.push(`Theme: ${ctx.cluster.theme}`);
    if (ctx.cluster.narrative_summary) {
      lines.push(`Narrative: ${ctx.cluster.narrative_summary}`);
    }
    lines.push('');
  }

  // Include trend summaries when available
  if (ctx.trends && ctx.trends.length > 0) {
    lines.push(`STRATEGIC TRENDS (${ctx.trends.length} identified):`);
    ctx.trends.forEach((t, i) => {
      lines.push(`[Trend ${i + 1}] ${t.title} (Confidence: ${t.confidence_score.toFixed(1)})`);
      lines.push(`  Description: ${t.description}`);
      if (t.strategic_summary) {
        lines.push(`  Strategic summary: ${t.strategic_summary}`);
      }
      if (t.implication_for_operators) {
        lines.push(`  For operators: ${t.implication_for_operators}`);
      }
      if (t.region_scope.length > 0) {
        lines.push(`  Regions: ${t.region_scope.join(', ')}`);
      }
      if (t.sector_scope.length > 0) {
        lines.push(`  Sectors: ${t.sector_scope.join(', ')}`);
      }
      lines.push('');
    });
  }

  lines.push(`SCORED INTELLIGENCE SIGNALS (${ctx.signals.length} signals):`);
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

/**
 * Format a subset of signals filtered by category.
 */
function filterSignalsByCategory(ctx: SignalContext, categories: string[]): SignalContext {
  const lowerCategories = categories.map((c) => c.toLowerCase());
  return {
    ...ctx,
    signals: ctx.signals.filter((s) =>
      lowerCategories.some((cat) => s.category.toLowerCase().includes(cat)),
    ),
  };
}

async function generate<T>(prompt: string, maxTokens = 4096): Promise<T> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    system: SYSTEM,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');

  // Extract JSON from the response (handle markdown code blocks)
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
  const jsonStr = (jsonMatch[1] || text).trim();

  return JSON.parse(jsonStr) as T;
}

export async function generateCoverStory(
  sources: string[],
  instructions?: string,
  signalContext?: SignalContext,
  evidencePack?: SectionEvidencePack,
): Promise<CoverStory> {
  const sourceBlock = evidencePack
    ? formatEvidencePack(evidencePack)
    : signalContext
      ? `The following pre-analysed intelligence signals have been scored and clustered by our Intelligence Hub. Use these as your primary source material. Each signal includes a composite score (higher = more significant), category, summary, and strategic analysis.

${formatSignalBlock(signalContext)}`
      : `Source material:
${sources.map((s, i) => `[${i + 1}] ${s}`).join('\n\n')}`;

  const prompt = `Based on the following source material, write a compelling cover story for a premium AI intelligence report aimed at operators, founders, and executives globally. The story should synthesise the most significant AI developments into a cohesive narrative with strategic business implications. Draw on examples from companies, labs, and developments across multiple regions.

${sourceBlock}

${instructions ? `Additional instructions: ${instructions}` : ''}

Return a JSON object matching this schema:
{
  "headline": "string (compelling, max 15 words)",
  "subheadline": "string (supporting context, max 25 words)",
  "introduction": "string (approximately 500 words, sets the scene and introduces the core theme, engaging opening)",
  "analysis": "string (approximately 650 words, deep dive into the developments, data points, expert perspectives)",
  "strategic_implications": "string (approximately 500 words, what this means for operators and organisations globally, actionable takeaways)",
  "pull_quotes": ["array of 4-6 impactful quotes or statistics pulled from the narrative"],
  "evidence": {
    "statement": "string (one concise supporting evidence statement, max 30 words, referencing a specific data point, industry report finding, or observable market pattern)",
    "implication": "string (one sentence strategic implication of the evidence, max 25 words)"
  }
}

Separate paragraphs within introduction, analysis, and strategic_implications with double newlines.

Return ONLY the JSON object, no other text.`;

  return generate<CoverStory>(prompt, 8192);
}

export async function generateImplications(
  coverStory: CoverStory,
  instructions?: string,
  signalContext?: SignalContext,
  evidencePack?: SectionEvidencePack,
): Promise<ImplicationItem[]> {
  const signalEnrichment = evidencePack
    ? `\n\n${formatEvidencePack(evidencePack)}`
    : signalContext
      ? `\n\nSupporting intelligence signals:\n${formatSignalBlock(signalContext)}`
      : '';

  const prompt = `Based on this cover story, identify 4 strategic implications for operators and executives globally:

Cover Story: ${coverStory.headline}
${coverStory.subheadline}

Key themes from the story:
${coverStory.introduction.slice(0, 500)}
${signalEnrichment}

${instructions ? `Additional instructions: ${instructions}` : ''}

Return a JSON array of exactly 4 items:
[{
  "title": "string (max 20 words)",
  "description": "string (max 80 words)",
  "impact_level": "transformative" | "significant" | "emerging",
  "sector_relevance": ["string array of relevant sectors"],
  "source_signal": "string (concise signal source, max 10 words, e.g. 'Enterprise technology analyst reports, Q1 2026')",
  "data_point": "string (short data indicator, e.g. '72% of enterprises expanding AI pilots' or '$180B projected infrastructure spend')"
}]

Return ONLY the JSON array.`;

  return generate<ImplicationItem[]>(prompt);
}

export async function generateEnterprise(
  coverStory: CoverStory,
  instructions?: string,
  signalContext?: SignalContext,
  evidencePack?: SectionEvidencePack,
): Promise<EnterpriseItem[]> {
  let signalEnrichment = '';
  if (evidencePack) {
    signalEnrichment = `\n\n${formatEvidencePack(evidencePack)}`;
  } else if (signalContext) {
    const enterpriseSignals = filterSignalsByCategory(signalContext, ['enterprise', 'adoption', 'infrastructure']);
    signalEnrichment = enterpriseSignals.signals.length > 0
      ? `\n\nEnterprise intelligence signals:\n${formatSignalBlock(enterpriseSignals)}`
      : `\n\nIntelligence signals:\n${formatSignalBlock(signalContext)}`;
  }

  const prompt = `Based on this cover story, identify 4 enterprise AI adoption signals:

Cover Story: ${coverStory.headline}
${coverStory.subheadline}

Key themes:
${coverStory.introduction.slice(0, 500)}
${signalEnrichment}

${instructions ? `Additional instructions: ${instructions}` : ''}

Return a JSON array of exactly 4 items:
[{
  "title": "string (max 20 words)",
  "description": "string (max 80 words)",
  "adoption_stage": "early" | "growing" | "mainstream",
  "industry": "string",
  "source_signal": "string (concise signal source, max 10 words, e.g. 'Industry deployment surveys, 2026')",
  "data_point": "string (short data indicator, e.g. '3x increase in production deployments' or '45% cost reduction reported')"
}]

Return ONLY the JSON array.`;

  return generate<EnterpriseItem[]>(prompt);
}

export async function generateIndustryWatch(
  sources: string[],
  coverStory: CoverStory,
  instructions?: string,
  signalContext?: SignalContext,
  evidencePack?: SectionEvidencePack,
): Promise<IndustryWatchItem[]> {
  const sourceBlock = evidencePack
    ? formatEvidencePack(evidencePack)
    : signalContext
      ? `Intelligence signals:\n${formatSignalBlock(signalContext)}`
      : `Source material:\n${sources.map((s, i) => `[${i + 1}] ${s}`).join('\n\n')}`;

  const prompt = `Based on the source material and cover story context, identify 4-6 industry-specific AI trends worth watching for operators and executives globally. Each should focus on a different industry sector. Include developments from companies and markets across multiple regions.

${sourceBlock}

Cover Story Context: ${coverStory.headline}
${coverStory.subheadline}

${instructions ? `Additional instructions: ${instructions}` : ''}

Return a JSON array of 4-6 items:
[{
  "industry": "string (specific industry sector)",
  "headline": "string (max 15 words)",
  "description": "string (max 80 words)",
  "trend_direction": "accelerating" | "emerging" | "stabilising" | "declining"
}]

Return ONLY the JSON array.`;

  return generate<IndustryWatchItem[]>(prompt);
}

export async function generateTools(
  sources: string[],
  instructions?: string,
  signalContext?: SignalContext,
  evidencePack?: SectionEvidencePack,
): Promise<ToolItem[]> {
  const sourceBlock = evidencePack
    ? formatEvidencePack(evidencePack)
    : signalContext
      ? `Intelligence signals (identify tools mentioned or implied by these developments):\n${formatSignalBlock(signalContext)}`
      : `Source material:\n${sources.map((s, i) => `[${i + 1}] ${s}`).join('\n\n')}`;

  const prompt = `Based on the source material, recommend 6 AI tools worth watching for business operators:

${sourceBlock}

${instructions ? `Additional instructions: ${instructions}` : ''}

Return a JSON array of exactly 6 items:
[{
  "name": "string",
  "description": "string (max 40 words)",
  "category": "string (e.g. Productivity, Analytics, Automation, etc.)",
  "url": "string (URL if known, otherwise empty string)",
  "verdict": "string (max 25 words, concise assessment)"
}]

Return ONLY the JSON array.`;

  return generate<ToolItem[]>(prompt);
}

export async function generatePlaybooks(
  coverStory: CoverStory,
  instructions?: string,
  signalContext?: SignalContext,
  evidencePack?: SectionEvidencePack,
): Promise<PlaybookItem[]> {
  const signalEnrichment = evidencePack
    ? `\n\n${formatEvidencePack(evidencePack)}`
    : signalContext
      ? `\n\nIntelligence signals for grounding playbooks:\n${formatSignalBlock(signalContext)}`
      : '';

  const prompt = `Based on this cover story, create 4 practical operator playbooks that business leaders can implement regardless of region or market:

Cover Story: ${coverStory.headline}
${coverStory.subheadline}

Key themes:
${coverStory.introduction.slice(0, 500)}

Strategic implications:
${coverStory.strategic_implications.slice(0, 500)}
${signalEnrichment}

${instructions ? `Additional instructions: ${instructions}` : ''}

Return a JSON array of exactly 4 items:
[{
  "title": "string (max 15 words, action-oriented)",
  "context": "string (max 30 words)",
  "steps": ["string array, 3-5 steps, each max 15 words"],
  "outcome": "string (max 20 words)"
}]

Return ONLY the JSON array.`;

  return generate<PlaybookItem[]>(prompt);
}

export async function generateStrategicSignals(
  coverStory: CoverStory,
  implications: ImplicationItem[],
  instructions?: string,
  signalContext?: SignalContext,
  evidencePack?: SectionEvidencePack,
): Promise<StrategicSignalItem[]> {
  const signalEnrichment = evidencePack
    ? `\n\n${formatEvidencePack(evidencePack)}`
    : signalContext
      ? `\n\nScored intelligence signals:\n${formatSignalBlock(signalContext)}`
      : '';

  const prompt = `Based on the cover story and strategic implications, identify 4-6 strategic signals that forward-thinking operators and executives should be monitoring globally. These are early indicators of shifts that will shape the business landscape. Draw signals from AI labs, enterprise technology, regulatory developments, and adoption patterns across multiple regions.

Cover Story: ${coverStory.headline}
${coverStory.subheadline}

Strategic Implications:
${implications.map((i) => `- ${i.title}: ${i.description}`).join('\n')}
${signalEnrichment}

${instructions ? `Additional instructions: ${instructions}` : ''}

Return a JSON array of 4-6 items:
[{
  "signal": "string (max 15 words, the signal being observed)",
  "context": "string (max 40 words, why this signal matters)",
  "implication": "string (max 40 words, what operators should consider)"
}]

Return ONLY the JSON array.`;

  return generate<StrategicSignalItem[]>(prompt);
}

export async function generateWhyThisMatters(
  coverStory: CoverStory,
  implications: ImplicationItem[],
  instructions?: string,
  signalContext?: SignalContext,
  evidencePack?: SectionEvidencePack,
): Promise<string> {
  const signalEnrichment = evidencePack
    ? `\n\n${formatEvidencePack(evidencePack)}`
    : signalContext
      ? `\n\nIntelligence signals:\n${formatSignalBlock(signalContext)}`
      : '';

  const prompt = `Write a "Why This Matters" section (120-180 words) for the David & Goliath AI Intelligence Report.

Cover Story: ${coverStory.headline}
${coverStory.subheadline}

Key implications:
${implications.map((i) => `- ${i.title}: ${i.description}`).join('\n')}
${signalEnrichment}

${instructions ? `Additional instructions: ${instructions}` : ''}

This section should:
- Explain why the AI developments covered in this report matter for modern organisations and decision-makers
- Speak to operators, founders, and executives navigating AI adoption
- Use a strategic, authoritative tone
- Not reference any personal names or specific companies
- Use Australian English
- Be engaging and thought-provoking
- Separate paragraphs with double newlines

Return ONLY the text, no JSON wrapping.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    system: SYSTEM,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');
}

export async function generateBriefingPrompts(
  coverStory: CoverStory,
  implications: ImplicationItem[],
  instructions?: string,
  signalContext?: SignalContext,
  evidencePack?: SectionEvidencePack,
): Promise<BriefingPromptItem[]> {
  const signalEnrichment = evidencePack
    ? `\n\n${formatEvidencePack(evidencePack)}`
    : signalContext
      ? `\n\nIntelligence signals:\n${formatSignalBlock(signalContext)}`
      : '';

  const prompt = `Based on the cover story and strategic implications, generate 6 "Operator Briefing Prompts" for the David & Goliath AI Intelligence Report. These are strategic questions that leadership teams should be discussing in their next meeting. Each prompt should provoke meaningful discussion about AI strategy, adoption, risk, or opportunity.

Cover Story: ${coverStory.headline}
${coverStory.subheadline}

Strategic Implications:
${implications.map((i) => `- ${i.title}: ${i.description}`).join('\n')}
${signalEnrichment}

${instructions ? `Additional instructions: ${instructions}` : ''}

Requirements:
- Each question should be specific enough to drive a focused 10-minute leadership discussion
- Questions should span different strategic angles: competitive positioning, risk management, capability building, investment prioritisation, talent strategy, operational readiness
- Explanations should clarify why the question matters and what dimensions to consider
- Use Australian English
- Do NOT use em dashes, en dashes, or hyphens as punctuation

Return a JSON array of exactly 6 items:
[{
  "question": "string (a strategic question for leadership discussion)",
  "explanation": "string (max 60 words, why this question matters and what to consider)"
}]

Return ONLY the JSON array.`;

  return generate<BriefingPromptItem[]>(prompt);
}

export async function generateExecutiveBriefing(
  coverStory: CoverStory,
  implications: ImplicationItem[],
  instructions?: string,
  signalContext?: SignalContext,
  evidencePack?: SectionEvidencePack,
): Promise<ExecutiveTakeawayItem[]> {
  const signalEnrichment = evidencePack
    ? `\n\n${formatEvidencePack(evidencePack)}`
    : signalContext
      ? `\n\nIntelligence signals:\n${formatSignalBlock(signalContext)}`
      : '';

  const prompt = `Based on the cover story and strategic implications, generate 5 executive takeaways for the "Executive Briefing: Key Takeaways" section of the David & Goliath AI Intelligence Report. This section provides senior leaders with a concise summary of the most important strategic insights from the report.

Cover Story: ${coverStory.headline}
${coverStory.subheadline}

Introduction context:
${coverStory.introduction.slice(0, 400)}

Strategic Implications:
${implications.map((i) => `- ${i.title}: ${i.description}`).join('\n')}
${signalEnrichment}

${instructions ? `Additional instructions: ${instructions}` : ''}

Requirements:
- Generate exactly 5 takeaways that summarise the most important themes in this issue
- Each takeaway should feel strategic rather than tactical (similar in tone to McKinsey or BCG reports)
- Focus on insights related to: AI adoption patterns, organisational transformation, competitive advantage, operational redesign, emerging technology infrastructure
- Avoid: tool announcements, product releases, hype language
- Headlines should be clear, analytical, and direct
- Explanations should clarify the strategic significance and what leaders need to understand
- Use Australian English
- Do NOT use em dashes, en dashes, or hyphens as punctuation

Return a JSON array of exactly 5 items:
[{
  "headline": "string (max 10 words, clear strategic insight)",
  "explanation": "string (max 60 words, strategic significance and context)"
}]

Return ONLY the JSON array.`;

  return generate<ExecutiveTakeawayItem[]>(prompt);
}

export async function generateAiNativeOrg(
  coverStory: CoverStory,
  implications: ImplicationItem[],
  edition: number,
  instructions?: string,
  signalContext?: SignalContext,
  evidencePack?: SectionEvidencePack,
): Promise<AiNativeOrgData> {
  // Rotate through the five layers each edition
  const layers = ['strategy', 'workflow', 'agent', 'model', 'infrastructure'] as const;
  const focusLayer = layers[(edition - 1) % layers.length];

  const layerDescriptions: Record<string, string> = {
    strategy: 'Strategy Layer: leadership decisions, governance, and resource allocation',
    workflow: 'Workflow Layer: business processes redesigned around AI systems',
    agent: 'Agent Layer: autonomous systems executing tasks and coordinating workflows',
    model: 'Model Layer: foundation models and reasoning engines',
    infrastructure: 'Infrastructure Layer: compute, data, and orchestration platforms',
  };

  const signalEnrichment = evidencePack
    ? `\n\n${formatEvidencePack(evidencePack)}`
    : signalContext
      ? `\n\nIntelligence signals:\n${formatSignalBlock(signalContext)}`
      : '';

  const prompt = `Based on the cover story and strategic implications, generate content for "The AI Native Organisation" framework page. This page features a recurring five-layer model of the AI native organisation (Strategy, Workflow, Agent, Model, Infrastructure) with dynamic monthly content.

Cover Story: ${coverStory.headline}
${coverStory.subheadline}

Strategic Implications:
${implications.map((i) => `- ${i.title}: ${i.description}`).join('\n')}
${signalEnrichment}

${instructions ? `Additional instructions: ${instructions}` : ''}

Generate two sections of dynamic content:

1. SIGNALS THIS MONTH: Three signals that indicate how organisations are becoming more AI native. Each signal should connect to this month's developments. Keep the tone analytical, similar to McKinsey or BCG reports.

2. LAYER IN FOCUS: This month's focus is the ${layerDescriptions[focusLayer]}. Write an analytical paragraph (max 120 words) explaining how recent developments (from the cover story context) are affecting this specific layer of the AI native organisation.

Requirements:
- Use Australian English
- Do NOT use em dashes, en dashes, or hyphens as punctuation
- Signal explanations: max 50 words each
- Layer focus text: max 120 words

Return a JSON object:
{
  "signals": [
    { "headline": "string (max 10 words)", "explanation": "string (max 50 words)", "source_signal": "string (concise source, max 8 words)" },
    { "headline": "string (max 10 words)", "explanation": "string (max 50 words)", "source_signal": "string (concise source, max 8 words)" },
    { "headline": "string (max 10 words)", "explanation": "string (max 50 words)", "source_signal": "string (concise source, max 8 words)" }
  ],
  "layer_in_focus": "${focusLayer}",
  "layer_focus_text": "string (max 120 words, analytical paragraph)"
}

Return ONLY the JSON object.`;

  return generate<AiNativeOrgData>(prompt);
}

export async function generateEditorial(
  coverStory: CoverStory,
  implications: ImplicationItem[],
  month: string,
  edition: number,
  instructions?: string,
  signalContext?: SignalContext,
  evidencePack?: SectionEvidencePack,
): Promise<string> {
  const signalEnrichment = evidencePack
    ? `\n\n${formatEvidencePack(evidencePack)}`
    : signalContext
      ? `\n\nTop intelligence signals this month:\n${signalContext.signals.slice(0, 5).map((s) => `- ${s.title} (Score: ${s.composite_score.toFixed(1)})`).join('\n')}`
      : '';

  const prompt = `Write an editorial note for Edition ${String(edition).padStart(2, '0')} (${month}) of the David & Goliath AI Intelligence Report.

Cover story theme: ${coverStory.headline}
${coverStory.subheadline}

Key implications:
${implications.map((i) => `- ${i.title}`).join('\n')}
${signalEnrichment}

${instructions ? `Additional instructions: ${instructions}` : ''}

The editorial should:
- Be exactly 80-120 words, no longer
- Briefly frame the most important AI shift this month
- Explain why it matters for operators and decision-makers
- Introduce the rest of the report (one sentence)
- Do NOT include a title, heading, or author attribution
- Do NOT use em dashes, en dashes, or hyphens as punctuation
- Be strategic, confident, and concise
- Use Australian English
- Separate paragraphs with double newlines

Return ONLY the editorial text, no JSON wrapping.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: SYSTEM,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');
}

export async function generateRegionalSignals(
  coverStory: CoverStory,
  context: string,
  instructions?: string,
  signalContext?: SignalContext,
  evidencePack?: SectionEvidencePack,
): Promise<{ implications: RegionalSignal[]; enterprise: RegionalSignal[] }> {
  const signalEnrichment = evidencePack
    ? `\n\n${formatEvidencePack(evidencePack)}`
    : signalContext
      ? `\n\nIntelligence signals:\n${formatSignalBlock(signalContext)}`
      : '';

  const prompt = `Based on this cover story, generate two sets of regional signals showing how global AI developments manifest differently across key regions. Each set has exactly 3 signals (United States, Europe, Asia).

Cover Story: ${coverStory.headline}
${coverStory.subheadline}

Context: ${context}
${signalEnrichment}

${instructions ? `Additional instructions: ${instructions}` : ''}

Requirements:
- Each signal: max 20 words, concise and specific
- Signals should highlight meaningful regional differences in the same global trend
- Focus on: enterprise deployments, regulatory changes, infrastructure investments, major technology initiatives
- Avoid minor local news or repetitive phrasing
- Use Australian English
- Do NOT use em dashes, en dashes, or hyphens as punctuation

Return a JSON object:
{
  "implications": [
    { "region": "United States", "signal": "string (max 20 words)" },
    { "region": "Europe", "signal": "string (max 20 words)" },
    { "region": "Asia", "signal": "string (max 20 words)" }
  ],
  "enterprise": [
    { "region": "United States", "signal": "string (max 20 words)" },
    { "region": "Europe", "signal": "string (max 20 words)" },
    { "region": "Asia", "signal": "string (max 20 words)" }
  ]
}

Return ONLY the JSON object.`;

  return generate<{ implications: RegionalSignal[]; enterprise: RegionalSignal[] }>(prompt);
}

export async function generateGlobalLandscape(
  coverStory: CoverStory,
  instructions?: string,
  signalContext?: SignalContext,
  evidencePack?: SectionEvidencePack,
): Promise<GlobalLandscapeRegion[]> {
  const signalEnrichment = evidencePack
    ? `\n\n${formatEvidencePack(evidencePack)}`
    : signalContext
      ? `\n\nIntelligence signals:\n${formatSignalBlock(signalContext)}`
      : '';

  const prompt = `Based on this cover story, generate regional AI landscape data for four regions. Each region should have 3 signals highlighting the most significant AI developments in that region this month.

Cover Story: ${coverStory.headline}
${coverStory.subheadline}

Key themes:
${coverStory.introduction.slice(0, 400)}
${signalEnrichment}

${instructions ? `Additional instructions: ${instructions}` : ''}

Requirements:
- Each signal: max 15 words, concise
- Signals should be specific and current, not generic
- Cover: enterprise adoption, regulatory shifts, infrastructure investment, technology developments
- Use Australian English
- Do NOT use em dashes, en dashes, or hyphens as punctuation

Return a JSON array of exactly 4 regions:
[
  { "name": "North America", "signals": ["signal 1", "signal 2", "signal 3"] },
  { "name": "Europe", "signals": ["signal 1", "signal 2", "signal 3"] },
  { "name": "Asia", "signals": ["signal 1", "signal 2", "signal 3"] },
  { "name": "Global Networks", "signals": ["signal 1", "signal 2", "signal 3"] }
]

Return ONLY the JSON array.`;

  return generate<GlobalLandscapeRegion[]>(prompt);
}
