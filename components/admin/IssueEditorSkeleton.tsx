'use client';

import { SkeletonBlock } from '@/components/shared/Skeleton';

export default function IssueEditorSkeleton() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <SkeletonBlock className="h-6 w-48 mb-2" />
          <SkeletonBlock className="h-3 w-28" />
        </div>
        <div className="flex gap-2">
          <SkeletonBlock className="h-9 w-16 rounded-lg" />
          <SkeletonBlock className="h-9 w-20 rounded-lg" />
          <SkeletonBlock className="h-9 w-28 rounded-lg" />
        </div>
      </div>

      <div className="flex gap-6">
        {/* Main content */}
        <div className="flex-1">
          {/* Tabs */}
          <div className="flex gap-1 mb-5 pb-3 border-b border-[#333333]">
            {Array.from({ length: 7 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-7 w-20 rounded-md" />
            ))}
          </div>

          {/* Form */}
          <div className="bg-[#222222] border border-[#333333] rounded-lg p-5 space-y-4">
            <div>
              <SkeletonBlock className="h-3 w-20 mb-2" />
              <SkeletonBlock className="h-10 w-full rounded" />
            </div>
            <div>
              <SkeletonBlock className="h-3 w-24 mb-2" />
              <SkeletonBlock className="h-10 w-full rounded" />
            </div>
            <div>
              <SkeletonBlock className="h-3 w-20 mb-2" />
              <SkeletonBlock className="h-24 w-full rounded" />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-56 flex-shrink-0 space-y-4">
          <div className="bg-[#222222] border border-[#333333] rounded-lg p-4 space-y-3">
            <SkeletonBlock className="h-3 w-20 mb-1" />
            <SkeletonBlock className="h-8 w-full rounded-lg" />
          </div>
          <div className="bg-[#222222] border border-[#333333] rounded-lg p-4 space-y-2">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-3 w-32" />
            <SkeletonBlock className="h-3 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}
