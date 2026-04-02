/**
 * Slide 4: Personal Photo + Narrative
 *
 * Full-bleed personal photo with dark gradient overlay
 * and first-person text connecting the news to the DG journey.
 */

import { CAROUSEL_COLORS, escapeHtml, scale, scaleW } from './shared';
import { getEmbeddedFontCSS } from './fonts';
import { dgLogoDataUri } from '@/lib/templates/shared/assets';

interface PersonalSlideData {
  photoUrl: string;
  text: string;
  angle: string;
}

export function renderPersonalSlide(
  data: PersonalSlideData,
  width: number,
  height: number,
): string {
  const logo = dgLogoDataUri();

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    ${getEmbeddedFontCSS()}

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      width: ${width}px;
      height: ${height}px;
      overflow: hidden;
      font-family: 'Inter', sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    .slide {
      width: ${width}px;
      height: ${height}px;
      position: relative;
      overflow: hidden;
    }

    .bg-photo {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .gradient-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 65%;
      background: linear-gradient(
        to top,
        rgba(20, 20, 20, 0.95) 0%,
        rgba(20, 20, 20, 0.8) 35%,
        rgba(20, 20, 20, 0) 100%
      );
    }

    .content {
      position: absolute;
      bottom: ${scale(56, height)}px;
      left: ${scaleW(48, width)}px;
      right: ${scaleW(48, width)}px;
      z-index: 2;
    }

    .gold-line {
      width: ${scaleW(48, width)}px;
      height: 3px;
      background: ${CAROUSEL_COLORS.gold};
      margin-bottom: ${scale(20, height)}px;
    }

    .personal-text {
      font-family: 'Inter', sans-serif;
      font-size: ${scale(23, height)}px;
      line-height: 1.6;
      color: ${CAROUSEL_COLORS.white};
      font-weight: 400;
      max-width: 92%;
    }

    .personal-text strong {
      font-weight: 700;
      color: ${CAROUSEL_COLORS.gold};
    }

    /* gold-bar removed */

    .logo {
      position: absolute;
      top: 32px;
      right: 32px;
      width: 48px;
      height: 48px;
      opacity: 0.6;
      z-index: 2;
    }
  </style>
</head>
<body>
  <div class="slide">
    <img class="bg-photo" src="${escapeHtml(data.photoUrl)}" alt="" />
    <div class="gradient-overlay"></div>
    <img class="logo" src="${logo}" alt="" />
    <div class="content">
      <div class="gold-line"></div>
      <div class="personal-text">${escapeHtml(data.text)}</div>
    </div>
    <!-- gold-bar removed -->
  </div>
</body>
</html>`;
}
