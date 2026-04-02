/**
 * Slide 5: Personal Brand Closer
 *
 * Always uses a headshot photo with dark gradient overlay.
 * Personal brand: Josh Morrow, @joshbuildswithai, Oxford/MIT credentials.
 * Rotating CTA. DG logo.
 */

import { CAROUSEL_COLORS, escapeHtml, scale, scaleW } from './shared';
import { getEmbeddedFontCSS } from './fonts';
import { dgLogoDataUri } from '@/lib/templates/shared/assets';
import type { CTAVariant } from '../types';

interface CloserSlideData {
  ctaVariant: CTAVariant;
  ctaText: string;
  photoUrl: string;
}

export function renderCloserSlide(
  data: CloserSlideData,
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
      object-position: center top;
    }

    .gradient-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        to bottom,
        rgba(20, 20, 20, 0.15) 0%,
        rgba(20, 20, 20, 0.3) 35%,
        rgba(20, 20, 20, 0.7) 60%,
        rgba(20, 20, 20, 0.95) 80%,
        rgba(20, 20, 20, 1) 100%
      );
    }

    .logo {
      position: absolute;
      top: ${scale(32, height)}px;
      right: ${scaleW(32, width)}px;
      width: ${scale(48, height)}px;
      height: ${scale(48, height)}px;
      opacity: 0.7;
      z-index: 2;
    }

    .content {
      position: absolute;
      bottom: ${scale(56, height)}px;
      left: ${scaleW(56, width)}px;
      right: ${scaleW(56, width)}px;
      z-index: 2;
    }

    .gold-line {
      width: ${scaleW(48, width)}px;
      height: 3px;
      background: ${CAROUSEL_COLORS.gold};
      margin-bottom: ${scale(20, height)}px;
    }

    .name {
      font-family: 'Playfair Display', serif;
      font-weight: 900;
      font-size: ${scale(44, height)}px;
      color: ${CAROUSEL_COLORS.white};
      line-height: 1.15;
      margin-bottom: ${scale(6, height)}px;
    }

    .handle {
      font-family: 'Inter', sans-serif;
      font-size: ${scale(18, height)}px;
      color: ${CAROUSEL_COLORS.gold};
      font-weight: 600;
      margin-bottom: ${scale(14, height)}px;
    }

    .credentials {
      font-family: 'Inter', sans-serif;
      font-size: ${scale(16, height)}px;
      color: rgba(255,255,255,0.55);
      font-weight: 400;
      margin-bottom: ${scale(24, height)}px;
      line-height: 1.4;
    }

    .cta-box {
      background: rgba(184, 134, 11, 0.12);
      border: 1px solid rgba(184, 134, 11, 0.25);
      border-radius: ${scale(8, height)}px;
      padding: ${scale(16, height)}px ${scaleW(20, width)}px;
    }

    .cta-text {
      font-family: 'Inter', sans-serif;
      font-size: ${scale(19, height)}px;
      line-height: 1.45;
      color: rgba(255,255,255,0.9);
      font-weight: 500;
    }

    /* gold-bar removed */
  </style>
</head>
<body>
  <div class="slide">
    <img class="bg-photo" src="${escapeHtml(data.photoUrl)}" alt="" />
    <div class="gradient-overlay"></div>
    <img class="logo" src="${logo}" alt="" />
    <div class="content">
      <div class="gold-line"></div>
      <div class="name">Josh Morrow.</div>
      <div class="handle">@joshbuildswithai</div>
      <div class="credentials">AI Programmes at Oxford &amp; MIT. Building from Bali. Operator, not a guru.</div>
      <div class="cta-box">
        <div class="cta-text">${escapeHtml(data.ctaText)}</div>
      </div>
    </div>
    <!-- gold-bar removed -->
  </div>
</body>
</html>`;
}
