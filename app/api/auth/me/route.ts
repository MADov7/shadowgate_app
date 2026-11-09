import type { NextRequest } from 'next/server';
import { clearedHintCookie, clearedSessionCookie, getSession, isHttps } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { errorResponse, json } from '@/lib/http';
import { publicUser } from '@/lib/users';
import { User } from '@/models/User';

const MESSAGES = {
  missing: 'You are not signed in.',
  invalid: 'Your session is not valid. Please log in again.',
  expired: 'Your session has expired. Please log in again.',
} as const;

// GET /api/auth/me — the signed-in user (from the verified cookie), or 401 with the reason.
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.ok) return json({ error: MESSAGES[session.reason], reason: session.reason }, 401);
    await connectDB();
    const user = await User.findById(session.userId);
    if (!user) {
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
