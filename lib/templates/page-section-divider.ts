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
  <div class="page" style="padding: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">

    <!-- DG logo at top -->
    <div style="position: absolute; top: 38pt; left: 38pt;">
      <img src="${logoSrc}" alt="DG" style="height: 22pt; width: 22pt; object-fit: contain;" />
    </div>

    <!-- Centred content -->
    <div style="max-width: 360pt; width: 100%; display: flex; flex-direction: column; align-items: center;">
      <div style="width: 50pt; height: 2pt; background: ${COLORS.gold}; border-radius: 1pt; margin-bottom: 20pt;"></div>
      <h1 style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 26pt; color: ${COLORS.white}; line-height: 1.2; margin: 0;">
        ${escapeHtml(data.title)}
      </h1>
      ${data.subtitle ? `
      <p style="font-family: 'Inter', sans-serif; font-size: 9pt; color: ${COLORS.midGrey}; line-height: 1.55; margin-top: 14pt;">
        ${escapeHtml(data.subtitle)}
      </p>
      ` : ''}
      <div style="width: 50pt; height: 2pt; background: ${COLORS.gold}; border-radius: 1pt; margin-top: 20pt;"></div>
    </div>

    <!-- Bottom accent -->
    <div style="position: absolute; bottom: 28pt; left: 0; right: 0; display: flex; justify-content: center;">
      <div style="width: 36pt; height: 2pt; background: ${COLORS.gold}; border-radius: 1pt; opacity: 0.4;"></div>
    </div>

  </div>
</body>
</html>`;
}
