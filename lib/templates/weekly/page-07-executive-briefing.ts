import { BASE_STYLES, COLORS } from '../shared/styles';
import { renderMagazineHeader, renderMagazineFooter, renderIconLabel, renderCitationMark, buildCitations } from '../shared/components';
import { escapeHtml } from '@/lib/utils/escape-html';
import type { ExecutiveTakeawayItem } from '@/lib/types/issue';

export type WeeklyExecutiveBriefingData = {
  items: ExecutiveTakeawayItem[];
};

export function renderWeeklyExecutiveBriefing(data: WeeklyExecutiveBriefingData): string {
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
    ${renderMagazineHeader(7)}

    <div style="margin-top: 52pt;">
      ${renderIconLabel('briefing', 'Executive Briefing')}

      <h2 style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 16pt; color: ${COLORS.white}; line-height: 1.2; margin-bottom: 5pt;">
        Key Takeaways for Leadership
      </h2>
      <div style="width: 40pt; height: 2pt; background: ${COLORS.gold}; border-radius: 1pt; margin-bottom: 14pt;"></div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10pt;">
        ${items.map((item, idx) => {
          const citeMark = marks.has(idx) ? renderCitationMark(marks.get(idx)!) : '';
          return `
          <div style="background: ${COLORS.card}; border: 0.4pt solid ${COLORS.rule}; border-radius: 5pt; padding: 12pt 14pt; display: flex; gap: 10pt; align-items: flex-start;">
            <div style="width: 24pt; height: 24pt; border-radius: 4pt; background: ${COLORS.card2}; border: 0.4pt solid ${COLORS.gold}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <span style="font-family: 'Inter', sans-serif; font-size: 8pt; font-weight: 700; color: ${COLORS.gold};">${String(idx + 1).padStart(2, '0')}</span>
            </div>
            <div style="flex: 1; min-width: 0;">
              <div style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 8.5pt; color: ${COLORS.white}; line-height: 1.3; margin-bottom: 5pt;">
                ${escapeHtml(item.headline)}${citeMark}
              </div>
              <p style="font-family: 'Inter', sans-serif; font-size: 7pt; color: ${COLORS.lightGrey}; line-height: 1.5; margin: 0;">
                ${escapeHtml(item.explanation)}
              </p>
            </div>
          </div>
          `;
        }).join('')}
      </div>

      <!-- Weekly action prompt -->
      <div style="margin-top: 18pt; padding: 12pt 16pt; background: rgba(184,134,11,0.06); border: 0.4pt solid rgba(184,134,11,0.2); border-radius: 5pt;">
        <div style="font-family: 'Inter', sans-serif; font-weight: 600; font-size: 6.5pt; color: ${COLORS.gold}; text-transform: uppercase; letter-spacing: 1.5pt; margin-bottom: 6pt;">
          This Week's Action
        </div>
        <p style="font-family: 'Inter', sans-serif; font-size: 8pt; color: ${COLORS.lightGrey}; line-height: 1.5; margin: 0;">
          Review these takeaways with your leadership team. Which developments most impact your current AI strategy and roadmap? Prioritise one action item for the week ahead.
        </p>
      </div>
    </div>

    ${footer}
    ${renderMagazineFooter(7)}
  </div>
</body>
</html>`;
}
