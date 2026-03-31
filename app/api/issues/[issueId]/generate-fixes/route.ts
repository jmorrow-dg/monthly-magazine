import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { isAuthenticated } from '@/lib/auth';
import { getIssue } from '@/lib/supabase/queries';
import { fetchSignalsByIds } from '@/lib/intelligence/fetch-signals-by-ids';
import type { ClaimVerdict } from '../verify-claims/route';

export const maxDuration = 120;

type RouteContext = { params: Promise<{ issueId: string }> };

export interface FixPreview {
  id: string;
  section: string;
  field: string;
  db_field: string;
  item_index: number | null;
  claim_text: string;
  suggested_fix: string;
  original_text: string;
  fixed_text: string;
  word_count_before: number;
  word_count_after: number;
}

/**
 * Maps QA section labels to the Issue DB field and the text sub-field within it.
 */
interface FieldMapping {
  db_field: string;
  is_array: boolean;
  text_fields: string[];
}

const SECTION_FIELD_MAP: Record<string, FieldMapping> = {
  'Cover Story': { db_field: 'cover_story_json', is_array: false, text_fields: ['headline', 'subheadline', 'introduction', 'analysis', 'strategic_implications'] },
  'cover_story': { db_field: 'cover_story_json', is_array: false, text_fields: ['headline', 'subheadline', 'introduction', 'analysis', 'strategic_implications'] },
  'Editorial Note': { db_field: 'editorial_note', is_array: false, text_fields: ['editorial_note'] },
  'Why This Matters': { db_field: 'why_this_matters', is_array: false, text_fields: ['why_this_matters'] },
  'Strategic Implications': { db_field: 'implications_json', is_array: true, text_fields: ['title', 'description'] },
  'Enterprise Spotlight': { db_field: 'enterprise_json', is_array: true, text_fields: ['title', 'description'] },
  'Industry Watch': { db_field: 'industry_watch_json', is_array: true, text_fields: ['headline', 'description'] },
  'Tools & Platforms': { db_field: 'tools_json', is_array: true, text_fields: ['name', 'description', 'verdict'] },
  'Operator Playbooks': { db_field: 'playbooks_json', is_array: true, text_fields: ['title', 'context', 'outcome'] },
  'Strategic Signals': { db_field: 'strategic_signals_json', is_array: true, text_fields: ['signal', 'context', 'implication'] },
  'Briefing Prompts': { db_field: 'briefing_prompts_json', is_array: true, text_fields: ['question', 'explanation'] },
  'Executive Briefing': { db_field: 'executive_briefing_json', is_array: true, text_fields: ['headline', 'explanation'] },
  'AI Native Organisation': { db_field: 'ai_native_org_json', is_array: false, text_fields: ['layer_focus_text'] },
  'Global Landscape': { db_field: 'global_landscape_json', is_array: false, text_fields: [] },
  'Regional Signals': { db_field: 'regional_signals_json', is_array: false, text_fields: [] },
};

