import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { createIssue, upsertIssuePage } from '@/lib/supabase/queries';
import { createIssueSchema } from '@/lib/schemas/issue.schema';
import { editionLabel } from '@/lib/utils/format-date';
import type { PageType, SpreadPosition } from '@/lib/types/issue';

const PAGE_DEFINITIONS: { page_number: number; page_type: PageType; spread_position: SpreadPosition; title: string }[] = [
  { page_number: 1, page_type: 'cover', spread_position: 'full', title: 'Cover' },
  { page_number: 2, page_type: 'editorial', spread_position: 'left', title: 'Editorial Notes' },
  { page_number: 3, page_type: 'why-this-matters', spread_position: 'right', title: 'Why This Matters' },
  { page_number: 4, page_type: 'section-divider', spread_position: 'left', title: 'Cover Story' },
  { page_number: 5, page_type: 'cover-story-intro', spread_position: 'right', title: 'Cover Story' },
  { page_number: 6, page_type: 'cover-story-analysis', spread_position: 'left', title: 'Cover Story Analysis' },
  { page_number: 7, page_type: 'cover-story-implications', spread_position: 'right', title: 'Cover Story Implications' },
  { page_number: 8, page_type: 'strategic-implications', spread_position: 'left', title: 'Strategic Implications' },
  { page_number: 9, page_type: 'enterprise', spread_position: 'right', title: 'Enterprise AI Adoption' },
  { page_number: 10, page_type: 'industry-watch', spread_position: 'left', title: 'Industry Watch' },
  { page_number: 11, page_type: 'tools', spread_position: 'right', title: 'Tools Worth Watching' },
  { page_number: 12, page_type: 'section-divider', spread_position: 'left', title: 'Operator Playbooks' },
  { page_number: 13, page_type: 'playbook', spread_position: 'right', title: 'Operator Playbooks' },
  { page_number: 14, page_type: 'playbook-continued', spread_position: 'left', title: 'More Playbooks' },
  { page_number: 15, page_type: 'strategic-signals', spread_position: 'right', title: 'Strategic Signals' },
  { page_number: 16, page_type: 'closing', spread_position: 'full', title: 'Closing' },
];

export async function POST(request: Request) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createIssueSchema.parse(body);

    const label = editionLabel(parsed.edition, parsed.month, parsed.year);

    const issue = await createIssue({
      month: parsed.month,
      year: parsed.year,
      edition: parsed.edition,
      cover_headline: parsed.cover_headline || 'AI Intelligence Report',
      cover_subtitle: parsed.cover_subtitle || null,
      cover_edition_label: label,
    });

    // Create 16 page rows
    for (const pageDef of PAGE_DEFINITIONS) {
      await upsertIssuePage({
        issue_id: issue.id,
        page_number: pageDef.page_number,
        page_type: pageDef.page_type,
        spread_position: pageDef.spread_position,
        title: pageDef.title,
      });
    }

    return NextResponse.json({ issue });
  } catch (error) {
    console.error('Failed to generate issue:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate issue';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
