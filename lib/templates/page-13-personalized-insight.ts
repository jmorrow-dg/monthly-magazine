import { BASE_STYLES, COLORS } from './shared/styles';
import { renderMagazineHeader, renderMagazineFooter, renderIconLabel } from './shared/components';
import { escapeHtml } from '@/lib/utils/escape-html';
import type { WhyThisMattersPageData } from '@/lib/types/templates';

export function renderWhyThisMatters(data: WhyThisMattersPageData): string {
  const paragraphs = data.content.split(/\n\n+/).filter(Boolean);

  const statBlock = data.statValue ? `
    <div style="margin-bottom: 20pt; padding: 18pt 20pt; background: rgba(184,134,11,0.06); border-left: 3pt solid ${COLORS.gold}; border-radius: 0 5pt 5pt 0;">
      <div style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 28pt; color: ${COLORS.gold}; line-height: 1.1; margin-bottom: 4pt;">
        ${escapeHtml(data.statValue)}
      </div>
      <div style="font-family: 'Inter', sans-serif; font-size: 8pt; color: ${COLORS.lightGrey}; line-height: 1.4;">
        ${escapeHtml(data.statLabel || '')}
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
    ${renderMagazineHeader(5)}

    <div style="margin-top: 52pt;">
      ${renderIconLabel('why-this-matters', 'Why This Matters')}

      <div style="margin-bottom: 16pt;">
        <h2 style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 18pt; color: ${COLORS.white}; line-height: 1.2; margin-bottom: 6pt;">
          Why This Matters
        </h2>
        <div style="width: 40pt; height: 2pt; background: ${COLORS.gold}; border-radius: 1pt;"></div>
      </div>

      ${statBlock}

      <div style="max-width: 420pt;">
        ${paragraphs.map((p, i) => `
          <p style="font-family: 'Inter', sans-serif; font-size: ${i === 0 ? '9.5pt' : '8.5pt'}; color: ${i === 0 ? COLORS.offWhite : COLORS.lightGrey}; line-height: 1.7; margin-bottom: 14pt; text-align: left; ${i === 0 ? 'font-weight: 500;' : ''}">
            ${escapeHtml(p)}
          </p>
        `).join('')}
      </div>
    </div>

    ${renderMagazineFooter(5)}
  </div>
</body>
</html>`;
}
