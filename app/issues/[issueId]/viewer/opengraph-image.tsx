import { ImageResponse } from 'next/og';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { getIssue } from '@/lib/supabase/queries';
import { monthName } from '@/lib/utils/format-date';

export const runtime = 'nodejs';
export const alt = 'David & Goliath AI Intelligence Report';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ issueId: string }> }) {
  const { issueId } = await params;

  const fontsDir = join(process.cwd(), 'public', 'fonts');
  const [playfairFont, interFont] = await Promise.all([
    readFile(join(fontsDir, 'PlayfairDisplay-Variable.ttf')),
    readFile(join(fontsDir, 'Inter-Variable.ttf')),
  ]);

  let headline = 'AI Intelligence Report';
  let subtitle = '';
  let editionText = '';
  let monthYear = '';

  try {
    const issue = await getIssue(issueId);
    if (issue) {
      headline = issue.cover_headline || headline;
      subtitle = issue.cover_subtitle || '';
      editionText = `Edition ${String(issue.edition).padStart(2, '0')}`;
      monthYear = `${monthName(issue.month)} ${issue.year}`;
    }
  } catch {
    // Use defaults
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#141414',
          padding: '0',
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
            padding: '48px 60px 40px',
          }}
        >
          {/* Top row: Brand + edition */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  fontFamily: 'Playfair Display',
                  letterSpacing: '-0.02em',
                }}
              >
                David & Goliath
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#B8860B',
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                  marginTop: '2px',
                }}
              >
                AI Intelligence Report
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              {editionText && (
                <div
                  style={{
                    fontSize: '14px',
                    color: '#B0B0B0',
                    fontWeight: 600,
                  }}
                >
                  {editionText}
                </div>
              )}
              {monthYear && (
                <div
                  style={{
                    fontSize: '12px',
                    color: '#888888',
                    marginTop: '2px',
                  }}
                >
                  {monthYear}
                </div>
              )}
            </div>
          </div>

          {/* Gold divider */}
          <div
            style={{
              width: '60px',
              height: '2px',
              backgroundColor: '#B8860B',
              marginTop: '36px',
              display: 'flex',
            }}
          />

          {/* Headline */}
          <div
            style={{
              fontSize: '48px',
              fontWeight: 700,
              color: '#FFFFFF',
              fontFamily: 'Playfair Display',
              lineHeight: 1.15,
              marginTop: '24px',
              maxWidth: '900px',
            }}
          >
            {headline}
          </div>

          {/* Subtitle */}
          {subtitle && (
            <div
              style={{
                fontSize: '18px',
                color: '#B0B0B0',
                marginTop: '16px',
                lineHeight: 1.5,
                maxWidth: '800px',
              }}
            >
              {subtitle}
            </div>
          )}

          {/* Spacer */}
          <div style={{ flex: 1, display: 'flex' }} />

          {/* Bottom bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid #333333',
              paddingTop: '16px',
            }}
          >
            <div style={{ fontSize: '12px', color: '#666666' }}>davidandgoliath.ai</div>
            <div
              style={{
                fontSize: '11px',
                color: '#B8860B',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
              }}
            >
              Strategic AI Insights for Operators
            </div>
          </div>
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
