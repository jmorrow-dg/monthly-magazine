import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { bulkUpsertSubscribers } from '@/lib/supabase/subscriber-queries';

export async function POST(request: Request) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { subscribers } = body as { subscribers: Array<{ email: string; name?: string; role?: string; industry?: string; company_size?: string }> };

    if (!Array.isArray(subscribers) || subscribers.length === 0) {
      return NextResponse.json({ error: 'subscribers array is required' }, { status: 400 });
    }

    if (subscribers.length > 500) {
      return NextResponse.json({ error: 'Maximum 500 subscribers per request' }, { status: 400 });
    }

    const result = await bulkUpsertSubscribers(subscribers);
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Import failed' },
      { status: 500 },
    );
  }
}
