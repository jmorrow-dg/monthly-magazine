import { BASE_STYLES, COLORS } from '../shared/styles';
import { renderMagazineHeader, renderMagazineFooter, renderIconLabel } from '../shared/components';
import { escapeHtml } from '@/lib/utils/escape-html';
import type { StrategicSignalItem, RegionalSignal } from '@/lib/types/issue';

export type WeeklyStrategicOutlookData = {
  signals: StrategicSignalItem[];
  regionalSignals?: RegionalSignal[];
};

export function renderWeeklyStrategicOutlook(data: WeeklyStrategicOutlookData): string {
  const signals = data.signals.slice(0, 3);
  const regional = data.regionalSignals?.slice(0, 3) || [];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="page">
    ${renderMagazineHeader(9)}

    <div style="margin-top: 52pt;">
      ${renderIconLabel('strategic-signals', 'Strategic Outlook')}

      <h2 style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 16pt; color: ${COLORS.white}; line-height: 1.2; margin-bottom: 5pt;">
        Signals to Watch Next Week
      </h2>
      <div style="width: 40pt; height: 2pt; background: ${COLORS.gold}; border-radius: 1pt; margin-bottom: 14pt;"></div>

      <!-- Forward-looking signals -->
      <div style="display: flex; flex-direction: column; gap: 8pt; margin-bottom: 18pt;">
        ${signals.map((item) => `
          <div style="background: ${COLORS.card}; border: 0.4pt solid ${COLORS.rule}; border-radius: 5pt; padding: 10pt 14pt;">
            <div style="display: flex; align-items: flex-start; gap: 8pt;">
              <div style="width: 3pt; height: 100%; min-height: 30pt; background: ${COLORS.gold}; border-radius: 1pt; flex-shrink: 0; opacity: 0.6;"></div>
              <div style="flex: 1;">
                <div style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 8.5pt; color: ${COLORS.white}; line-height: 1.3; margin-bottom: 4pt;">
                  ${escapeHtml(item.signal)}
                </div>
                <p style="font-family: 'Inter', sans-serif; font-size: 7pt; color: ${COLORS.lightGrey}; line-height: 1.45; margin-bottom: 4pt;">
                  ${escapeHtml(item.context)}
                </p>
                <div style="padding-top: 4pt; border-top: 0.4pt solid ${COLORS.rule};">
                  <span style="font-family: 'Inter', sans-serif; font-size: 6.5pt; color: ${COLORS.gold}; font-weight: 600;">Implication: </span>
                  <span style="font-family: 'Inter', sans-serif; font-size: 6.5pt; color: ${COLORS.midGrey};">${escapeHtml(item.implication)}</span>
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      ${regional.length > 0 ? `
      <!-- Divider -->
      <div style="width: 100%; height: 0.5pt; background: ${COLORS.gold}; opacity: 0.25; margin-bottom: 14pt;"></div>

      <!-- Regional Signals -->
      ${renderIconLabel('global', 'Regional Signals')}

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8pt; margin-top: 8pt;">
        ${regional.map((item) => `
          <div style="background: ${COLORS.card}; border: 0.4pt solid ${COLORS.rule}; border-radius: 5pt; padding: 10pt 12pt;">
            <div style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 8pt; color: ${COLORS.white}; margin-bottom: 6pt;">
              ${escapeHtml(item.region)}
            </div>
            <p style="font-family: 'Inter', sans-serif; font-size: 6.5pt; color: ${COLORS.lightGrey}; line-height: 1.45; margin: 0;">
              ${escapeHtml(item.signal)}
            </p>
          </div>
        `).join('')}
      </div>
      ` : ''}
    </div>

    ${renderMagazineFooter(9)}
  </div>
</body>
</html>`;
}
