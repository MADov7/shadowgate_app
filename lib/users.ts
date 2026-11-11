import type { AuthUser } from './supabase';

// The only user fields ever sent to the browser (from the Supabase Auth user — never a password or token).
export interface PublicUser {
  id: string;
  name: string;
  email: string;
  createdAt: string | null;
}

/** Display name: the name given at sign-up (Supabase user_metadata.name), else the part of the email before "@". */
export function displayName(user: Pick<AuthUser, 'email' | 'user_metadata'>): string {
  const name = typeof user.user_metadata?.name === 'string' ? user.user_metadata.name.trim() : '';
  return name || (user.email ?? '').split('@')[0] || '';
}

export function publicUser(user: AuthUser): PublicUser {
  return {
    id: user.id,
    name: displayName(user),
    email: user.email ?? '',
    createdAt: user.created_at ? new Date(user.created_at).toISOString() : null,
  };
}
