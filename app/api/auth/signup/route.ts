import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { errorResponse, json, readJson } from '@/lib/http';
import { publicUser } from '@/lib/users';
import { validateSignup } from '@/lib/validators';
import { User } from '@/models/User';

// POST /api/auth/signup — { name, email, password } → 201 { user }
// Validates on the server, rejects duplicate emails (409), stores ONLY a bcrypt hash of the password and never
// returns it.
export async function POST(request: Request) {
  try {
    const result = validateSignup(await readJson(request));
    if (!result.ok) return json({ error: 'Please check the highlighted fields.', fields: result.errors }, 400);
    const { name, email, password } = result.data;
    await connectDB();
    if (await User.exists({ email })) {
      return json({ error: 'An account with this email already exists.', fields: { email: 'taken' } }, 409);
    }
    const passwordHash = await bcrypt.hash(password, 12);
    try {
      const user = await User.create({ name, email, passwordHash });
      return json({ user: publicUser(user) }, 201);
    } catch (error) {
      // Two sign-ups racing for the same email: the unique index decides.
      if ((error as { code?: number }).code === 11000) {
        return json({ error: 'An account with this email already exists.', fields: { email: 'taken' } }, 409);
      }
      throw error;
    }
  } catch (error) {
    return errorResponse(error);
  }
}
