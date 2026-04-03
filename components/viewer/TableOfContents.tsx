'use client';

import { useEffect, useRef } from 'react';
import type { SpreadConfig } from '@/lib/types/magazine';

type Props = {
  pageHtmls: (string | null)[];
  currentSpread: number;
  onNavigate: (spreadIndex: number) => void;
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
  spreadLayout: SpreadConfig[];
  pageLabels: string[];
};

function getSpreadForPage(pageNumber: number, spreadLayout: SpreadConfig[]): number {
  return spreadLayout.findIndex(
    (s) => s.leftPageNumber === pageNumber || s.rightPageNumber === pageNumber
  );
}

/**
 * Lightweight page thumbnail: a coloured block with the page number.
 * Replaces the previous approach of rendering a full iframe per thumbnail,
 * cutting DOM weight from ~16 iframes to zero.
 */
function PageThumb({ pageIndex, isActive }: { pageIndex: number; isActive: boolean }) {
  const THUMB_W = 56;
  const THUMB_H = 79;

  // First page (cover) gets a dark bg, others get a subtly different shade
  const bgColor = pageIndex === 0 ? '#1a1a1a' : '#222222';

  return (
    <div
      className={`overflow-hidden rounded border flex items-center justify-center ${
        isActive ? 'border-[#B8860B] ring-1 ring-[#B8860B]' : 'border-[#333333]'
      }`}
      style={{ width: THUMB_W, height: THUMB_H, backgroundColor: bgColor }}
    >
      <span className={`text-[10px] font-medium ${isActive ? 'text-[#B8860B]' : 'text-[#555555]'}`}>
        {pageIndex + 1}
      </span>
    </div>
  );
}

export default function TableOfContents({ pageHtmls, currentSpread, onNavigate, isOpen, onClose, isMobile, spreadLayout, pageLabels }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  if (isMobile) {
    return (
      <>
        <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
        <div
          ref={panelRef}
          className="fixed bottom-0 left-0 right-0 bg-[#1C1C1C] border-t border-[#333333] z-50 rounded-t-2xl max-h-[55vh] overflow-y-auto"
        >
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-[#444444] rounded-full" />
          </div>
          <div className="px-4 pb-6">
            <h3 className="text-white font-semibold text-xs mb-4 uppercase tracking-wider">Contents</h3>
            <div className="grid grid-cols-4 gap-3">
              {pageHtmls.map((html, i) => {
                if (!html) return null;
                const spreadIdx = getSpreadForPage(i + 1, spreadLayout);
                const isActive = spreadIdx === currentSpread;
                return (
                  <button
                    key={i}
                    onClick={() => { onNavigate(spreadIdx); onClose(); }}
                    className="text-center"
                  >
                    <PageThumb pageIndex={i} isActive={isActive} />
                    <div className={`text-[8px] mt-1 leading-tight ${isActive ? 'text-[#B8860B]' : 'text-[#888888]'}`}>
                      {pageLabels[i]}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </>
    );
  }

  // Desktop: slide-out left panel
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-30" onClick={onClose} />
      <div
        ref={panelRef}
        className="fixed left-0 top-0 bottom-0 w-60 bg-[#1C1C1C] border-r border-[#333333] z-40 overflow-y-auto shadow-2xl animate-slide-in-left"
      >
        <div className="p-4 border-b border-[#333333] flex items-center justify-between">
          <h3 className="text-white font-semibold text-xs uppercase tracking-wider">Contents</h3>
          <button onClick={onClose} className="text-[#888888] hover:text-white text-xs transition-colors">Close</button>
        </div>
        <div className="p-3 space-y-1">
          {pageHtmls.map((html, i) => {
            if (!html) return null;
            const spreadIdx = getSpreadForPage(i + 1, spreadLayout);
            const isActive = spreadIdx === currentSpread;
            return (
              <button
                key={i}
                onClick={() => { onNavigate(spreadIdx); onClose(); }}
                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                  isActive ? 'bg-[#B8860B]/10 border border-[#B8860B]/30' : 'hover:bg-[#222222] border border-transparent'
                }`}
              >
                <PageThumb pageIndex={i} isActive={isActive} />
                <div className="text-left min-w-0">
                  <div className={`text-xs font-medium truncate ${isActive ? 'text-[#B8860B]' : 'text-white'}`}>
                    {pageLabels[i]}
                  </div>
                  <div className="text-[10px] text-[#555555]">Page {i + 1}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
