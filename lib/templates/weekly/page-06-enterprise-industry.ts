import { BASE_STYLES, COLORS } from '../shared/styles';
import { renderMagazineHeader, renderMagazineFooter, renderIconLabel, renderCard, renderCitationMark, buildCitations } from '../shared/components';
import { escapeHtml } from '@/lib/utils/escape-html';
import type { EnterpriseItem, IndustryWatchItem } from '@/lib/types/issue';

export type WeeklyEnterpriseIndustryData = {
  enterprise: EnterpriseItem[];
  industryWatch: IndustryWatchItem[];
};

const ADOPTION_COLORS: Record<string, { bg: string; text: string }> = {
  early: { bg: 'rgba(59,130,246,0.15)', text: '#3B82F6' },
  growing: { bg: 'rgba(34,197,94,0.15)', text: '#22C55E' },
  mainstream: { bg: 'rgba(184,134,11,0.15)', text: COLORS.gold },
};

const TREND_COLORS: Record<string, string> = {
  accelerating: '#22C55E',
  emerging: '#3B82F6',
  stabilising: '#F59E0B',
  declining: '#C0392B',
};

export function renderWeeklyEnterpriseIndustry(data: WeeklyEnterpriseIndustryData): string {
  const enterprise = data.enterprise.slice(0, 2);
  const industry = data.industryWatch.slice(0, 2);
  const allItems = [...enterprise, ...industry];
  const { marks, footer } = buildCitations(allItems);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="page">
    ${renderMagazineHeader(6)}

    <div style="margin-top: 52pt;">
      <!-- Enterprise section -->
      ${renderIconLabel('enterprise', 'Enterprise AI')}

      <h2 style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 14pt; color: ${COLORS.white}; line-height: 1.2; margin-bottom: 5pt;">
        Adoption Patterns
      </h2>
      <div style="width: 40pt; height: 2pt; background: ${COLORS.gold}; border-radius: 1pt; margin-bottom: 10pt;"></div>

      <div style="display: flex; flex-direction: column; gap: 6pt; margin-bottom: 16pt;">
        ${enterprise.map((item, idx) => {
          const citeMark = marks.has(idx) ? renderCitationMark(marks.get(idx)!) : '';
          const adoption = ADOPTION_COLORS[item.adoption_stage] || ADOPTION_COLORS.early;
          return renderCard(`
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4pt;">
              <div style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 8.5pt; color: ${COLORS.white}; line-height: 1.3; flex: 1;">
                ${escapeHtml(item.title)}${citeMark}
              </div>
              <span style="font-family: 'Inter', sans-serif; font-size: 5.5pt; font-weight: 600; color: ${adoption.text}; text-transform: uppercase; letter-spacing: 0.5pt; padding: 2pt 5pt; background: ${adoption.bg}; border-radius: 2pt; flex-shrink: 0; margin-left: 6pt;">
                ${escapeHtml(item.adoption_stage)}
              </span>
            </div>
            <p style="font-family: 'Inter', sans-serif; font-size: 7pt; color: ${COLORS.lightGrey}; line-height: 1.45; margin-bottom: 4pt;">
              ${escapeHtml(item.description)}
            </p>
            ${item.data_point ? `
            <div style="padding-top: 4pt; border-top: 0.4pt solid ${COLORS.rule};">
              <span style="font-family: 'Inter', sans-serif; font-size: 6pt; color: ${COLORS.gold}; font-weight: 600;">Data: </span>
              <span style="font-family: 'Inter', sans-serif; font-size: 6pt; color: ${COLORS.midGrey};">${escapeHtml(item.data_point)}</span>
            </div>
            ` : ''}
          `, { padding: '10pt 12pt', marginBottom: '0' });
        }).join('')}
      </div>

      <!-- Divider -->
      <div style="width: 100%; height: 0.5pt; background: ${COLORS.gold}; opacity: 0.25; margin-bottom: 14pt;"></div>

      <!-- Industry Watch section -->
      ${renderIconLabel('industry', 'Industry Watch')}

      <h2 style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 14pt; color: ${COLORS.white}; line-height: 1.2; margin-bottom: 5pt;">
        Sector Trends
      </h2>
      <div style="width: 40pt; height: 2pt; background: ${COLORS.gold}; border-radius: 1pt; margin-bottom: 10pt;"></div>

      <div style="display: flex; flex-direction: column; gap: 6pt;">
        ${industry.map((item, idx) => {
          const mapIdx = enterprise.length + idx;
          const citeMark = marks.has(mapIdx) ? renderCitationMark(marks.get(mapIdx)!) : '';
          const trendColor = TREND_COLORS[item.trend_direction] || COLORS.midGrey;
          return renderCard(`
            <div style="display: flex; align-items: center; gap: 6pt; margin-bottom: 4pt;">
              <span style="font-family: 'Inter', sans-serif; font-size: 5.5pt; font-weight: 600; color: #3B82F6; text-transform: uppercase; letter-spacing: 0.5pt; padding: 2pt 5pt; background: rgba(59,130,246,0.15); border-radius: 2pt;">
                ${escapeHtml(item.industry)}
              </span>
              <div style="display: flex; align-items: center; gap: 3pt; margin-left: auto;">
                <div style="width: 5pt; height: 5pt; border-radius: 50%; background: ${trendColor};"></div>
                <span style="font-family: 'Inter', sans-serif; font-size: 5.5pt; color: ${trendColor}; text-transform: uppercase; letter-spacing: 0.3pt;">
                  ${escapeHtml(item.trend_direction)}
                </span>
              </div>
            </div>
            <div style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 8.5pt; color: ${COLORS.white}; line-height: 1.3; margin-bottom: 4pt;">
              ${escapeHtml(item.headline)}${citeMark}
            </div>
            <p style="font-family: 'Inter', sans-serif; font-size: 7pt; color: ${COLORS.lightGrey}; line-height: 1.45; margin: 0;">
              ${escapeHtml(item.description)}
            </p>
          `, { padding: '10pt 12pt', marginBottom: '0' });
        }).join('')}
      </div>
    </div>

    ${footer}
    ${renderMagazineFooter(6)}
  </div>
</body>
</html>`;
}
