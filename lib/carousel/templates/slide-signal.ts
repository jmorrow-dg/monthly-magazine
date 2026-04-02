/**
 * Slide 2: The Signal
 *
 * Bold headline with one word highlighted in gold.
 * Short context body text below. All centred.
 */

import { CAROUSEL_COLORS, wrapSlide, escapeHtml, scale, scaleW } from './shared';

interface SignalSlideData {
  label: string;
  headline: string;
  highlightWord: string;
  body: string;
}

export function renderSignalSlide(
  data: SignalSlideData,
  width: number,
  height: number,
  showSwipeHint = true,
): string {
  const headlineHtml = formatHeadlineWithHighlight(
    data.headline,
    data.highlightWord,
  );

  const extraStyles = `
    .signal-content {
      position: absolute;
      top: 50%;
      left: ${scaleW(56, width)}px;
      right: ${scaleW(56, width)}px;
      transform: translateY(-55%);
      z-index: 2;
      text-align: center;
    }

    .signal-label {
      margin-bottom: ${scale(28, height)}px;
    }

    .signal-headline {
      font-size: ${scale(82, height)}px;
      margin-bottom: ${scale(36, height)}px;
      line-height: 1.0;
    }

    .signal-headline .gold {
      color: ${CAROUSEL_COLORS.gold};
    }

    .signal-body {
      margin: 0 auto;
      max-width: 85%;
      font-size: ${scale(24, height)}px;
      line-height: 1.5;
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

  const inner = `
    <div class="signal-content">
      <div class="gold-label signal-label">${escapeHtml(data.label)}</div>
      <div class="headline signal-headline">${headlineHtml}</div>
      <div class="body-text signal-body">${escapeHtml(data.body)}</div>
    </div>
    ${showSwipeHint ? `<div class="swipe-hint">
      <span>WHY THIS MATTERS</span>
      <div class="swipe-arrow">&rarr;</div>
    </div>` : ''}
  `;

  return wrapSlide(inner, width, height, extraStyles);
}

function formatHeadlineWithHighlight(headline: string, highlightWord: string): string {
  if (!highlightWord) return escapeHtml(headline);

  const escaped = escapeHtml(headline);
  const escapedWord = escapeHtml(highlightWord);
  const regex = new RegExp(`(${escapedWord})`, 'i');

  return escaped.replace(regex, `<span class="gold">$1</span>`);
}
