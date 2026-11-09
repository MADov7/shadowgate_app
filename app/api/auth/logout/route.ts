import type { NextRequest } from 'next/server';
import { clearedHintCookie, clearedSessionCookie, isHttps } from '@/lib/auth';
import { json } from '@/lib/http';

// POST /api/auth/logout — clears the session cookie.
export async function POST(request: NextRequest) {
  const response = json({ ok: true }, 200);
  response.cookies.set(clearedSessionCookie(isHttps(request)));
  response.cookies.set(clearedHintCookie(isHttps(request)));
  return response;
}
