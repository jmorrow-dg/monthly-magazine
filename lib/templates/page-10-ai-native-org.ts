import { BASE_STYLES, COLORS } from './shared/styles';
import { renderMagazineHeader, renderMagazineFooter, renderIconLabel, renderCard } from './shared/components';
import { escapeHtml } from '@/lib/utils/escape-html';
import type { AiNativeOrgPageData } from '@/lib/types/templates';
import type { AiNativeOrgLayer } from '@/lib/types/issue';

const LAYER_META: Record<AiNativeOrgLayer, { label: string; color: string }> = {
  strategy:       { label: 'Strategy',       color: '#B8860B' },
  workflow:       { label: 'Workflow',        color: '#C49A1A' },
  agent:          { label: 'Agent',           color: '#D4A82A' },
  model:          { label: 'Model',           color: '#8B6914' },
  infrastructure: { label: 'Infrastructure',  color: '#6B5210' },
};

const LAYERS: AiNativeOrgLayer[] = ['strategy', 'workflow', 'agent', 'model', 'infrastructure'];

function renderFrameworkDiagram(focusLayer: AiNativeOrgLayer | null): string {
  return LAYERS.map((layer, idx) => {
    const meta = LAYER_META[layer];
    const isFocus = layer === focusLayer;
    const topRadius = idx === 0 ? 'border-radius: 4pt 4pt 0 0;' : '';
    const bottomRadius = idx === LAYERS.length - 1 ? 'border-radius: 0 0 4pt 4pt;' : '';
    const opacity = isFocus ? '1' : '0.5';
    const borderLeft = isFocus ? `border-left: 3pt solid ${meta.color};` : `border-left: 3pt solid transparent;`;
    const bg = isFocus ? `rgba(184,134,11,0.1)` : `rgba(34,34,34,0.6)`;

    return `
      <div style="display: flex; align-items: center; padding: 7pt 10pt; background: ${bg}; border-bottom: 0.4pt solid ${COLORS.rule}; ${topRadius} ${bottomRadius} ${borderLeft} opacity: ${opacity};">
        <div style="width: 8pt; height: 8pt; border-radius: 4pt; background: ${meta.color}; flex-shrink: 0; margin-right: 8pt;"></div>
        <span style="font-family: 'Inter', sans-serif; font-weight: ${isFocus ? '700' : '600'}; font-size: 7.5pt; color: ${isFocus ? COLORS.white : COLORS.lightGrey}; text-transform: uppercase; letter-spacing: 1pt;">
          ${meta.label}
        </span>
        ${isFocus ? `<span style="margin-left: auto; font-family: 'Inter', sans-serif; font-size: 6pt; font-weight: 700; color: ${COLORS.gold}; text-transform: uppercase; letter-spacing: 0.8pt;">In Focus</span>` : ''}
      </div>
    `;
  }).join('');
}

export function renderAiNativeOrg(data: AiNativeOrgPageData): string {
  const orgData = data.data;
  const focusLayer = orgData?.layer_in_focus ?? null;
  const focusLabel = focusLayer ? LAYER_META[focusLayer].label : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="page">
    ${renderMagazineHeader(10)}

    <div style="margin-top: 52pt;">
      ${renderIconLabel('ai-native-org', 'The AI Native Organisation')}

      <h2 style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 16pt; color: ${COLORS.white}; line-height: 1.2; margin-bottom: 6pt;">
        Five Layers of the AI Native Enterprise
      </h2>
      <p style="font-family: 'Inter', sans-serif; font-size: 7.5pt; color: ${COLORS.midGrey}; line-height: 1.45; margin-bottom: 6pt;">
        A recurring framework for understanding how organisations evolve toward AI native operations.
      </p>
      <div style="width: 40pt; height: 2pt; background: ${COLORS.gold}; border-radius: 1pt; margin-bottom: 14pt;"></div>

      <div style="display: flex; gap: 14pt;">
        <!-- Left column: Framework diagram + Layer in Focus -->
        <div style="flex: 1;">
          <div style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 6.5pt; color: ${COLORS.gold}; text-transform: uppercase; letter-spacing: 1pt; margin-bottom: 6pt;">
            Organisation Model
          </div>
          <div style="border: 0.4pt solid ${COLORS.rule}; border-radius: 4pt; overflow: hidden; margin-bottom: 12pt;">
            ${renderFrameworkDiagram(focusLayer)}
          </div>

          ${focusLayer && orgData?.layer_focus_text ? `
            <div style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 6.5pt; color: ${COLORS.gold}; text-transform: uppercase; letter-spacing: 1pt; margin-bottom: 6pt;">
              Layer in Focus: ${escapeHtml(focusLabel)}
            </div>
            ${renderCard(`
              <p style="font-family: 'Inter', sans-serif; font-size: 8pt; color: ${COLORS.lightGrey}; line-height: 1.6; margin: 0;">
                ${escapeHtml(orgData.layer_focus_text)}
              </p>
            `, { marginBottom: '0pt' })}
          ` : ''}
        </div>

        <!-- Right column: Signals This Month -->
        <div style="flex: 1;">
          <div style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 6.5pt; color: ${COLORS.gold}; text-transform: uppercase; letter-spacing: 1pt; margin-bottom: 6pt;">
            Signals This Month
          </div>

          ${orgData?.signals?.length ? orgData.signals.map((signal, idx) => renderCard(`
            <div style="display: flex; align-items: flex-start; gap: 8pt; margin-bottom: 6pt;">
              <div style="width: 16pt; height: 16pt; border-radius: 3pt; background: rgba(184,134,11,0.08); border: 0.4pt solid ${COLORS.gold}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <span style="font-family: 'Inter', sans-serif; font-size: 7pt; font-weight: 700; color: ${COLORS.gold};">${String(idx + 1).padStart(2, '0')}</span>
              </div>
              <div style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 9.5pt; color: ${COLORS.white}; line-height: 1.3; flex: 1;">
                ${escapeHtml(signal.headline)}
              </div>
            </div>
            <p style="font-family: 'Inter', sans-serif; font-size: 7.5pt; color: ${COLORS.lightGrey}; line-height: 1.6; margin: 0;">
              ${escapeHtml(signal.explanation)}
            </p>
          `, { marginBottom: '8pt' })).join('') : `
            <p style="font-family: 'Inter', sans-serif; font-size: 8pt; color: ${COLORS.midGrey}; line-height: 1.5;">
              Signal data will appear here once generated.
            </p>
          `}
        </div>
      </div>
    </div>

    ${renderMagazineFooter(10)}
  </div>
</body>
</html>`;
}
