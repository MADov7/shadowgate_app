import { expect, test, type APIRequestContext, type Browser, type BrowserContext, type Page } from '@playwright/test';

// Day 4 — accounts, sessions and orders, checked against the production build (npm run build first).
//
// REQUIRES a real database: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (and JWT_SECRET) must be set for the server started by playwright.config.ts,
// and the catalog must be seeded first (npm run seed) — the order tests use the "consultation" (illustrative, 49)
// and "personal-accounts" products. Every test creates its own accounts with unique emails, so runs never collide.

const PASSWORD = 'Correct-Horse-42';
/** A bcrypt hash prefix such as $2a$12$ / $2b$12$. */
const BCRYPT = /\$2[abxy]?\$\d{2}\$/;

interface Account {
  id: string;
  name: string;
  email: string;
  password: string;
}

interface ApiOrder {
  id: string;
  status: string;
  total: number;
  hasQuoteItems: boolean;
  items: Array<{ slug: string; quantity: number; price: number; pricingKind: string }>;
}

function suffix(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Unique per run, per project (desktop / mobile run in parallel) and per call. Lower-case, like the server stores it. */
function uniqueEmail(label: string): string {
  return `sg-e2e-${label}-${test.info().project.name}-${suffix()}@example.com`.toLowerCase();
}

function expectNoSecrets(body: string, password: string): void {
  expect(body).not.toContain('passwordHash');
  expect(body).not.toMatch(BCRYPT);
  expect(body).not.toContain(password);
}

async function signUpViaApi(request: APIRequestContext, label: string): Promise<Account> {
  const data = { name: `E2E ${label} ${Math.random().toString(36).slice(2, 6)}`, email: uniqueEmail(label), password: PASSWORD };
  const res = await request.post('/api/auth/signup', { data });
  expect(res.status(), await res.text()).toBe(201);
  const { user } = (await res.json()) as { user: { id: string } };
  return { ...data, id: user.id };
}

async function logInViaApi(request: APIRequestContext, account: Pick<Account, 'email' | 'password'>): Promise<void> {
  const res = await request.post('/api/auth/login', { data: { email: account.email, password: account.password } });
  expect(res.status(), await res.text()).toBe(200);
}

/** A separate browser context (own cookie jar) with a fresh, signed-in account. */
async function openAccount(browser: Browser, baseURL: string | undefined, label: string): Promise<Account & { context: BrowserContext }> {
  const context = await browser.newContext({ baseURL });
  const account = await signUpViaApi(context.request, label);
  await logInViaApi(context.request, account);
  return { ...account, context };
}

async function placeOrder(request: APIRequestContext, body: Record<string, unknown>): Promise<ApiOrder> {
  const res = await request.post('/api/orders', { data: body });
  expect(res.status(), await res.text()).toBe(201);
  return ((await res.json()) as { order: ApiOrder }).order;
}

async function orderIds(request: APIRequestContext): Promise<string[]> {
  const res = await request.get('/api/orders');
  expect(res.status(), await res.text()).toBe(200);
  return ((await res.json()) as { orders: ApiOrder[] }).orders.map((o) => o.id).sort();
}

/**
 * The visible copy of a navigation account control. At ≤1320px (the mobile project) the bar copy is hidden and the
 * same control lives in the navigation menu, so the menu is opened when needed. Retries until the page has settled.
 */
async function accountControl(page: Page, testId: 'account-name' | 'logout-button' | 'login-link' | 'signup-link') {
  // The menu copy of each control has the same id with a "-menu" suffix.
  const visible = page.locator(`[data-testid="${testId}"]:visible, [data-testid="${testId}-menu"]:visible`).first();
  await expect(async () => {
    const openMenu = page.getByRole('button', { name: /open menu/i }).first();
    if (await openMenu.isVisible()) await openMenu.click();
    await expect(visible).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
  return visible;
}

async function submitAuthForm(page: Page): Promise<void> {
  await page.locator('form.auth-form button[type="submit"]').click();
}

function isPost(path: string) {
  return (r: { url(): string; request(): { method(): string } }) => new URL(r.url()).pathname === path && r.request().method() === 'POST';
}

function base64url(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

// 1 ─ Sign Up page ──────────────────────────────────────────────────────────────────────────────────────────────────

test('sign up: client validation, successful registration lands on Log In, duplicate email is refused (409)', async ({ page }) => {
  const signupRequests: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('/api/auth/signup')) signupRequests.push(r.method());
  });

  await page.goto('/signup');
  const name = page.locator('#signup-name');
  const email = page.locator('#signup-email');
  const password = page.locator('#signup-password');
  await expect(name).toBeVisible({ timeout: 15_000 });

  // Empty form: every field is required.
  await submitAuthForm(page);
  await expect(page.locator('#signup-errors')).toBeVisible();
  for (const field of ['name', 'email', 'password']) {
    await expect(page.locator(`#signup-${field}`)).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator(`#signup-${field}-error`)).toHaveText(/required/i);
  }

  // Bad email + a 7-character password.
  await name.fill('Form Tester');
  await email.fill('not-an-email');
  await password.fill('short7!');
  await submitAuthForm(page);
  await expect(name).not.toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#signup-name-error')).toHaveCount(0);
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#signup-email-error')).toHaveText(/valid email/i);
  await expect(password).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#signup-password-error')).toHaveText(/at least 8/i);
  expect(signupRequests, 'client-side validation must not call the API').toEqual([]);

  // Valid sign-up → /login with the "registered" notice and the email pre-filled.
  const account = { name: `Form Tester ${suffix()}`.slice(0, 40), email: uniqueEmail('signup'), password: PASSWORD };
  await name.fill(account.name);
  await email.fill(account.email);
  await password.fill(account.password);
  const created = page.waitForResponse(isPost('/api/auth/signup'));
  await submitAuthForm(page);
  expect((await created).status()).toBe(201);
  await expect(page).toHaveURL(/\/login\?/);
  const loginUrl = new URL(page.url());
  expect(loginUrl.pathname).toBe('/login');
  expect(loginUrl.searchParams.get('registered')).toBe('1');
  await expect(page.getByTestId('login-notice')).toHaveText(/account created/i);
  await expect(page.locator('#login-email')).toHaveValue(account.email);
  // Signing up does not sign you in.
  expect((await page.request.get('/api/auth/me')).status()).toBe(401);

  // Same email again → 409 → "already exists" on the email field, still on /signup.
  await page.goto('/signup');
  await expect(name).toBeVisible({ timeout: 15_000 });
  await name.fill('Someone Else');
  await email.fill(account.email);
  await password.fill('Another-password-9');
  const duplicate = page.waitForResponse(isPost('/api/auth/signup'));
  await submitAuthForm(page);
  expect((await duplicate).status()).toBe(409);
  await expect(page.locator('#signup-email-error')).toHaveText(/already exists/i);
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await expect(page).toHaveURL(/\/signup/);
});

