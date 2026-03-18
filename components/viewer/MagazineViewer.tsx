'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import PageRenderer from './PageRenderer';
import LazyPageRenderer from './LazyPageRenderer';
import SpreadNavigation from './SpreadNavigation';
import TableOfContents from './TableOfContents';
import ShareActions from './ShareActions';
import { SPREAD_LAYOUT, TOTAL_SPREADS, TOTAL_PAGES } from '@/lib/types/magazine';

type MagazineViewerProps = {
  pageHtmls: (string | null)[];
  issueId?: string;
  headline?: string;
  subtitle?: string | null;
};

export default function MagazineViewer({ pageHtmls, issueId, headline, subtitle }: MagazineViewerProps) {
  const [currentSpread, setCurrentSpread] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [tocOpen, setTocOpen] = useState(false);
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
      requestAnimationFrame(() => {
        setIsTransitioning(false);
      });
    }, 350);
  }, [isTransitioning]);

  const goNext = useCallback(() => {
    const next = Math.min(currentSpread + 1, TOTAL_SPREADS - 1);
    if (next !== currentSpread) navigateTo(next, 'next');
  }, [currentSpread, navigateTo]);

  const goPrev = useCallback(() => {
    const prev = Math.max(currentSpread - 1, 0);
    if (prev !== currentSpread) navigateTo(prev, 'prev');
  }, [currentSpread, navigateTo]);

  const jumpToSpread = useCallback((idx: number) => {
    if (idx === currentSpread || isTransitioning) return;
    navigateTo(idx, idx > currentSpread ? 'next' : 'prev');
  }, [currentSpread, isTransitioning, navigateTo]);

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

  // Preload adjacent spreads (hidden off-screen) so transitions feel instant
  const adjacentPages: string[] = [];
  for (const offset of [-1, 1]) {
    const idx = currentSpread + offset;
    if (idx >= 0 && idx < TOTAL_SPREADS) {
      const adj = SPREAD_LAYOUT[idx];
      if (adj.leftPageNumber) {
        const h = pageHtmls[adj.leftPageNumber - 1];
        if (h) adjacentPages.push(h);
      }
      if (adj.rightPageNumber) {
        const h = pageHtmls[adj.rightPageNumber - 1];
        if (h) adjacentPages.push(h);
      }
    }
  }

  // Build page label
  let pageLabel: string;
  if (spread.leftPageNumber && spread.rightPageNumber) {
    pageLabel = `${spread.leftPageNumber} \u2013 ${spread.rightPageNumber} / ${TOTAL_PAGES}`;
  } else if (spread.leftPageNumber) {
    pageLabel = `${spread.leftPageNumber} / ${TOTAL_PAGES}`;
  } else {
    pageLabel = '';
  }

  const progressPercent = Math.round(((currentSpread + 1) / TOTAL_SPREADS) * 100);

  // Mobile: stacked single-page view
  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        {/* Mobile progress bar */}
        <div className="h-[2px] bg-[#1a1a1a]">
          <div
            className="h-full bg-[#B8860B] transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <TableOfContents
          pageHtmls={pageHtmls}
          currentSpread={currentSpread}
          onNavigate={jumpToSpread}
          isOpen={tocOpen}
          onClose={() => setTocOpen(false)}
          isMobile={true}
        />
        <div className="sticky top-0 z-10 bg-[#0a0a0a]/90 backdrop-blur-sm border-b border-[#222222] px-4 py-3 flex items-center justify-between">
          <Link href="/issues" className="text-[#B8860B] text-xs hover:underline">&larr; All Issues</Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTocOpen(true)}
              className="text-[#888888] hover:text-white text-xs transition-colors"
              aria-label="Table of contents"
            >
              Contents
            </button>
            {issueId && headline && (
              <ShareActions issueId={issueId} headline={headline} subtitle={subtitle} />
            )}
          </div>
        </div>
        <div className="max-w-lg mx-auto py-6 px-4 space-y-6">
          {pageHtmls.map((html, i) =>
            html ? (
              <div key={i} className="rounded-lg overflow-hidden shadow-2xl border border-[#222222]">
                <LazyPageRenderer html={html} />
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
      {/* Reading progress bar */}
      <div className="h-[2px] bg-[#1a1a1a] flex-shrink-0">
        <div
          className="h-full bg-[#B8860B] transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <TableOfContents
        pageHtmls={pageHtmls}
        currentSpread={currentSpread}
        onNavigate={jumpToSpread}
        isOpen={tocOpen}
        onClose={() => setTocOpen(false)}
        isMobile={false}
      />

      {/* Top bar */}
      <div className="px-6 pt-3 pb-2 flex items-center justify-between flex-shrink-0">
        <Link href="/issues" className="text-[#B8860B] text-xs hover:underline">&larr; All Issues</Link>
        <div className="flex items-center gap-4">
          {pageLabel && (
            <span className="text-[#444444] text-[11px] font-mono tracking-wider select-none">
              {pageLabel}
            </span>
          )}
          <button
            onClick={() => setTocOpen(true)}
            className="text-[#666666] hover:text-white text-xs transition-colors flex items-center gap-1.5"
            aria-label="Table of contents"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="opacity-70">
              <rect x="1" y="2" width="14" height="1.5" rx="0.5" fill="currentColor"/>
              <rect x="1" y="7" width="14" height="1.5" rx="0.5" fill="currentColor"/>
              <rect x="1" y="12" width="14" height="1.5" rx="0.5" fill="currentColor"/>
            </svg>
            Contents
          </button>
          {issueId && headline && (
            <ShareActions issueId={issueId} headline={headline} subtitle={subtitle} />
          )}
        </div>
      </div>

      {/* Viewer area */}
      <div className="flex-1 flex items-center justify-center px-8 pb-2 pt-0 relative min-h-0">
        {/* Ambient glow behind spread */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: '60%',
            height: '50%',
            background: 'radial-gradient(ellipse at center, rgba(184,134,11,0.06) 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* Spread wrapper with deep shadow */}
        <div
          className={`flex ${isSinglePage ? 'justify-center' : 'gap-0'} relative`}
          style={{
            maxHeight: '82vh',
            filter: 'drop-shadow(0 24px 64px rgba(0,0,0,0.75)) drop-shadow(0 4px 16px rgba(0,0,0,0.4))',
            animation: isTransitioning
              ? `spread-exit-${direction} 350ms ease-out forwards`
              : `spread-enter-${direction} 350ms ease-out forwards`,
          }}
        >
          {/* Left page */}
          {leftHtml && (
            <div
              className={`bg-[#141414] overflow-hidden ${isSinglePage ? 'rounded-sm' : 'rounded-l-sm'}`}
              style={{
                width: isSinglePage ? '42vw' : '40vw',
                maxWidth: isSinglePage ? 580 : 540,
              }}
            >
              <PageRenderer html={leftHtml} />
            </div>
          )}

          {/* Book spine */}
          {!isSinglePage && (
            <div
              className="self-stretch flex-shrink-0 relative"
              style={{ width: 4 }}
            >
              {/* Spine gradient: shadow from left page */}
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to right, rgba(0,0,0,0.35) 0%, rgba(184,134,11,0.12) 50%, rgba(0,0,0,0.35) 100%)',
                }}
              />
            </div>
          )}

          {/* Right page */}
          {rightHtml && (
            <div
              className="bg-[#141414] rounded-r-sm overflow-hidden"
              style={{
                width: '40vw',
                maxWidth: 540,
              }}
            >
              <PageRenderer html={rightHtml} />
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-md mx-auto w-full pb-5 flex-shrink-0">
        <SpreadNavigation
          currentSpread={currentSpread}
          onPrev={goPrev}
          onNext={goNext}
          pageLabel=""
        />
      </div>

      {/* Hidden preload of adjacent spreads so next/prev transitions are instant */}
      <div className="sr-only" aria-hidden="true" style={{ position: 'absolute', left: -9999, width: 1, height: 1, overflow: 'hidden' }}>
        {adjacentPages.map((h, i) => (
          <iframe key={`preload-${currentSpread}-${i}`} srcDoc={h} tabIndex={-1} sandbox="allow-same-origin" style={{ width: 1, height: 1 }} />
        ))}
      </div>
    </div>
  );
}
