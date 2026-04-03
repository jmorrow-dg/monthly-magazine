/**
 * GET /api/cron/weekly-magazine
 *
 * Automated weekly magazine generation.
 * Called by Vercel Cron every Sunday at 6:00 AM AEST (Saturday 20:00 UTC).
 *
 * Pipeline:
 * 1. Compute the week range (Mon-Sun)
 * 2. Check if a weekly issue already exists for this week
 * 3. Create issue skeleton with format='weekly'
 * 4. Trigger AI content generation from weekly signals
 * 5. Auto-publish if QA passes
 * 6. Send Slack notification
 */

import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/client';
import { createIssue, updateIssue } from '@/lib/supabase/queries';
import { getWeekRange, fetchWeeklySignals, buildWeeklySignalContext } from '@/lib/intelligence/fetch-weekly-signals';
import {
  generateWeeklyLeadStory,
  generateWeeklyImplications,
  generateWeeklyEnterprise,
  generateWeeklyIndustryWatch,
  generateWeeklyTools,
  generateWeeklyPlaybook,
  generateWeeklyStrategicSignals,
  generateWeeklyBriefingPrompts,
  generateWeeklyExecutiveBriefing,
  generateWeeklyEditorial,
  generateWeeklyOutlookSignals,
} from '@/lib/ai/generate-weekly-content';
import { sanitiseDashes, sanitiseDashesDeep } from '@/lib/utils/sanitise-dashes';
import { runIssueQA } from '@/lib/qa/run-issue-qa';
import { createQAReport } from '@/lib/supabase/queries';
import type { Issue } from '@/lib/types/issue';

const CRON_SECRET = process.env.CRON_SECRET;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

export const maxDuration = 300;

