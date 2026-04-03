import { BASE_STYLES, COLORS } from '../shared/styles';
import { renderMagazineHeader, renderMagazineFooter, renderIconLabel, renderCard, goldBullet, renderCitationMark, buildCitations } from '../shared/components';
import { escapeHtml } from '@/lib/utils/escape-html';
import type { PlaybookItem, ToolItem, BriefingPromptItem } from '@/lib/types/issue';

export type WeeklyOperatorsToolkitData = {
  playbook: PlaybookItem | null;
  tools: ToolItem[];
  prompts: BriefingPromptItem[];
};

export function renderWeeklyOperatorsToolkit(data: WeeklyOperatorsToolkitData): string {
  const tools = data.tools.slice(0, 2);
  const prompts = data.prompts.slice(0, 2);
  const { marks, footer } = buildCitations(tools);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="page">
    ${renderMagazineHeader(8)}

    <div style="margin-top: 52pt;">
      ${renderIconLabel('playbook', "Operator's Toolkit")}

      <h2 style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 16pt; color: ${COLORS.white}; line-height: 1.2; margin-bottom: 5pt;">
        Practical Plays, Tools &amp; Prompts
      </h2>
      <div style="width: 40pt; height: 2pt; background: ${COLORS.gold}; border-radius: 1pt; margin-bottom: 12pt;"></div>

      <!-- Playbook -->
      ${data.playbook ? `
      <div style="background: ${COLORS.card}; border: 0.4pt solid ${COLORS.rule}; border-radius: 5pt; padding: 10pt 12pt; margin-bottom: 10pt;">
        <div style="font-family: 'Inter', sans-serif; font-weight: 600; font-size: 5.5pt; color: ${COLORS.gold}; text-transform: uppercase; letter-spacing: 1.5pt; margin-bottom: 4pt;">
          Play of the Week
        </div>
        <div style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 9pt; color: ${COLORS.white}; line-height: 1.3; margin-bottom: 4pt;">
          ${escapeHtml(data.playbook.title)}
        </div>
        <p style="font-family: 'Inter', sans-serif; font-size: 7pt; color: ${COLORS.midGrey}; line-height: 1.4; margin-bottom: 6pt; font-style: italic;">
          ${escapeHtml(data.playbook.context)}
        </p>
        <div style="margin-bottom: 6pt;">
          ${data.playbook.steps.map((step, i) => `
            <div style="display: flex; align-items: flex-start; margin-bottom: 3pt;">
              <div style="width: 12pt; height: 12pt; border-radius: 6pt; background: ${COLORS.card2}; border: 0.4pt solid ${COLORS.gold}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 6pt; margin-top: 1pt;">
                <span style="font-family: 'Inter', sans-serif; font-size: 5.5pt; font-weight: 700; color: ${COLORS.gold};">${i + 1}</span>
              </div>
              <span style="font-family: 'Inter', sans-serif; font-size: 7pt; color: ${COLORS.lightGrey}; line-height: 1.45;">${escapeHtml(step)}</span>
            </div>
          `).join('')}
        </div>
        <div style="padding-top: 4pt; border-top: 0.4pt solid ${COLORS.rule}; display: flex; align-items: flex-start;">
          ${goldBullet()}
          <span style="font-family: 'Inter', sans-serif; font-size: 6.5pt; color: ${COLORS.gold}; font-weight: 600;">
            Outcome: ${escapeHtml(data.playbook.outcome)}
          </span>
        </div>
      </div>
      ` : ''}

      <!-- Divider -->
      <div style="width: 100%; height: 0.5pt; background: ${COLORS.gold}; opacity: 0.25; margin-bottom: 10pt;"></div>

      <!-- Tools (2 side by side) -->
      <div style="font-family: 'Inter', sans-serif; font-weight: 600; font-size: 5.5pt; color: ${COLORS.gold}; text-transform: uppercase; letter-spacing: 1.5pt; margin-bottom: 6pt;">
        Tools Worth Watching
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6pt; margin-bottom: 10pt;">
        ${tools.map((item, idx) => {
          const citeMark = marks.has(idx) ? renderCitationMark(marks.get(idx)!) : '';
          return renderCard(`
            <div style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 8pt; color: ${COLORS.white}; margin-bottom: 2pt; line-height: 1.3;">
              ${escapeHtml(item.name)}${citeMark}
            </div>
            <div style="font-family: 'Inter', sans-serif; font-size: 5pt; color: ${COLORS.gold}; text-transform: uppercase; letter-spacing: 0.5pt; margin-bottom: 3pt;">
              ${escapeHtml(item.category)}
            </div>
            <p style="font-family: 'Inter', sans-serif; font-size: 6.5pt; color: ${COLORS.lightGrey}; line-height: 1.45; margin-bottom: 3pt;">
              ${escapeHtml(item.description)}
            </p>
            <div style="padding-top: 3pt; border-top: 0.4pt solid ${COLORS.rule};">
              <span style="font-family: 'Inter', sans-serif; font-size: 5.5pt; color: ${COLORS.midGrey}; font-style: italic;">${escapeHtml(item.verdict)}</span>
            </div>
          `, { padding: '8pt 10pt', marginBottom: '0' });
        }).join('')}
      </div>

      <!-- Divider -->
      <div style="width: 100%; height: 0.5pt; background: ${COLORS.gold}; opacity: 0.25; margin-bottom: 10pt;"></div>

      <!-- Briefing Prompts (2 side by side) -->
      <div style="font-family: 'Inter', sans-serif; font-weight: 600; font-size: 5.5pt; color: ${COLORS.gold}; text-transform: uppercase; letter-spacing: 1.5pt; margin-bottom: 6pt;">
        Briefing Prompts
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6pt;">
        ${prompts.map((item, idx) => `
          <div style="background: ${COLORS.card}; border: 0.4pt solid ${COLORS.rule}; border-radius: 5pt; padding: 8pt 10pt;">
            <div style="display: flex; align-items: flex-start; gap: 6pt; margin-bottom: 3pt;">
              <div style="width: 14pt; height: 14pt; border-radius: 7pt; background: ${COLORS.card2}; border: 0.4pt solid ${COLORS.gold}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <span style="font-family: 'Inter', sans-serif; font-size: 6pt; font-weight: 700; color: ${COLORS.gold};">${idx + 1}</span>
              </div>
              <div style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 7.5pt; color: ${COLORS.white}; line-height: 1.3; flex: 1;">
                ${escapeHtml(item.question)}
              </div>
            </div>
            <p style="font-family: 'Inter', sans-serif; font-size: 6pt; color: ${COLORS.lightGrey}; line-height: 1.45; margin: 0; padding-left: 20pt;">
              ${escapeHtml(item.explanation)}
            </p>
          </div>
        `).join('')}
      </div>
    </div>

    ${footer}
    ${renderMagazineFooter(8)}
  </div>
</body>
</html>`;
}
