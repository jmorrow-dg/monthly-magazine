'use client';

import type { IssueStatus } from '@/lib/types/issue';

const STATUS_STYLES: Record<IssueStatus, { bg: string; text: string; border: string }> = {
  draft: { bg: 'rgba(136,136,136,0.12)', text: '#888888', border: 'rgba(136,136,136,0.3)' },
  review: { bg: 'rgba(59,130,246,0.12)', text: '#3B82F6', border: 'rgba(59,130,246,0.3)' },
  approved: { bg: 'rgba(34,197,94,0.12)', text: '#22C55E', border: 'rgba(34,197,94,0.3)' },
  published: { bg: 'rgba(184,134,11,0.12)', text: '#B8860B', border: 'rgba(184,134,11,0.3)' },
  archived: { bg: 'rgba(102,102,102,0.12)', text: '#666666', border: 'rgba(102,102,102,0.3)' },
};

export default function IssueStatusBadge({ status }: { status: IssueStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className="inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider"
      style={{ backgroundColor: style.bg, color: style.text, border: `1px solid ${style.border}` }}
    >
      {status}
    </span>
  );
}
