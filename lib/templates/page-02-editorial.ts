import { BASE_STYLES, COLORS } from './shared/styles';
import { renderMagazineHeader, renderMagazineFooter, renderIconLabel } from './shared/components';
import { escapeHtml } from '@/lib/utils/escape-html';
import type { EditorialPageData } from '@/lib/types/templates';

export function renderEditorial(data: EditorialPageData): string {
  const paragraphs = (data.note || '').split('\n\n').filter(Boolean).slice(0, 3);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="page">
    ${renderMagazineHeader(2)}

    <div style="margin-top: 52pt;">
      ${renderIconLabel('editorial', 'Editorial Note')}

      <h2 style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 20pt; color: ${COLORS.white}; line-height: 1.2; margin-bottom: 6pt;">
        From the Editor
      </h2>
      <div style="width: 40pt; height: 2pt; background: ${COLORS.gold}; border-radius: 1pt; margin-bottom: 18pt;"></div>

      <div style="font-family: 'Inter', sans-serif; font-size: 8.5pt; color: ${COLORS.lightGrey}; line-height: 1.65; margin-bottom: 10pt;">
        ${escapeHtml(data.month)} | Edition ${String(data.edition).padStart(2, '0')}
      </div>

      <div style="display: flex; align-items: flex-start; gap: 16pt; margin-bottom: 20pt;">
        <img src="/images/josh-morrow.jpg" alt="" style="width: 54pt; height: 54pt; border-radius: 50%; object-fit: cover; flex-shrink: 0; margin-top: 2pt;" />
        <div style="border-left: 2pt solid ${COLORS.gold}; padding-left: 16pt; flex: 1;">
          ${paragraphs.map((p, i) => `
            <p style="font-family: 'Inter', sans-serif; font-size: 9pt; color: ${i === 0 ? COLORS.offWhite : COLORS.lightGrey}; line-height: 1.7; margin-bottom: 12pt; ${i === 0 ? 'font-weight: 500;' : ''}">
              ${escapeHtml(p)}
            </p>
          `).join('')}

          <div style="margin-top: 6pt;">
            <div style="font-family: 'Playfair Display', serif; font-style: italic; font-size: 11pt; color: ${COLORS.offWhite}; margin-bottom: 2pt;">
              Josh Morrow
            </div>
            <div style="font-family: 'Inter', sans-serif; font-size: 7pt; color: ${COLORS.midGrey}; text-transform: uppercase; letter-spacing: 0.8pt;">
              Founder, David &amp; Goliath
            </div>
          </div>
        </div>
      </div>
    </div>

    ${renderMagazineFooter(2)}
  </div>
</body>
</html>`;
}
