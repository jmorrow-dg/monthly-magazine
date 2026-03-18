import { BASE_STYLES, COLORS } from './shared/styles';
import { dgLogoDataUri } from './shared/assets';
import { escapeHtml } from '@/lib/utils/escape-html';
import type { SectionDividerPageData } from '@/lib/types/templates';

export function renderSectionDividerPage(data: SectionDividerPageData): string {
  const logoSrc = dgLogoDataUri();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="page" style="padding: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; overflow: hidden;">

    <!-- Radial ambient glow centred behind content -->
    <div style="position: absolute; inset: 0; background: radial-gradient(ellipse 70% 50% at 50% 50%, rgba(184,134,11,0.07) 0%, transparent 70%); pointer-events: none;"></div>

    <!-- Subtle horizontal rules at top/bottom thirds -->
    <div style="position: absolute; top: 72pt; left: 38pt; right: 38pt; height: 0.4pt; background: linear-gradient(to right, transparent, rgba(184,134,11,0.25), transparent);"></div>
    <div style="position: absolute; bottom: 72pt; left: 38pt; right: 38pt; height: 0.4pt; background: linear-gradient(to right, transparent, rgba(184,134,11,0.25), transparent);"></div>

    <!-- DG logo at top left -->
    <div style="position: absolute; top: 34pt; left: 38pt;">
      <img src="${logoSrc}" alt="DG" style="height: 20pt; width: 20pt; object-fit: contain; opacity: 0.7;" />
    </div>

    <!-- Centred content -->
    <div style="max-width: 340pt; width: 100%; display: flex; flex-direction: column; align-items: center; position: relative; z-index: 2;">

      <!-- Gold diamond ornament above -->
      <div style="display: flex; align-items: center; gap: 8pt; margin-bottom: 22pt;">
        <div style="width: 36pt; height: 1pt; background: ${COLORS.gold}; opacity: 0.6;"></div>
        <div style="width: 5pt; height: 5pt; background: ${COLORS.gold}; transform: rotate(45deg); opacity: 0.9;"></div>
        <div style="width: 36pt; height: 1pt; background: ${COLORS.gold}; opacity: 0.6;"></div>
      </div>

      ${data.subtitle ? `
      <div style="font-family: 'Inter', sans-serif; font-weight: 600; font-size: 6.5pt; color: ${COLORS.gold}; text-transform: uppercase; letter-spacing: 2.5pt; margin-bottom: 14pt;">
        ${escapeHtml(data.subtitle)}
      </div>
      ` : ''}

      <h1 style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 30pt; color: ${COLORS.white}; line-height: 1.15; margin: 0; letter-spacing: -0.3pt;">
        ${escapeHtml(data.title)}
      </h1>

      <!-- Gold diamond ornament below -->
      <div style="display: flex; align-items: center; gap: 8pt; margin-top: 22pt;">
        <div style="width: 36pt; height: 1pt; background: ${COLORS.gold}; opacity: 0.6;"></div>
        <div style="width: 5pt; height: 5pt; background: ${COLORS.gold}; transform: rotate(45deg); opacity: 0.9;"></div>
        <div style="width: 36pt; height: 1pt; background: ${COLORS.gold}; opacity: 0.6;"></div>
      </div>
    </div>

    <!-- Bottom: publication name -->
    <div style="position: absolute; bottom: 28pt; left: 0; right: 0; display: flex; justify-content: center;">
      <span style="font-family: 'Inter', sans-serif; font-size: 6pt; color: ${COLORS.darkGrey}; text-transform: uppercase; letter-spacing: 1.5pt;">
        David &amp; Goliath AI Intelligence Report
      </span>
    </div>

  </div>
</body>
</html>`;
}
