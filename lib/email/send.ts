import { Resend } from 'resend';
import type { Issue } from '@/lib/types/issue';
import { getActiveSubscribers } from '@/lib/supabase/subscriber-queries';
import { buildIssueEmailHtml, buildIssueEmailText } from './templates';
import { monthName } from '@/lib/utils/format-date';

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY environment variable is not set');
  return new Resend(apiKey);
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
}

export type DistributionResult = {
  sent: number;
  failed: number;
  errors: string[];
};

export async function sendIssueToSubscribers(issue: Issue): Promise<DistributionResult> {
  const resend = getResend();
  const baseUrl = getBaseUrl();
  const subscribers = await getActiveSubscribers();

  if (subscribers.length === 0) {
    return { sent: 0, failed: 0, errors: ['No active subscribers found'] };
  }

  const month = monthName(issue.month);
  const editionLabel = `Edition #${String(issue.edition).padStart(2, '0')}`;
  const subject = `${issue.cover_headline} | AI Intelligence Report ${editionLabel} | ${month} ${issue.year}`;

  const result: DistributionResult = { sent: 0, failed: 0, errors: [] };

  // Send emails in batches of 10
  const emailBatchSize = 10;

  for (let i = 0; i < subscribers.length; i += emailBatchSize) {
    const batch = subscribers.slice(i, i + emailBatchSize);

    const promises = batch.map(async (subscriber) => {
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'AI Intelligence Report <report@davidandgoliath.ai>',
          to: subscriber.email,
          subject,
          html: buildIssueEmailHtml({
            issue,
            baseUrl,
            subscriberId: subscriber.id,
          }),
          text: buildIssueEmailText({
            issue,
            baseUrl,
            subscriberId: subscriber.id,
          }),
        });
        result.sent++;
      } catch (err) {
        result.failed++;
        result.errors.push(`${subscriber.email}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    });

    await Promise.all(promises);
  }

  return result;
}
