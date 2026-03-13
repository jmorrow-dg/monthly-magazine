'use client';

import { useEffect, useState, useRef } from 'react';

const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

type Props = {
  issueId: string;
  fallback: React.ReactNode;
};

export default function CoverPreview({ issueId, fallback }: Props) {
  const [coverHtml, setCoverHtml] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          fetchCover();
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issueId]);

  async function fetchCover() {
    try {
      const res = await fetch(`/api/issues/${issueId}/render?pages=1`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.pages?.[0]) {
        setCoverHtml(data.pages[0]);
      }
    } catch {
      // Fall back to placeholder
    }
  }

  // Container is h-48 = 192px. Calculate scale.
  const CONTAINER_HEIGHT = 192;
  const scale = CONTAINER_HEIGHT / A4_HEIGHT;

  return (
    <div ref={containerRef} className="h-48 overflow-hidden relative bg-gradient-to-br from-[#1C1C1C] to-[#0a0a0a]">
      {coverHtml ? (
        <div className="absolute inset-0">
          <div
            style={{
              width: A4_WIDTH,
              height: A4_HEIGHT,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            <iframe
              srcDoc={coverHtml}
              title="Cover preview"
              className="border-0 pointer-events-none"
              style={{ width: A4_WIDTH, height: A4_HEIGHT }}
              sandbox="allow-same-origin"
              tabIndex={-1}
              loading="lazy"
              onLoad={() => setLoaded(true)}
            />
          </div>
          {/* Fade in overlay */}
          {!loaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-[#1C1C1C] to-[#0a0a0a]" />
          )}
        </div>
      ) : (
        fallback
      )}
    </div>
  );
}
