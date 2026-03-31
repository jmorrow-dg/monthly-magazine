import { BASE_STYLES, COLORS } from './shared/styles';
import { renderMagazineHeader, renderMagazineFooter, renderIconLabel, renderCard, goldBullet, renderStrategicPullQuote } from './shared/components';
import { escapeHtml } from '@/lib/utils/escape-html';
import type { PlaybooksPageData } from '@/lib/types/templates';

export function renderPlaybooks(data: PlaybooksPageData): string {
  const items = data.items.slice(0, 3);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="page">
    ${renderMagazineHeader(19)}

    <div style="margin-top: 52pt;">
      ${renderIconLabel('playbook', 'Operator Playbooks')}

      <h2 style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 16pt; color: ${COLORS.white}; line-height: 1.2; margin-bottom: 5pt;">
        Practical Plays to Run Now
      </h2>
      <div style="width: 40pt; height: 2pt; background: ${COLORS.gold}; border-radius: 1pt; margin-bottom: 10pt;"></div>

      ${items.map((item, idx) => {
        // Insert pull quote between first and second playbook
        const quote = idx === 1 && data.pullQuote ? renderStrategicPullQuote(data.pullQuote) : '';
        return quote + renderCard(`
        <div style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 9pt; color: ${COLORS.white}; margin-bottom: 4pt; line-height: 1.3;">
          ${escapeHtml(item.title)}
        </div>
        <p style="font-family: 'Inter', sans-serif; font-size: 7pt; color: ${COLORS.midGrey}; line-height: 1.4; margin-bottom: 6pt; font-style: italic;">
          ${escapeHtml(item.context)}
        </p>

        <div style="margin-bottom: 6pt;">
          ${item.steps.map((step, i) => `
            <div style="display: flex; align-items: flex-start; margin-bottom: 4pt;">
              <div style="width: 13pt; height: 13pt; border-radius: 7pt; background: ${COLORS.card2}; border: 0.4pt solid ${COLORS.gold}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 7pt; margin-top: 1pt;">
                <span style="font-family: 'Inter', sans-serif; font-size: 6pt; font-weight: 700; color: ${COLORS.gold};">${i + 1}</span>
              </div>
              <span style="font-family: 'Inter', sans-serif; font-size: 7.5pt; color: ${COLORS.lightGrey}; line-height: 1.45;">${escapeHtml(step)}</span>
            </div>
          `).join('')}
        </div>

        <div style="padding-top: 5pt; border-top: 0.4pt solid ${COLORS.rule}; display: flex; align-items: flex-start;">
          ${goldBullet()}
          <span style="font-family: 'Inter', sans-serif; font-size: 7pt; color: ${COLORS.gold}; font-weight: 600;">
            Outcome: ${escapeHtml(item.outcome)}
          </span>
        </div>
      `, { padding: '9pt 12pt', marginBottom: '6pt' }); }).join('')}
    </div>

    ${renderMagazineFooter(19)}
  </div>
</body>
</html>`;
}
