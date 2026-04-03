import { BASE_STYLES, COLORS } from '../shared/styles';
import { dgLogoDataUri, goldCurvesBgDataUri } from '../shared/assets';
import { escapeHtml } from '@/lib/utils/escape-html';

export type WeeklyClosingData = {
  edition: number;
  weekRange: string;
  year: number;
};

export function renderWeeklyClosing(data: WeeklyClosingData): string {
  const logoSrc = dgLogoDataUri();
  const bgSrc = goldCurvesBgDataUri();

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
      <img src="${bgSrc}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.15;" />
      <div style="position: absolute; inset: 0; background: rgba(20,20,20,0.88);"></div>
    </div>

    <!-- Content -->
    <div style="position: relative; z-index: 10; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; padding: 38pt;">

      <!-- Logo -->
      <img src="${logoSrc}" alt="DG" style="width: 60pt; height: 60pt; object-fit: contain; margin-bottom: 16pt;" />

      <div style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 18pt; color: ${COLORS.white}; margin-bottom: 4pt;">
        David &amp; Goliath
      </div>
      <div style="font-family: 'Inter', sans-serif; font-weight: 600; font-size: 6pt; color: ${COLORS.gold}; text-transform: uppercase; letter-spacing: 2.5pt; margin-bottom: 20pt;">
        Weekly AI Intelligence
      </div>

      <!-- Gold divider -->
      <div style="width: 40pt; height: 2pt; background: ${COLORS.gold}; border-radius: 1pt; margin-bottom: 20pt;"></div>

      <p style="font-family: 'Inter', sans-serif; font-size: 8.5pt; color: ${COLORS.lightGrey}; line-height: 1.6; max-width: 320pt; margin-bottom: 24pt;">
        Actionable AI intelligence delivered weekly. Helping operators and leaders navigate the AI landscape with clarity and confidence.
      </p>

      <!-- Services -->
      <div style="display: flex; gap: 24pt; margin-bottom: 28pt;">
        <div style="text-align: center;">
          <div style="font-family: 'Inter', sans-serif; font-weight: 600; font-size: 7pt; color: ${COLORS.white};">AI Growth Engine</div>
        </div>
        <div style="width: 1pt; background: ${COLORS.rule};"></div>
        <div style="text-align: center;">
          <div style="font-family: 'Inter', sans-serif; font-weight: 600; font-size: 7pt; color: ${COLORS.white};">Employee Amplification</div>
        </div>
        <div style="width: 1pt; background: ${COLORS.rule};"></div>
        <div style="text-align: center;">
          <div style="font-family: 'Inter', sans-serif; font-weight: 600; font-size: 7pt; color: ${COLORS.white};">Secure AI Brain</div>
        </div>
      </div>

      <!-- CTA -->
      <a style="display: inline-block; padding: 8pt 24pt; background: ${COLORS.gold}; border-radius: 4pt; text-decoration: none; margin-bottom: 20pt;">
        <span style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 8pt; color: ${COLORS.white}; text-transform: uppercase; letter-spacing: 1pt;">
          Book an Intelligence Briefing
        </span>
      </a>

      <!-- Contact -->
      <div style="font-family: 'Inter', sans-serif; font-size: 7pt; color: ${COLORS.midGrey}; line-height: 1.8;">
        hello@davidandgoliath.ai<br/>
        davidandgoliath.ai
      </div>
    </div>

    <!-- Edition footer -->
    <div style="position: absolute; bottom: 22pt; left: 0; right: 0; display: flex; justify-content: center; z-index: 10;">
      <span style="font-family: 'Inter', sans-serif; font-size: 6pt; color: ${COLORS.darkGrey}; letter-spacing: 0.5pt;">
        Weekly Edition W${data.edition} &middot; ${escapeHtml(data.weekRange)} &middot; ${data.year}
      </span>
    </div>

  </div>
</body>
</html>`;
}
