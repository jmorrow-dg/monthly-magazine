import { BASE_STYLES, COLORS } from './shared/styles';
import { renderMagazineHeader, renderMagazineFooter, renderIconLabel } from './shared/components';
import { escapeHtml } from '@/lib/utils/escape-html';
import type { BriefingPromptsPageData } from '@/lib/types/templates';

export function renderBriefingPrompts(data: BriefingPromptsPageData): string {
  const items = data.items.slice(0, 6);

  // Split into two columns: first 3 left, last 3 right
  const leftItems = items.slice(0, 3);
  const rightItems = items.slice(3, 6);

  const renderPromptCard = (item: { question: string; explanation: string }, idx: number): string => `
    <div style="background: ${COLORS.card}; border: 0.4pt solid ${COLORS.rule}; border-radius: 5pt; padding: 12pt 14pt; margin-bottom: 8pt; overflow: hidden; word-wrap: break-word; overflow-wrap: break-word;">
      <div style="display: flex; align-items: flex-start; gap: 8pt; margin-bottom: 6pt;">
        <div style="width: 18pt; height: 18pt; border-radius: 9pt; background: ${COLORS.card2}; border: 0.4pt solid ${COLORS.gold}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <span style="font-family: 'Inter', sans-serif; font-size: 7pt; font-weight: 700; color: ${COLORS.gold};">${idx + 1}</span>
        </div>
        <div style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 9pt; color: ${COLORS.white}; line-height: 1.35; flex: 1;">
          ${escapeHtml(item.question)}
        </div>
      </div>
      <p style="font-family: 'Inter', sans-serif; font-size: 7.5pt; color: ${COLORS.lightGrey}; line-height: 1.55; margin: 0; padding-left: 26pt;">
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

      <h2 style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 18pt; color: ${COLORS.white}; line-height: 1.2; margin-bottom: 6pt;">
        Questions for Your Next Leadership Meeting
      </h2>
      <div style="width: 40pt; height: 2pt; background: ${COLORS.gold}; border-radius: 1pt; margin-bottom: 14pt;"></div>

      <div style="display: flex; gap: 12pt;">
        <div style="flex: 1;">
          ${leftItems.map((item, idx) => renderPromptCard(item, idx)).join('')}
        </div>
        <div style="flex: 1;">
          ${rightItems.map((item, idx) => renderPromptCard(item, idx + 3)).join('')}
        </div>
      </div>
    </div>

    ${renderMagazineFooter(16)}
  </div>
</body>
</html>`;
}
