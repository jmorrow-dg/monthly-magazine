import { BASE_STYLES, COLORS } from '../shared/styles';
import { renderMagazineHeader, renderMagazineFooter, renderIconLabel, renderCitationMark, buildCitations } from '../shared/components';
import { escapeHtml } from '@/lib/utils/escape-html';

export type WeeklySignalItem = {
  headline: string;
  summary: string;
  category: string;
  source_signal?: string;
};

export type WeeklyKeySignalsData = {
  items: WeeklySignalItem[];
};

const CATEGORY_COLORS: Record<string, string> = {
  'Model Release': '#3B82F6',
  'Enterprise AI': '#22C55E',
  'AI Infrastructure': '#F59E0B',
  'AI Security': '#DC2626',
  'AI Strategy': '#8B5CF6',
  'Agent Systems': '#06B6D4',
};

export function renderWeeklyKeySignals(data: WeeklyKeySignalsData): string {
  const items = data.items.slice(0, 5);
  const { marks, footer } = buildCitations(items);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="page">
    ${renderMagazineHeader(4)}

    <div style="margin-top: 52pt;">
      ${renderIconLabel('strategic-signals', 'Key Signals')}

      <h2 style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 16pt; color: ${COLORS.white}; line-height: 1.2; margin-bottom: 5pt;">
        Top Signals This Week
      </h2>
      <div style="width: 40pt; height: 2pt; background: ${COLORS.gold}; border-radius: 1pt; margin-bottom: 14pt;"></div>

      <div style="display: flex; flex-direction: column; gap: 8pt;">
        ${items.map((item, idx) => {
          const citeMark = marks.has(idx) ? renderCitationMark(marks.get(idx)!) : '';
          const catColor = CATEGORY_COLORS[item.category] || COLORS.midGrey;
          return `
          <div style="background: ${COLORS.card}; border: 0.4pt solid ${COLORS.rule}; border-radius: 5pt; padding: 10pt 14pt; display: flex; gap: 12pt; align-items: flex-start;">
            <div style="width: 20pt; height: 20pt; border-radius: 10pt; background: ${COLORS.card2}; border: 0.4pt solid ${COLORS.gold}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2pt;">
              <span style="font-family: 'Inter', sans-serif; font-size: 7pt; font-weight: 700; color: ${COLORS.gold};">${idx + 1}</span>
            </div>
            <div style="flex: 1; min-width: 0;">
              <div style="display: flex; align-items: center; gap: 6pt; margin-bottom: 4pt;">
                <span style="font-family: 'Inter', sans-serif; font-size: 5.5pt; font-weight: 600; color: ${catColor}; text-transform: uppercase; letter-spacing: 0.5pt; padding: 1pt 5pt; background: ${catColor}15; border-radius: 2pt;">
                  ${escapeHtml(item.category)}
                </span>
              </div>
              <div style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 8.5pt; color: ${COLORS.white}; line-height: 1.3; margin-bottom: 4pt;">
                ${escapeHtml(item.headline)}${citeMark}
              </div>
              <p style="font-family: 'Inter', sans-serif; font-size: 7pt; color: ${COLORS.lightGrey}; line-height: 1.45; margin: 0;">
                ${escapeHtml(item.summary)}
              </p>
            </div>
          </div>
          `;
        }).join('')}
      </div>
    </div>

    ${footer}
    ${renderMagazineFooter(4)}
  </div>
</body>
</html>`;
}
