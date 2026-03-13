import { BASE_STYLES, COLORS } from './shared/styles';
import { renderMagazineHeader, renderMagazineFooter, renderFigureCaption, renderKeyInsight } from './shared/components';

const STAGES = [
  {
    title: 'Experimentation',
    description: 'Pilots and proofs of concept. Individual teams testing tools.',
    opacity: 0.12,
  },
  {
    title: 'Workflow Augmentation',
    description: 'AI embedded into existing processes. Copilots and assistants.',
    opacity: 0.2,
  },
  {
    title: 'AI-Assisted Operations',
    description: 'AI drives decisions with human oversight. Scaled deployment.',
    opacity: 0.3,
  },
  {
    title: 'Autonomous Systems',
    description: 'AI operates independently within defined boundaries.',
    opacity: 0.4,
  },
  {
    title: 'AI-Native Organisation',
    description: 'AI is the default. Humans govern, machines execute.',
    opacity: 0.5,
  },
];

export function renderAdoptionCurve(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="page">
    ${renderMagazineHeader(11)}

    <div style="margin-top: 52pt;">
      ${renderFigureCaption(1, 'The AI Adoption Curve', 'Where most organisations sit today, and where leaders are heading.')}

      <h2 style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 20pt; color: ${COLORS.white}; line-height: 1.2; margin-bottom: 6pt;">
        The AI Adoption Curve
      </h2>
      <div style="width: 40pt; height: 2pt; background: ${COLORS.gold}; border-radius: 1pt; margin-bottom: 28pt;"></div>

      <!-- Stage blocks -->
      <div style="display: flex; gap: 6pt; margin-bottom: 20pt;">
        ${STAGES.map((stage, i) => {
          const isMarker = i === 1;
          const height = 60 + i * 22;
          return `
            <div style="flex: 1; display: flex; flex-direction: column; justify-content: flex-end;">
              <div style="position: relative; height: ${height}pt; background: rgba(184,134,11,${stage.opacity}); border: 0.4pt solid rgba(184,134,11,${stage.opacity + 0.15}); border-radius: 4pt; padding: 8pt 6pt; display: flex; flex-direction: column; justify-content: flex-end;">
                ${isMarker ? `
                  <div style="position: absolute; top: -14pt; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 3pt;">
                    <div style="width: 6pt; height: 6pt; border-radius: 50%; background: ${COLORS.gold};"></div>
                    <span style="font-family: 'Inter', sans-serif; font-size: 5.5pt; color: ${COLORS.gold}; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3pt; white-space: nowrap;">
                      Market centre
                    </span>
                  </div>
                ` : ''}
                <div style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 7pt; color: ${COLORS.white}; margin-bottom: 2pt; line-height: 1.3;">
                  ${stage.title}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Connecting arrow -->
      <div style="display: flex; align-items: center; margin-bottom: 24pt; padding: 0 4pt;">
        <div style="flex: 1; height: 0.5pt; background: ${COLORS.gold}; opacity: 0.4;"></div>
        <svg width="10" height="8" viewBox="0 0 10 8" style="flex-shrink: 0; margin-left: 2pt;">
          <path d="M0 4 L8 4 M5 1 L8 4 L5 7" stroke="${COLORS.gold}" stroke-width="0.8" fill="none" opacity="0.6"/>
        </svg>
      </div>

      <!-- Stage descriptions -->
      <div style="display: flex; gap: 6pt;">
        ${STAGES.map((stage, i) => `
          <div style="flex: 1;">
            <div style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 6pt; color: ${COLORS.gold}; margin-bottom: 3pt; text-transform: uppercase; letter-spacing: 0.5pt;">
              Stage ${String(i + 1).padStart(2, '0')}
            </div>
            <div style="font-family: 'Inter', sans-serif; font-size: 6.5pt; color: ${COLORS.lightGrey}; line-height: 1.45;">
              ${stage.description}
            </div>
          </div>
        `).join('')}
      </div>

      <div style="margin-top: 28pt;">
        ${renderKeyInsight(
          'The gap is widening',
          'Most organisations remain in Stage 2, augmenting existing workflows with AI tools. Leaders are already operating at Stage 3, using AI to drive decisions with human oversight. The gap between these groups is widening each quarter.'
        )}
      </div>
    </div>

    ${renderMagazineFooter(11)}
  </div>
</body>
</html>`;
}
