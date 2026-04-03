import { BASE_STYLES, COLORS } from '../shared/styles';
import { renderMagazineHeader, renderMagazineFooter } from '../shared/components';
import { escapeHtml } from '@/lib/utils/escape-html';

export type WeeklyContentsEditorialData = {
  editorial: string;
  weekRange: string;
  edition: number;
};

const WEEKLY_SECTIONS = [
  { page: 3, label: 'Lead Story', desc: "This week's most significant development" },
  { page: 4, label: 'Key Signals', desc: 'Top signals from the past 7 days' },
  { page: 5, label: 'Strategic Implications', desc: 'What this means for operators' },
  { page: 6, label: 'Enterprise + Industry', desc: 'Adoption patterns and sector trends' },
  { page: 7, label: 'Executive Briefing', desc: 'Key takeaways for leadership' },
  { page: 8, label: "Operator's Toolkit", desc: 'Playbook, tools, and prompts' },
  { page: 9, label: 'Strategic Outlook', desc: 'Regional signals and forward look' },
];

export function renderWeeklyContentsEditorial(data: WeeklyContentsEditorialData): string {
  const editorialParagraphs = data.editorial.split('\n').filter(p => p.trim());

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="page">
    ${renderMagazineHeader(2)}

    <div style="margin-top: 52pt;">
      <!-- Week label -->
      <div style="font-family: 'Inter', sans-serif; font-weight: 600; font-size: 6.5pt; color: ${COLORS.gold}; text-transform: uppercase; letter-spacing: 2pt; margin-bottom: 6pt;">
        This Week
      </div>
      <h2 style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 18pt; color: ${COLORS.white}; line-height: 1.2; margin-bottom: 4pt;">
        ${escapeHtml(data.weekRange)}
      </h2>
      <div style="width: 40pt; height: 2pt; background: ${COLORS.gold}; border-radius: 1pt; margin-bottom: 16pt;"></div>

      <!-- Contents -->
      <div style="margin-bottom: 20pt;">
        ${WEEKLY_SECTIONS.map((section) => `
          <div style="display: flex; align-items: baseline; padding: 6pt 0; border-bottom: 0.4pt solid ${COLORS.rule};">
            <span style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 7pt; color: ${COLORS.gold}; width: 18pt; flex-shrink: 0;">${String(section.page).padStart(2, '0')}</span>
            <div style="flex: 1;">
              <span style="font-family: 'Inter', sans-serif; font-weight: 600; font-size: 8pt; color: ${COLORS.white};">${escapeHtml(section.label)}</span>
              <span style="font-family: 'Inter', sans-serif; font-size: 7pt; color: ${COLORS.midGrey}; margin-left: 8pt;">${escapeHtml(section.desc)}</span>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Gold divider -->
      <div style="width: 100%; height: 0.5pt; background: ${COLORS.gold}; opacity: 0.25; margin-bottom: 16pt;"></div>

      <!-- Editorial Note -->
      <div style="font-family: 'Inter', sans-serif; font-weight: 600; font-size: 6.5pt; color: ${COLORS.gold}; text-transform: uppercase; letter-spacing: 2pt; margin-bottom: 8pt;">
        From the Editor
      </div>

      <div style="max-width: 360pt;">
        ${editorialParagraphs.map(p => `
          <p style="font-family: 'Inter', sans-serif; font-size: 8pt; color: ${COLORS.lightGrey}; line-height: 1.55; margin-bottom: 8pt;">
            ${escapeHtml(p)}
          </p>
        `).join('')}
      </div>

      <!-- Signature -->
      <div style="margin-top: 12pt;">
        <div style="font-family: 'Playfair Display', serif; font-style: italic; font-size: 10pt; color: ${COLORS.white}; margin-bottom: 2pt;">Josh Morrow</div>
        <div style="font-family: 'Inter', sans-serif; font-size: 6.5pt; color: ${COLORS.midGrey};">Editor, David &amp; Goliath AI Intelligence</div>
      </div>
    </div>

    ${renderMagazineFooter(2)}
  </div>
</body>
</html>`;
}
