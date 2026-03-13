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
} from '@/lib/types/issue';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM = `You are an AI strategist writing for the David & Goliath AI Intelligence Report, a premium monthly magazine for Australian business operators. Your tone is authoritative, insightful, and practical. You write in Australian English (organisation, optimise, analyse, etc.).

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
): Promise<CoverStory> {
  const prompt = `Based on the following source material, write a compelling cover story for a premium AI intelligence report aimed at Australian business operators. The story should synthesise the most significant AI developments into a cohesive narrative with strategic business implications.

Source material:
${sources.map((s, i) => `[${i + 1}] ${s}`).join('\n\n')}

${instructions ? `Additional instructions: ${instructions}` : ''}

Return a JSON object matching this schema:
{
  "headline": "string (compelling, max 15 words)",
  "subheadline": "string (supporting context, max 25 words)",
  "introduction": "string (approximately 500 words, sets the scene and introduces the core theme, engaging opening)",
  "analysis": "string (approximately 650 words, deep dive into the developments, data points, expert perspectives)",
  "strategic_implications": "string (approximately 500 words, what this means for Australian businesses, actionable takeaways)",
  "pull_quotes": ["array of 4-6 impactful quotes or statistics pulled from the narrative"]
}

Separate paragraphs within introduction, analysis, and strategic_implications with double newlines.

Return ONLY the JSON object, no other text.`;

  return generate<CoverStory>(prompt, 8192);
}

export async function generateImplications(
  coverStory: CoverStory,
  instructions?: string,
): Promise<ImplicationItem[]> {
  const prompt = `Based on this cover story, identify 4 strategic implications for Australian business operators:

Cover Story: ${coverStory.headline}
${coverStory.subheadline}

Key themes from the story:
${coverStory.introduction.slice(0, 500)}

${instructions ? `Additional instructions: ${instructions}` : ''}

Return a JSON array of exactly 4 items:
[{
  "title": "string (max 20 words)",
  "description": "string (max 80 words)",
  "impact_level": "transformative" | "significant" | "emerging",
  "sector_relevance": ["string array of relevant sectors"]
}]

Return ONLY the JSON array.`;

  return generate<ImplicationItem[]>(prompt);
}

export async function generateEnterprise(
  coverStory: CoverStory,
  instructions?: string,
): Promise<EnterpriseItem[]> {
  const prompt = `Based on this cover story, identify 4 enterprise AI adoption signals:

Cover Story: ${coverStory.headline}
${coverStory.subheadline}

Key themes:
${coverStory.introduction.slice(0, 500)}

${instructions ? `Additional instructions: ${instructions}` : ''}

Return a JSON array of exactly 4 items:
[{
  "title": "string (max 20 words)",
  "description": "string (max 80 words)",
  "adoption_stage": "early" | "growing" | "mainstream",
  "industry": "string"
}]

Return ONLY the JSON array.`;

  return generate<EnterpriseItem[]>(prompt);
}

export async function generateIndustryWatch(
  sources: string[],
  coverStory: CoverStory,
  instructions?: string,
): Promise<IndustryWatchItem[]> {
  const prompt = `Based on the source material and cover story context, identify 4-6 industry-specific AI trends worth watching for Australian business operators. Each should focus on a different industry sector.

Source material:
${sources.map((s, i) => `[${i + 1}] ${s}`).join('\n\n')}

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
): Promise<ToolItem[]> {
  const prompt = `Based on the source material, recommend 6 AI tools worth watching for business operators:

Source material:
${sources.map((s, i) => `[${i + 1}] ${s}`).join('\n\n')}

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
): Promise<PlaybookItem[]> {
  const prompt = `Based on this cover story, create 4 practical operator playbooks that Australian business leaders can implement:

Cover Story: ${coverStory.headline}
${coverStory.subheadline}

Key themes:
${coverStory.introduction.slice(0, 500)}

Strategic implications:
${coverStory.strategic_implications.slice(0, 500)}

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
): Promise<StrategicSignalItem[]> {
  const prompt = `Based on the cover story and strategic implications, identify 4-6 strategic signals that forward-thinking Australian business operators should be monitoring. These are early indicators of shifts that will shape the business landscape.

Cover Story: ${coverStory.headline}
${coverStory.subheadline}

Strategic Implications:
${implications.map((i) => `- ${i.title}: ${i.description}`).join('\n')}

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
): Promise<string> {
  const prompt = `Write a "Why This Matters" section (120-180 words) for the David & Goliath AI Intelligence Report.

Cover Story: ${coverStory.headline}
${coverStory.subheadline}

Key implications:
${implications.map((i) => `- ${i.title}: ${i.description}`).join('\n')}

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
): Promise<BriefingPromptItem[]> {
  const prompt = `Based on the cover story and strategic implications, generate 6 "Operator Briefing Prompts" for the David & Goliath AI Intelligence Report. These are strategic questions that leadership teams should be discussing in their next meeting. Each prompt should provoke meaningful discussion about AI strategy, adoption, risk, or opportunity.

Cover Story: ${coverStory.headline}
${coverStory.subheadline}

Strategic Implications:
${implications.map((i) => `- ${i.title}: ${i.description}`).join('\n')}

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
): Promise<ExecutiveTakeawayItem[]> {
  const prompt = `Based on the cover story and strategic implications, generate 5 executive takeaways for the "Executive Briefing: Key Takeaways" section of the David & Goliath AI Intelligence Report. This section provides senior leaders with a concise summary of the most important strategic insights from the report.

Cover Story: ${coverStory.headline}
${coverStory.subheadline}

Introduction context:
${coverStory.introduction.slice(0, 400)}

Strategic Implications:
${implications.map((i) => `- ${i.title}: ${i.description}`).join('\n')}

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

  const prompt = `Based on the cover story and strategic implications, generate content for "The AI Native Organisation" framework page. This page features a recurring five-layer model of the AI native organisation (Strategy, Workflow, Agent, Model, Infrastructure) with dynamic monthly content.

Cover Story: ${coverStory.headline}
${coverStory.subheadline}

Strategic Implications:
${implications.map((i) => `- ${i.title}: ${i.description}`).join('\n')}

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
    { "headline": "string (max 10 words)", "explanation": "string (max 50 words)" },
    { "headline": "string (max 10 words)", "explanation": "string (max 50 words)" },
    { "headline": "string (max 10 words)", "explanation": "string (max 50 words)" }
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
): Promise<string> {
  const prompt = `Write an editorial note for Edition ${String(edition).padStart(2, '0')} (${month}) of the David & Goliath AI Intelligence Report.

Cover story theme: ${coverStory.headline}
${coverStory.subheadline}

Key implications:
${implications.map((i) => `- ${i.title}`).join('\n')}

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
