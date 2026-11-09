import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { NextRequest } from 'next/server';
import { hintCookie, isHttps, sessionCookie } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { errorResponse, json, readJson } from '@/lib/http';
import { signSession } from '@/lib/session';
import { publicUser } from '@/lib/users';
import { validateLogin } from '@/lib/validators';
import { User } from '@/models/User';

// When the email is unknown we still run one bcrypt comparison (against a hash of a random value), so the response
// time does not reveal which emails have accounts.
let dummyHash: Promise<string> | null = null;

// POST /api/auth/login — { email, password } → 200 { user } + HttpOnly session cookie, or 401.
export async function POST(request: NextRequest) {
  try {
    const result = validateLogin(await readJson(request));
    if (!result.ok) return json({ error: 'Please check the highlighted fields.', fields: result.errors }, 400);
    const { email, password } = result.data;
    await connectDB();
    const user = await User.findOne({ email }).select('+passwordHash');
    dummyHash ??= bcrypt.hash(randomUUID(), 12);
    const valid = await bcrypt.compare(password, user?.passwordHash ?? (await dummyHash));
    if (!user || !valid) return json({ error: 'Incorrect email or password.' }, 401);
    const token = signSession({ id: String(user._id), name: user.name });
    const response = json({ user: publicUser(user) }, 200);
    response.cookies.set(sessionCookie(token, isHttps(request)));
    response.cookies.set(hintCookie(isHttps(request)));
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
