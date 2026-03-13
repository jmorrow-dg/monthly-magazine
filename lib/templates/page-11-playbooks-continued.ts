import { BASE_STYLES, COLORS } from './shared/styles';
import { renderMagazineHeader, renderMagazineFooter, renderIconLabel, renderCard, goldBullet } from './shared/components';
import { escapeHtml } from '@/lib/utils/escape-html';
import type { PlaybooksPageData } from '@/lib/types/templates';

export function renderPlaybooksContinued(data: PlaybooksPageData): string {
  const items = data.items.slice(2, 4);

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
      ${renderIconLabel('playbook', 'More Plays to Run')}

      ${items.map((item) => renderCard(`
        <div style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 10pt; color: ${COLORS.white}; margin-bottom: 4pt; line-height: 1.3;">
          ${escapeHtml(item.title)}
        </div>
        <p style="font-family: 'Inter', sans-serif; font-size: 7.5pt; color: ${COLORS.midGrey}; line-height: 1.45; margin-bottom: 8pt; font-style: italic;">
          ${escapeHtml(item.context)}
        </p>

        <div style="margin-bottom: 8pt;">
          ${item.steps.map((step, i) => `
            <div style="display: flex; align-items: flex-start; margin-bottom: 4pt;">
              <div style="width: 14pt; height: 14pt; border-radius: 7pt; background: ${COLORS.card2}; border: 0.4pt solid ${COLORS.gold}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 8pt; margin-top: 1pt;">
                <span style="font-family: 'Inter', sans-serif; font-size: 6.5pt; font-weight: 700; color: ${COLORS.gold};">${i + 1}</span>
              </div>
              <span style="font-family: 'Inter', sans-serif; font-size: 8pt; color: ${COLORS.lightGrey}; line-height: 1.5;">${escapeHtml(step)}</span>
            </div>
          `).join('')}
        </div>

        <div style="padding-top: 6pt; border-top: 0.4pt solid ${COLORS.rule}; display: flex; align-items: flex-start;">
          ${goldBullet()}
          <span style="font-family: 'Inter', sans-serif; font-size: 7.5pt; color: ${COLORS.gold}; font-weight: 600;">
            Outcome: ${escapeHtml(item.outcome)}
          </span>
        </div>
      `, { marginBottom: '8pt' })).join('')}
    </div>

    ${renderMagazineFooter(17)}
  </div>
</body>
</html>`;
}
