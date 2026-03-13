import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { listSubscribers, createSubscriber, getSubscriberCount } from '@/lib/supabase/subscriber-queries';

export async function GET(request: Request) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    const [subscribers, counts] = await Promise.all([
      listSubscribers({ status, search }),
      getSubscriberCount(),
    ]);

    return NextResponse.json({ subscribers, counts });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list subscribers' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { email, name, role, industry, company_size } = body as {
      email: string;
      name?: string;
      role?: string;
      industry?: string;
      company_size?: string;
    };

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const subscriber = await createSubscriber({ email, name, role, industry, company_size });
    return NextResponse.json({ subscriber }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create subscriber' },
      { status: 500 },
    );
  }
}
