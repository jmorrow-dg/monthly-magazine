import { BASE_STYLES, COLORS } from './shared/styles';
import { renderMagazineHeader, renderMagazineFooter, renderIconLabel, renderCard, renderCitationMark, buildCitations } from './shared/components';
import { escapeHtml } from '@/lib/utils/escape-html';
import type { ToolsPageData } from '@/lib/types/templates';

export function renderTools(data: ToolsPageData): string {
  const items = data.items.slice(0, 6);
  const { marks, footer } = buildCitations(items);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="page">
    ${renderMagazineHeader(18)}

    <div style="margin-top: 52pt;">
      ${renderIconLabel('tools', 'Tools Worth Watching')}

      <h2 style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 18pt; color: ${COLORS.white}; line-height: 1.2; margin-bottom: 6pt;">
        The Operator's Toolkit
      </h2>
      <div style="width: 40pt; height: 2pt; background: ${COLORS.gold}; border-radius: 1pt; margin-bottom: 14pt;"></div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 7pt;">
        ${items.map((item, idx) => {
          const citeMark = marks.has(idx) ? renderCitationMark(marks.get(idx)!) : '';
          return renderCard(`
          <div style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 9pt; color: ${COLORS.white}; margin-bottom: 3pt; line-height: 1.3;">
            ${escapeHtml(item.name)}${citeMark}
          </div>
          <div style="font-family: 'Inter', sans-serif; font-size: 6pt; color: ${COLORS.gold}; text-transform: uppercase; letter-spacing: 0.5pt; margin-bottom: 6pt;">
            ${escapeHtml(item.category)}
          </div>
          <p style="font-family: 'Inter', sans-serif; font-size: 7.5pt; color: ${COLORS.lightGrey}; line-height: 1.5; margin-bottom: 6pt;">
            ${escapeHtml(item.description)}
          </p>
          <div style="padding-top: 5pt; border-top: 0.4pt solid ${COLORS.rule};">
            <span style="font-family: 'Inter', sans-serif; font-size: 7pt; color: ${COLORS.midGrey}; font-style: italic;">
              ${escapeHtml(item.verdict)}
            </span>
          </div>
        `, { padding: '10pt 12pt', marginBottom: '0' });
        }).join('')}
      </div>
    </div>

    ${footer}
    ${renderMagazineFooter(18)}
  </div>
</body>
</html>`;
}
