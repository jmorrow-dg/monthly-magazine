'use client';

type ReadinessStatus = 'empty' | 'partial' | 'complete';

const COLORS: Record<ReadinessStatus, string> = {
  empty: 'bg-[#C0392B]',
  partial: 'bg-[#F59E0B]',
  complete: 'bg-[#22C55E]',
};

export default function SectionReadiness({ status }: { status: ReadinessStatus }) {
  return <div className={`w-2 h-2 rounded-full ${COLORS[status]} flex-shrink-0`} />;
}

/**
 * Compute readiness for an array-based section (developments, implications, etc.)
 * @param items - The array of content items
 * @param requiredKeys - Keys that must be non-empty for "complete"
 */
export function computeArrayReadiness(
  items: Record<string, unknown>[],
  requiredKeys: string[],
): ReadinessStatus {
  if (!items || items.length === 0) return 'empty';

  const allFilled = items.every((item) =>
    requiredKeys.every((key) => {
      const val = item[key];
      if (Array.isArray(val)) return val.length > 0;
      return typeof val === 'string' && val.trim().length > 0;
    })
  );

  return allFilled ? 'complete' : 'partial';
}
