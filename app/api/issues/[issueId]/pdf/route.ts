import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getIssue, updateIssue, uploadPdf, createIssueAsset } from '@/lib/supabase/queries';
import { generateStandardPdf } from '@/lib/pdf/generator';

type RouteContext = { params: Promise<{ issueId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  try {
    const { issueId } = await context.params;
    const issue = await getIssue(issueId);

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    // Generate PDF
    const pdfBuffer = await generateStandardPdf(issue);

    // Upload to Supabase Storage
    const pdfUrl = await uploadPdf(issueId, pdfBuffer);

    // Update issue record
    await updateIssue(issueId, { pdf_url: pdfUrl });

    // Create asset record
    await createIssueAsset({
      issue_id: issueId,
      asset_type: 'pdf',
      url: pdfUrl,
      metadata_json: {
        size: pdfBuffer.length,
        generated_at: new Date().toISOString(),
      },
    });

    // Check if caller wants the binary PDF directly
    const { searchParams } = new URL(request.url);
    if (searchParams.get('download') === 'true') {
      return new NextResponse(Buffer.from(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="dg-ai-report-${issue.year}-${String(issue.month).padStart(2, '0')}.pdf"`,
        },
      });
    }

    return NextResponse.json({ pdf_url: pdfUrl });
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate PDF';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
