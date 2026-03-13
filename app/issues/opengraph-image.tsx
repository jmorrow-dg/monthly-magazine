import { ImageResponse } from 'next/og';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const alt = 'David & Goliath AI Intelligence Report Archive';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const fontsDir = join(process.cwd(), 'public', 'fonts');
  const [playfairFont, interFont] = await Promise.all([
    readFile(join(fontsDir, 'PlayfairDisplay-Variable.ttf')),
    readFile(join(fontsDir, 'Inter-Variable.ttf')),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#141414',
          fontFamily: 'Inter',
        }}
      >
        {/* Gold accent bar */}
        <div style={{ width: '100%', height: '4px', backgroundColor: '#B8860B', display: 'flex' }} />

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 60px',
          }}
        >
          {/* Brand label */}
          <div
            style={{
              fontSize: '12px',
              color: '#B8860B',
              textTransform: 'uppercase',
              letterSpacing: '0.25em',
              marginBottom: '16px',
            }}
          >
            David & Goliath
          </div>

          {/* Main title */}
          <div
            style={{
              fontSize: '52px',
              fontWeight: 700,
              color: '#FFFFFF',
              fontFamily: 'Playfair Display',
              textAlign: 'center',
              lineHeight: 1.15,
            }}
          >
            AI Intelligence Report
          </div>

          {/* Gold divider */}
          <div
            style={{
              width: '80px',
              height: '2px',
              backgroundColor: '#B8860B',
              marginTop: '28px',
              marginBottom: '28px',
              display: 'flex',
            }}
          />

          {/* Subtitle */}
          <div
            style={{
              fontSize: '20px',
              color: '#B0B0B0',
              textAlign: 'center',
            }}
          >
            Browse all published editions
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: '14px',
              color: '#888888',
              marginTop: '8px',
              textAlign: 'center',
            }}
          >
            Strategic AI insights for Australian operators
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '16px',
            borderTop: '1px solid #333333',
          }}
        >
          <div style={{ fontSize: '12px', color: '#666666' }}>davidandgoliath.ai</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Playfair Display',
          data: playfairFont,
          style: 'normal',
          weight: 700,
        },
        {
          name: 'Inter',
          data: interFont,
          style: 'normal',
          weight: 400,
        },
      ],
    }
  );
}