export async function POST(request: Request, context: RouteContext) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  try {
    const { issueId } = await context.params;
    const body = await request.json();
    const verdicts: ClaimVerdict[] = body.verdicts || [];

    // Only process hallucinated claims
    const hallucinated = verdicts.filter(v => v.verdict === 'hallucinated');
    if (hallucinated.length === 0) {
      return NextResponse.json({ fixes: [], summary: 'No hallucinated claims to fix.' });
    }

    const issue = await getIssue(issueId);
    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    // Fetch source signals for context
    const signals = issue.source_signal_ids?.length
      ? await fetchSignalsByIds(issue.source_signal_ids).catch(() => [])
      : [];

    const signalContext = signals.slice(0, 80).map(s =>
      `- ${s.title}: ${s.summary.slice(0, 200)}${s.company ? ` [${s.company}]` : ''}`,
    ).join('\n');

    // Group hallucinated claims by section
    const claimsBySection = new Map<string, ClaimVerdict[]>();
    for (const claim of hallucinated) {
      const key = claim.section;
      if (!claimsBySection.has(key)) claimsBySection.set(key, []);
      claimsBySection.get(key)!.push(claim);
    }

    // Generate fixes per section
    const fixes: FixPreview[] = [];
    let fixId = 0;

    for (const [section, claims] of claimsBySection) {
      const mapping = SECTION_FIELD_MAP[section];
      if (!mapping) {
        // Try to find the field by checking claim text against content
        continue;
      }

      // Get current content for this section
      const currentContent = (issue as Record<string, unknown>)[mapping.db_field];
      if (!currentContent) continue;

      if (mapping.is_array && Array.isArray(currentContent)) {
        // For array sections, find which items contain hallucinated claims
        for (const claim of claims) {
          const itemIndex = findItemContainingClaim(currentContent as Record<string, unknown>[], claim.claim_text, mapping.text_fields);
          if (itemIndex === -1) continue;

          const item = (currentContent as Record<string, unknown>[])[itemIndex];
          const field = findFieldContainingClaim(item, claim.claim_text, mapping.text_fields);
          if (!field) continue;

          const originalText = String(item[field] || '');
          const fixedText = await generateFieldFix(
            originalText,
            claim.claim_text,
            claim.suggested_fix || claim.explanation,
            signalContext,
            section,
            field,
          );

          fixes.push({
            id: `fix-${fixId++}`,
            section,
            field,
            db_field: mapping.db_field,
            item_index: itemIndex,
            claim_text: claim.claim_text,
            suggested_fix: claim.suggested_fix || claim.explanation,
            original_text: originalText,
            fixed_text: fixedText,
            word_count_before: countWords(originalText),
            word_count_after: countWords(fixedText),
          });
        }
      } else if (mapping.db_field === 'editorial_note' || mapping.db_field === 'why_this_matters') {
        // Top-level string fields
        const originalText = String(currentContent || '');
        const allClaimTexts = claims.map(c => c.claim_text).join('\n');
        const allFixes = claims.map(c => c.suggested_fix || c.explanation).join('\n');

        const fixedText = await generateFieldFix(
          originalText,
          allClaimTexts,
          allFixes,
          signalContext,
          section,
          mapping.db_field,
        );

        fixes.push({
          id: `fix-${fixId++}`,
          section,
          field: mapping.db_field,
          db_field: mapping.db_field,
          item_index: null,
          claim_text: allClaimTexts,
          suggested_fix: allFixes,
          original_text: originalText,
          fixed_text: fixedText,
          word_count_before: countWords(originalText),
          word_count_after: countWords(fixedText),
        });
      } else if (typeof currentContent === 'object' && !Array.isArray(currentContent)) {
        // Object sections (cover_story_json, global_landscape_json, regional_signals_json, ai_native_org_json)
        const obj = currentContent as Record<string, unknown>;

        if (mapping.db_field === 'global_landscape_json' || mapping.db_field === 'regional_signals_json') {
          // Complex nested structures - generate a fix for the whole object
          const originalText = JSON.stringify(obj, null, 2);
          const allClaimTexts = claims.map(c => c.claim_text).join('\n');
          const allFixes = claims.map(c => c.suggested_fix || c.explanation).join('\n');

          const fixedText = await generateStructuredFix(
            originalText,
            allClaimTexts,
            allFixes,
            signalContext,
            section,
          );

          fixes.push({
            id: `fix-${fixId++}`,
            section,
            field: 'content',
            db_field: mapping.db_field,
            item_index: null,
            claim_text: allClaimTexts,
            suggested_fix: allFixes,
            original_text: summariseForPreview(obj),
            fixed_text: fixedText,
            word_count_before: countWords(originalText),
            word_count_after: countWords(fixedText),
          });
        } else {
          // Object with text fields (cover_story_json, ai_native_org_json)
          for (const claim of claims) {
            const field = findFieldContainingClaim(obj, claim.claim_text, mapping.text_fields);
            if (!field) continue;

            const originalText = String(obj[field] || '');
            const fixedText = await generateFieldFix(
              originalText,
              claim.claim_text,
              claim.suggested_fix || claim.explanation,
              signalContext,
              section,
              field,
            );

            // Deduplicate: don't generate two fixes for the same field
            if (fixes.some(f => f.db_field === mapping.db_field && f.field === field && f.item_index === null)) continue;

            fixes.push({
              id: `fix-${fixId++}`,
              section,
              field,
              db_field: mapping.db_field,
              item_index: null,
              claim_text: claim.claim_text,
              suggested_fix: claim.suggested_fix || claim.explanation,
              original_text: originalText,
              fixed_text: fixedText,
              word_count_before: countWords(originalText),
              word_count_after: countWords(fixedText),
            });
          }
        }
      }
    }

    return NextResponse.json({
      fixes,
      summary: `Generated ${fixes.length} fix preview${fixes.length !== 1 ? 's' : ''} for ${hallucinated.length} hallucinated claims.`,
    });
  } catch (error) {
    console.error('Fix generation failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Fix generation failed' },
      { status: 500 },
    );
  }
}

