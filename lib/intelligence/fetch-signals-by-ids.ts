// ============================================================
// Intelligence Hub: Fetch Signals by IDs
// Retrieves specific signals from the website API by their IDs.
// ============================================================

import type { IntelligenceSignal } from './types';

function getConfig() {
  const apiUrl = process.env.INTELLIGENCE_API_URL;
  const apiKey = process.env.INTELLIGENCE_API_KEY;
  if (!apiUrl || !apiKey) {
    throw new Error('Missing INTELLIGENCE_API_URL or INTELLIGENCE_API_KEY');
  }
  return { apiUrl: apiUrl.replace(/\/$/, ''), apiKey };
}

/**
 * Fetch signals by an array of IDs from the Intelligence Hub.
 * Falls back gracefully if the endpoint does not exist.
 */
export async function fetchSignalsByIds(ids: string[]): Promise<IntelligenceSignal[]> {
  if (!ids || ids.length === 0) return [];

  const { apiUrl, apiKey } = getConfig();

  try {
    const response = await fetch(`${apiUrl}/api/signals/by-ids`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-intelligence-key': apiKey,
      },
      body: JSON.stringify({ ids }),
      cache: 'no-store',
    });

    if (!response.ok) {
      console.warn(`fetchSignalsByIds returned ${response.status}, falling back to empty`);
      return [];
    }

    const data = await response.json();
    return (data.signals || []) as IntelligenceSignal[];
  } catch (error) {
    console.warn('fetchSignalsByIds failed, falling back to empty:', error);
    return [];
  }
}
