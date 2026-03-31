/**
 * Script to fix all hallucinated claims in an issue.
 *
 * Usage: npx tsx scripts/fix-hallucinations.ts <issueId>
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

// Load .env.local
const envPath = resolve(process.cwd(), '.env.local');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch { /* ignore */ }

const ISSUE_ID = process.argv[2];
if (!ISSUE_ID) {
  console.error('Usage: npx tsx scripts/fix-hallucinations.ts <issueId>');
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const anthropic = new Anthropic();

// Retry wrapper for Anthropic calls
async function callClaude(system: string, userMsg: string, maxRetries = 3): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system,
        messages: [{ role: 'user', content: userMsg }],
      });
      return response.content[0].type === 'text' ? response.content[0].text : '';
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 529 || status === 429) {
        const delay = Math.pow(2, attempt + 1) * 1000;
        console.log(`   ⏳ API overloaded, retrying in ${delay / 1000}s...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Max retries exceeded');
}

// ---- Section config ----

interface SectionConfig {
  db_field: string;
  section: string;
  type: 'string' | 'object' | 'array' | 'nested_json';
  text_fields: string[];
}

const SECTIONS: SectionConfig[] = [
  { db_field: 'cover_story_json', section: 'Cover Story', type: 'object', text_fields: ['introduction', 'analysis', 'strategic_implications'] },
  { db_field: 'why_this_matters', section: 'Why This Matters', type: 'string', text_fields: [] },
  { db_field: 'editorial_note', section: 'Editorial Note', type: 'string', text_fields: [] },
  { db_field: 'implications_json', section: 'Strategic Implications', type: 'array', text_fields: ['title', 'description'] },
  { db_field: 'enterprise_json', section: 'Enterprise Spotlight', type: 'array', text_fields: ['title', 'description'] },
  { db_field: 'industry_watch_json', section: 'Industry Watch', type: 'array', text_fields: ['headline', 'description'] },
  { db_field: 'tools_json', section: 'Tools & Platforms', type: 'array', text_fields: ['name', 'description', 'verdict'] },
  { db_field: 'strategic_signals_json', section: 'Strategic Signals', type: 'array', text_fields: ['signal', 'context', 'implication'] },
  { db_field: 'executive_briefing_json', section: 'Executive Briefing', type: 'array', text_fields: ['headline', 'explanation'] },
  { db_field: 'global_landscape_json', section: 'Global Landscape', type: 'nested_json', text_fields: [] },
  { db_field: 'regional_signals_json', section: 'Regional Signals', type: 'nested_json', text_fields: [] },
];

// ---- Main ----

async function main() {
  console.log(`\n🔍 Fetching issue ${ISSUE_ID}...`);
  const { data: issue, error: issueErr } = await supabase
    .from('issues')
    .select('*')
    .eq('id', ISSUE_ID)
    .single();
  if (issueErr || !issue) { console.error('Failed to fetch issue'); process.exit(1); }
  console.log(`   Title: ${issue.title} | Status: ${issue.status}`);

  // Fetch signals directly from Supabase
  console.log('\n📡 Fetching source signals from Supabase...');
  const signalIds: string[] = issue.source_signal_ids || [];
  let signals: { title: string; summary: string; company: string | null }[] = [];

  if (signalIds.length > 0) {
    // Supabase .in() has limits, chunk into batches of 100
    for (let i = 0; i < signalIds.length; i += 100) {
      const chunk = signalIds.slice(i, i + 100);
      const { data } = await supabase
        .from('ai_signals')
        .select('title, summary, company')
        .in('id', chunk);
      if (data) signals = signals.concat(data);
    }
  }
  console.log(`   Found ${signals.length} source signals`);

  const signalContext = signals.map(s =>
    `- ${s.title}: ${s.summary.slice(0, 250)}${s.company ? ` [${s.company}]` : ''}`,
  ).join('\n');

  // Process each section - batch verification + fix in one LLM call
  console.log('\n🔧 Checking and fixing each section...\n');
  const updates: Record<string, unknown> = {};
  let totalFixed = 0;

  for (const config of SECTIONS) {
    const content = issue[config.db_field];
    if (!content) continue;

    let sectionText: string;
    if (config.type === 'string') {
      sectionText = content as string;
    } else {
      sectionText = JSON.stringify(content, null, 2);
    }

    if (sectionText.length < 30) continue;

    console.log(`📝 ${config.section}...`);

    // Single LLM call: identify hallucinations AND fix them in one pass
    const systemPrompt = `You are an editorial fact-checker and fixer for a professional AI strategy magazine called the David & Goliath AI Intelligence Report.

You will be given:
1. A section of magazine content (may be plain text or JSON)
2. Source signals that the content was generated from

Your job:
1. IDENTIFY any specific claims that are NOT supported by the source signals (hallucinated names, model versions, legislation names, specific dates, dollar figures, company actions that don't appear in signals)
2. FIX those hallucinations by replacing fabricated specifics with accurate generalisations or verified info from the signals
3. Leave all grounded/accurate content UNCHANGED

IMPORTANT RULES:
- General industry observations and strategic recommendations do NOT need signal backing (they are editorial)
- Prescriptive advice ("implement X", "monitor Y") is NOT hallucination, it's editorial guidance
- Only flag/fix SPECIFIC factual claims (names, numbers, dates, legislation, model versions) that have no signal support
- Make MINIMUM changes. If a sentence is 90% accurate, fix only the inaccurate part
- Preserve the exact same writing style, tone, structure, and approximate length
- Use Australian English (organisation, optimise, etc.)
- Do not use em dashes or en dashes
- If the content is JSON, return valid JSON with the exact same structure/schema
- If nothing needs fixing, return the content UNCHANGED

Return ONLY the fixed content. No explanations, no markdown code fences, no preamble.`;

    const userMsg = `SECTION: ${config.section}
FORMAT: ${config.type === 'string' ? 'Plain text' : 'JSON (preserve exact structure)'}

SOURCE SIGNALS:
${signalContext.slice(0, 6000)}

CONTENT TO CHECK AND FIX:
${sectionText}`;

    const fixed = await callClaude(systemPrompt, userMsg);

    // Compare and apply
    if (config.type === 'string') {
      const fixedClean = fixed.trim();
      if (fixedClean !== sectionText.trim() && fixedClean.length > 20) {
        updates[config.db_field] = fixedClean;
        totalFixed++;
        console.log(`   ✅ Fixed (${sectionText.length} -> ${fixedClean.length} chars)`);
      } else {
        console.log(`   ✓ No changes needed`);
      }
    } else {
      // Parse JSON response
      try {
        const jsonMatch = fixed.match(/[\[{][\s\S]*[\]}]/);
        const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(fixed);
        const originalStr = JSON.stringify(content);
        const fixedStr = JSON.stringify(parsed);

        if (fixedStr !== originalStr) {
          updates[config.db_field] = parsed;
          totalFixed++;
          console.log(`   ✅ Fixed (${originalStr.length} -> ${fixedStr.length} chars)`);
        } else {
          console.log(`   ✓ No changes needed`);
        }
      } catch {
        console.log(`   ⚠️ Could not parse response, skipping`);
      }
    }
  }

  if (totalFixed === 0) {
    console.log('\n✅ No hallucinations found!');
    return;
  }

  // Save to database
  console.log(`\n💾 Saving ${totalFixed} updated sections to database...`);
  const { error: updateErr } = await supabase
    .from('issues')
    .update(updates)
    .eq('id', ISSUE_ID);

  if (updateErr) {
    console.error(`❌ Failed to save: ${updateErr.message}`);
    process.exit(1);
  }

  console.log('✅ All fixes applied successfully!');
  console.log(`\n📝 Fixed ${totalFixed} sections. Next steps:`);
  console.log('   1. Hard refresh the magazine viewer to see updated content');
  console.log('   2. Click "Run QA Review" to see the new score');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
