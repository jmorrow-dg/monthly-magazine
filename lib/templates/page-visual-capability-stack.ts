import { BASE_STYLES, COLORS } from './shared/styles';
import { renderMagazineHeader, renderMagazineFooter, renderFigureCaption } from './shared/components';

const LAYERS = [
  {
    name: 'Decision Layer',
    description: 'Strategic choices informed by AI analysis. Human governance and oversight.',
    width: '60%',
    color: COLORS.gold,
    focused: false,
  },
  {
    name: 'Workflow Layer',
    description: 'End-to-end processes redesigned around AI capabilities.',
    width: '70%',
    color: COLORS.gold,
    focused: false,
  },
  {
    name: 'Agent Layer',
    description: 'Autonomous agents executing tasks, coordinating actions, and learning.',
    width: '80%',
    color: COLORS.gold,
    focused: true,
  },
  {
    name: 'Model Layer',
    description: 'Foundation models, fine-tuned models, and retrieval-augmented systems.',
    width: '90%',
    color: COLORS.gold,
    focused: false,
  },
  {
    name: 'Infrastructure Layer',
    description: 'Compute, data pipelines, security, and deployment architecture.',
    width: '100%',
    color: COLORS.gold,
    focused: false,
  },
];

export function renderCapabilityStack(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="page">
    ${renderMagazineHeader(13)}

    <div style="margin-top: 52pt;">
      ${renderFigureCaption(2, 'The AI Capability Stack', 'Five layers required to build an AI-native organisation.')}

      <h2 style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 20pt; color: ${COLORS.white}; line-height: 1.2; margin-bottom: 6pt;">
        The AI Capability Stack
      </h2>
      <div style="width: 40pt; height: 2pt; background: ${COLORS.gold}; border-radius: 1pt; margin-bottom: 28pt;"></div>

      <!-- Stack diagram -->
      <div style="display: flex; flex-direction: column; align-items: center; gap: 4pt; margin-bottom: 24pt;">
        ${LAYERS.map((layer) => {
          const bgOpacity = layer.focused ? 0.15 : 0.06;
          const borderOpacity = layer.focused ? 0.5 : 0.2;
          const borderWidth = layer.focused ? '1pt' : '0.4pt';
          return `
            <div style="width: ${layer.width}; padding: 12pt 14pt; background: rgba(184,134,11,${bgOpacity}); border: ${borderWidth} solid rgba(184,134,11,${borderOpacity}); border-radius: 4pt; display: flex; justify-content: space-between; align-items: center; position: relative;">
              ${layer.focused ? `
                <div style="position: absolute; top: -1pt; right: 12pt; transform: translateY(-100%); font-family: 'Inter', sans-serif; font-size: 5.5pt; color: ${COLORS.gold}; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5pt; padding: 2pt 6pt; background: rgba(184,134,11,0.12); border: 0.4pt solid rgba(184,134,11,0.3); border-radius: 2pt;">
                  In Focus
                </div>
              ` : ''}
              <div style="display: flex; align-items: center; gap: 8pt;">
                ${layer.focused ? `<div style="width: 3pt; height: 18pt; background: ${COLORS.gold}; border-radius: 1pt;"></div>` : ''}
                <div style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 8.5pt; color: ${layer.focused ? COLORS.white : COLORS.offWhite}; line-height: 1.3;">
                  ${layer.name}
                </div>
              </div>
              <div style="font-family: 'Inter', sans-serif; font-size: 7pt; color: ${COLORS.lightGrey}; max-width: 220pt; text-align: right; line-height: 1.4;">
                ${layer.description}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Reading guide -->
      <div style="display: flex; gap: 12pt; padding-top: 16pt; border-top: 0.4pt solid ${COLORS.rule};">
        <div style="flex: 1; padding: 10pt 12pt; background: ${COLORS.card}; border: 0.4pt solid ${COLORS.rule}; border-radius: 5pt;">
          <div style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 6.5pt; color: ${COLORS.gold}; text-transform: uppercase; letter-spacing: 1pt; margin-bottom: 4pt;">
            Read Bottom Up
          </div>
          <p style="font-family: 'Inter', sans-serif; font-size: 7pt; color: ${COLORS.lightGrey}; line-height: 1.5; margin: 0;">
            Infrastructure enables models. Models power agents. Agents execute workflows. Workflows inform decisions.
          </p>
        </div>
        <div style="flex: 1; padding: 10pt 12pt; background: ${COLORS.card}; border: 0.4pt solid ${COLORS.rule}; border-radius: 5pt;">
          <div style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 6.5pt; color: ${COLORS.gold}; text-transform: uppercase; letter-spacing: 1pt; margin-bottom: 4pt;">
            Current Focus
          </div>
          <p style="font-family: 'Inter', sans-serif; font-size: 7pt; color: ${COLORS.lightGrey}; line-height: 1.5; margin: 0;">
            The Agent Layer is where most enterprise investment is concentrated this quarter. Agentic systems are reshaping how organisations deploy AI.
          </p>
        </div>
      </div>
    </div>

    ${renderMagazineFooter(13)}
  </div>
</body>
</html>`;
}
