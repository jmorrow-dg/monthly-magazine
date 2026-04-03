'use client';

type SpreadNavigationProps = {
  currentSpread: number;
  totalSpreads: number;
  onPrev: () => void;
  onNext: () => void;
  pageLabel: string;
};

export default function SpreadNavigation({ currentSpread, totalSpreads, onPrev, onNext, pageLabel }: SpreadNavigationProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      {/* Previous */}
      <button
        onClick={onPrev}
        disabled={currentSpread === 0}
        className="w-10 h-10 rounded-full bg-[#222222] border border-[#333333] flex items-center justify-center text-white hover:border-[#B8860B] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous spread"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      {/* Page indicator */}
      <div className="flex items-center gap-4">
        <div className="flex gap-1.5">
          {Array.from({ length: totalSpreads }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === currentSpread ? 'bg-[#B8860B]' : 'bg-[#333333]'
              }`}
            />
          ))}
        </div>
        <span className="text-[#888888] text-xs">{pageLabel}</span>
      </div>

      {/* Next */}
      <button
        onClick={onNext}
        disabled={currentSpread === totalSpreads - 1}
        className="w-10 h-10 rounded-full bg-[#222222] border border-[#333333] flex items-center justify-center text-white hover:border-[#B8860B] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Next spread"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  );
}
