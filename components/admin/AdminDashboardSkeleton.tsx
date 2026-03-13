'use client';

import { SkeletonBlock } from '@/components/shared/Skeleton';

export default function AdminDashboardSkeleton() {
  return (
    <>
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-[#222222] border border-[#333333] rounded-lg p-5">
            <SkeletonBlock className="h-3 w-16 mb-3" />
            <SkeletonBlock className="h-6 w-10" />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#222222] border border-[#333333] rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-[#333333]">
          <SkeletonBlock className="h-4 w-28" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-8 px-5 py-3 border-t border-[#333333]">
            <SkeletonBlock className="h-3 w-10" />
            <SkeletonBlock className="h-3 w-16" />
            <SkeletonBlock className="h-3 flex-1" />
            <SkeletonBlock className="h-5 w-16 rounded-full" />
            <SkeletonBlock className="h-3 w-20" />
          </div>
        ))}
      </div>
    </>
  );
}
