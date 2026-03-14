import { BASE_STYLES, COLORS } from './shared/styles';
import { renderMagazineHeader, renderMagazineFooter, renderIconLabel, renderCitationMark, buildCitations } from './shared/components';
import { escapeHtml } from '@/lib/utils/escape-html';
import type { ExecutiveBriefingPageData } from '@/lib/types/templates';

export function renderExecutiveBriefing(data: ExecutiveBriefingPageData): string {
  const items = data.items.slice(0, 5);
  const { marks, footer } = buildCitations(items);

  // Split into two columns: 3 left, 2 right
  const leftItems = items.slice(0, 3);
  const rightItems = items.slice(3, 5);

  const renderTakeawayCard = (item: { headline: string; explanation: string; source_signal?: string }, idx: number): string => {
    const citeMark = marks.has(idx) ? renderCitationMark(marks.get(idx)!) : '';
    return `
    <div style="background: ${COLORS.card}; border: 0.4pt solid ${COLORS.rule}; border-radius: 5pt; padding: 14pt 16pt; margin-bottom: 8pt; overflow: hidden; word-wrap: break-word; overflow-wrap: break-word;">
      <div style="display: flex; align-items: flex-start; gap: 8pt; margin-bottom: 8pt;">
        <div style="width: 20pt; height: 20pt; border-radius: 3pt; background: rgba(184,134,11,0.08); border: 0.4pt solid ${COLORS.gold}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <span style="font-family: 'Inter', sans-serif; font-size: 8pt; font-weight: 700; color: ${COLORS.gold};">${String(idx + 1).padStart(2, '0')}</span>
        </div>
        <div style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 10pt; color: ${COLORS.white}; line-height: 1.3; flex: 1;">
          ${escapeHtml(item.headline)}${citeMark}
        </div>
      </div>
      <p style="font-family: 'Inter', sans-serif; font-size: 8pt; color: ${COLORS.lightGrey}; line-height: 1.6; margin: 0;">
        ${escapeHtml(item.explanation)}
      </p>
    </div>
  `;
  };

  // Cover story connector for the bottom-right space
  const coverConnector = data.coverHeadline ? `
    <div style="background: rgba(184,134,11,0.06); border: 0.4pt solid rgba(184,134,11,0.25); border-radius: 5pt; padding: 14pt 16pt; margin-top: 8pt;">
      <div style="font-family: 'Inter', sans-serif; font-size: 6.5pt; color: ${COLORS.gold}; text-transform: uppercase; letter-spacing: 1.2pt; margin-bottom: 6pt;">
        This Edition's Cover Story
      </div>
      <div style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 9.5pt; color: ${COLORS.white}; line-height: 1.35; margin-bottom: 4pt;">
        ${escapeHtml(data.coverHeadline)}
      </div>
      <div style="font-family: 'Inter', sans-serif; font-size: 7pt; color: ${COLORS.midGrey};">
        See page 7 for full analysis
      </div>
    </div>
  ` : '';

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
      <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 0;">
        <div>
          ${renderIconLabel('executive-briefing', 'Executive Briefing')}
        </div>
        <div style="font-family: 'Inter', sans-serif; font-size: 6.5pt; color: ${COLORS.gold}; text-transform: uppercase; letter-spacing: 1pt; padding-top: 2pt;">
          60-Second Brief
        </div>
      </div>

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
          ${coverConnector}
        </div>
      </div>
    </div>

    ${footer}
    ${renderMagazineFooter(3)}
  </div>
</body>
</html>`;
}
