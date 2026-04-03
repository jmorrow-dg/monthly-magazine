import { BASE_STYLES, COLORS } from '../shared/styles';
import { renderMagazineHeader, renderMagazineFooter, renderIconLabel, renderCitationMark, buildCitations } from '../shared/components';
import { escapeHtml } from '@/lib/utils/escape-html';

export type WeeklyLeadStoryData = {
  headline: string;
  subheadline?: string;
  body: string;
  pullQuote?: string;
  source_signal?: string;
};

export function renderWeeklyLeadStory(data: WeeklyLeadStoryData): string {
  const { marks, footer } = buildCitations(data.source_signal ? [{ source_signal: data.source_signal }] : []);
  const citeMark = marks.has(0) ? renderCitationMark(marks.get(0)!) : '';
  const paragraphs = data.body.split('\n').filter(p => p.trim());

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="page">
    ${renderMagazineHeader(3)}

    <div style="margin-top: 52pt;">
      ${renderIconLabel('cover-story', 'Lead Story')}

      <h2 style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 20pt; color: ${COLORS.white}; line-height: 1.15; margin-bottom: 6pt; letter-spacing: -0.2pt;">
        ${escapeHtml(data.headline)}${citeMark}
      </h2>

      ${data.subheadline ? `
      <p style="font-family: 'Inter', sans-serif; font-size: 9pt; color: ${COLORS.lightGrey}; line-height: 1.5; margin-bottom: 10pt; max-width: 380pt;">
        ${escapeHtml(data.subheadline)}
      </p>
      ` : ''}

      <div style="width: 40pt; height: 2pt; background: ${COLORS.gold}; border-radius: 1pt; margin-bottom: 16pt;"></div>

      <!-- Body text in two columns -->
      <div style="column-count: 2; column-gap: 18pt; column-rule: 0.4pt solid ${COLORS.rule};">
        ${paragraphs.map((p, i) => `
          <p style="font-family: 'Inter', sans-serif; font-size: 8pt; color: ${COLORS.lightGrey}; line-height: 1.55; margin-bottom: 10pt;${i === 0 ? ` text-indent: 0;` : ''}">
            ${i === 0 ? `<span style="font-family: 'Playfair Display', serif; font-size: 26pt; font-weight: 700; color: ${COLORS.gold}; float: left; line-height: 0.8; margin-right: 4pt; margin-top: 3pt;">${escapeHtml(p.charAt(0))}</span>${escapeHtml(p.slice(1))}` : escapeHtml(p)}
          </p>
        `).join('')}
      </div>

      ${data.pullQuote ? `
      <!-- Pull quote -->
      <div style="margin-top: 14pt; padding: 12pt 16pt; border-left: 2.5pt solid ${COLORS.gold}; background: rgba(184,134,11,0.04);">
        <p style="font-family: 'Playfair Display', serif; font-style: italic; font-size: 10pt; color: ${COLORS.white}; line-height: 1.45;">
          &ldquo;${escapeHtml(data.pullQuote)}&rdquo;
        </p>
      </div>
      ` : ''}
    </div>

    ${footer}
    ${renderMagazineFooter(3)}
  </div>
</body>
</html>`;
}
