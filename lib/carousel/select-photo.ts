/**
 * Photo Selection for Carousels
 *
 * Selects personal photos from the Supabase Storage archive.
 * - selectPhoto(): Random photo from lifestyle/working/candid/speaking/team
 * - selectHeadshot(): Always from headshots category (for closer slide)
 * Both avoid recently used photos.
 */

import { getSupabase } from '@/lib/supabase/client';
import type { PhotoCategory } from './types';

/** Categories to cycle through for slide 4 (variety) */
const CATEGORY_CYCLE: PhotoCategory[] = [
  'lifestyle',
  'working',
  'candid',
  'speaking',
  'team',
];

/**
 * Select a random photo from the archive (not headshots).
 * Used for slide 4 (personal narrative).
 *
 * If the personal angle is 'lost_everything', always use the fire category
 * (hospital photo after house fire). This is hardcoded because it is the
 * only photo that should ever accompany that story.
 */
export async function selectPhoto(
  overridePath?: string,
  personalAngle?: string,
): Promise<string> {
  if (overridePath) return overridePath;

  // Hardcoded: lost_everything angle ALWAYS uses the fire photo
  if (personalAngle === 'lost_everything') {
    const firePhoto = await selectFromStorage(['fire']);
    if (firePhoto) {
      console.log('[Photo] Using fire category photo for lost_everything angle');
      return firePhoto;
    }
    console.warn('[Photo] No fire photo found in storage, falling back to general pool');
  }

  const photo = await selectFromStorage(CATEGORY_CYCLE);
  if (photo) return photo;

  console.warn('No photos available in storage. Using placeholder.');
  return 'https://placehold.co/1080x1350/141414/B8860B?text=Add+Photos';
}

/**
 * Select a headshot photo from the archive.
 * Used for slide 5 (personal brand closer). Always from headshots category.
 */
export async function selectHeadshot(): Promise<string> {
  const photo = await selectFromStorage(['headshots']);
  if (photo) return photo;

  // Fallback: try any category if no headshots available
  const fallback = await selectFromStorage(CATEGORY_CYCLE);
  if (fallback) return fallback;

  console.warn('No headshots available in storage. Using placeholder.');
  return 'https://placehold.co/1080x1350/141414/B8860B?text=Add+Headshot';
}

/**
 * Select a photo from specified categories in Supabase Storage.
 * Avoids recently used photos. Excludes a specific URL if provided.
 */
async function selectFromStorage(
  categories: (PhotoCategory | string)[],
  excludeUrl?: string,
): Promise<string | null> {
  const supabase = getSupabase();
  const recentlyUsed = await getRecentlyUsedPhotos();

  // Shuffle categories for variety
  const shuffled = [...categories].sort(() => Math.random() - 0.5);

  for (const category of shuffled) {
    const { data: files, error } = await supabase.storage
      .from('photo-archive')
      .list(category, { limit: 100 });

    if (error || !files?.length) continue;

    const imageFiles = files.filter((f) =>
      /\.(jpg|jpeg|png|webp)$/i.test(f.name),
    );

    const unused = imageFiles.filter((f) => {
      const path = `${category}/${f.name}`;
      if (recentlyUsed.has(path)) return false;
      if (excludeUrl) {
        const { data: urlData } = supabase.storage
          .from('photo-archive')
          .getPublicUrl(path);
        if (urlData.publicUrl === excludeUrl) return false;
      }
      return true;
    });

    const pool = unused.length > 0 ? unused : imageFiles;
    const selected = pool[Math.floor(Math.random() * pool.length)];

    const { data: urlData } = supabase.storage
      .from('photo-archive')
      .getPublicUrl(`${category}/${selected.name}`);

    return urlData.publicUrl;
  }

  return null;
}

/**
 * Get photo paths used in the last 30 days.
 */
async function getRecentlyUsedPhotos(): Promise<Set<string>> {
  const supabase = getSupabase();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data, error } = await supabase
    .from('carousels')
    .select('photo_path')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .not('photo_path', 'is', null);

  if (error) {
    console.error('Failed to fetch recent photo paths:', error.message);
    return new Set();
  }

  return new Set(
    (data || [])
      .map((r: { photo_path: string | null }) => r.photo_path)
      .filter(Boolean) as string[],
  );
}
