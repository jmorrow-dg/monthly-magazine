import { BASE_STYLES, COLORS } from './shared/styles';
import { renderMagazineHeader, renderMagazineFooter, renderIconLabel, renderBadge, renderCard, renderStrategicPullQuote } from './shared/components';
import { escapeHtml } from '@/lib/utils/escape-html';
import type { ImplicationsPageData } from '@/lib/types/templates';

const IMPACT_COLORS: Record<string, string> = {
  transformative: COLORS.gold,
  significant: '#3B82F6',
  emerging: COLORS.midGrey,
};

export function renderImplications(data: ImplicationsPageData): string {
  const items = data.items.slice(0, 4);

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
      ${renderIconLabel('strategic-implications', 'Strategic Implications')}

      <h2 style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 18pt; color: ${COLORS.white}; line-height: 1.2; margin-bottom: 6pt;">
        What It Means for Operators
      </h2>
      <div style="width: 40pt; height: 2pt; background: ${COLORS.gold}; border-radius: 1pt; margin-bottom: 16pt;"></div>

      ${items.map((item, idx) => {
        const impactColor = IMPACT_COLORS[item.impact_level] || COLORS.midGrey;
        const card = renderCard(`
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6pt;">
            <div style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 9.5pt; color: ${COLORS.white}; flex: 1; margin-right: 8pt; line-height: 1.3;">
              ${escapeHtml(item.title)}
            </div>
            ${renderBadge(item.impact_level, impactColor)}
          </div>
          <p style="font-family: 'Inter', sans-serif; font-size: 8pt; color: ${COLORS.lightGrey}; line-height: 1.55; margin-bottom: 8pt;">
            ${escapeHtml(item.description)}
          </p>
          <div style="display: flex; gap: 5pt; flex-wrap: wrap;">
            ${item.sector_relevance.map(s => `
              <span style="font-family: 'Inter', sans-serif; font-size: 6pt; color: ${COLORS.midGrey}; padding: 1.5pt 6pt; border: 0.4pt solid ${COLORS.rule}; border-radius: 2pt; text-transform: uppercase; letter-spacing: 0.3pt;">
                ${escapeHtml(s)}
              </span>
            `).join('')}
          </div>
        `, { marginBottom: '7pt' });
        return idx === 2 && data.pullQuote ? renderStrategicPullQuote(data.pullQuote) + card : card;
      }).join('')}
    </div>

    ${renderMagazineFooter(9)}
  </div>
</body>
</html>`;
}
