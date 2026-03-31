import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getIssue, updateIssue } from '@/lib/supabase/queries';
import type { Issue } from '@/lib/types/issue';
import type { FixPreview } from '../generate-fixes/route';

export const maxDuration = 30;

type RouteContext = { params: Promise<{ issueId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  try {
    const { issueId } = await context.params;
    const body = await request.json();
    const fixes: FixPreview[] = body.fixes || [];

    if (fixes.length === 0) {
      return NextResponse.json({ error: 'No fixes provided' }, { status: 400 });
    }

    const issue = await getIssue(issueId);
    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    // Build update payload by applying fixes to current issue data
    const updates: Partial<Issue> = {};
    let appliedCount = 0;

    for (const fix of fixes) {
      try {
        const { db_field, field, item_index, fixed_text } = fix;

        if (db_field === 'editorial_note' || db_field === 'why_this_matters') {
          // Top-level string fields
          (updates as Record<string, unknown>)[db_field] = fixed_text;
          appliedCount++;
        } else if (db_field === 'global_landscape_json' || db_field === 'regional_signals_json') {
          // Structured JSON fields - parse the fixed JSON
          try {
            const parsed = JSON.parse(fixed_text);
            (updates as Record<string, unknown>)[db_field] = parsed;
            appliedCount++;
          } catch {
            console.error(`Failed to parse fixed JSON for ${db_field}`);
          }
        } else if (item_index !== null && item_index >= 0) {
          // Array item field update
          const currentArray = (updates as Record<string, unknown>)[db_field]
            ?? (issue as Record<string, unknown>)[db_field];

          if (Array.isArray(currentArray)) {
            const arrayCopy = JSON.parse(JSON.stringify(currentArray));
            if (arrayCopy[item_index] && typeof arrayCopy[item_index] === 'object') {
              arrayCopy[item_index][field] = fixed_text;
              (updates as Record<string, unknown>)[db_field] = arrayCopy;
              appliedCount++;
            }
          }
        } else if (item_index === null) {
          // Object field update (e.g., cover_story_json.introduction)
          const currentObj = (updates as Record<string, unknown>)[db_field]
            ?? (issue as Record<string, unknown>)[db_field];

          if (currentObj && typeof currentObj === 'object' && !Array.isArray(currentObj)) {
            const objCopy = JSON.parse(JSON.stringify(currentObj));
            objCopy[field] = fixed_text;
            (updates as Record<string, unknown>)[db_field] = objCopy;
            appliedCount++;
          }
        }
      } catch (fixError) {
        console.error(`Failed to apply fix ${fix.id}:`, fixError);
      }
    }

    if (appliedCount === 0) {
      return NextResponse.json({ error: 'No fixes could be applied' }, { status: 400 });
    }

    // Save to database
    await updateIssue(issueId, updates);

    return NextResponse.json({
      success: true,
      applied_count: appliedCount,
      total_fixes: fixes.length,
      summary: `Applied ${appliedCount} of ${fixes.length} fixes. Run QA Review to see updated score.`,
    });
  } catch (error) {
    console.error('Apply fixes failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Apply fixes failed' },
      { status: 500 },
    );
  }
}
