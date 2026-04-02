/**
 * Slide 3: Why It Matters
 *
 * Strategic insight with 3 bullet points. All centred.
 */

import { CAROUSEL_COLORS, wrapSlide, escapeHtml, scale, scaleW } from './shared';

interface InsightSlideData {
  label: string;
  headline: string;
  bullets: string[];
}

export function renderInsightSlide(
  data: InsightSlideData,
  width: number,
  height: number,
  showSwipeHint = true,
): string {
  const extraStyles = `
    .insight-content {
      position: absolute;
      top: 50%;
      left: ${scaleW(56, width)}px;
      right: ${scaleW(56, width)}px;
      transform: translateY(-55%);
      z-index: 2;
      text-align: center;
    }

    .insight-label {
      margin-bottom: ${scale(28, height)}px;
    }

    .insight-headline {
      font-size: ${scale(64, height)}px;
      margin-bottom: ${scale(40, height)}px;
      line-height: 1.05;
    }

    .bullets {
      display: flex;
      flex-direction: column;
      gap: ${scale(24, height)}px;
      max-width: 92%;
      margin: 0 auto;
      text-align: left;
    }

    .bullet {
      display: flex;
      align-items: flex-start;
      gap: ${scale(18, height)}px;
    }

    .bullet-marker {
      flex-shrink: 0;
      width: ${scale(10, height)}px;
      height: ${scale(10, height)}px;
      border-radius: 50%;
      background: ${CAROUSEL_COLORS.gold};
      margin-top: ${scale(12, height)}px;
    }

    .bullet-text {
      font-family: 'Inter', sans-serif;
      font-size: ${scale(24, height)}px;
      line-height: 1.5;
      color: rgba(255,255,255,0.75);
    }

    .swipe-hint {
      position: absolute;
      bottom: ${scale(48, height)}px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: ${scale(14, height)}px;
      color: ${CAROUSEL_COLORS.white};
      font-size: ${scale(16, height)}px;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .swipe-arrow {
      width: ${scale(44, height)}px;
      height: ${scale(44, height)}px;
      border: 2px solid rgba(255,255,255,0.5);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${scale(20, height)}px;
      color: ${CAROUSEL_COLORS.white};
    }
  `;

  const bulletsHtml = data.bullets
    .map(
      (b) => `
      <div class="bullet">
        <div class="bullet-marker"></div>
        <div class="bullet-text">${escapeHtml(b)}</div>
      </div>
    `,
    )
    .join('');

  const inner = `
    <div class="insight-content">
      <div class="gold-label insight-label">${escapeHtml(data.label)}</div>
      <div class="headline insight-headline">${escapeHtml(data.headline)}</div>
      <div class="bullets">
        ${bulletsHtml}
      </div>
    </div>
    ${showSwipeHint ? `<div class="swipe-hint">
      <span>THE JOURNEY</span>
      <div class="swipe-arrow">&rarr;</div>
    </div>` : ''}
  `;

  return wrapSlide(inner, width, height, extraStyles);
}
