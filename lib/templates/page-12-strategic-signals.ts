import { BASE_STYLES, COLORS } from './shared/styles';
import { renderMagazineHeader, renderMagazineFooter, renderIconLabel, renderSectionTitle, renderStrategicSignalBox, renderCitationMark, buildCitations } from './shared/components';
import type { StrategicSignalsPageData } from '@/lib/types/templates';

export function renderStrategicSignals(data: StrategicSignalsPageData): string {
  const items = data.items.slice(0, 4);
  const { marks, footer } = buildCitations(items);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="page">
    ${renderMagazineHeader(21)}

    <div style="margin-top: 52pt;">
      ${renderIconLabel('strategic-signals', 'Strategic Signals')}

      ${renderSectionTitle('Strategic Signals', 'Emerging patterns and weak signals worth monitoring.')}

      ${items.map((item, idx) => {
        const citeMark = marks.has(idx) ? renderCitationMark(marks.get(idx)!) : '';
        return renderStrategicSignalBox(item.signal, item.context, item.implication, citeMark);
      }).join('')}
    </div>

    ${footer}
    ${renderMagazineFooter(21)}
  </div>
</body>
</html>`;
}
