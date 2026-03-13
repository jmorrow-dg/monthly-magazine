import { BASE_STYLES, COLORS } from './shared/styles';
import { renderMagazineHeader, renderMagazineFooter, renderFigureCaption, renderKeyInsight } from './shared/components';

const STAGES = [
  {
    number: '01',
    title: 'Tool Experimentation',
    description: 'Individual teams trial AI tools. No coordinated strategy. Learning by doing.',
    marker: false,
  },
  {
    number: '02',
    title: 'Team Augmentation',
    description: 'AI tools embedded into team workflows. Productivity gains measured. Champions emerge.',
    marker: true,
  },
  {
    number: '03',
    title: 'Workflow Redesign',
    description: 'Processes rebuilt around AI capabilities. Cross-functional deployment. Governance established.',
    marker: false,
  },
  {
    number: '04',
    title: 'AI-Embedded Operations',
    description: 'AI operates autonomously within guardrails. Humans oversee and govern. Scale achieved.',
    marker: false,
  },
  {
    number: '05',
    title: 'AI-Native Organisation',
    description: 'AI is the default operating layer. Structure, strategy, and culture shaped by AI capabilities.',
    marker: false,
  },
];

export function renderTransformationPathway(): string {
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
      ${renderFigureCaption(4, 'The Transformation Pathway', 'Five stages from experimentation to AI-native operations.')}

      <h2 style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 20pt; color: ${COLORS.white}; line-height: 1.2; margin-bottom: 6pt;">
        The Transformation Pathway
      </h2>
      <div style="width: 40pt; height: 2pt; background: ${COLORS.gold}; border-radius: 1pt; margin-bottom: 28pt;"></div>

      <!-- Timeline -->
      <div style="position: relative; padding-left: 40pt;">
        <!-- Vertical connecting line -->
        <div style="position: absolute; left: 14pt; top: 12pt; bottom: 12pt; width: 1pt; background: linear-gradient(180deg, rgba(184,134,11,0.15), rgba(184,134,11,0.5));"></div>

        ${STAGES.map((stage, i) => {
          const isLast = i === STAGES.length - 1;
          const circleSize = stage.marker ? '28pt' : '24pt';
          const circleBorder = stage.marker ? `2pt solid ${COLORS.gold}` : `0.4pt solid rgba(184,134,11,0.4)`;
          const circleBg = stage.marker ? 'rgba(184,134,11,0.15)' : COLORS.card2;
          const leftOffset = stage.marker ? '1pt' : '3pt';

          return `
            <div style="display: flex; align-items: flex-start; margin-bottom: ${isLast ? '0' : '16pt'}; position: relative;">
              <!-- Number circle -->
              <div style="position: absolute; left: -${leftOffset}; width: ${circleSize}; height: ${circleSize}; border-radius: 50%; background: ${circleBg}; border: ${circleBorder}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; z-index: 1; margin-left: -26pt;">
                <span style="font-family: 'Inter', sans-serif; font-size: 7pt; font-weight: 700; color: ${stage.marker ? COLORS.gold : COLORS.midGrey};">
                  ${stage.number}
                </span>
              </div>

              <!-- Content -->
              <div style="flex: 1; padding: 2pt 0;">
                <div style="display: flex; align-items: center; gap: 6pt; margin-bottom: 4pt;">
                  <div style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 9.5pt; color: ${stage.marker ? COLORS.white : COLORS.offWhite}; line-height: 1.3;">
                    ${stage.title}
                  </div>
                  ${stage.marker ? `
                    <div style="padding: 1.5pt 6pt; background: rgba(184,134,11,0.12); border: 0.4pt solid rgba(184,134,11,0.3); border-radius: 2pt;">
                      <span style="font-family: 'Inter', sans-serif; font-size: 5.5pt; color: ${COLORS.gold}; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5pt;">
                        Most organisations
                      </span>
                    </div>
                  ` : ''}
                </div>
                <p style="font-family: 'Inter', sans-serif; font-size: 8pt; color: ${COLORS.lightGrey}; line-height: 1.55; margin: 0; max-width: 340pt;">
                  ${stage.description}
                </p>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div style="margin-top: 24pt;">
        ${renderKeyInsight(
          'From Stage 2 to Stage 3',
          'The playbooks in this section are designed to move your organisation from Stage 2 to Stage 3. Each play targets a specific capability gap that prevents teams from progressing beyond augmentation into true workflow redesign.'
        )}
      </div>
    </div>

    ${renderMagazineFooter(21)}
  </div>
</body>
</html>`;
}
