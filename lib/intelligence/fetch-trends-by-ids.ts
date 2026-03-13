// ============================================================
// Intelligence Hub: Fetch Trends by IDs
// ============================================================

import type { IntelligenceTrend } from './types';

function getConfig() {
  const apiUrl = process.env.INTELLIGENCE_API_URL;
  const apiKey = process.env.INTELLIGENCE_API_KEY;
  if (!apiUrl || !apiKey) {
    throw new Error('Missing INTELLIGENCE_API_URL or INTELLIGENCE_API_KEY');
  }
  return { apiUrl: apiUrl.replace(/\/$/, ''), apiKey };
}

export async function fetchTrendsByIds(ids: string[]): Promise<IntelligenceTrend[]> {
  if (!ids || ids.length === 0) return [];

  const { apiUrl, apiKey } = getConfig();

  try {
    const response = await fetch(`${apiUrl}/api/trends/by-ids`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-intelligence-key': apiKey,
      },
      body: JSON.stringify({ ids }),
      cache: 'no-store',
    });

    if (!response.ok) {
      console.warn(`fetchTrendsByIds returned ${response.status}, falling back to empty`);
      return [];
    }

    const data = await response.json();
    return (data.trends || []) as IntelligenceTrend[];
  } catch (error) {
    console.warn('fetchTrendsByIds failed, falling back to empty:', error);
    return [];
  }
}
