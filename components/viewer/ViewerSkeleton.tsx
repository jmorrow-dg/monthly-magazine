'use client';

import { SkeletonBlock } from '@/components/shared/Skeleton';

export default function ViewerSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Back link */}
      <div className="px-6 pt-4">
        <SkeletonBlock className="h-3 w-20" />
      </div>

      {/* Spread area */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex gap-1 items-stretch">
          <SkeletonBlock
            className="rounded-l-sm"
            style={{ width: 'min(38vw, 450px)', aspectRatio: '794 / 1123' }}
          />
          <div className="w-[2px] bg-[#222222] self-stretch" />
          <SkeletonBlock
            className="rounded-r-sm"
            style={{ width: 'min(38vw, 450px)', aspectRatio: '794 / 1123' }}
          />
        </div>
      </div>

      {/* Navigation skeleton */}
      <div className="max-w-md mx-auto w-full pb-6 flex items-center justify-center gap-4">
        <SkeletonBlock className="h-10 w-10 rounded-full" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-2 w-2 rounded-full" />
          ))}
        </div>
        <SkeletonBlock className="h-10 w-10 rounded-full" />
      </div>
    </div>
  );
}
