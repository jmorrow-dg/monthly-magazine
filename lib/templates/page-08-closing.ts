import { BASE_STYLES, COLORS } from './shared/styles';
import { dgLogoDataUri, goldCurvesBgDataUri } from './shared/assets';
import { escapeHtml } from '@/lib/utils/escape-html';
import type { ClosingPageData } from '@/lib/types/templates';

export function renderClosing(data: ClosingPageData): string {
  const bgSrc = goldCurvesBgDataUri();
  const logoSrc = dgLogoDataUri();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="page" style="padding: 0; background: url('${bgSrc}') center/cover no-repeat;">

    <!-- Dark overlay -->
    <div style="position: absolute; inset: 0; background: rgba(20,20,20,0.88);"></div>

    <!-- Content -->
    <div style="position: relative; z-index: 2; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60pt 50pt;">

      <!-- Logo -->
      <img src="${logoSrc}" alt="David &amp; Goliath" style="width: 80pt; height: 80pt; object-fit: contain; margin-bottom: 20pt;" />

      <!-- Brand name -->
      <div style="font-family: 'Playfair Display', serif; font-size: 26pt; font-weight: 700; color: ${COLORS.white}; text-align: center; margin-bottom: 6pt;">
        David &amp; Goliath
      </div>

      <!-- Tagline -->
      <div style="font-family: 'Inter', sans-serif; font-size: 8pt; color: ${COLORS.gold}; text-transform: uppercase; letter-spacing: 2pt; text-align: center; margin-bottom: 28pt;">
        AI Intelligence for Operators
      </div>

      <!-- Gold divider -->
      <div style="width: 80pt; height: 1.5pt; background: ${COLORS.gold}; border-radius: 0.75pt; margin-bottom: 28pt;"></div>

      <!-- Brand statement -->
      <p style="font-family: 'Inter', sans-serif; font-size: 9pt; color: ${COLORS.lightGrey}; text-align: center; line-height: 1.7; max-width: 340pt; margin-bottom: 32pt;">
        We help ambitious organisations harness AI to drive growth, amplify their people, and build lasting competitive advantage.
      </p>

      <!-- Services -->
      <div style="display: flex; gap: 20pt; margin-bottom: 32pt;">
        <div style="text-align: center;">
          <div style="font-family: 'Inter', sans-serif; font-size: 7pt; color: ${COLORS.gold}; text-transform: uppercase; letter-spacing: 1pt; margin-bottom: 3pt;">01</div>
          <div style="font-family: 'Inter', sans-serif; font-size: 7.5pt; color: ${COLORS.offWhite};">AI Growth Engine</div>
        </div>
        <div style="width: 0.5pt; background: ${COLORS.rule};"></div>
        <div style="text-align: center;">
          <div style="font-family: 'Inter', sans-serif; font-size: 7pt; color: ${COLORS.gold}; text-transform: uppercase; letter-spacing: 1pt; margin-bottom: 3pt;">02</div>
          <div style="font-family: 'Inter', sans-serif; font-size: 7.5pt; color: ${COLORS.offWhite};">Employee Amplification</div>
        </div>
        <div style="width: 0.5pt; background: ${COLORS.rule};"></div>
        <div style="text-align: center;">
          <div style="font-family: 'Inter', sans-serif; font-size: 7pt; color: ${COLORS.gold}; text-transform: uppercase; letter-spacing: 1pt; margin-bottom: 3pt;">03</div>
          <div style="font-family: 'Inter', sans-serif; font-size: 7.5pt; color: ${COLORS.offWhite};">Secure AI Brain</div>
        </div>
      </div>

      <!-- CTA -->
      <a href="https://davidandgoliath.ai" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 10pt 30pt; background: ${COLORS.gold}; border-radius: 5pt; margin-bottom: 20pt; text-decoration: none;">
        <span style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 8.5pt; color: ${COLORS.white}; text-transform: uppercase; letter-spacing: 0.5pt;">Book an Intelligence Briefing</span>
      </a>

      <!-- Contact -->
      <div style="text-align: center;">
        <div style="font-family: 'Inter', sans-serif; font-size: 7.5pt; color: ${COLORS.midGrey}; margin-bottom: 3pt;">
          jmorrow@davidandgoliath.ai
        </div>
        <div style="font-family: 'Inter', sans-serif; font-size: 7.5pt; color: ${COLORS.midGrey};">
          davidandgoliath.ai
        </div>
      </div>
    </div>

    <!-- Edition footer -->
    <div style="position: absolute; bottom: 24pt; left: 38pt; right: 38pt; text-align: center; z-index: 2;">
      <div style="font-family: 'Inter', sans-serif; font-size: 6.5pt; color: ${COLORS.darkGrey};">
        Edition ${String(data.edition).padStart(2, '0')} | ${escapeHtml(data.month)} ${data.year}
      </div>
    </div>

  </div>
</body>
</html>`;
}