export async function GET(request: Request) {
  // Verify cron auth
  if (CRON_SECRET) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    // 1. Compute the week range
    const { weekStart, weekEnd } = getWeekRange(new Date());
    const now = new Date();

    // 2. Check if weekly issue already exists for this week
    const supabase = getSupabase();
    const { data: existing } = await supabase
      .from('issues')
      .select('id, status')
      .eq('format', 'weekly')
      .eq('week_start', weekStart)
      .eq('week_end', weekEnd)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        skipped: true,
        reason: `Weekly issue already exists for ${weekStart} to ${weekEnd}`,
        issueId: existing.id,
        status: existing.status,
      });
    }

    // 3. Fetch signals for the week
    const feed = await fetchWeeklySignals(weekStart, weekEnd);

    if (feed.signals.length < 5) {
      await notifySlack(
        `:warning: Weekly magazine skipped for ${weekStart} to ${weekEnd}: only ${feed.signals.length} signals (minimum 5 required).`,
      );
      return NextResponse.json({
        skipped: true,
        reason: `Insufficient signals: ${feed.signals.length} (minimum 5)`,
        weekStart,
        weekEnd,
      });
    }

    // 4. Compute edition number (weekly editions counted from W1)
    const { count } = await supabase
      .from('issues')
      .select('id', { count: 'exact', head: true })
      .eq('format', 'weekly');
    const edition = (count || 0) + 1;

    // 5. Create issue skeleton
    const issue = await createIssue({
      title: 'David & Goliath Weekly AI Intelligence',
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      edition,
      cover_headline: 'Weekly AI Intelligence',
      cover_edition_label: `Weekly Edition W${edition}`,
      format: 'weekly',
      week_start: weekStart,
      week_end: weekEnd,
    });

    // 6. Generate content
    const signalContext = buildWeeklySignalContext(feed);
    const weekRange = `${formatWeekDate(weekStart)} - ${formatWeekDate(weekEnd)}`;

    // Step 1: Lead story
    const leadStory = await generateWeeklyLeadStory(signalContext);

    // Step 2: Implications + strategic signals in parallel
    const [implications, strategicSignals] = await Promise.all([
      generateWeeklyImplications(leadStory, signalContext),
      generateWeeklyStrategicSignals(leadStory, [], signalContext),
    ]);

    // Step 3: Remaining sections in parallel
    const [enterprise, industryWatch, tools, playbook, briefingPrompts, executiveBriefing, editorial, outlookSignals] = await Promise.all([
      generateWeeklyEnterprise(leadStory, signalContext),
      generateWeeklyIndustryWatch(leadStory, signalContext),
      generateWeeklyTools(signalContext),
      generateWeeklyPlaybook(leadStory, signalContext),
      generateWeeklyBriefingPrompts(leadStory, signalContext),
      generateWeeklyExecutiveBriefing(leadStory, implications, signalContext),
      generateWeeklyEditorial(leadStory, weekRange),
      generateWeeklyOutlookSignals(leadStory, strategicSignals, signalContext),
    ]);

    // 7. Save content
    const updateData: Record<string, unknown> = {
      cover_story_json: sanitiseDashesDeep(leadStory),
      cover_headline: sanitiseDashes(leadStory.headline),
      cover_subtitle: sanitiseDashes(leadStory.subheadline),
      implications_json: sanitiseDashesDeep(implications),
      enterprise_json: sanitiseDashesDeep(enterprise),
      industry_watch_json: sanitiseDashesDeep(industryWatch),
      tools_json: sanitiseDashesDeep(tools),
      playbooks_json: sanitiseDashesDeep(playbook),
      strategic_signals_json: sanitiseDashesDeep([...strategicSignals, ...outlookSignals]),
      briefing_prompts_json: sanitiseDashesDeep(briefingPrompts),
      executive_briefing_json: sanitiseDashesDeep(executiveBriefing),
      editorial_note: sanitiseDashes(editorial),
      generation_mode: 'signals',
      source_signal_ids: feed.signals.map((s) => s.id),
    };

    const updated = await updateIssue(issue.id, updateData);

    // 8. Run QA
    let qaResult = null;
    if (updated) {
      try {
        const report = await runIssueQA(updated);
        await createQAReport(report);
        await updateIssue(issue.id, {
          qa_score: report.qa_score,
          qa_passed: report.qa_passed,
          qa_status: report.qa_status,
          qa_summary: report.summary,
          last_qa_run_at: new Date().toISOString(),
        } as Partial<Issue>);
        qaResult = { qa_score: report.qa_score, qa_passed: report.qa_passed };

        // 9. Auto-publish if QA passes
        if (report.qa_passed) {
          await updateIssue(issue.id, { status: 'published' } as Partial<Issue>);
        } else {
          await updateIssue(issue.id, { status: 'review' } as Partial<Issue>);
        }
      } catch (qaError) {
        console.error('Weekly QA failed (non-fatal):', qaError);
        await updateIssue(issue.id, { status: 'review' } as Partial<Issue>);
      }
    }

    // 10. Notify Slack
    const status = qaResult?.qa_passed ? 'Published' : 'In Review';
    await notifySlack(
      `:newspaper: Weekly AI Intelligence W${edition} generated!\n` +
      `*${leadStory.headline}*\n` +
      `Week: ${weekRange}\n` +
      `Signals: ${feed.total} | QA: ${qaResult?.qa_score?.toFixed(1) || 'N/A'}/100\n` +
      `Status: ${status}`,
    );

    return NextResponse.json({
      generated: true,
      issueId: issue.id,
      edition,
      headline: leadStory.headline,
      signalCount: feed.total,
      weekRange,
      qa: qaResult,
      status,
    });
  } catch (error) {
    console.error('Weekly magazine cron failed:', error);
    const message = error instanceof Error ? error.message : 'Weekly generation failed';
    await notifySlack(`:x: Weekly magazine generation failed: ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function formatWeekDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

async function notifySlack(text: string): Promise<void> {
  if (!SLACK_WEBHOOK_URL) return;
  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
  } catch {
    console.error('Slack notification failed');
  }
}
