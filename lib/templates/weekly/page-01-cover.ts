import { BASE_STYLES, COLORS } from '../shared/styles';
import { dgLogoDataUri, goldCurvesBgDataUri } from '../shared/assets';
import { escapeHtml } from '@/lib/utils/escape-html';

export type WeeklyCoverData = {
  headline: string;
  subtitle?: string | null;
  editionLabel: string;
  weekRange: string;
  coverImageUrl?: string | null;
};

export function renderWeeklyCover(data: WeeklyCoverData): string {
  const logoSrc = dgLogoDataUri();
  const bgSrc = data.coverImageUrl || goldCurvesBgDataUri();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="page" style="padding: 0; overflow: hidden;">

    <!-- Background -->
    <div style="position: absolute; inset: 0;">
      <img src="${bgSrc}" style="width: 100%; height: 100%; object-fit: cover;" />
      <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(20,20,20,0.5) 0%, rgba(20,20,20,0.85) 55%, rgba(20,20,20,0.98) 100%);"></div>
    </div>

    <!-- Grid texture -->
    <div style="position: absolute; inset: 0; opacity: 0.03; background-image: repeating-linear-gradient(0deg, transparent, transparent 29px, rgba(255,255,255,0.5) 30px), repeating-linear-gradient(90deg, transparent, transparent 29px, rgba(255,255,255,0.5) 30px);"></div>

    <!-- Masthead -->
    <div style="position: absolute; top: 28pt; left: 38pt; right: 38pt; display: flex; justify-content: space-between; align-items: flex-start; z-index: 10;">
      <div style="display: flex; align-items: center; gap: 10pt;">
        <img src="${logoSrc}" alt="DG" style="height: 30pt; width: 30pt; object-fit: contain;" />
        <div>
          <div style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 11pt; color: ${COLORS.white}; letter-spacing: 0.5pt;">David & Goliath</div>
          <div style="font-family: 'Inter', sans-serif; font-weight: 600; font-size: 5.5pt; color: ${COLORS.gold}; text-transform: uppercase; letter-spacing: 2pt;">Weekly AI Intelligence</div>
        </div>
      </div>
      <div style="text-align: right;">
        <div style="font-family: 'Inter', sans-serif; font-weight: 600; font-size: 7pt; color: ${COLORS.white}; opacity: 0.7;">${escapeHtml(data.editionLabel)}</div>
        <div style="font-family: 'Inter', sans-serif; font-size: 6pt; color: ${COLORS.gold}; margin-top: 2pt;">${escapeHtml(data.weekRange)}</div>
      </div>
    </div>

    <!-- Main headline -->
    <div style="position: absolute; bottom: 100pt; left: 38pt; right: 38pt; z-index: 10;">
      <div style="width: 40pt; height: 2.5pt; background: ${COLORS.gold}; border-radius: 1pt; margin-bottom: 16pt;"></div>
      <h1 style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 32pt; color: ${COLORS.white}; line-height: 1.15; margin-bottom: 10pt; letter-spacing: -0.3pt;">
        ${escapeHtml(data.headline)}
      </h1>
      ${data.subtitle ? `
      <p style="font-family: 'Inter', sans-serif; font-size: 10pt; color: ${COLORS.lightGrey}; line-height: 1.5; max-width: 380pt;">
        ${escapeHtml(data.subtitle)}
      </p>
      ` : ''}
    </div>

    <!-- Bottom bar -->
    <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 42pt; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: space-between; padding: 0 38pt; z-index: 10;">
      <span style="font-family: 'Inter', sans-serif; font-size: 6.5pt; color: ${COLORS.midGrey}; letter-spacing: 0.5pt;">davidandgoliath.ai</span>
      <div style="width: 50pt; height: 2pt; background: ${COLORS.gold}; border-radius: 1pt;"></div>
    </div>

  </div>
</body>
</html>`;
}
