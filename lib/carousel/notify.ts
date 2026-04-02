/**
 * Carousel Notification System
 *
 * Sends Slack notifications when carousels are ready for review.
 * Uses Slack Incoming Webhooks for simplicity (no SDK needed).
 *
 * Setup: Create a Slack Incoming Webhook and set SLACK_CAROUSEL_WEBHOOK_URL in .env.local
 * Guide: https://api.slack.com/messaging/webhooks
 */

import type { Carousel, Platform } from './types';

const WEBHOOK_URL = process.env.SLACK_CAROUSEL_WEBHOOK_URL;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface SlackBlock {
  type: string;
  text?: { type: string; text: string; emoji?: boolean };
  elements?: Array<{ type: string; text?: { type: string; text: string }; url?: string; action_id?: string; value?: string; style?: string }>;
  fields?: Array<{ type: string; text: string }>;
  accessory?: { type: string; image_url: string; alt_text: string };
}

/**
 * Send a Slack notification for a new carousel pending review.
 * Includes a visual preview and approve/reject buttons.
 */
export async function notifyCarouselReady(carousel: Carousel): Promise<boolean> {
  if (!WEBHOOK_URL) {
    console.warn('[Slack] SLACK_CAROUSEL_WEBHOOK_URL not set. Skipping notification.');
    return false;
  }

  const previewUrl = carousel.slideUrls[0] || '';
  const reviewUrl = `${APP_URL}/api/carousels/${carousel.id}`;

  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: 'New Carousel Ready for Review',
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Signal:* ${carousel.sourceSignalTitle}\n*Category:* ${carousel.sourceSignalCategory}\n*Platforms:* ${carousel.platforms.join(', ')}`,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Slide 2 Headline:*\n${carousel.content.signal.headline}`,
        },
        {
          type: 'mrkdwn',
          text: `*CTA:*\n${carousel.content.closer.ctaText || 'None'}`,
        },
      ],
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Why It Matters:*\n${carousel.content.insight.bullets.map((b) => `  \u2022 ${b}`).join('\n')}`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Personal Slide:*\n_"${carousel.content.personal.text}"_`,
      },
    },
  ];

  // Add hero image preview if available
  if (previewUrl) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Hero Slide Preview:*',
      },
      accessory: {
        type: 'image',
        image_url: previewUrl,
        alt_text: 'Hero slide preview',
      },
    });
  }

  // LinkedIn caption preview
  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*LinkedIn Caption:*\n\`\`\`${truncate(carousel.captions.linkedin, 300)}\`\`\``,
    },
  });

  // Action buttons
  blocks.push({
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: { type: 'plain_text', text: 'Approve' },
        style: 'primary',
        action_id: 'carousel_approve',
        value: carousel.id,
      },
      {
        type: 'button',
        text: { type: 'plain_text', text: 'Reject' },
        style: 'danger',
        action_id: 'carousel_reject',
        value: carousel.id,
      },
      {
        type: 'button',
        text: { type: 'plain_text', text: 'View Full Details' },
        url: reviewUrl,
        action_id: 'carousel_view',
      },
    ],
  });

  // Divider
  blocks.push({ type: 'divider' });

  // Slide URLs for all platforms
  const platformLinks = carousel.platforms
    .map((p) => `<${APP_URL}/api/carousels/${carousel.id}|${p}>`)
    .join(' | ');

  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*Download slides:* ${platformLinks}\n_Carousel ID: \`${carousel.id}\`_`,
    },
  });

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Slack] Webhook failed: ${response.status} ${errorText}`);
      return false;
    }

    console.log(`[Slack] Carousel review notification sent for ${carousel.id}`);
    return true;
  } catch (err) {
    console.error('[Slack] Notification error:', err);
    return false;
  }
}

/**
 * Send notification when a carousel is approved.
 */
export async function notifyCarouselApproved(carouselId: string, signalTitle: string): Promise<boolean> {
  if (!WEBHOOK_URL) return false;

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `Carousel *approved* and queued for posting.\n*Signal:* ${signalTitle}\n*ID:* \`${carouselId}\``,
            },
          },
        ],
      }),
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Send a weekly summary of carousel activity.
 */
export async function notifyWeeklySummary(
  generated: number,
  approved: number,
  posted: number,
  weekNumber: number,
): Promise<boolean> {
  if (!WEBHOOK_URL) return false;

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `Carousel Engine: Week ${weekNumber} Summary`,
            },
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Generated:* ${generated}` },
              { type: 'mrkdwn', text: `*Approved:* ${approved}` },
              { type: 'mrkdwn', text: `*Posted:* ${posted}` },
              { type: 'mrkdwn', text: `*Pending:* ${generated - approved - (generated - approved - posted > 0 ? generated - approved - posted : 0)}` },
            ],
          },
        ],
      }),
    });

    return response.ok;
  } catch {
    return false;
  }
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}
