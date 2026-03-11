import fs from 'fs';
import path from 'path';

let _logoBase64: string | null = null;
let _bgBase64: string | null = null;

function loadAsset(filename: string): string {
  const candidates = [
    path.join(process.cwd(), 'public', 'images', filename),
    path.join(__dirname, '..', '..', '..', 'public', 'images', filename),
  ];

  for (const filePath of candidates) {
    try {
      const buffer = fs.readFileSync(filePath);
      return buffer.toString('base64');
    } catch {
      continue;
    }
  }

  throw new Error(`Asset not found: ${filename}`);
}

export function getDgLogoBase64(): string {
  if (!_logoBase64) {
    _logoBase64 = loadAsset('dg-logo.png');
  }
  return _logoBase64;
}

export function getGoldCurvesBgBase64(): string {
  if (!_bgBase64) {
    _bgBase64 = loadAsset('gold-curves-bg.jpg');
  }
  return _bgBase64;
}

export function dgLogoDataUri(): string {
  return `data:image/png;base64,${getDgLogoBase64()}`;
}

export function goldCurvesBgDataUri(): string {
  return `data:image/jpeg;base64,${getGoldCurvesBgBase64()}`;
}
