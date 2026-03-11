import { cookies } from 'next/headers';
import crypto from 'crypto';

const COOKIE_NAME = 'dg-magazine-session';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSecret(): Buffer {
  const password = process.env.APP_PASSWORD;
  if (!password) throw new Error('APP_PASSWORD environment variable is not set');
  return crypto.createHash('sha256').update(password).digest();
}

export function verifyPassword(input: string): boolean {
  const password = process.env.APP_PASSWORD;
  if (!password) return false;

  const inputBuf = Buffer.from(input);
  const passwordBuf = Buffer.from(password);

  if (inputBuf.length !== passwordBuf.length) return false;

  return crypto.timingSafeEqual(inputBuf, passwordBuf);
}

export function createSessionToken(): string {
  const secret = getSecret();
  const payload = JSON.stringify({
    issued: Date.now(),
    expires: Date.now() + SESSION_DURATION_MS,
  });

  const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const token = Buffer.from(payload).toString('base64') + '.' + hmac;

  return token;
}

export function verifySessionToken(token: string): boolean {
  try {
    const [payloadB64, signature] = token.split('.');
    if (!payloadB64 || !signature) return false;

    const secret = getSecret();
    const payload = Buffer.from(payloadB64, 'base64').toString('utf-8');
    const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return false;
    }

    const data = JSON.parse(payload);
    if (Date.now() > data.expires) return false;

    return true;
  } catch {
    return false;
  }
}

export async function setSessionCookie(): Promise<void> {
  const token = createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_MS / 1000,
    path: '/',
  });
}

export async function getSessionCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getSessionCookie();
  if (!token) return false;
  return verifySessionToken(token);
}
