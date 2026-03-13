import { BASE_STYLES, COLORS } from './shared/styles';
import { renderMagazineHeader, renderMagazineFooter, renderIconLabel, renderSectionTitle, renderStrategicSignalBox } from './shared/components';
import type { StrategicSignalsPageData } from '@/lib/types/templates';

export function renderStrategicSignals(data: StrategicSignalsPageData): string {
  const items = data.items.slice(0, 5);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="page">
    ${renderMagazineHeader(18)}

    <div style="margin-top: 52pt;">
      ${renderIconLabel('strategic-signals', 'Strategic Signals')}

      ${renderSectionTitle('Strategic Signals', 'Emerging patterns and weak signals worth monitoring.')}

      ${items.map((item) => renderStrategicSignalBox(item.signal, item.context, item.implication)).join('')}
    </div>

    ${renderMagazineFooter(18)}
  </div>
</body>
</html>`;
}
