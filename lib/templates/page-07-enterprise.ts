import { BASE_STYLES, COLORS } from './shared/styles';
import { renderMagazineHeader, renderMagazineFooter, renderIconLabel, renderBadge, renderCard, renderStrategicPullQuote } from './shared/components';
import { escapeHtml } from '@/lib/utils/escape-html';
import type { EnterprisePageData } from '@/lib/types/templates';

const STAGE_COLORS: Record<string, string> = {
  early: COLORS.midGrey,
  growing: '#3B82F6',
  mainstream: COLORS.green,
};

export function renderEnterprise(data: EnterprisePageData): string {
  const items = data.items.slice(0, 4);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="page">
    ${renderMagazineHeader(11)}

    <div style="margin-top: 52pt;">
      ${renderIconLabel('enterprise', 'Enterprise AI Adoption')}

      <h2 style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 18pt; color: ${COLORS.white}; line-height: 1.2; margin-bottom: 6pt;">
        How Organisations Are Moving
      </h2>
      <div style="width: 40pt; height: 2pt; background: ${COLORS.gold}; border-radius: 1pt; margin-bottom: 16pt;"></div>

      ${items.map((item, idx) => {
        const stageColor = STAGE_COLORS[item.adoption_stage] || COLORS.midGrey;
        const quote = idx === 2 && data.pullQuote ? renderStrategicPullQuote(data.pullQuote) : '';
        return quote + renderCard(`
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6pt;">
            <div style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 9.5pt; color: ${COLORS.white}; flex: 1; margin-right: 8pt; line-height: 1.3;">
              ${escapeHtml(item.title)}
            </div>
            <div style="display: flex; gap: 4pt; align-items: center; flex-shrink: 0;">
              ${renderBadge(item.adoption_stage, stageColor)}
            </div>
          </div>
          <p style="font-family: 'Inter', sans-serif; font-size: 8pt; color: ${COLORS.lightGrey}; line-height: 1.55; margin-bottom: 6pt;">
            ${escapeHtml(item.description)}
          </p>
          <div style="font-family: 'Inter', sans-serif; font-size: 6.5pt; color: ${COLORS.darkGrey}; text-transform: uppercase; letter-spacing: 0.5pt;">
            ${escapeHtml(item.industry)}
          </div>
        `, { marginBottom: '7pt' });
      }).join('')}
    </div>

    ${renderMagazineFooter(11)}
  </div>
</body>
</html>`;
}