function findItemContainingClaim(
  items: Record<string, unknown>[],
  claimText: string,
  textFields: string[],
): number {
  const claimLower = claimText.toLowerCase();
  const claimWords = claimLower.split(/\s+/).filter(w => w.length > 4);

  let bestIndex = -1;
  let bestScore = 0;

  for (let i = 0; i < items.length; i++) {
    const itemText = textFields
      .map(f => String(items[i][f] || ''))
      .join(' ')
      .toLowerCase();

    const matchCount = claimWords.filter(w => itemText.includes(w)).length;
    const score = claimWords.length > 0 ? matchCount / claimWords.length : 0;

    if (score > bestScore && score > 0.3) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return bestIndex;
}

function findFieldContainingClaim(
  item: Record<string, unknown>,
  claimText: string,
  textFields: string[],
): string | null {
  const claimLower = claimText.toLowerCase();
  const claimWords = claimLower.split(/\s+/).filter(w => w.length > 4);

  let bestField: string | null = null;
  let bestScore = 0;

  for (const field of textFields) {
    const fieldText = String(item[field] || '').toLowerCase();
    if (!fieldText) continue;

    const matchCount = claimWords.filter(w => fieldText.includes(w)).length;
    const score = claimWords.length > 0 ? matchCount / claimWords.length : 0;

    if (score > bestScore && score > 0.2) {
      bestScore = score;
      bestField = field;
    }
  }

  return bestField;
}

async function generateFieldFix(
  originalText: string,
  claimText: string,
  suggestedFix: string,
  signalContext: string,
  section: string,
  field: string,
): Promise<string> {
  const anthropic = new Anthropic();

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: `You are an editorial assistant for a professional AI strategy magazine. Your task is to make small, targeted fixes to remove hallucinated content while preserving the editorial flow, tone, and length of the text.

RULES:
- Make the MINIMUM change needed to fix the hallucination
- Preserve the writing style, tone, and structure
- Keep the text approximately the same length (within 10%)
- Replace fabricated specifics with accurate generalisations or verified information from the source signals
- Do not add new content that wasn't implied by the original
- Use Australian English spelling (organisation, optimise, etc.)
- Do not use em dashes or en dashes
- Return ONLY the fixed text, no explanation or markup`,
    messages: [{
      role: 'user',
      content: `Fix this ${section} > ${field} text by addressing the hallucinated claim.

HALLUCINATED CLAIM:
${claimText}

SUGGESTED FIX:
${suggestedFix}

SOURCE SIGNALS (for accurate replacement info):
${signalContext.slice(0, 3000)}

ORIGINAL TEXT TO FIX:
${originalText}

Return ONLY the corrected text.`,
    }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  return text.trim();
}

async function generateStructuredFix(
  originalJson: string,
  claimTexts: string,
  suggestedFixes: string,
  signalContext: string,
  section: string,
): Promise<string> {
  const anthropic = new Anthropic();

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: `You are an editorial assistant. Fix hallucinated content in this structured JSON data while preserving the exact JSON structure. Return valid JSON only.

RULES:
- Fix only the hallucinated claims, leave everything else unchanged
- Replace fabricated specifics with accurate info from source signals
- Preserve the exact JSON schema and structure
- Use Australian English spelling
- Do not use em dashes or en dashes
- Return ONLY valid JSON, no explanation`,
    messages: [{
      role: 'user',
      content: `Fix this ${section} JSON data:

HALLUCINATED CLAIMS:
${claimTexts}

SUGGESTED FIXES:
${suggestedFixes}

SOURCE SIGNALS:
${signalContext.slice(0, 3000)}

ORIGINAL JSON:
${originalJson}

Return ONLY the fixed JSON.`,
    }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  // Try to extract JSON
  const jsonMatch = text.match(/[\[{][\s\S]*[\]}]/);
  return jsonMatch ? jsonMatch[0] : text.trim();
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

function summariseForPreview(obj: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'string') {
      parts.push(`${key}: ${val.slice(0, 80)}...`);
    } else if (Array.isArray(val)) {
      parts.push(`${key}: [${val.length} items]`);
    }
  }
  return parts.join('\n');
}
