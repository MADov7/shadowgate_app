import type { NextRequest } from 'next/server';
import { clearedHintCookie, clearedSessionCookie, getSession, isHttps } from '@/lib/auth';
import { errorResponse, json } from '@/lib/http';
import { getAuthUser } from '@/lib/supabase';
import { publicUser } from '@/lib/users';

const MESSAGES = {
  missing: 'You are not signed in.',
  invalid: 'Your session is not valid. Please log in again.',
  expired: 'Your session has expired. Please log in again.',
} as const;

// GET /api/auth/me — the signed-in user (verified cookie → Supabase Auth user), or 401 with the reason.
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.ok) return json({ error: MESSAGES[session.reason], reason: session.reason }, 401);
    const user = await getAuthUser(session.userId);
    if (!user) {
      // The account was deleted in Supabase: end the session.
      const response = json({ error: MESSAGES.invalid, reason: 'invalid' }, 401);
      response.cookies.set(clearedSessionCookie(isHttps(request)));
      response.cookies.set(clearedHintCookie(isHttps(request)));
      return response;
    }
    return json({ user: publicUser(user) });
  } catch (error) {
    return errorResponse(error);
  }
}
