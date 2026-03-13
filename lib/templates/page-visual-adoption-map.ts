import { BASE_STYLES, COLORS } from './shared/styles';
import { renderMagazineHeader, renderMagazineFooter, renderFigureCaption } from './shared/components';

const DOMAINS = [
  { name: 'Customer Support Automation', percentage: 78, stage: 'Mainstream' },
  { name: 'Software Development Copilots', percentage: 64, stage: 'Growing' },
  { name: 'Marketing Automation', percentage: 52, stage: 'Growing' },
  { name: 'Sales Intelligence', percentage: 38, stage: 'Early' },
  { name: 'Operational Forecasting', percentage: 31, stage: 'Early' },
  { name: 'Strategic Decision Support', percentage: 18, stage: 'Emerging' },
];

const STAGE_COLORS: Record<string, string> = {
  Mainstream: COLORS.gold,
  Growing: '#C49A1A',
  Early: COLORS.goldDark,
  Emerging: COLORS.darkGrey,
};

export function renderAdoptionMap(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="page">
    ${renderMagazineHeader(15)}

    <div style="margin-top: 52pt;">
      ${renderFigureCaption(3, 'Where AI Is Landing First', 'Enterprise adoption strength by operational domain.')}

      <h2 style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 20pt; color: ${COLORS.white}; line-height: 1.2; margin-bottom: 6pt;">
        Enterprise Adoption Signals
      </h2>
      <div style="width: 40pt; height: 2pt; background: ${COLORS.gold}; border-radius: 1pt; margin-bottom: 28pt;"></div>

      <!-- Bar chart -->
      <div style="margin-bottom: 24pt;">
        ${DOMAINS.map((domain) => {
          const stageColor = STAGE_COLORS[domain.stage] || COLORS.midGrey;
          return `
            <div style="margin-bottom: 14pt;">
              <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4pt;">
                <div style="font-family: 'Inter', sans-serif; font-weight: 600; font-size: 8pt; color: ${COLORS.offWhite}; line-height: 1.3;">
                  ${domain.name}
                </div>
                <div style="display: flex; align-items: center; gap: 6pt;">
                  <span style="font-family: 'Inter', sans-serif; font-size: 6pt; color: ${stageColor}; text-transform: uppercase; letter-spacing: 0.3pt; font-weight: 600;">
                    ${domain.stage}
                  </span>
                  <span style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 9pt; color: ${COLORS.gold};">
                    ${domain.percentage}%
                  </span>
                </div>
              </div>
              <div style="width: 100%; height: 6pt; background: ${COLORS.card2}; border-radius: 3pt; overflow: hidden;">
                <div style="width: ${domain.percentage}%; height: 100%; background: linear-gradient(90deg, rgba(184,134,11,0.3), rgba(184,134,11,0.7)); border-radius: 3pt;"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Legend -->
      <div style="display: flex; gap: 16pt; padding: 10pt 0; border-top: 0.4pt solid ${COLORS.rule}; margin-bottom: 16pt;">
        ${Object.entries(STAGE_COLORS).map(([stage, color]) => `
          <div style="display: flex; align-items: center; gap: 4pt;">
            <div style="width: 6pt; height: 6pt; border-radius: 50%; background: ${color};"></div>
            <span style="font-family: 'Inter', sans-serif; font-size: 6.5pt; color: ${COLORS.midGrey}; text-transform: uppercase; letter-spacing: 0.3pt;">
              ${stage}
            </span>
          </div>
        `).join('')}
      </div>

      <!-- Insight cards -->
      <div style="display: flex; gap: 10pt;">
        <div style="flex: 1; padding: 10pt 12pt; background: ${COLORS.card}; border: 0.4pt solid ${COLORS.rule}; border-radius: 5pt;">
          <div style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 6.5pt; color: ${COLORS.gold}; text-transform: uppercase; letter-spacing: 1pt; margin-bottom: 4pt;">
            Fastest Growing
          </div>
          <p style="font-family: 'Inter', sans-serif; font-size: 7pt; color: ${COLORS.lightGrey}; line-height: 1.5; margin: 0;">
            Software development copilots saw the largest quarter-on-quarter increase, driven by enterprise rollouts of coding assistants.
          </p>
        </div>
        <div style="flex: 1; padding: 10pt 12pt; background: ${COLORS.card}; border: 0.4pt solid ${COLORS.rule}; border-radius: 5pt;">
          <div style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 6.5pt; color: ${COLORS.gold}; text-transform: uppercase; letter-spacing: 1pt; margin-bottom: 4pt;">
            Watch This Space
          </div>
          <p style="font-family: 'Inter', sans-serif; font-size: 7pt; color: ${COLORS.lightGrey}; line-height: 1.5; margin: 0;">
            Strategic decision support remains early but is attracting significant C-suite attention as agentic systems mature.
          </p>
        </div>
      </div>
    </div>

    ${renderMagazineFooter(15)}
  </div>
</body>
</html>`;
}
