import { BASE_STYLES, COLORS } from './shared/styles';
import { renderMagazineHeader, renderMagazineFooter, renderColumnText, renderPullQuote } from './shared/components';
import { escapeHtml } from '@/lib/utils/escape-html';
import type { CoverStoryAnalysisPageData } from '@/lib/types/templates';

export function renderCoverStoryAnalysis(data: CoverStoryAnalysisPageData): string {
  // Split analysis into parts to interleave pull quotes
  const paragraphs = data.analysis.split(/\n\n+/).filter(Boolean);
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
    ${renderMagazineHeader(7)}

    <div style="margin-top: 52pt;">
      <div style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 6.5pt; color: ${COLORS.gold}; text-transform: uppercase; letter-spacing: 1pt; margin-bottom: 14pt;">
        Analysis
      </div>

      ${renderColumnText(firstHalf)}

      ${data.pullQuotes.length > 0 ? renderPullQuote(data.pullQuotes[0]) : ''}

      ${secondHalf ? renderColumnText(secondHalf) : ''}

      ${data.pullQuotes.length > 1 ? renderPullQuote(data.pullQuotes[1]) : ''}
    </div>

    ${renderMagazineFooter(7)}
  </div>
</body>
</html>`;
}
