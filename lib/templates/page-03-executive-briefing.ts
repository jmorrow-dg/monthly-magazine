import { BASE_STYLES, COLORS } from './shared/styles';
import { renderMagazineHeader, renderMagazineFooter, renderIconLabel } from './shared/components';
import { escapeHtml } from '@/lib/utils/escape-html';
import type { ExecutiveBriefingPageData } from '@/lib/types/templates';

export function renderExecutiveBriefing(data: ExecutiveBriefingPageData): string {
  const items = data.items.slice(0, 5);

  // Split into two columns: 3 left, 2 right (or 2+3 if 5 items)
  const leftItems = items.slice(0, 3);
  const rightItems = items.slice(3, 5);

  const renderTakeawayCard = (item: { headline: string; explanation: string }, idx: number): string => `
    <div style="background: ${COLORS.card}; border: 0.4pt solid ${COLORS.rule}; border-radius: 5pt; padding: 14pt 16pt; margin-bottom: 8pt; overflow: hidden; word-wrap: break-word; overflow-wrap: break-word;">
      <div style="display: flex; align-items: flex-start; gap: 8pt; margin-bottom: 8pt;">
        <div style="width: 20pt; height: 20pt; border-radius: 3pt; background: rgba(184,134,11,0.08); border: 0.4pt solid ${COLORS.gold}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <span style="font-family: 'Inter', sans-serif; font-size: 8pt; font-weight: 700; color: ${COLORS.gold};">${String(idx + 1).padStart(2, '0')}</span>
        </div>
        <div style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 10pt; color: ${COLORS.white}; line-height: 1.3; flex: 1;">
          ${escapeHtml(item.headline)}
        </div>
      </div>
      <p style="font-family: 'Inter', sans-serif; font-size: 7.5pt; color: ${COLORS.lightGrey}; line-height: 1.6; margin: 0;">
        ${escapeHtml(item.explanation)}
      </p>
    </div>
  `;

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
      ${renderIconLabel('executive-briefing', 'Executive Briefing')}

      <h2 style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 18pt; color: ${COLORS.white}; line-height: 1.2; margin-bottom: 6pt;">
        Key Takeaways
      </h2>
      <p style="font-family: 'Inter', sans-serif; font-size: 8pt; color: ${COLORS.midGrey}; line-height: 1.45; margin-bottom: 6pt;">
        The most important insights from this month's AI intelligence report.
      </p>
      <div style="width: 40pt; height: 2pt; background: ${COLORS.gold}; border-radius: 1pt; margin-bottom: 14pt;"></div>

      <div style="display: flex; gap: 12pt;">
        <div style="flex: 1;">
          ${leftItems.map((item, idx) => renderTakeawayCard(item, idx)).join('')}
        </div>
        <div style="flex: 1;">
          ${rightItems.map((item, idx) => renderTakeawayCard(item, idx + 3)).join('')}
        </div>
      </div>
    </div>

    ${renderMagazineFooter(3)}
  </div>
</body>
</html>`;
}
