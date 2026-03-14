import { BASE_STYLES, COLORS } from './shared/styles';
import { renderMagazineHeader, renderMagazineFooter, renderIconLabel, renderSectionTitle, renderBadge, renderCard, renderCitationMark, buildCitations } from './shared/components';
import { escapeHtml } from '@/lib/utils/escape-html';
import type { IndustryWatchPageData } from '@/lib/types/templates';

const TREND_COLORS: Record<string, string> = {
  accelerating: COLORS.green,
  emerging: COLORS.gold,
  stabilising: '#3B82F6',
  declining: COLORS.red,
};

export function renderIndustryWatch(data: IndustryWatchPageData): string {
  const items = data.items.slice(0, 4);
  const { marks, footer } = buildCitations(items);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="page">
    ${renderMagazineHeader(17)}

    <div style="margin-top: 52pt;">
      ${renderIconLabel('industry-watch', 'Industry Watch')}

      ${renderSectionTitle('Industry Watch', 'Sector-specific trends and movements shaping AI adoption.')}

      ${items.map((item, idx) => {
        const trendColor = TREND_COLORS[item.trend_direction] || COLORS.midGrey;
        const citeMark = marks.has(idx) ? renderCitationMark(marks.get(idx)!) : '';
        return renderCard(`
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6pt;">
            <div style="display: flex; align-items: center; gap: 8pt; flex: 1; margin-right: 8pt;">
              ${renderBadge(item.industry, '#3B82F6')}
              <div style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 9pt; color: ${COLORS.white}; line-height: 1.3;">
                ${escapeHtml(item.headline)}${citeMark}
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 4pt; flex-shrink: 0;">
              <span style="display: inline-block; width: 5pt; height: 5pt; border-radius: 50%; background: ${trendColor};"></span>
              <span style="font-family: 'Inter', sans-serif; font-size: 6pt; color: ${trendColor}; text-transform: uppercase; letter-spacing: 0.3pt; font-weight: 600;">
                ${escapeHtml(item.trend_direction)}
              </span>
            </div>
          </div>
          <p style="font-family: 'Inter', sans-serif; font-size: 8pt; color: ${COLORS.lightGrey}; line-height: 1.55; margin: 0;">
            ${escapeHtml(item.description)}
          </p>
        `, { marginBottom: '10pt' });
      }).join('')}
    </div>

    ${footer}
    ${renderMagazineFooter(17)}
  </div>
</body>
</html>`;
}
