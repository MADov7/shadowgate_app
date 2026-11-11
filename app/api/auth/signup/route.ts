import { errorResponse, json, readJson, tooManyRequests } from '@/lib/http';
import { limitSignup } from '@/lib/rateLimit';
import { createAuthUser, SupabaseError } from '@/lib/supabase';
import { publicUser } from '@/lib/users';
import { validateSignup } from '@/lib/validators';

// POST /api/auth/signup — { name, email, password } → 201 { user }
// Validates on the server, then creates the account in Supabase Auth (Authentication → Users in the Supabase
// dashboard). Supabase stores only a hash of the password; it is never logged or returned. Duplicate email → 409.
export async function POST(request: Request) {
  try {
    const result = validateSignup(await readJson(request));
    if (!result.ok) return json({ error: 'Please check the highlighted fields.', fields: result.errors }, 400);
    const limit = limitSignup(request);
    if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);
    const { name, email, password } = result.data;
    try {
      const user = await createAuthUser({ name, email, password });
      return json({ user: publicUser(user) }, 201);
    } catch (error) {
      if (error instanceof SupabaseError) {
        const body = JSON.stringify(error.body ?? '');
        if (error.code === 'email_exists' || error.code === 'user_already_exists' || (error.status === 422 && /already/i.test(body))) {
          return json({ error: 'An account with this email already exists.', fields: { email: 'taken' } }, 409);
        }
        if (error.code === 'weak_password') return json({ error: 'Please choose a stronger password.', code: 'weak_password' }, 400);
        if (error.code === 'email_address_invalid' || error.code === 'validation_failed') {
          return json({ error: 'Please check the highlighted fields.', fields: { email: 'invalid' } }, 400);
        }
      }
      throw error;
    }
  } catch (error) {
    return errorResponse(error);
  }
}
