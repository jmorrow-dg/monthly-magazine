import Anthropic from '@anthropic-ai/sdk';
import type { Issue, LinkedInSnippet } from '@/lib/types/issue';

// ============================================================
// Derivative Content Generator
// Generates downstream artifacts from a completed issue:
// executive summary, Beehiiv newsletter summary,
// welcome email snippet, LinkedIn snippets.
// ============================================================

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM = `You are writing derivative content for the David & Goliath AI Intelligence Report, a premium weekly publication for operators, founders, and executives. Write in Australian English. Do NOT use em dashes, en dashes, or hyphens as punctuation.`;

function issueContext(issue: Issue): string {
  const coverStory = issue.cover_story_json;
  const lines: string[] = [];
  lines.push(`Edition ${issue.edition} | ${issue.cover_headline}`);
  if (issue.cover_subtitle) lines.push(issue.cover_subtitle);
  if (coverStory) {
    lines.push(`\nCover Story: ${coverStory.headline}`);
    if (coverStory.subheadline) lines.push(coverStory.subheadline);
    if (coverStory.introduction) {
      lines.push(`\nIntroduction excerpt: ${coverStory.introduction.slice(0, 400)}`);
    }
  }
  if (issue.executive_briefing_json && issue.executive_briefing_json.length > 0) {
    lines.push('\nKey Takeaways:');
    issue.executive_briefing_json.forEach((t) => {
      lines.push(`- ${t.headline}: ${t.explanation}`);
    });
  }
  if (issue.implications_json && issue.implications_json.length > 0) {
    lines.push('\nStrategic Implications:');
    issue.implications_json.forEach((i) => {
      lines.push(`- ${i.title}: ${i.description}`);
    });
  }
  return lines.join('\n');
}

/**
 * Generate a concise executive summary (2-3 paragraphs) from a completed issue.
 */
export async function generateExecutiveSummary(issue: Issue): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Write a concise executive summary (150-200 words, 2-3 paragraphs) of this AI Intelligence Report edition. This will be used in executive briefings and dashboards.

${issueContext(issue)}

Requirements:
- Lead with the most significant insight
- Include 2-3 key strategic implications
- End with a forward-looking statement
- Separate paragraphs with double newlines
- Australian English

Return ONLY the summary text.`,
      },
    ],
  });

  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');
}

/**
 * Generate a Beehiiv newsletter summary for email distribution.
 */
export async function generateBeehiivSummary(issue: Issue): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Write a newsletter summary (120-160 words) for Beehiiv distribution. This introduces the latest AI Intelligence Report and drives readers to open the full report.

${issueContext(issue)}

Requirements:
- Hook with the most compelling insight in the first sentence
- Summarise 3-4 key topics covered
- End with a clear call to action: "Read the full report"
- Conversational but strategic tone
- Australian English

Return ONLY the summary text.`,
      },
    ],
  });

  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');
}

/**
 * Generate a short welcome email snippet referencing the latest report.
 */
export async function generateWelcomeSnippet(issue: Issue): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    system: SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Write a brief snippet (40-60 words) for a welcome email that tells new subscribers about the latest AI Intelligence Report. This appears in the welcome email alongside a link to the report.

${issueContext(issue)}

Requirements:
- One short paragraph
- Mention the cover story theme
- Create urgency to read the report
- Australian English

Return ONLY the snippet text.`,
      },
    ],
  });

  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');
}

/**
 * Generate 2-3 LinkedIn post snippets for social distribution.
 */
export async function generateLinkedInSnippets(issue: Issue): Promise<LinkedInSnippet[]> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Generate 3 LinkedIn post snippets based on this AI Intelligence Report. Each should highlight a different insight and work as a standalone social post.

${issueContext(issue)}

Return a JSON array of exactly 3 items:
[{
  "hook": "string (opening line that grabs attention, max 20 words)",
  "body": "string (2-3 sentences expanding on the insight, max 60 words)",
  "cta": "string (call to action referencing the full report, max 15 words)"
}]

Return ONLY the JSON array.`,
      },
    ],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];
  return JSON.parse(jsonMatch[0]) as LinkedInSnippet[];
}

/**
 * Generate all derivative artifacts for an issue.
 */
export async function generateAllDerivatives(issue: Issue): Promise<{
  executive_summary: string;
  beehiiv_summary: string;
  welcome_email_snippet: string;
  linkedin_snippets: LinkedInSnippet[];
}> {
  const [executive_summary, beehiiv_summary, welcome_email_snippet, linkedin_snippets] =
    await Promise.all([
      generateExecutiveSummary(issue),
      generateBeehiivSummary(issue),
      generateWelcomeSnippet(issue),
      generateLinkedInSnippets(issue),
    ]);

  return {
    executive_summary,
    beehiiv_summary,
    welcome_email_snippet,
    linkedin_snippets,
  };
}
