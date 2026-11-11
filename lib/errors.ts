// Server error types shared by lib/* and the API routes.

/** A required server setting (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET, STRIPE_SECRET_KEY…) is not configured. Only the key name is ever reported. */
export class MissingSecretError extends Error {
  constructor(public readonly key: string) {
    super(`Missing required server secret: ${key}`);
    this.name = 'MissingSecretError';
  }
}

/** An expected failure with an HTTP status and a safe, user-facing message. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}
