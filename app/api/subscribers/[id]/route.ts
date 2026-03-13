import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { unsubscribe, deleteSubscriber, updateSubscriberProfile } from '@/lib/supabase/subscriber-queries';

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    await deleteSubscriber(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete subscriber' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const { action, role, industry, company_size } = body as {
      action?: string;
      role?: string;
      industry?: string;
      company_size?: string;
    };

    // If action is 'unsubscribe', handle unsubscription
    if (action === 'unsubscribe') {
      await unsubscribe(id);
      return NextResponse.json({ success: true });
    }

    // Otherwise, update profile fields
    const profile: { role?: string | null; industry?: string | null; company_size?: string | null } = {};
    if (role !== undefined) profile.role = role || null;
    if (industry !== undefined) profile.industry = industry || null;
    if (company_size !== undefined) profile.company_size = company_size || null;

    if (Object.keys(profile).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const subscriber = await updateSubscriberProfile(id, profile);
    return NextResponse.json({ subscriber });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update subscriber' },
      { status: 500 },
    );
  }
}
