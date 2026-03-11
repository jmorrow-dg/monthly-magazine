import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { createIssue, upsertIssuePage } from '@/lib/supabase/queries';
import { createIssueSchema } from '@/lib/schemas/issue.schema';
import { editionLabel } from '@/lib/utils/format-date';
import type { PageType, SpreadPosition } from '@/lib/types/issue';

const PAGE_DEFINITIONS: { page_number: number; page_type: PageType; spread_position: SpreadPosition; title: string }[] = [
  { page_number: 1, page_type: 'cover', spread_position: 'full', title: 'Cover' },
  { page_number: 2, page_type: 'editorial', spread_position: 'left', title: 'Editorial Notes' },
  { page_number: 3, page_type: 'developments', spread_position: 'right', title: 'Major AI Developments' },
  { page_number: 4, page_type: 'implications', spread_position: 'left', title: 'Strategic Implications' },
  { page_number: 5, page_type: 'enterprise', spread_position: 'right', title: 'Enterprise AI Adoption' },
  { page_number: 6, page_type: 'tools', spread_position: 'left', title: 'Tools Worth Watching' },
  { page_number: 7, page_type: 'playbooks', spread_position: 'right', title: 'Operator Playbooks' },
  { page_number: 8, page_type: 'closing', spread_position: 'full', title: 'Closing' },
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

    // Create 8 page rows
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
