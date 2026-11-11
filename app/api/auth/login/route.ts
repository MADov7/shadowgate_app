import type { NextRequest } from 'next/server';
import { hintCookie, isHttps, sessionCookie } from '@/lib/auth';
import { errorResponse, json, readJson, tooManyRequests } from '@/lib/http';
import { limitLogin } from '@/lib/rateLimit';
import { signSession } from '@/lib/session';
import { signInWithPassword } from '@/lib/supabase';
import { displayName, publicUser } from '@/lib/users';
import { validateLogin } from '@/lib/validators';

// POST /api/auth/login — { email, password } → 200 { user } + HttpOnly session cookie, 401, or 429 (too many tries).
// The password is checked by Supabase Auth (password grant); only when Supabase accepts it does the server issue
// the session cookie, whose subject is the Supabase user id.
export async function POST(request: NextRequest) {
  try {
    const result = validateLogin(await readJson(request));
    if (!result.ok) return json({ error: 'Please check the highlighted fields.', fields: result.errors }, 400);
    const { email, password } = result.data;
    const limit = limitLogin(request, email);
    if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);
    const user = await signInWithPassword(email, password);
    if (!user) return json({ error: 'Incorrect email or password.' }, 401);
    const token = signSession({ id: user.id, name: displayName(user) });
    const response = json({ user: publicUser(user) }, 200);
    response.cookies.set(sessionCookie(token, isHttps(request)));
    response.cookies.set(hintCookie(isHttps(request)));
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
