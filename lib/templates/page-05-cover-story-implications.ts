import { BASE_STYLES, COLORS } from './shared/styles';
import { renderMagazineHeader, renderMagazineFooter, renderColumnText, renderPullQuote, renderEvidenceBlock } from './shared/components';
import { escapeHtml } from '@/lib/utils/escape-html';
import type { CoverStoryImplicationsPageData } from '@/lib/types/templates';

export function renderCoverStoryImplications(data: CoverStoryImplicationsPageData): string {
  // Split implications into parts to interleave pull quotes
  const paragraphs = data.strategicImplications.split(/\n\n+/).filter(Boolean);
  const midpoint = Math.ceil(paragraphs.length / 2);
  const firstHalf = paragraphs.slice(0, midpoint).join('\n\n');
  const secondHalf = paragraphs.slice(midpoint).join('\n\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="page">
    ${renderMagazineHeader(9)}

    <div style="margin-top: 52pt;">
      <div style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 6.5pt; color: ${COLORS.gold}; text-transform: uppercase; letter-spacing: 1pt; margin-bottom: 14pt;">
        What This Means for Operators
      </div>

      ${renderColumnText(firstHalf)}

      ${data.pullQuotes.length > 0 ? renderPullQuote(data.pullQuotes[0]) : ''}

      ${secondHalf ? renderColumnText(secondHalf) : ''}

      ${data.pullQuotes.length > 1 ? renderPullQuote(data.pullQuotes[1]) : ''}

      ${data.evidence ? renderEvidenceBlock(data.evidence.statement, data.evidence.implication) : ''}
    </div>

    ${renderMagazineFooter(9)}
  </div>
</body>
</html>`;
}
