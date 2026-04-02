/**
 * Shared carousel template constants and utilities.
 * Mirrors the magazine design system but optimised for social media slides.
 */

import { dgLogoDataUri } from '@/lib/templates/shared/assets';
import { escapeHtml } from '@/lib/utils/escape-html';
import { getEmbeddedFontCSS } from './fonts';

export { escapeHtml };

/**
 * Reference canvas dimensions (LinkedIn/Instagram portrait).
 * All font sizes are authored for this size and scaled proportionally.
 */
const REF_WIDTH = 1080;
const REF_HEIGHT = 1350;

/**
 * Scale a pixel value relative to reference canvas height.
 * E.g. scale(82, 675) = ~41 (X landscape is half the height).
 * E.g. scale(82, 1920) = ~117 (TikTok is taller, text scales up).
 */
export function scale(px: number, height: number): number {
  return Math.round(px * height / REF_HEIGHT);
}

/**
 * Scale based on width for horizontal spacing.
 */
export function scaleW(px: number, width: number): number {
  return Math.round(px * width / REF_WIDTH);
}

export const CAROUSEL_COLORS = {
  bg: '#141414',
  card: '#1C1C1C',
  gold: '#B8860B',
  goldDark: '#8B6914',
  white: '#FFFFFF',
  whiteSubtle: 'rgba(255,255,255,0.6)',
  whiteMuted: 'rgba(255,255,255,0.4)',
  rule: '#333333',
} as const;

/**
 * Base CSS for all carousel slides.
 * Loads Playfair Display (headings) and Inter (body).
 */
export function carouselBaseStyles(width: number, height: number): string {
  return `
    ${getEmbeddedFontCSS()}

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      width: ${width}px;
      height: ${height}px;
      overflow: hidden;
      background: ${CAROUSEL_COLORS.bg};
      font-family: 'Inter', sans-serif;
      color: ${CAROUSEL_COLORS.white};
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .slide {
      width: ${width}px;
      height: ${height}px;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .gold-label {
      color: ${CAROUSEL_COLORS.gold};
      font-family: 'Inter', sans-serif;
      font-size: ${scale(14, height)}px;
      font-weight: 600;
      letter-spacing: 0.2em;
      text-transform: uppercase;
    }

    .headline {
      font-family: 'Playfair Display', serif;
      font-weight: 900;
      color: ${CAROUSEL_COLORS.white};
      line-height: 1.05;
    }

    .body-text {
      font-family: 'Inter', sans-serif;
      color: ${CAROUSEL_COLORS.whiteSubtle};
      font-size: ${scale(22, height)}px;
      line-height: 1.5;
      font-weight: 400;
    }

    .gold-accent {
      color: ${CAROUSEL_COLORS.gold};
    }

    /* gold-bar removed */

    .grid-texture {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0.03;
      background-image:
        linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px);
      background-size: 40px 40px;
      pointer-events: none;
    }

    .logo-watermark {
      position: absolute;
      bottom: ${scale(24, height)}px;
      right: ${scaleW(24, width)}px;
      width: ${scale(48, height)}px;
      height: ${scale(48, height)}px;
      opacity: 0.2;
    }
  `;
}

/**
 * Wrap slide content in a full HTML document.
 */
export function wrapSlide(
  innerHtml: string,
  width: number,
  height: number,
  extraStyles = '',
): string {
  const logo = dgLogoDataUri();

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>${carouselBaseStyles(width, height)}${extraStyles}</style>
</head>
<body>
  <div class="slide">
    <div class="grid-texture"></div>
    ${innerHtml}
    <img class="logo-watermark" src="${logo}" alt="" />
  </div>
</body>
</html>`;
}
