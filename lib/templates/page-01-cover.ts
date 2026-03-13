import { BASE_STYLES, COLORS } from './shared/styles';
import { dgLogoDataUri, goldCurvesBgDataUri } from './shared/assets';
import { escapeHtml } from '@/lib/utils/escape-html';
import type { CoverPageData } from '@/lib/types/templates';

export function renderCover(data: CoverPageData): string {
  const logoSrc = dgLogoDataUri();
  const bgSrc = data.coverImageUrl || goldCurvesBgDataUri();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="page" style="padding: 0; background: url('${bgSrc}') center/cover no-repeat;">

    <!-- Dark overlay for text legibility -->
    <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(20,20,20,0.4) 0%, rgba(20,20,20,0.85) 100%);"></div>

    <!-- Masthead -->
    <div style="position: absolute; top: 38pt; left: 38pt; right: 38pt; display: flex; justify-content: space-between; align-items: center; z-index: 2;">
      <div style="display: flex; align-items: center; gap: 10pt;">
        <img src="${logoSrc}" alt="David &amp; Goliath" style="width: 32pt; height: 32pt; object-fit: contain;" />
        <div>
          <div style="font-family: 'Playfair Display', serif; font-size: 10pt; font-weight: 700; color: ${COLORS.white}; letter-spacing: 0.5pt;">David &amp; Goliath</div>
          <div style="font-family: 'Inter', sans-serif; font-size: 6pt; color: ${COLORS.gold}; text-transform: uppercase; letter-spacing: 1.5pt; margin-top: 1pt;">AI Intelligence Report</div>
        </div>
      </div>
      <div style="font-family: 'Inter', sans-serif; font-size: 7pt; color: ${COLORS.midGrey}; text-align: right;">
        ${escapeHtml(data.editionLabel)}
      </div>
    </div>

    <!-- Main headline -->
    <div style="position: absolute; bottom: 140pt; left: 38pt; right: 38pt; z-index: 2;">
      <div style="width: 80pt; height: 2pt; background: ${COLORS.gold}; border-radius: 1pt; margin-bottom: 16pt;"></div>
      <div style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 32pt; color: ${COLORS.white}; line-height: 1.15; margin-bottom: 14pt;">
        ${escapeHtml(data.headline)}
      </div>
      ${data.subtitle ? `
      <div style="font-family: 'Inter', sans-serif; font-size: 10pt; color: ${COLORS.lightGrey}; line-height: 1.5; max-width: 380pt;">
        ${escapeHtml(data.subtitle)}
      </div>
      ` : ''}
    </div>

    <!-- Bottom bar -->
    <div style="position: absolute; bottom: 28pt; left: 38pt; right: 38pt; display: flex; justify-content: space-between; align-items: flex-end; z-index: 2;">
      <div>
        <div style="font-family: 'Inter', sans-serif; font-size: 7pt; color: ${COLORS.lightGrey};">
          davidandgoliath.ai
        </div>
      </div>
      <div style="width: 50pt; height: 2pt; background: ${COLORS.gold}; border-radius: 1pt;"></div>
    </div>

  </div>
</body>
</html>`;
}
