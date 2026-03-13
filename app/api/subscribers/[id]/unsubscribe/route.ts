import { NextResponse } from 'next/server';
import { unsubscribe } from '@/lib/supabase/subscriber-queries';

type RouteContext = { params: Promise<{ id: string }> };

// Public endpoint - no auth required (used from email unsubscribe links)
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await unsubscribe(id);

    // Return a simple HTML page confirming unsubscription
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Unsubscribed</title>
  <style>
    body { margin: 0; padding: 60px 20px; background: #141414; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; text-align: center; }
    .container { max-width: 480px; margin: 0 auto; }
    h1 { font-size: 24px; margin-bottom: 16px; }
    p { font-size: 14px; color: #B0B0B0; line-height: 1.6; }
    .brand { color: #B8860B; font-size: 12px; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="brand">David & Goliath</div>
    <h1>You have been unsubscribed</h1>
    <p>You will no longer receive the AI Intelligence Report via email. If this was a mistake, please contact us to resubscribe.</p>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  } catch {
    return new NextResponse('<h1>Something went wrong</h1>', {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}
