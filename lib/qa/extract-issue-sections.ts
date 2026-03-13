// ============================================================
// Section Extraction: Normalises issue content into analysable sections.
// ============================================================

import type { ExtractedSection, QACheckInput } from '../types/qa';

/**
 * Takes raw issue data and returns a flat array of labelled text sections.
 * Each section preserves traceability to its source key and label.
 */
export function extractIssueSections(input: QACheckInput): ExtractedSection[] {
  const sections: ExtractedSection[] = [];

  // Cover story
  if (input.cover_story) {
    const cs = input.cover_story as Record<string, unknown>;
    const fields = ['headline', 'subheadline', 'introduction', 'analysis', 'strategic_implications'];
    const parts: string[] = [];
    for (const field of fields) {
      if (typeof cs[field] === 'string' && (cs[field] as string).trim()) {
        parts.push(`${field}: ${cs[field]}`);
      }
    }
    if (cs.pull_quotes && Array.isArray(cs.pull_quotes)) {
      for (const q of cs.pull_quotes) {
        if (typeof q === 'string') parts.push(`pull_quote: ${q}`);
      }
    }
    if (parts.length > 0) {
      sections.push({
        section_key: 'cover_story',
        section_label: 'Cover Story',
        raw_text: parts.join('\n\n'),
        metadata: { field_count: fields.length },
      });
    }
  }

  // Editorial note
  if (input.editorial_note?.trim()) {
    sections.push({
      section_key: 'editorial_note',
      section_label: 'Editorial Note',
      raw_text: input.editorial_note,
      metadata: {},
    });
  }

  // Why this matters
  if (input.why_this_matters?.trim()) {
    sections.push({
      section_key: 'why_this_matters',
      section_label: 'Why This Matters',
      raw_text: input.why_this_matters,
      metadata: {},
    });
  }

  // Array sections
  const arraySections: [string, string, Record<string, unknown>[]][] = [
    ['implications', 'Strategic Implications', input.implications],
    ['enterprise', 'Enterprise Spotlight', input.enterprise],
    ['industry_watch', 'Industry Watch', input.industry_watch],
    ['tools', 'Tools & Platforms', input.tools],
    ['playbooks', 'Operator Playbooks', input.playbooks],
    ['strategic_signals', 'Strategic Signals', input.strategic_signals],
    ['briefing_prompts', 'Briefing Prompts', input.briefing_prompts],
    ['executive_briefing', 'Executive Briefing', input.executive_briefing],
  ];

  for (const [key, label, items] of arraySections) {
    if (!items || items.length === 0) continue;
    const parts: string[] = [];
    for (let i = 0; i < items.length; i++) {
      const itemParts: string[] = [];
      for (const [field, val] of Object.entries(items[i])) {
        if (typeof val === 'string' && val.trim()) {
          itemParts.push(`${field}: ${val}`);
        }
        if (Array.isArray(val)) {
          for (const v of val) {
            if (typeof v === 'string' && v.trim()) itemParts.push(v);
          }
        }
      }
      if (itemParts.length > 0) {
        parts.push(`[Item ${i + 1}]\n${itemParts.join('\n')}`);
      }
    }
    if (parts.length > 0) {
      sections.push({
        section_key: key,
        section_label: label,
        raw_text: parts.join('\n\n'),
        metadata: { item_count: items.length },
      });
    }
  }

  // AI Native Org
  if (input.ai_native_org) {
    const org = input.ai_native_org as Record<string, unknown>;
    const parts: string[] = [];
    if (typeof org.layer_focus_text === 'string') parts.push(org.layer_focus_text);
    if (Array.isArray(org.signals)) {
      for (const sig of org.signals) {
        const s = sig as Record<string, unknown>;
        if (typeof s.headline === 'string') parts.push(s.headline);
        if (typeof s.explanation === 'string') parts.push(s.explanation);
      }
    }
    if (parts.length > 0) {
      sections.push({
        section_key: 'ai_native_org',
        section_label: 'AI Native Organisation',
        raw_text: parts.join('\n\n'),
        metadata: {},
      });
    }
  }

  // Global landscape
  if (input.global_landscape) {
    const gl = input.global_landscape as Record<string, unknown>;
    if (Array.isArray(gl.regions)) {
      const parts = (gl.regions as Array<{ name: string; signals: string[] }>)
        .map(r => `${r.name}: ${(r.signals || []).join('; ')}`)
        .filter(Boolean);
      if (parts.length > 0) {
        sections.push({
          section_key: 'global_landscape',
          section_label: 'Global Landscape',
          raw_text: parts.join('\n'),
          metadata: {},
        });
      }
    }
  }

  // Regional signals
  if (input.regional_signals) {
    const rs = input.regional_signals as Record<string, unknown>;
    const parts: string[] = [];
    for (const [key, val] of Object.entries(rs)) {
      if (Array.isArray(val)) {
        for (const item of val) {
          const r = item as Record<string, unknown>;
          if (typeof r.region === 'string' && typeof r.signal === 'string') {
            parts.push(`${r.region}: ${r.signal}`);
          }
        }
      }
    }
    if (parts.length > 0) {
      sections.push({
        section_key: 'regional_signals',
        section_label: 'Regional Signals',
        raw_text: parts.join('\n'),
        metadata: {},
      });
    }
  }

  // Derivative content
  if (input.executive_summary?.trim()) {
    sections.push({
      section_key: 'executive_summary',
      section_label: 'Executive Summary',
      raw_text: input.executive_summary,
      metadata: { is_derivative: true },
    });
  }

  if (input.beehiiv_summary?.trim()) {
    sections.push({
      section_key: 'beehiiv_summary',
      section_label: 'Beehiiv Summary',
      raw_text: input.beehiiv_summary,
      metadata: { is_derivative: true },
    });
  }

  if (input.welcome_email_snippet?.trim()) {
    sections.push({
      section_key: 'welcome_email_snippet',
      section_label: 'Welcome Email Snippet',
      raw_text: input.welcome_email_snippet,
      metadata: { is_derivative: true },
    });
  }

  if (input.linkedin_snippets && input.linkedin_snippets.length > 0) {
    const parts = input.linkedin_snippets.map((s, i) => {
      const texts: string[] = [];
      if (typeof s.hook === 'string') texts.push(s.hook);
      if (typeof s.body === 'string') texts.push(s.body);
      if (typeof s.cta === 'string') texts.push(s.cta);
      return `[Snippet ${i + 1}]\n${texts.join('\n')}`;
    }).filter(Boolean);
    if (parts.length > 0) {
      sections.push({
        section_key: 'linkedin_snippets',
        section_label: 'LinkedIn Snippets',
        raw_text: parts.join('\n\n'),
        metadata: { is_derivative: true, count: input.linkedin_snippets.length },
      });
    }
  }

  return sections;
}

/**
 * Get all non-derivative sections (the core issue content).
 */
export function getCoreContentSections(sections: ExtractedSection[]): ExtractedSection[] {
  return sections.filter(s => !s.metadata.is_derivative);
}

/**
 * Get only derivative sections.
 */
export function getDerivativeSections(sections: ExtractedSection[]): ExtractedSection[] {
  return sections.filter(s => s.metadata.is_derivative === true);
}
