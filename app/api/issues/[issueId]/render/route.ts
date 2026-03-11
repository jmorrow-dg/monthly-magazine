import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getIssue } from '@/lib/supabase/queries';
import { renderCover } from '@/lib/templates/page-01-cover';
import { renderEditorial } from '@/lib/templates/page-02-editorial';
import { renderDevelopments } from '@/lib/templates/page-03-developments';
import { renderImplications } from '@/lib/templates/page-04-implications';
import { renderEnterprise } from '@/lib/templates/page-05-enterprise';
import { renderTools } from '@/lib/templates/page-06-tools';
import { renderPlaybooks } from '@/lib/templates/page-07-playbooks';
import { renderClosing } from '@/lib/templates/page-08-closing';
import { monthName, editionLabel as buildEditionLabel } from '@/lib/utils/format-date';

type RouteContext = { params: Promise<{ issueId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { issueId } = await context.params;
    const issue = await getIssue(issueId);

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    const authenticated = await isAuthenticated();

    // Public users can only view published issues; admin can view all except archived
    if (!authenticated && issue.status !== 'published') {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    if (issue.status === 'archived') {
      return NextResponse.json({ error: 'Issue not available' }, { status: 404 });
    }

    const month = monthName(issue.month);
    const label = issue.cover_edition_label || buildEditionLabel(issue.edition, issue.month, issue.year);

    const pages = [
      renderCover({ headline: issue.cover_headline, subtitle: issue.cover_subtitle, editionLabel: label, coverImageUrl: issue.cover_image_url }),
      renderEditorial({ note: issue.editorial_note || '', month, edition: issue.edition }),
      renderDevelopments({ items: issue.developments_json || [] }),
      renderImplications({ items: issue.implications_json || [] }),
      renderEnterprise({ items: issue.enterprise_json || [] }),
      renderTools({ items: issue.tools_json || [] }),
      renderPlaybooks({ items: issue.playbooks_json || [] }),
      renderClosing({ edition: issue.edition, month, year: issue.year }),
    ];

    return NextResponse.json({ pages });
  } catch (error) {
    console.error('Failed to render issue:', error);
    return NextResponse.json({ error: 'Failed to render issue' }, { status: 500 });
  }
}
