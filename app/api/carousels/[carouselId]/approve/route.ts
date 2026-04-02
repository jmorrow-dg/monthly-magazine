/**
 * POST /api/carousels/[carouselId]/approve
 *
 * Approve or reject a carousel.
 * Body: { action: 'approve' | 'reject' }
 */

import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/client';

interface ApproveBody {
  action: 'approve' | 'reject';
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ carouselId: string }> },
) {
  try {
    const { carouselId } = await params;
    const body = (await request.json()) as ApproveBody;

    if (!['approve', 'reject'].includes(body.action)) {
      return NextResponse.json(
        { error: 'action must be "approve" or "reject"' },
        { status: 400 },
      );
    }

    const supabase = getSupabase();

    const { data: existing, error: fetchError } = await supabase
      .from('carousels')
      .select('id, status')
      .eq('id', carouselId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Carousel not found' }, { status: 404 });
    }

    if (existing.status !== 'pending_review') {
      return NextResponse.json(
        { error: `Cannot ${body.action} a carousel with status "${existing.status}"` },
        { status: 400 },
      );
    }

    const newStatus = body.action === 'approve' ? 'approved' : 'rejected';
    const updates: Record<string, unknown> = { status: newStatus };

    if (body.action === 'approve') {
      updates.approved_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('carousels')
      .update(updates)
      .eq('id', carouselId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      message: `Carousel ${body.action}d successfully`,
      status: newStatus,
    });
  } catch (err) {
    console.error('Approve carousel error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    );
  }
}
