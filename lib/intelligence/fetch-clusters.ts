// ============================================================
// Intelligence Hub: Cluster Fetch Client
// Fetches signal clusters from the website intelligence API.
// ============================================================

import type { ClusterResponse, SignalCluster } from './types';

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
 * Fetch existing signal clusters for a given month.
 */
export async function fetchMonthlyClusters(monthYear: string): Promise<ClusterResponse> {
  const { apiUrl, apiKey } = getConfig();

  const response = await fetch(
    `${apiUrl}/api/signals/clusters/${encodeURIComponent(monthYear)}`,
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
 * Generate new signal clusters for a given month.
 * This will delete any existing clusters for that month and regenerate.
 */
export async function generateClusters(monthYear: string): Promise<ClusterResponse> {
  const { apiUrl, apiKey } = getConfig();

  const response = await fetch(
    `${apiUrl}/api/signals/clusters/generate`,
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
 * Find the cover story cluster from a list of clusters.
 * Returns the cluster with type 'cover_story', or the highest-scoring cluster.
 */
export function findCoverStoryCluster(clusters: SignalCluster[]): SignalCluster | null {
  const coverStory = clusters.find((c) => c.cluster_type === 'cover_story');
  if (coverStory) return coverStory;

  // Fallback: highest average composite score
  if (clusters.length === 0) return null;
  return clusters.reduce((best, c) =>
    (c.avg_composite_score || 0) > (best.avg_composite_score || 0) ? c : best,
  );
}
