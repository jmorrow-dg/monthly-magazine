import { BASE_STYLES, COLORS } from './shared/styles';
import { renderMagazineHeader, renderMagazineFooter, renderIconLabel, renderColumnText, renderPullQuote } from './shared/components';
import { escapeHtml } from '@/lib/utils/escape-html';
import type { CoverStoryIntroPageData } from '@/lib/types/templates';

export function renderCoverStoryIntro(data: CoverStoryIntroPageData): string {
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
      ${renderIconLabel('cover-story', 'Cover Story')}

      <h2 style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 20pt; color: ${COLORS.white}; line-height: 1.15; margin-bottom: 8pt;">
        ${escapeHtml(data.headline)}
      </h2>
      <p style="font-family: 'Inter', sans-serif; font-size: 10pt; color: ${COLORS.midGrey}; line-height: 1.45; margin-bottom: 10pt;">
        ${escapeHtml(data.subheadline)}
      </p>
      <div style="width: 40pt; height: 2pt; background: ${COLORS.gold}; border-radius: 1pt; margin-bottom: 16pt;"></div>

      ${data.pullQuote ? renderPullQuote(data.pullQuote) : ''}

      ${renderColumnText(data.introduction, { dropCap: true })}
    </div>

    ${renderMagazineFooter(7)}
  </div>
</body>
</html>`;
}
