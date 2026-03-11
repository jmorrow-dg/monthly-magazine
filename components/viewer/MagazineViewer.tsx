'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import PageRenderer from './PageRenderer';
import SpreadNavigation from './SpreadNavigation';
import { SPREAD_LAYOUT, TOTAL_SPREADS } from '@/lib/types/magazine';

type MagazineViewerProps = {
  pageHtmls: (string | null)[];
};

export default function MagazineViewer({ pageHtmls }: MagazineViewerProps) {
  const [currentSpread, setCurrentSpread] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth < 1024);
    }
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
    };
  }, []);

  const navigateTo = useCallback((nextSpread: number, dir: 'next' | 'prev') => {
    if (isTransitioning) return;
    setDirection(dir);
    setIsTransitioning(true);

    transitionTimer.current = setTimeout(() => {
      setCurrentSpread(nextSpread);
      // Brief pause then fade in
      requestAnimationFrame(() => {
        setIsTransitioning(false);
      });
    }, 200);
  }, [isTransitioning]);

  const goNext = useCallback(() => {
    const next = Math.min(currentSpread + 1, TOTAL_SPREADS - 1);
    if (next !== currentSpread) navigateTo(next, 'next');
  }, [currentSpread, navigateTo]);

  const goPrev = useCallback(() => {
    const prev = Math.max(currentSpread - 1, 0);
    if (prev !== currentSpread) navigateTo(prev, 'prev');
  }, [currentSpread, navigateTo]);

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev]);

  const spread = SPREAD_LAYOUT[currentSpread];
  const leftHtml = spread.leftPageNumber ? pageHtmls[spread.leftPageNumber - 1] : null;
  const rightHtml = spread.rightPageNumber ? pageHtmls[spread.rightPageNumber - 1] : null;
  const isSinglePage = !rightHtml;

  // Build page label
  let pageLabel: string;
  if (spread.leftPageNumber && spread.rightPageNumber) {
    pageLabel = `Pages ${spread.leftPageNumber}-${spread.rightPageNumber} of 8`;
  } else if (spread.leftPageNumber) {
    pageLabel = `Page ${spread.leftPageNumber} of 8`;
  } else {
    pageLabel = '';
  }

  // Mobile: stacked single-page view
  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="sticky top-0 z-10 bg-[#0a0a0a]/90 backdrop-blur-sm border-b border-[#222222] px-4 py-3">
          <Link href="/issues" className="text-[#B8860B] text-xs hover:underline">&larr; All Issues</Link>
        </div>
        <div className="max-w-lg mx-auto py-6 px-4 space-y-6">
          {pageHtmls.map((html, i) =>
            html ? (
              <div key={i} className="rounded-lg overflow-hidden shadow-2xl border border-[#222222]">
                <PageRenderer html={html} />
              </div>
            ) : null
          )}
        </div>
      </div>
    );
  }

  // Desktop: spread view with transitions
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Top bar */}
      <div className="px-6 pt-4">
        <Link href="/issues" className="text-[#B8860B] text-xs hover:underline">&larr; All Issues</Link>
      </div>

      {/* Viewer area */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div
          className={`flex ${isSinglePage ? 'justify-center' : 'gap-1'} transition-all duration-300 ease-out ${
            isTransitioning
              ? `opacity-0 scale-[0.98] ${direction === 'next' ? 'translate-x-4' : '-translate-x-4'}`
              : 'opacity-100 scale-100 translate-x-0'
          }`}
          style={{ maxHeight: '80vh' }}
        >
          {/* Left page */}
          {leftHtml && (
            <div
              className={`bg-[#141414] rounded-l-sm overflow-hidden ${isSinglePage ? 'rounded-r-sm' : ''}`}
              style={{
                width: isSinglePage ? '40vw' : '38vw',
                maxWidth: isSinglePage ? 500 : 450,
                boxShadow: isSinglePage
                  ? '0 20px 60px rgba(0,0,0,0.5)'
                  : '4px 0 20px rgba(0,0,0,0.3)',
              }}
            >
              <PageRenderer html={leftHtml} />
            </div>
          )}

          {/* Spine */}
          {!isSinglePage && (
            <div className="w-[2px] bg-[#333333] self-stretch" />
          )}

          {/* Right page */}
          {rightHtml && (
            <div
              className="bg-[#141414] rounded-r-sm overflow-hidden"
              style={{
                width: '38vw',
                maxWidth: 450,
                boxShadow: '-4px 0 20px rgba(0,0,0,0.3)',
              }}
            >
              <PageRenderer html={rightHtml} />
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-md mx-auto w-full pb-6">
        <SpreadNavigation
          currentSpread={currentSpread}
          onPrev={goPrev}
          onNext={goNext}
          pageLabel={pageLabel}
        />
      </div>
    </div>
  );
}
