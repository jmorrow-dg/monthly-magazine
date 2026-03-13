// ============================================================
// Intelligence Hub: Signal Fetch Client
// Fetches scored signals from the website intelligence API.
// ============================================================

import type { SignalFeedResponse, SignalSummaryResponse } from './types';

function getConfig() {
  const apiUrl = process.env.INTELLIGENCE_API_URL;
  const apiKey = process.env.INTELLIGENCE_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error(
      'Missing INTELLIGENCE_API_URL or INTELLIGENCE_API_KEY environment variables. ' +
      'These are required to connect to the Intelligence Hub.',
    );
  }

  return { apiUrl: apiUrl.replace(/\/$/, ''), apiKey };
}

/**
 * Fetch all scored signals for a given month from the Intelligence Hub.
 * Returns signals grouped by category with composite score >= 6.0.
 */
export async function fetchMonthlySignals(monthYear: string): Promise<SignalFeedResponse> {
  const { apiUrl, apiKey } = getConfig();

  const response = await fetch(
    `${apiUrl}/api/signals/for-magazine?month_year=${encodeURIComponent(monthYear)}`,
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
 * Fetch a summary of the top 10 signals for a month.
 * Useful for admin UI preview before generating.
 */
export async function fetchSignalSummary(monthYear: string): Promise<SignalSummaryResponse> {
  const { apiUrl, apiKey } = getConfig();

  const response = await fetch(
    `${apiUrl}/api/signals/for-magazine?month_year=${encodeURIComponent(monthYear)}&summary=true`,
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