// 2 ─ Auth API ──────────────────────────────────────────────────────────────────────────────────────────────────────

test('auth API: no password hash in any response; /api/auth/me follows log in and log out', async ({ request }) => {
  const account = { name: 'Api Tester', email: uniqueEmail('api'), password: PASSWORD };

  const signup = await request.post('/api/auth/signup', { data: account });
  expect(signup.status()).toBe(201);
  const signupText = await signup.text();
  expectNoSecrets(signupText, account.password);
  const { user } = JSON.parse(signupText) as { user: Record<string, unknown> };
  expect(Object.keys(user).sort()).toEqual(['createdAt', 'email', 'id', 'name']);
  expect(user).toMatchObject({ name: account.name, email: account.email });
  expect(signup.headers()['set-cookie'] ?? '').not.toContain('sg_session=');

  // Not signed in yet.
  const before = await request.get('/api/auth/me');
  expect(before.status()).toBe(401);
  expect(((await before.json()) as { reason: string }).reason).toBe('missing');

  // Wrong password: 401 and no session cookie.
  const wrong = await request.post('/api/auth/login', { data: { email: account.email, password: 'Wrong-password-1' } });
  expect(wrong.status()).toBe(401);
  expect(wrong.headers()['set-cookie'] ?? '').not.toContain('sg_session=');
  expectNoSecrets(await wrong.text(), account.password);

  // Correct password: 200 + HttpOnly cookie; the token is never in the body.
  const login = await request.post('/api/auth/login', { data: { email: account.email, password: account.password } });
  expect(login.status()).toBe(200);
  const loginText = await login.text();
  expectNoSecrets(loginText, account.password);
  expect((JSON.parse(loginText) as { user: { id: string } }).user.id).toBe(user.id);
  const setCookie = login
    .headersArray()
    .filter((h) => h.name.toLowerCase() === 'set-cookie')
    .map((h) => h.value)
    .join('\n');
  const token = /sg_session=([^;]+)/.exec(setCookie)?.[1];
  expect(token, 'login sets the sg_session cookie').toBeTruthy();
  expect(setCookie).toMatch(/httponly/i);
  expect(setCookie).toMatch(/samesite=lax/i);
  expect(loginText).not.toContain(token!);

  // Signed in: /api/auth/me returns the user (public fields only).
  const me = await request.get('/api/auth/me');
  expect(me.status()).toBe(200);
  const meText = await me.text();
  expectNoSecrets(meText, account.password);
  expect((JSON.parse(meText) as { user: unknown }).user).toMatchObject({ id: user.id, name: account.name, email: account.email });

  // Log out clears the cookie: /api/auth/me is 401 again.
  const logout = await request.post('/api/auth/logout');
  expect(logout.status()).toBe(200);
  const after = await request.get('/api/auth/me');
  expect(after.status()).toBe(401);
  expect(((await after.json()) as { reason: string }).reason).toBe('missing');
});

