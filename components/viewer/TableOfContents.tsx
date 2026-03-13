'use client';

import { useEffect, useRef } from 'react';
import { SPREAD_LAYOUT, PAGE_LABELS } from '@/lib/types/magazine';

const A4_W = 794;
const A4_H = 1123;

type Props = {
  pageHtmls: (string | null)[];
  currentSpread: number;
  onNavigate: (spreadIndex: number) => void;
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
};

function getSpreadForPage(pageNumber: number): number {
  return SPREAD_LAYOUT.findIndex(
    (s) => s.leftPageNumber === pageNumber || s.rightPageNumber === pageNumber
  );
}

export default function TableOfContents({ pageHtmls, currentSpread, onNavigate, isOpen, onClose, isMobile }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const THUMB_W = 56;
  const THUMB_H = 79;
  const thumbScale = THUMB_H / A4_H;

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
                const spreadIdx = getSpreadForPage(i + 1);
                const isActive = spreadIdx === currentSpread;
                return (
                  <button
                    key={i}
                    onClick={() => { onNavigate(spreadIdx); onClose(); }}
                    className="text-center"
                  >
                    <div
                      className={`overflow-hidden rounded border ${isActive ? 'border-[#B8860B] ring-1 ring-[#B8860B]' : 'border-[#333333]'}`}
                      style={{ width: THUMB_W, height: THUMB_H }}
                    >
                      <div style={{ width: A4_W, height: A4_H, transform: `scale(${thumbScale})`, transformOrigin: 'top left' }}>
                        <iframe srcDoc={html} className="border-0 pointer-events-none" style={{ width: A4_W, height: A4_H }} sandbox="allow-same-origin" tabIndex={-1} />
                      </div>
                    </div>
                    <div className={`text-[8px] mt-1 leading-tight ${isActive ? 'text-[#B8860B]' : 'text-[#888888]'}`}>
                      {PAGE_LABELS[i]}
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
            const spreadIdx = getSpreadForPage(i + 1);
            const isActive = spreadIdx === currentSpread;
            return (
              <button
                key={i}
                onClick={() => { onNavigate(spreadIdx); onClose(); }}
                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                  isActive ? 'bg-[#B8860B]/10 border border-[#B8860B]/30' : 'hover:bg-[#222222] border border-transparent'
                }`}
              >
                <div
                  className={`overflow-hidden rounded border flex-shrink-0 ${isActive ? 'border-[#B8860B]' : 'border-[#333333]'}`}
                  style={{ width: THUMB_W, height: THUMB_H }}
                >
                  <div style={{ width: A4_W, height: A4_H, transform: `scale(${thumbScale})`, transformOrigin: 'top left' }}>
                    <iframe srcDoc={html} className="border-0 pointer-events-none" style={{ width: A4_W, height: A4_H }} sandbox="allow-same-origin" tabIndex={-1} />
                  </div>
                </div>
                <div className="text-left min-w-0">
                  <div className={`text-xs font-medium truncate ${isActive ? 'text-[#B8860B]' : 'text-white'}`}>
                    {PAGE_LABELS[i]}
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
