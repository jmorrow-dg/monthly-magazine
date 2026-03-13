'use client';

import { useMemo } from 'react';
import type { ContentLimit } from '@/lib/constants/content-limits';

type Props = {
  value: string;
  limit: ContentLimit;
};

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

type Status = 'empty' | 'good' | 'warning' | 'overflow';

const DOT: Record<Status, string> = {
  empty: 'bg-[#444444]',
  good: 'bg-[#22C55E]',
  warning: 'bg-[#F59E0B]',
  overflow: 'bg-[#C0392B]',
};

const TEXT: Record<Status, string> = {
  empty: 'text-[#555555]',
  good: 'text-[#555555]',
  warning: 'text-[#F59E0B]',
  overflow: 'text-[#C0392B]',
};

export default function ContentIndicator({ value, limit }: Props) {
  const { words, status } = useMemo(() => {
    const w = countWords(value);
    const c = value.length;
    let s: Status = 'empty';
    if (c === 0) s = 'empty';
    else if (w > limit.maxWords || c > limit.maxChars) s = 'overflow';
    else if (w >= limit.warnWords) s = 'warning';
    else s = 'good';
    return { words: w, status: s };
  }, [value, limit]);

  if (status === 'empty') return null;

  return (
    <div className="flex items-center gap-1.5 mt-1">
      <div className={`w-1.5 h-1.5 rounded-full ${DOT[status]}`} />
      <span className={`text-[10px] ${TEXT[status]}`}>
        {words}/{limit.maxWords} words
      </span>
    </div>
  );
}
