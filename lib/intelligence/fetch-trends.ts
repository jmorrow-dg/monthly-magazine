// ============================================================
// Intelligence Hub: Trend Fetch Client
// Fetches strategic trends from the website intelligence API.
// ============================================================

import type { TrendResponse, TrendDetailResponse, IntelligenceTrend } from './types';

function getConfig() {
  const apiUrl = process.env.INTELLIGENCE_API_URL;
  const apiKey = process.env.INTELLIGENCE_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error(
      'Missing INTELLIGENCE_API_URL or INTELLIGENCE_API_KEY environment variables.',
    );
  }

  return { apiUrl: apiUrl.replace(/\/$/, ''), apiKey };
}

/**
 * Fetch all trends for a given month.
 */
export async function fetchMonthlyTrends(monthYear: string): Promise<TrendResponse> {
  const { apiUrl, apiKey } = getConfig();

  const response = await fetch(
    `${apiUrl}/api/signals/trends/${encodeURIComponent(monthYear)}`,
    {
      headers: { 'x-intelligence-key': apiKey },
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Intelligence Hub returned ${response.status}: ${body}`);
  }

  return response.json();
}

/**
 * Fetch trends filtered by region.
 */
export async function fetchTrendsByRegion(
  monthYear: string,
  region: string,
): Promise<TrendResponse> {
  const { apiUrl, apiKey } = getConfig();

  const response = await fetch(
    `${apiUrl}/api/signals/trends/${encodeURIComponent(monthYear)}?region=${encodeURIComponent(region)}`,
    {
      headers: { 'x-intelligence-key': apiKey },
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Intelligence Hub returned ${response.status}: ${body}`);
  }

  return response.json();
}

/**
 * Fetch trends filtered by sector.
 */
export async function fetchTrendsBySector(
  monthYear: string,
  sector: string,
): Promise<TrendResponse> {
  const { apiUrl, apiKey } = getConfig();

  const response = await fetch(
    `${apiUrl}/api/signals/trends/${encodeURIComponent(monthYear)}?sector=${encodeURIComponent(sector)}`,
    {
      headers: { 'x-intelligence-key': apiKey },
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Intelligence Hub returned ${response.status}: ${body}`);
  }

  return response.json();
}

/**
 * Fetch a single trend with its linked signals.
 */
export async function fetchTrendDetail(
  monthYear: string,
  trendId: string,
): Promise<TrendDetailResponse> {
  const { apiUrl, apiKey } = getConfig();

  const response = await fetch(
    `${apiUrl}/api/signals/trends/${encodeURIComponent(monthYear)}?id=${encodeURIComponent(trendId)}`,
    {
      headers: { 'x-intelligence-key': apiKey },
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Intelligence Hub returned ${response.status}: ${body}`);
  }

  return response.json();
}

/**
 * Generate new trends for a given month.
 * Deletes existing trends and regenerates from scored signals.
 */
export async function generateTrends(monthYear: string): Promise<TrendResponse> {
  const { apiUrl, apiKey } = getConfig();

  const response = await fetch(
    `${apiUrl}/api/signals/trends/generate`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-intelligence-key': apiKey,
      },
      body: JSON.stringify({ month_year: monthYear }),
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Intelligence Hub returned ${response.status}: ${body}`);
  }

  return response.json();
}

/**
 * Find the highest-confidence trend (candidate for cover story).
 */
export function findTopTrend(trends: IntelligenceTrend[]): IntelligenceTrend | null {
  if (trends.length === 0) return null;
  return trends.reduce((best, t) =>
    (t.confidence_score || 0) > (best.confidence_score || 0) ? t : best,
  );
}
