import { COLORS } from './styles';
import { dgLogoDataUri } from './assets';
import { escapeHtml } from '@/lib/utils/escape-html';

/**
 * Magazine header with DG logo and page number.
 * Used on pages 2-7.
 */
export function renderMagazineHeader(pageNumber: number): string {
  return `
    <div style="position: absolute; top: 28pt; left: 38pt; right: 38pt; height: 28pt; display: flex; justify-content: space-between; align-items: center;">
      <img src="${dgLogoDataUri()}" alt="DG" style="height: 22pt; width: 22pt; object-fit: contain;" />
      <span style="font-family: 'Inter', sans-serif; font-size: 7pt; color: ${COLORS.midGrey}; letter-spacing: 0.5pt;">${pageNumber}</span>
    </div>
  `;
}

/**
 * Magazine footer with publication name and gold accent.
 * Used on pages 2-7.
 */
export function renderMagazineFooter(pageNumber: number): string {
  return `
    <div style="position: absolute; bottom: 22pt; left: 38pt; right: 38pt; display: flex; justify-content: space-between; align-items: center;">
      <span style="font-family: 'Inter', sans-serif; font-size: 6.5pt; color: ${COLORS.darkGrey}; letter-spacing: 0.3pt;">The David &amp; Goliath AI Intelligence Report</span>
      <div style="display: flex; align-items: center; gap: 10pt;">
        <span style="font-family: 'Inter', sans-serif; font-size: 6.5pt; color: ${COLORS.darkGrey};">${pageNumber}</span>
        <div style="width: 36pt; height: 2pt; background: ${COLORS.gold}; border-radius: 1pt;"></div>
      </div>
    </div>
  `;
}

/**
 * Gold uppercase section label.
 */
export function renderSectionLabel(label: string): string {
  return `
    <div style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 7pt; color: ${COLORS.gold}; text-transform: uppercase; letter-spacing: 1.5pt; margin-bottom: 10pt;">
      ${escapeHtml(label)}
    </div>
  `;
}

/**
 * Section title with gold accent bar.
 */
export function renderSectionTitle(title: string, subtitle?: string): string {
  return `
    <div style="margin-bottom: 16pt;">
      <h2 style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 18pt; color: ${COLORS.white}; line-height: 1.2; margin: 0;">
        ${escapeHtml(title)}
      </h2>
      <div style="width: 40pt; height: 2pt; background: ${COLORS.gold}; border-radius: 1pt; margin-top: 8pt;"></div>
      ${subtitle ? `<p style="font-family: 'Inter', sans-serif; font-size: 8pt; color: ${COLORS.midGrey}; margin-top: 8pt; line-height: 1.45;">${escapeHtml(subtitle)}</p>` : ''}
    </div>
  `;
}

/**
 * Article/content card with border.
 */
export function renderCard(content: string, opts?: { bg?: string; padding?: string; marginBottom?: string }): string {
  const bg = opts?.bg || COLORS.card;
  const padding = opts?.padding || '12pt 14pt';
  const mb = opts?.marginBottom || '8pt';
  return `
    <div style="background: ${bg}; border: 0.4pt solid ${COLORS.rule}; border-radius: 5pt; padding: ${padding}; margin-bottom: ${mb}; overflow: hidden; word-wrap: break-word; overflow-wrap: break-word;">
      ${content}
    </div>
  `;
}

/**
 * Gold horizontal divider.
 */
export function renderGoldDivider(width: string = '100%'): string {
  return `<div style="width: ${width}; height: 0.5pt; background: ${COLORS.gold}; opacity: 0.3; margin: 10pt 0;"></div>`;
}

/**
 * Significance/impact badge.
 */
export function renderBadge(label: string, color?: string): string {
  const c = color || COLORS.gold;
  return `
    <div style="display: inline-block; padding: 2pt 8pt; border-radius: 3pt; position: relative;">
      <div style="position: absolute; inset: 0; background: ${c}; opacity: 0.12; border-radius: 3pt;"></div>
      <div style="position: absolute; inset: 0; border: 0.4pt solid ${c}; opacity: 0.3; border-radius: 3pt;"></div>
      <span style="font-family: 'Inter', sans-serif; font-weight: 600; font-size: 6pt; color: ${c}; text-transform: uppercase; letter-spacing: 0.5pt; position: relative; z-index: 1;">${escapeHtml(label)}</span>
    </div>
  `;
}

/**
 * Gold square bullet point.
 */
export function goldBullet(): string {
  return `<span style="display: inline-block; width: 3pt; height: 3pt; background: ${COLORS.gold}; margin-right: 7pt; flex-shrink: 0; margin-top: 5pt;"></span>`;
}
