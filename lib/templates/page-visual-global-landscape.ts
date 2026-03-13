import { BASE_STYLES, COLORS } from './shared/styles';
import { renderMagazineHeader, renderMagazineFooter, renderFigureCaption } from './shared/components';
import { escapeHtml } from '@/lib/utils/escape-html';

export type GlobalLandscapeRegion = {
  name: string;
  signals: string[];
};

export type GlobalLandscapePageData = {
  regions?: GlobalLandscapeRegion[];
};

const DEFAULT_REGIONS: GlobalLandscapeRegion[] = [
  {
    name: 'North America',
    signals: [
      'Enterprise copilots entering production at scale',
      'Agentic AI frameworks gaining enterprise traction',
      'Hyperscaler AI infrastructure investment accelerating',
    ],
  },
  {
    name: 'Europe',
    signals: [
      'AI Act enforcement shaping compliance strategies',
      'Sovereign AI initiatives driving local model development',
      'Enterprise adoption accelerating in financial services',
    ],
  },
  {
    name: 'Asia',
    signals: [
      'Large-scale AI infrastructure build-outs underway',
      'Open-source model ecosystem expanding rapidly',
      'Manufacturing and logistics AI adoption leading globally',
    ],
  },
  {
    name: 'Global Networks',
    signals: [
      'Cross-border AI governance frameworks emerging',
      'Cloud-native AI platforms enabling global deployment',
      'Talent mobility reshaping AI capability distribution',
    ],
  },
];

export function renderGlobalLandscape(data?: GlobalLandscapePageData): string {
  const REGIONS = data?.regions?.length ? data.regions : DEFAULT_REGIONS;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="page">
    ${renderMagazineHeader(4)}

    <div style="margin-top: 52pt;">
      ${renderFigureCaption(0, 'Global AI Landscape', 'Key regions shaping AI development and adoption.')}

      <h2 style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 20pt; color: ${COLORS.white}; line-height: 1.2; margin-bottom: 6pt;">
        Global AI Landscape
      </h2>
      <div style="width: 40pt; height: 2pt; background: ${COLORS.gold}; border-radius: 1pt; margin-bottom: 24pt;"></div>

      <!-- Region grid: 2x2 -->
      <div style="display: flex; flex-wrap: wrap; gap: 10pt;">
        ${REGIONS.map((region, idx) => {
          const isGlobal = idx === 3;
          return `
            <div style="width: calc(50% - 5pt); padding: 14pt 16pt; background: ${isGlobal ? 'rgba(184,134,11,0.06)' : COLORS.card}; border: 0.4pt solid ${isGlobal ? 'rgba(184,134,11,0.25)' : COLORS.rule}; border-radius: 5pt;">
              <div style="display: flex; align-items: center; gap: 6pt; margin-bottom: 10pt;">
                <div style="width: 3pt; height: 16pt; background: ${COLORS.gold}; border-radius: 1pt; opacity: ${isGlobal ? '1' : '0.5'};"></div>
                <div style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 9pt; color: ${COLORS.white}; line-height: 1.3;">
                  ${escapeHtml(region.name)}
                </div>
              </div>
              ${region.signals.map((signal) => `
                <div style="display: flex; align-items: flex-start; margin-bottom: 6pt;">
                  <span style="display: inline-block; width: 3pt; height: 3pt; background: ${COLORS.gold}; border-radius: 50%; margin-right: 6pt; margin-top: 4pt; flex-shrink: 0;"></span>
                  <span style="font-family: 'Inter', sans-serif; font-size: 7.5pt; color: ${COLORS.lightGrey}; line-height: 1.45;">
                    ${escapeHtml(signal)}
                  </span>
                </div>
              `).join('')}
            </div>
          `;
        }).join('')}
      </div>

      <!-- Bottom context bar -->
      <div style="margin-top: 16pt; padding: 10pt 14pt; border-top: 0.4pt solid ${COLORS.rule}; display: flex; justify-content: space-between; align-items: center;">
        <div style="font-family: 'Inter', sans-serif; font-size: 7pt; color: ${COLORS.midGrey}; line-height: 1.4; max-width: 320pt;">
          Signals sourced from AI labs, enterprise technology companies, infrastructure providers, and regulatory bodies across all major markets.
        </div>
        <div style="display: flex; gap: 8pt; flex-shrink: 0;">
          <div style="display: flex; align-items: center; gap: 3pt;">
            <div style="width: 6pt; height: 6pt; border-radius: 50%; background: ${COLORS.gold}; opacity: 0.5;"></div>
            <span style="font-family: 'Inter', sans-serif; font-size: 6pt; color: ${COLORS.midGrey}; text-transform: uppercase; letter-spacing: 0.3pt;">Regional</span>
          </div>
          <div style="display: flex; align-items: center; gap: 3pt;">
            <div style="width: 6pt; height: 6pt; border-radius: 50%; background: ${COLORS.gold};"></div>
            <span style="font-family: 'Inter', sans-serif; font-size: 6pt; color: ${COLORS.midGrey}; text-transform: uppercase; letter-spacing: 0.3pt;">Global</span>
          </div>
        </div>
      </div>
    </div>

    ${renderMagazineFooter(4)}
  </div>
</body>
</html>`;
}
