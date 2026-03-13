import type { Issue } from '@/lib/types/issue';
import { monthName } from '@/lib/utils/format-date';

type EmailTemplateInput = {
  issue: Issue;
  baseUrl: string;
  subscriberId: string;
};

export function buildIssueEmailHtml({
  issue,
  baseUrl,
  subscriberId,
}: EmailTemplateInput): string {
  const viewerUrl = `${baseUrl}/issues/${issue.id}/viewer`;
  const unsubscribeUrl = `${baseUrl}/api/subscribers/${subscriberId}/unsubscribe`;
  const month = monthName(issue.month);
  const editionLabel = `Edition #${String(issue.edition).padStart(2, '0')}`;

  const coverStory = issue.cover_story_json;
  const intro = coverStory?.introduction || '';
  const previewText = intro.split('\n\n')[0]?.substring(0, 200) || '';

  const pdfUrl = issue.pdf_url;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(issue.cover_headline)} | ${editionLabel}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #0A0A0A;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td style="padding: 24px 32px; background-color: #141414; border-bottom: 2px solid #B8860B;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td>
                    <div style="font-size: 10px; color: #B8860B; text-transform: uppercase; letter-spacing: 3px; font-weight: 600;">David & Goliath</div>
                    <div style="font-size: 18px; color: #FFFFFF; font-weight: 700; margin-top: 4px;">AI Intelligence Report</div>
                  </td>
                  <td align="right" style="vertical-align: bottom;">
                    <div style="font-size: 11px; color: #888888;">${month} ${issue.year}</div>
                    <div style="font-size: 11px; color: #B8860B; font-weight: 600;">${editionLabel}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="padding: 40px 32px 32px; background-color: #141414;">
              <div style="font-size: 24px; color: #FFFFFF; font-weight: 700; line-height: 1.3; margin-bottom: 12px;">
                ${escapeHtml(issue.cover_headline)}
              </div>
              ${issue.cover_subtitle ? `<div style="font-size: 14px; color: #B0B0B0; line-height: 1.5; margin-bottom: 16px;">${escapeHtml(issue.cover_subtitle)}</div>` : ''}
              ${coverStory?.subheadline ? `<div style="font-size: 13px; color: #B8860B; font-style: italic; margin-bottom: 16px;">${escapeHtml(coverStory.subheadline)}</div>` : ''}
            </td>
          </tr>

          <!-- Cover Story Preview -->
          ${previewText ? `
          <tr>
            <td style="padding: 0 32px 32px; background-color: #141414;">
              <div style="font-size: 10px; color: #B8860B; text-transform: uppercase; letter-spacing: 2px; font-weight: 600; margin-bottom: 12px;">Cover Story</div>
              <div style="font-size: 13px; color: #B0B0B0; line-height: 1.6;">
                ${escapeHtml(previewText)}${previewText.length >= 200 ? '...' : ''}
              </div>
            </td>
          </tr>` : ''}

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 32px 40px; background-color: #141414;">
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="background-color: #B8860B; border-radius: 8px;">
                    <a href="${viewerUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 600; color: #FFFFFF; text-decoration: none;">
                      Read Full Report
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${pdfUrl ? `
          <!-- PDF Link -->
          <tr>
            <td style="padding: 0 32px 32px; background-color: #141414;">
              <a href="${pdfUrl}" target="_blank" style="font-size: 12px; color: #B8860B; text-decoration: underline;">
                Download PDF Version
              </a>
            </td>
          </tr>` : ''}

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #0F0F0F; border-top: 1px solid #333333;">
              <div style="font-size: 11px; color: #666666; line-height: 1.6;">
                This report is published by <span style="color: #B8860B;">David & Goliath</span>, an AI consulting firm helping organisations harness artificial intelligence.
              </div>
              <div style="margin-top: 16px;">
                <a href="${unsubscribeUrl}" style="font-size: 10px; color: #666666; text-decoration: underline;">Unsubscribe</a>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildIssueEmailText({
  issue,
  baseUrl,
  subscriberId,
}: EmailTemplateInput): string {
  const viewerUrl = `${baseUrl}/issues/${issue.id}/viewer`;
  const unsubscribeUrl = `${baseUrl}/api/subscribers/${subscriberId}/unsubscribe`;
  const month = monthName(issue.month);
  const editionLabel = `Edition #${String(issue.edition).padStart(2, '0')}`;

  const coverStory = issue.cover_story_json;
  const intro = coverStory?.introduction || '';
  const previewText = intro.split('\n\n')[0]?.substring(0, 200) || '';

  const pdfUrl = issue.pdf_url;

  return `DAVID & GOLIATH AI INTELLIGENCE REPORT
${editionLabel} | ${month} ${issue.year}

${issue.cover_headline}
${issue.cover_subtitle || ''}

${coverStory?.subheadline ? `${coverStory.subheadline}\n\n` : ''}${previewText ? `COVER STORY\n\n${previewText}${previewText.length >= 200 ? '...' : ''}\n\n` : ''}Read the full report: ${viewerUrl}
${pdfUrl ? `\nDownload PDF: ${pdfUrl}` : ''}

---
Published by David & Goliath | AI Consulting

Unsubscribe: ${unsubscribeUrl}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