// 3 ─ Log In / Log out in the browser ───────────────────────────────────────────────────────────────────────────────

test('log in: wrong password shows an error, correct login shows the name in the nav, log out signs out', async ({ page }) => {
  const account = await signUpViaApi(page.request, 'login');

  await page.goto('/login');
  const email = page.locator('#login-email');
  const password = page.locator('#login-password');
  await expect(email).toBeVisible({ timeout: 15_000 });
  // Signed out (checked without opening the phone menu, which would cover the form).
  await expect(page.getByTestId('login-link').first()).toBeAttached({ timeout: 15_000 });

  // Wrong password.
  await email.fill(account.email);
  await password.fill('Wrong-password-1');
  const rejected = page.waitForResponse(isPost('/api/auth/login'));
  await submitAuthForm(page);
  expect((await rejected).status()).toBe(401);
  await expect(page.getByTestId('login-error')).toBeVisible();
  await expect(page.getByTestId('login-error')).toHaveText(/incorrect email or password/i);
  await expect(page).toHaveURL(/\/login/);
  expect((await page.request.get('/api/auth/me')).status()).toBe(401);

  // Correct password → My Orders (the default destination) with the user's name in the navigation.
  await password.fill(account.password);
  await submitAuthForm(page);
  await expect(page).toHaveURL(/\/orders(\?|$)/);
  await expect(await accountControl(page, 'account-name')).toContainText(account.name);
  const cookie = (await page.context().cookies()).find((c) => c.name === 'sg_session');
  expect(cookie?.httpOnly, 'session cookie is HttpOnly').toBe(true);
  expect(await page.evaluate(() => document.cookie)).not.toContain('sg_session');
  expect((await page.request.get('/api/auth/me')).status()).toBe(200);

  // Log out → back to the signed-out state.
  await (await accountControl(page, 'logout-button')).click();
  await expect(page).toHaveURL(/\/login/);
  await expect(await accountControl(page, 'login-link')).toBeVisible();
  await expect(page.getByTestId('account-name')).toHaveCount(0);
  await expect(page.getByTestId('account-name-menu')).toHaveCount(0);
  expect((await page.context().cookies()).find((c) => c.name === 'sg_session' && c.value)).toBeUndefined();
  expect((await page.request.get('/api/auth/me')).status()).toBe(401);
});

