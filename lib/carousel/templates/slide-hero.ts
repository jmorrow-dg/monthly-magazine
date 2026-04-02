/**
 * Slide 1: Hero Image
 *
 * Full-bleed AI-generated image with category label,
 * headline overlay, and gold accent bar.
 */

import { dgLogoDataUri } from '@/lib/templates/shared/assets';
import { CAROUSEL_COLORS, escapeHtml, scale, scaleW } from './shared';
import { getEmbeddedFontCSS } from './fonts';

interface HeroSlideData {
  imageUrl: string;
  category: string;
  headline: string;
}

export function renderHeroSlide(
  data: HeroSlideData,
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

    .bg-image {
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
      height: 60%;
      background: linear-gradient(
        to top,
        rgba(20, 20, 20, 0.95) 0%,
        rgba(20, 20, 20, 0.7) 40%,
        rgba(20, 20, 20, 0) 100%
      );
    }

    .content {
      position: absolute;
      bottom: ${scale(48, height)}px;
      left: ${scaleW(48, width)}px;
      right: ${scaleW(48, width)}px;
      z-index: 2;
    }

    .category {
      color: ${CAROUSEL_COLORS.gold};
      font-size: ${scale(14, height)}px;
      font-weight: 600;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      margin-bottom: ${scale(16, height)}px;
    }

    .headline {
      font-family: 'Playfair Display', serif;
      font-weight: 900;
      font-size: ${scale(64, height)}px;
      line-height: 1.05;
      color: ${CAROUSEL_COLORS.white};
      max-width: 90%;
    }

    .logo {
      position: absolute;
      top: ${scale(32, height)}px;
      right: ${scaleW(32, width)}px;
      width: ${scale(56, height)}px;
      height: ${scale(56, height)}px;
      opacity: 0.8;
      z-index: 2;
    }
  </style>
</head>
<body>
  <div class="slide">
    <img class="bg-image" src="${escapeHtml(data.imageUrl)}" alt="" />
    <div class="gradient-overlay"></div>
    <img class="logo" src="${logo}" alt="" />
    <div class="content">
      <div class="category">${escapeHtml(data.category)}</div>
      <div class="headline">${escapeHtml(data.headline)}</div>
    </div>
  </div>
</body>
</html>`;
}
