/**
 * Carousel Image Generation
 *
 * Uses DALL-E 3 to generate hero slide images from AI-crafted prompts.
 * Also handles photo selection from the personal archive.
 */

import { getSupabase } from '@/lib/supabase/client';

const OPENAI_API_URL = 'https://api.openai.com/v1/images/generations';

interface DalleResponse {
  data: Array<{
    url: string;
    revised_prompt: string;
  }>;
}

/**
 * Generate a hero image using DALL-E 3.
 * Returns the URL of the generated image.
 */
export async function generateHeroImage(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: buildSafePrompt(prompt),
      n: 1,
      size: '1024x1792',
      quality: 'hd',
      style: 'vivid',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DALL-E generation failed: ${response.status} ${error}`);
  }

  const data: DalleResponse = await response.json();

  if (!data.data?.[0]?.url) {
    throw new Error('No image URL in DALL-E response');
  }

  return data.data[0].url;
}

/**
 * Download a generated image and upload to Supabase Storage.
 * Returns the permanent public URL.
 */
export async function persistImage(
  temporaryUrl: string,
  carouselId: string,
  fileName: string,
): Promise<string> {
  const imageResponse = await fetch(temporaryUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to download image: ${imageResponse.status}`);
  }

  const buffer = new Uint8Array(await imageResponse.arrayBuffer());
  const supabase = getSupabase();
  const storagePath = `carousels/${carouselId}/${fileName}`;

  const { error } = await supabase.storage
    .from('carousel-images')
    .upload(storagePath, buffer, {
      contentType: 'image/png',
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload image to storage: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from('carousel-images')
    .getPublicUrl(storagePath);

  return urlData.publicUrl;
}

/**
 * Build a safe DALL-E prompt with brand constraints.
 */
function buildSafePrompt(rawPrompt: string): string {
  return `${rawPrompt}

STYLE REQUIREMENTS:
- Dark, moody colour palette with primary background near #141414
- Gold accent lighting and highlights (#B8860B / dark gold tones)
- Editorial, premium feel. Think high-end magazine cover or film poster.
- Abstract or symbolic imagery. No text, no UI elements, no screenshots.
- Cinematic lighting with dramatic shadows.
- Minimal composition. One strong focal point.
- No people unless specifically requested.
- Aspect ratio: tall portrait (9:16). Compose the image vertically with the focal point in the centre-upper area. Leave the bottom third slightly darker or more abstract for text overlay space.`;
}
