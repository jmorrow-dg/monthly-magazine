import { BASE_STYLES, COLORS } from '../shared/styles';
import { renderMagazineHeader, renderMagazineFooter, renderIconLabel, renderCitationMark, buildCitations } from '../shared/components';
import { escapeHtml } from '@/lib/utils/escape-html';
import type { ImplicationItem } from '@/lib/types/issue';

export type WeeklyImplicationsData = {
  items: ImplicationItem[];
  pullQuote?: string;
};

const IMPACT_COLORS: Record<string, { bg: string; text: string }> = {
  transformative: { bg: 'rgba(184,134,11,0.15)', text: COLORS.gold },
  significant: { bg: 'rgba(59,130,246,0.15)', text: '#3B82F6' },
  emerging: { bg: 'rgba(34,197,94,0.15)', text: '#22C55E' },
};

export function renderWeeklyImplications(data: WeeklyImplicationsData): string {
  const items = data.items.slice(0, 3);
  const { marks, footer } = buildCitations(items);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="page">
    ${renderMagazineHeader(5)}

    <div style="margin-top: 52pt;">
      ${renderIconLabel('implications', 'Strategic Implications')}

      <h2 style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 16pt; color: ${COLORS.white}; line-height: 1.2; margin-bottom: 5pt;">
        What It Means for Operators
      </h2>
      <div style="width: 40pt; height: 2pt; background: ${COLORS.gold}; border-radius: 1pt; margin-bottom: 14pt;"></div>

      <div style="display: flex; flex-direction: column; gap: 10pt;">
        ${items.map((item, idx) => {
          const citeMark = marks.has(idx) ? renderCitationMark(marks.get(idx)!) : '';
          const impact = IMPACT_COLORS[item.impact_level] || IMPACT_COLORS.emerging;
          return `
          <div style="background: ${COLORS.card}; border: 0.4pt solid ${COLORS.rule}; border-radius: 5pt; padding: 12pt 14pt;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6pt;">
              <div style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 9pt; color: ${COLORS.white}; line-height: 1.3; flex: 1;">
                ${escapeHtml(item.title)}${citeMark}
              </div>
              <span style="font-family: 'Inter', sans-serif; font-size: 5.5pt; font-weight: 600; color: ${impact.text}; text-transform: uppercase; letter-spacing: 0.5pt; padding: 2pt 6pt; background: ${impact.bg}; border: 0.4pt solid ${impact.text}30; border-radius: 2pt; flex-shrink: 0; margin-left: 8pt;">
                ${escapeHtml(item.impact_level)}
              </span>
            </div>
            <p style="font-family: 'Inter', sans-serif; font-size: 7.5pt; color: ${COLORS.lightGrey}; line-height: 1.5; margin-bottom: 8pt;">
              ${escapeHtml(item.description)}
            </p>
            ${item.data_point ? `
            <div style="padding-top: 6pt; border-top: 0.4pt solid ${COLORS.rule};">
              <span style="font-family: 'Inter', sans-serif; font-size: 6.5pt; color: ${COLORS.gold}; font-weight: 600;">Data point: </span>
              <span style="font-family: 'Inter', sans-serif; font-size: 6.5pt; color: ${COLORS.midGrey};">${escapeHtml(item.data_point)}</span>
            </div>
            ` : ''}
            <div style="display: flex; gap: 4pt; flex-wrap: wrap; margin-top: 6pt;">
              ${item.sector_relevance.map(s => `
                <span style="font-family: 'Inter', sans-serif; font-size: 5.5pt; color: ${COLORS.midGrey}; padding: 2pt 6pt; background: ${COLORS.card2}; border: 0.4pt solid ${COLORS.rule}; border-radius: 2pt; text-transform: uppercase; letter-spacing: 0.3pt;">
                  ${escapeHtml(s)}
                </span>
              `).join('')}
            </div>
          </div>
          `;
        }).join('')}
      </div>

      ${data.pullQuote ? `
      <div style="margin-top: 14pt; padding: 10pt 14pt; border-left: 2.5pt solid ${COLORS.gold}; background: rgba(184,134,11,0.04);">
        <p style="font-family: 'Playfair Display', serif; font-style: italic; font-size: 9.5pt; color: ${COLORS.white}; line-height: 1.45;">
          &ldquo;${escapeHtml(data.pullQuote)}&rdquo;
        </p>
      </div>
      ` : ''}
    </div>

    ${footer}
    ${renderMagazineFooter(5)}
  </div>
</body>
</html>`;
}
