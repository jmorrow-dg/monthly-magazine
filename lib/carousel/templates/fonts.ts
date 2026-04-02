/**
 * Local font embedding for carousel slide rendering.
 *
 * Embeds Playfair Display and Inter as base64 @font-face declarations.
 * Eliminates external HTTP calls to Google Fonts during Puppeteer renders,
 * making rendering faster and more reliable.
 */

import fs from 'fs';
import path from 'path';

interface FontDef {
  family: string;
  weight: number;
  file: string;
}

const FONTS: FontDef[] = [
  { family: 'Inter', weight: 400, file: 'Inter-400.ttf' },
  { family: 'Inter', weight: 500, file: 'Inter-500.ttf' },
  { family: 'Inter', weight: 600, file: 'Inter-600.ttf' },
  { family: 'Inter', weight: 700, file: 'Inter-700.ttf' },
  { family: 'Playfair Display', weight: 700, file: 'PlayfairDisplay-700.ttf' },
  { family: 'Playfair Display', weight: 800, file: 'PlayfairDisplay-800.ttf' },
  { family: 'Playfair Display', weight: 900, file: 'PlayfairDisplay-900.ttf' },
];

let _fontFaceCSS: string | null = null;

function resolveFontPath(filename: string): string {
  const candidates = [
    path.join(process.cwd(), 'public', 'fonts', filename),
    path.join(__dirname, '..', '..', '..', 'public', 'fonts', filename),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error(`Font not found: ${filename}`);
}

/**
 * Generate @font-face CSS with base64-embedded TTF fonts.
 * Cached after first load for performance.
 */
export function getEmbeddedFontCSS(): string {
  if (_fontFaceCSS) return _fontFaceCSS;

  const declarations = FONTS.map((font) => {
    const filePath = resolveFontPath(font.file);
    const base64 = fs.readFileSync(filePath).toString('base64');
    return `
      @font-face {
        font-family: '${font.family}';
        font-style: normal;
        font-weight: ${font.weight};
        font-display: swap;
        src: url(data:font/truetype;base64,${base64}) format('truetype');
      }`;
  }).join('\n');

  _fontFaceCSS = declarations;
  return declarations;
}
