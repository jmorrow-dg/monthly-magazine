'use client';

import { useRef, useState, useEffect } from 'react';
import PageRenderer from './PageRenderer';

type LazyPageRendererProps = {
  html: string;
  className?: string;
  /** Distance in px before the viewport to start loading (default 400) */
  rootMargin?: string;
};

/**
 * Wraps PageRenderer with IntersectionObserver-based lazy loading.
 * The iframe is only mounted once the container scrolls near the viewport,
 * dramatically reducing initial DOM weight on mobile (24 iframes -> ~3-4).
 */
export default function LazyPageRenderer({
  html,
  className = '',
  rootMargin = '400px',
}: LazyPageRendererProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  // Placeholder has the same aspect ratio so layout doesn't shift
  if (!visible) {
    return (
      <div
        ref={sentinelRef}
        className={`bg-[#1a1a1a] ${className}`}
        style={{ aspectRatio: '794/1123' }}
      />
    );
  }

  return (
    <div ref={sentinelRef}>
      <PageRenderer html={html} className={className} />
    </div>
  );
}
