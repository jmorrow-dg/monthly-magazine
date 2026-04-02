/**
 * Asset loading for carousel slide templates.
 *
 * Logo: David & Goliath transparent PNG (RGBA, no background).
 * Always reads fresh from disk to avoid stale caches after asset updates.
 */

import fs from 'fs';
import path from 'path';

function resolveAssetPath(filename: string): string {
  const candidates = [
    path.join(process.cwd(), 'public', 'images', filename),
    path.join(__dirname, '..', '..', '..', 'public', 'images', filename),
  ];

  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) return filePath;
  }

  throw new Error(`Asset not found: ${filename}. Searched: ${candidates.join(', ')}`);
}

function loadAssetBase64(filename: string): string {
  const filePath = resolveAssetPath(filename);
  const buffer = fs.readFileSync(filePath);
  return buffer.toString('base64');
}

/**
 * DG transparent logo as base64 string.
 * File: public/images/dg-logo.png (RGBA PNG, transparent background).
 */
export function getDgLogoBase64(): string {
  return loadAssetBase64('dg-logo.png');
}

export function getGoldCurvesBgBase64(): string {
  return loadAssetBase64('gold-curves-bg.jpg');
}

/**
 * DG transparent logo as a data URI for embedding in HTML templates.
 */
export function dgLogoDataUri(): string {
  return `data:image/png;base64,${getDgLogoBase64()}`;
}

export function goldCurvesBgDataUri(): string {
  return `data:image/jpeg;base64,${getGoldCurvesBgBase64()}`;
}
