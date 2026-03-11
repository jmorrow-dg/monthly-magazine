import { BASE_STYLES, COLORS } from './shared/styles';
import { renderMagazineHeader, renderMagazineFooter, renderSectionLabel, renderBadge, renderCard } from './shared/components';
import { escapeHtml } from '@/lib/utils/escape-html';
import type { DevelopmentsPageData } from '@/lib/types/templates';

export function renderDevelopments(data: DevelopmentsPageData): string {
  const items = data.items.slice(0, 4);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="page">
    ${renderMagazineHeader(3)}

    <div style="margin-top: 52pt;">
      ${renderSectionLabel('Major AI Developments')}

      <h2 style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 18pt; color: ${COLORS.white}; line-height: 1.2; margin-bottom: 6pt;">
        What Happened This Month
      </h2>
      <div style="width: 40pt; height: 2pt; background: ${COLORS.gold}; border-radius: 1pt; margin-bottom: 16pt;"></div>

      ${items.map((item) => renderCard(`
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6pt;">
          <div style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 9.5pt; color: ${COLORS.white}; flex: 1; margin-right: 8pt; line-height: 1.3;">
            ${escapeHtml(item.headline)}
          </div>
          ${renderBadge(item.significance, item.significance === 'high' ? COLORS.gold : COLORS.midGrey)}
        </div>
        <p style="font-family: 'Inter', sans-serif; font-size: 8pt; color: ${COLORS.lightGrey}; line-height: 1.55; margin-bottom: 6pt;">
          ${escapeHtml(item.summary)}
        </p>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          ${item.source_url
            ? `<a href="${escapeHtml(item.source_url)}" target="_blank" rel="noopener noreferrer" style="font-family: 'Inter', sans-serif; font-size: 6.5pt; color: ${COLORS.gold}; text-decoration: none; border-bottom: 0.4pt solid ${COLORS.goldDark};">${escapeHtml(item.source)}</a>`
            : `<span style="font-family: 'Inter', sans-serif; font-size: 6.5pt; color: ${COLORS.darkGrey};">${escapeHtml(item.source)}</span>`
          }
          <span style="font-family: 'Inter', sans-serif; font-size: 6.5pt; color: ${COLORS.darkGrey}; text-transform: uppercase; letter-spacing: 0.5pt;">${escapeHtml(item.category)}</span>
        </div>
      `, { marginBottom: '7pt' })).join('')}
    </div>

    ${renderMagazineFooter(3)}
  </div>
</body>
</html>`;
}