// 4 ─ Protected route ───────────────────────────────────────────────────────────────────────────────────────────────

test('protected route: /orders and /api/orders refuse missing, garbage and forged tokens', async ({ page, request, baseURL }) => {
  // Signed out in the browser → /login?next=/orders&reason=required with the notice.
  await page.goto('/orders');
  await expect(page).toHaveURL(/\/login\?/);
  const url = new URL(page.url());
  expect(url.pathname).toBe('/login');
  expect(url.searchParams.get('reason')).toBe('required');
  expect(url.searchParams.get('next')).toBe('/orders');
  await expect(page.getByTestId('login-notice')).toHaveText(/log in to see your orders/i);

  // The redirect happens on the server (307), before any order data is rendered.
  const raw = await request.get('/orders', { maxRedirects: 0 });
  expect(raw.status()).toBe(307);
  const location = new URL(raw.headers()['location'] ?? '', baseURL);
  expect(location.pathname).toBe('/login');
  expect(location.searchParams.get('reason')).toBe('required');
  expect(await raw.text()).not.toContain('data-order-id');

  // API without a cookie.
  const noCookie = await request.get('/api/orders');
  expect(noCookie.status()).toBe(401);
  expect(((await noCookie.json()) as { reason: string }).reason).toBe('missing');
  const noCookiePost = await request.post('/api/orders', { data: { items: [{ slug: 'consultation', quantity: 1 }] } });
  expect(noCookiePost.status()).toBe(401);

  // API with a garbage cookie.
  const garbage = await request.get('/api/orders', { headers: { cookie: 'sg_session=not-a-real-token' } });
  expect(garbage.status()).toBe(401);
  expect(((await garbage.json()) as { reason: string }).reason).toBe('invalid');

  // API with an unsigned ("alg: none") token that claims to be some user.
  const forged = `${base64url({ alg: 'none', typ: 'JWT' })}.${base64url({ sub: '0123456789abcdef01234567', name: 'Mallory', exp: Math.floor(Date.now() / 1000) + 3600 })}.`;
  const forgedRes = await request.get('/api/orders', { headers: { cookie: `sg_session=${forged}` } });
  expect(forgedRes.status()).toBe(401);
  expect(((await forgedRes.json()) as { reason: string }).reason).toBe('invalid');

  // Browser with a garbage cookie → /login with reason=invalid.
  await page.context().addCookies([{ name: 'sg_session', value: 'garbage.token.value', url: baseURL! }]);
  expect((await page.request.get('/api/orders')).status()).toBe(401);
  await page.goto('/orders');
  await expect(page).toHaveURL(/\/login\?.*reason=invalid/);
  await expect(page.getByTestId('login-notice')).toHaveText(/no longer valid/i);
});

// 5 ─ Authorization between two accounts ────────────────────────────────────────────────────────────────────────────

