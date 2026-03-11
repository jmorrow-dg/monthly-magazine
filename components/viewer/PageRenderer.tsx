'use client';

import { useRef, useEffect, useState } from 'react';

type PageRendererProps = {
  html: string;
  className?: string;
};

export default function PageRenderer({ html, className = '' }: PageRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(1);

  // A4 dimensions in pixels at 96 DPI
  const A4_WIDTH = 794;
  const A4_HEIGHT = 1123;

  useEffect(() => {
    function calculateScale() {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;

      const scaleX = containerWidth / A4_WIDTH;
      const scaleY = containerHeight / A4_HEIGHT;
      setScale(Math.min(scaleX, scaleY, 1));
    }

    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, []);

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`} style={{ aspectRatio: `${A4_WIDTH}/${A4_HEIGHT}` }}>
      <div
        style={{
          width: A4_WIDTH,
          height: A4_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        <iframe
          ref={iframeRef}
          srcDoc={html}
          title="Magazine page"
          className="w-full h-full border-0"
          style={{ width: A4_WIDTH, height: A4_HEIGHT }}
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  );
}
