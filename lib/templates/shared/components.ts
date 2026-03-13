import { COLORS } from './styles';
import { dgLogoDataUri } from './assets';
import { escapeHtml } from '@/lib/utils/escape-html';
import { getIcon } from './icons';

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

/**
 * Two-column text layout using CSS columns.
 * Splits text paragraphs across two balanced columns.
 */
export function renderColumnText(text: string): string {
  const paragraphs = text.split(/\n\n+/).filter(Boolean);
  const html = paragraphs
    .map(p => `<p style="font-family: 'Inter', sans-serif; font-size: 8.5pt; color: ${COLORS.lightGrey}; line-height: 1.65; margin-bottom: 8pt;">${escapeHtml(p)}</p>`)
    .join('');

  return `
    <div style="columns: 2; column-gap: 16pt; orphans: 3; widows: 3;">
      ${html}
    </div>
  `;
}

/**
 * Full-width pull quote spanning both columns.
 * Gold left border, italic Playfair Display.
 */
export function renderPullQuote(quote: string): string {
  return `
    <div style="column-span: all; margin: 14pt 0; padding: 12pt 16pt; border-left: 3pt solid ${COLORS.gold}; background: rgba(184,134,11,0.04);">
      <p style="font-family: 'Playfair Display', serif; font-style: italic; font-size: 11pt; color: ${COLORS.offWhite}; line-height: 1.55; margin: 0;">
        &ldquo;${escapeHtml(quote)}&rdquo;
      </p>
    </div>
  `;
}

/**
 * Operator Lens callout box.
 */
export function renderOperatorLens(audience: string, text: string): string {
  return renderCard(`
    <div style="display: flex; align-items: center; gap: 6pt; margin-bottom: 6pt;">
      <span style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 6.5pt; color: ${COLORS.gold}; text-transform: uppercase; letter-spacing: 1pt;">Operator Lens</span>
      <span style="font-family: 'Inter', sans-serif; font-size: 6.5pt; color: ${COLORS.midGrey};">&middot;</span>
      <span style="font-family: 'Inter', sans-serif; font-weight: 600; font-size: 7pt; color: ${COLORS.white};">${escapeHtml(audience)}</span>
    </div>
    <p style="font-family: 'Inter', sans-serif; font-size: 8pt; color: ${COLORS.lightGrey}; line-height: 1.55; margin: 0;">
      ${escapeHtml(text)}
    </p>
  `, { bg: COLORS.card2, padding: '10pt 12pt' });
}

/**
 * Industry Watch callout box.
 */
export function renderIndustryWatchBox(industry: string, text: string): string {
  return renderCard(`
    <div style="display: flex; align-items: center; gap: 6pt; margin-bottom: 6pt;">
      <span style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 6.5pt; color: #3B82F6; text-transform: uppercase; letter-spacing: 1pt;">Industry Watch</span>
      <span style="font-family: 'Inter', sans-serif; font-size: 6.5pt; color: ${COLORS.midGrey};">&middot;</span>
      <span style="font-family: 'Inter', sans-serif; font-weight: 600; font-size: 7pt; color: ${COLORS.white};">${escapeHtml(industry)}</span>
    </div>
    <p style="font-family: 'Inter', sans-serif; font-size: 8pt; color: ${COLORS.lightGrey}; line-height: 1.55; margin: 0;">
      ${escapeHtml(text)}
    </p>
  `, { bg: COLORS.card2, padding: '10pt 12pt' });
}

/**
 * Strategic Signal callout card.
 */
export function renderStrategicSignalBox(signal: string, context: string, implication: string): string {
  return renderCard(`
    <div style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 6.5pt; color: ${COLORS.gold}; text-transform: uppercase; letter-spacing: 1pt; margin-bottom: 6pt;">
      Strategic Signal
    </div>
    <div style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 9.5pt; color: ${COLORS.white}; line-height: 1.3; margin-bottom: 6pt;">
      ${escapeHtml(signal)}
    </div>
    <p style="font-family: 'Inter', sans-serif; font-size: 8pt; color: ${COLORS.lightGrey}; line-height: 1.55; margin-bottom: 6pt;">
      ${escapeHtml(context)}
    </p>
    <div style="padding-top: 6pt; border-top: 0.4pt solid ${COLORS.rule};">
      <p style="font-family: 'Inter', sans-serif; font-size: 8pt; color: ${COLORS.gold}; font-weight: 600; line-height: 1.5; margin: 0;">
        ${escapeHtml(implication)}
      </p>
    </div>
  `, { marginBottom: '7pt' });
}

/**
 * Section divider treatment (gold label with subtle background).
 */
export function renderSectionDivider(label: string): string {
  return `
    <div style="margin-bottom: 14pt; padding-bottom: 10pt; border-bottom: 0.5pt solid ${COLORS.rule};">
      <div style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 7pt; color: ${COLORS.gold}; text-transform: uppercase; letter-spacing: 2pt;">
        ${escapeHtml(label)}
      </div>
    </div>
  `;
}

/**
 * Section label with inline icon.
 * Replaces renderSectionLabel on pages that have section icons.
 */
export function renderIconLabel(iconKey: string, label: string): string {
  const icon = getIcon(iconKey);
  return `
    <div style="display: flex; align-items: center; gap: 6pt; margin-bottom: 10pt;">
      ${icon}
      <span style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 7pt; color: ${COLORS.gold}; text-transform: uppercase; letter-spacing: 1.5pt;">
        ${escapeHtml(label)}
      </span>
    </div>
  `;
}

/**
 * Figure caption block for diagrams and charts.
 * Gold figure number, off-white title, optional grey explanation.
 */
export function renderFigureCaption(figureNumber: number, title: string, explanation?: string): string {
  const num = String(figureNumber).padStart(2, '0');
  return `
    <div style="margin-bottom: 10pt;">
      <div style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 6.5pt; color: ${COLORS.gold}; text-transform: uppercase; letter-spacing: 1pt; margin-bottom: 3pt;">
        Figure ${num}
      </div>
      <div style="font-family: 'Inter', sans-serif; font-size: 8pt; color: ${COLORS.offWhite}; line-height: 1.4;">
        ${escapeHtml(title)}
      </div>
      ${explanation ? `<div style="font-family: 'Inter', sans-serif; font-size: 7.5pt; color: ${COLORS.lightGrey}; line-height: 1.4; margin-top: 2pt;">${escapeHtml(explanation)}</div>` : ''}
    </div>
  `;
}

/**
 * Strategic pull quote: center-aligned, large editorial type.
 * Used sparingly (max 3 per issue) to highlight key strategic insights.
 */
export function renderStrategicPullQuote(quote: string): string {
  return `
    <div style="margin: 16pt auto; max-width: 360pt; text-align: center; padding: 14pt 0;">
      <div style="width: 20pt; height: 1.5pt; background: ${COLORS.gold}; margin: 0 auto 12pt;"></div>
      <p style="font-family: 'Playfair Display', serif; font-style: italic; font-weight: 500; font-size: 12pt; color: ${COLORS.offWhite}; line-height: 1.45; margin: 0;">
        &ldquo;${escapeHtml(quote)}&rdquo;
      </p>
      <div style="width: 20pt; height: 1.5pt; background: ${COLORS.gold}; margin: 12pt auto 0;"></div>
    </div>
  `;
}