test('authorization: two accounts only ever see their own orders; a spoofed owner id is ignored', async ({ browser, baseURL }) => {
  const a = await openAccount(browser, baseURL, 'owner-a');
  const b = await openAccount(browser, baseURL, 'owner-b');
  try {
    const orderA = await placeOrder(a.context.request, { items: [{ slug: 'consultation', quantity: 2 }] });
    const orderB = await placeOrder(b.context.request, { items: [{ slug: 'personal-accounts', quantity: 1 }] });
    expect(orderA.id).not.toBe(orderB.id);

    // GET /api/orders is scoped to the token's user.
    expect(await orderIds(a.context.request)).toEqual([orderA.id]);
    expect(await orderIds(b.context.request)).toEqual([orderB.id]);

    // My Orders shows only the account's own order.
    for (const [who, mine, theirs] of [
      [a, orderA, orderB],
      [b, orderB, orderA],
    ] as const) {
      const page = await who.context.newPage();
      await page.goto('/orders');
      await expect(page).toHaveURL(/\/orders(\?|$)/);
      const list = page.getByTestId('orders-list');
      await expect(list).toBeVisible({ timeout: 15_000 });
      await expect(list.locator('[data-order-id]')).toHaveCount(1);
      await expect(list.locator(`[data-order-id="${mine.id}"]`)).toBeVisible();
      await expect(page.locator(`[data-order-id="${theirs.id}"]`)).toHaveCount(0);
      await expect(page.getByTestId('orders-empty')).toHaveCount(0);
      await expect(await accountControl(page, 'account-name')).toContainText(who.name);
      await page.close();
    }

    // A can open A's order; B gets 404 for it (API and page), without learning anything about it.
    const own = await a.context.request.get(`/api/orders/${orderA.id}`);
    expect(own.status()).toBe(200);
    expect(((await own.json()) as { order: ApiOrder }).order.id).toBe(orderA.id);
    const cross = await b.context.request.get(`/api/orders/${orderA.id}`);
    expect(cross.status()).toBe(404);
    const crossText = await cross.text();
    expect(crossText).not.toContain(orderA.id);
    expect(crossText).not.toContain('consultation');
    const pageB = await b.context.newPage();
    const crossPage = await pageB.goto(`/orders/${orderA.id}`);
    expect(crossPage?.status()).toBe(404);
    await expect(pageB.locator('[data-order-id]')).toHaveCount(0);
    await pageB.close();

    // B posts an order claiming to be A: it is still created for B (the owner comes from the token only).
    const spoofed = await placeOrder(b.context.request, { items: [{ slug: 'consultation', quantity: 1 }], user: a.id, userId: a.id });
    expect(await orderIds(b.context.request)).toEqual([orderB.id, spoofed.id].sort());
    expect(await orderIds(a.context.request)).toEqual([orderA.id]);
    expect((await b.context.request.get(`/api/orders/${spoofed.id}`)).status()).toBe(200);
    expect((await a.context.request.get(`/api/orders/${spoofed.id}`)).status()).toBe(404);
  } finally {
    await a.context.close();
    await b.context.close();
  }
});

// 6 ─ Server-derived prices ─────────────────────────────────────────────────────────────────────────────────────────

test('orders: unit prices and totals come from the catalog, never from the request body', async ({ request }) => {
  const product = await request.get('/api/products/consultation');
  expect(product.status(), 'seed the catalog first (npm run seed)').toBe(200);
  const pricing = ((await product.json()) as { product: { pricing: { kind: string; amount?: number } } }).product.pricing;
  expect(pricing).toMatchObject({ kind: 'illustrative', amount: 49 });

  const account = await signUpViaApi(request, 'prices');
  await logInViaApi(request, account);

  const order = await placeOrder(request, { items: [{ slug: 'consultation', quantity: 2, price: 0.01 }], total: 1 });
  expect(order.status).toBe('pending');
  expect(order.items).toHaveLength(1);
  expect(order.items[0]).toMatchObject({ slug: 'consultation', quantity: 2, price: 49, pricingKind: 'illustrative' });
  expect(order.total).toBe(98);
  expect(order.hasQuoteItems).toBe(false);

  // The stored order has the same server-side values.
  const saved = await request.get(`/api/orders/${order.id}`);
  expect(saved.status()).toBe(200);
  const stored = ((await saved.json()) as { order: ApiOrder }).order;
  expect(stored.total).toBe(98);
  expect(stored.items[0]).toMatchObject({ slug: 'consultation', quantity: 2, price: 49 });
});
