// ============================================================
// Intelligence Accuracy Engine: Evidence Pack Formatter
// Converts a SectionEvidencePack into a prompt-friendly block.
// ============================================================

import type { SectionEvidencePack } from '@/lib/types/evidence';

/**
 * Format an evidence pack into a structured prompt block
 * for injection into AI generation prompts.
 *
 * Replaces the flat `formatSignalBlock()` approach with curated,
 * section-specific evidence that includes grounding instructions.
 */
export function formatEvidencePack(pack: SectionEvidencePack): string {
  const lines: string[] = [];

  lines.push(`CURATED EVIDENCE FOR THIS SECTION (${pack.evidence_items.length} items):`);
  lines.push('');

  if (pack.primary_narrative) {
    lines.push(`Primary narrative: ${pack.primary_narrative}`);
    lines.push('');
  }

  for (let i = 0; i < pack.evidence_items.length; i++) {
    const item = pack.evidence_items[i];
    lines.push(`[Evidence ${i + 1}] ${item.title} (Score: ${item.composite_score.toFixed(1)})`);
    lines.push(`  ${item.evidence_text}`);

    if (item.data_points.length > 0) {
      const dpStr = item.data_points
        .map((d) => `${d.value} (${d.context})`)
        .join('; ');
      lines.push(`  Data points: ${dpStr}`);
    }

    if (item.source_url) {
      lines.push(`  Source: ${item.source_url}`);
    }

    if (item.company) {
      lines.push(`  Company: ${item.company}`);
    }

    lines.push('');
  }

  lines.push('GROUNDING INSTRUCTION: Base your content on these evidence items. Reference specific data points where possible. Do not introduce factual claims not supported by the evidence above. If you need to make strategic observations, clearly frame them as analysis rather than reported facts.');

  return lines.join('\n');
}
