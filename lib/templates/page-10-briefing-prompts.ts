import { BASE_STYLES, COLORS } from './shared/styles';
import { renderMagazineHeader, renderMagazineFooter, renderIconLabel, renderCard, renderCitationMark, buildCitations } from './shared/components';
import { escapeHtml } from '@/lib/utils/escape-html';
import type { BriefingPromptsPageData } from '@/lib/types/templates';
import type { ToolItem } from '@/lib/types/issue';

export type BriefingAndToolsPageData = BriefingPromptsPageData & {
  tools: ToolItem[];
};

export function renderBriefingAndTools(data: BriefingAndToolsPageData): string {
  const prompts = data.items.slice(0, 4);
  const tools = data.tools.slice(0, 4);
  const { marks, footer } = buildCitations(tools);

  const renderPromptCard = (item: { question: string; explanation: string }, idx: number): string => `
    <div style="background: ${COLORS.card}; border: 0.4pt solid ${COLORS.rule}; border-radius: 5pt; padding: 9pt 11pt; overflow: hidden; word-wrap: break-word; overflow-wrap: break-word;">
      <div style="display: flex; align-items: flex-start; gap: 7pt; margin-bottom: 4pt;">
        <div style="width: 16pt; height: 16pt; border-radius: 8pt; background: ${COLORS.card2}; border: 0.4pt solid ${COLORS.gold}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <span style="font-family: 'Inter', sans-serif; font-size: 6.5pt; font-weight: 700; color: ${COLORS.gold};">${idx + 1}</span>
        </div>
        <div style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 8pt; color: ${COLORS.white}; line-height: 1.3; flex: 1;">
          ${escapeHtml(item.question)}
        </div>
      </div>
      <p style="font-family: 'Inter', sans-serif; font-size: 6.5pt; color: ${COLORS.lightGrey}; line-height: 1.45; margin: 0; padding-left: 23pt;">
        ${escapeHtml(item.explanation)}
      </p>
    </div>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="page">
    ${renderMagazineHeader(16)}

    <div style="margin-top: 52pt;">
      ${renderIconLabel('briefing', 'Operator Briefing Prompts')}

      <h2 style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 16pt; color: ${COLORS.white}; line-height: 1.2; margin-bottom: 5pt;">
        Questions for Your Next Leadership Meeting
      </h2>
      <div style="width: 40pt; height: 2pt; background: ${COLORS.gold}; border-radius: 1pt; margin-bottom: 10pt;"></div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6pt; margin-bottom: 0;">
        ${prompts.map((item, idx) => renderPromptCard(item, idx)).join('')}
      </div>
    </div>

    <!-- Thin divider between sections -->
    <div style="width: 100%; height: 0.5pt; background: ${COLORS.gold}; opacity: 0.25; margin: 14pt 0;"></div>

    <div>
      ${renderIconLabel('tools', 'Tools Worth Watching')}

      <h2 style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 16pt; color: ${COLORS.white}; line-height: 1.2; margin-bottom: 5pt;">
        The Operator's Toolkit
      </h2>
      <div style="width: 40pt; height: 2pt; background: ${COLORS.gold}; border-radius: 1pt; margin-bottom: 10pt;"></div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6pt;">
        ${tools.map((item, idx) => {
          const citeMark = marks.has(idx) ? renderCitationMark(marks.get(idx)!) : '';
          return renderCard(`
          <div style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 8pt; color: ${COLORS.white}; margin-bottom: 2pt; line-height: 1.3;">
            ${escapeHtml(item.name)}${citeMark}
          </div>
          <div style="font-family: 'Inter', sans-serif; font-size: 5.5pt; color: ${COLORS.gold}; text-transform: uppercase; letter-spacing: 0.5pt; margin-bottom: 4pt;">
            ${escapeHtml(item.category)}
          </div>
          <p style="font-family: 'Inter', sans-serif; font-size: 6.5pt; color: ${COLORS.lightGrey}; line-height: 1.45; margin-bottom: 4pt;">
            ${escapeHtml(item.description)}
          </p>
          <div style="padding-top: 4pt; border-top: 0.4pt solid ${COLORS.rule};">
            <span style="font-family: 'Inter', sans-serif; font-size: 6pt; color: ${COLORS.midGrey}; font-style: italic;">
              ${escapeHtml(item.verdict)}
            </span>
          </div>
        `, { padding: '8pt 10pt', marginBottom: '0' });
        }).join('')}
      </div>
    </div>

    ${footer}
    ${renderMagazineFooter(16)}
  </div>
</body>
</html>`;
}
