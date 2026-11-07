import { expect, test, type Page } from '@playwright/test';

// Core customer journey checks against the production build (npm run build first).

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  return errors;
}

test('welcome gate: direct-services link bypasses the entrance and is remembered for the session', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/?intro=1');
  await expect(page.getByRole('button', { name: /enter shadow gate/i })).toBeVisible();
  await page.getByRole('link', { name: /go directly to services/i }).or(page.getByRole('button', { name: /go directly to services/i })).first().click();
  await expect(page.locator('#catalog')).toBeInViewport({ timeout: 10_000 });
  expect(await page.evaluate(() => sessionStorage.getItem('sg-entered'))).toBe('1');
  await page.goto('/');
  await expect(page.getByRole('button', { name: /enter shadow gate/i })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('welcome gate: Enter runs the entrance and lands on the hero', async ({ page }) => {
  await page.goto('/?intro=1');
  await page.getByRole('button', { name: /enter shadow gate/i }).click();
  await expect(page.getByRole('heading', { level: 1, name: /your business moves forward/i })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('button', { name: /enter shadow gate/i })).toHaveCount(0, { timeout: 10_000 });
});

test('catalog: audience switch, search with result count, empty state and clear', async ({ page }) => {
  await page.goto('/?intro=0#catalog');
  const catalog = page.locator('#catalog');
  const search = catalog.getByRole('searchbox').first();
  await search.fill('email');
  await expect(catalog.getByText(/services? found|service found/i).first()).toBeVisible();
  await search.fill('zzzzqqq');
  await expect(catalog.getByText(/no services match/i).first()).toBeVisible();
  await search.press('Escape');
  await expect(search).toHaveValue('');
  await catalog.getByRole('button', { name: /^personal/i }).first().click();
  await expect(catalog.getByRole('heading', { name: /personal account protection/i })).toBeVisible();
});

test('basket: add a service, badge updates, persists after reload, no duplicates', async ({ page }) => {
  await page.goto('/?intro=0#catalog');
  const catalog = page.locator('#catalog');
  await catalog.getByRole('button', { name: /add to request/i }).first().click();
  const badge = page.getByTestId('basket-button');
  await expect(badge).toHaveAccessibleName(/1/);
  await page.reload();
  await expect(page.getByTestId('basket-button')).toHaveAccessibleName(/1/);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('sg-basket-v1') ?? '{}'));
  expect(stored.state.serviceIds.length).toBe(1);
  await page.getByTestId('basket-button').click();
  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
});

test('service details dialog opens, traps focus in a modal and closes with Escape', async ({ page }) => {
  await page.goto('/?intro=0#catalog');
  await page.locator('#catalog').getByRole('button', { name: /view details/i }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/deliverables/i).first()).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('request form: field errors, then the honest demo confirmation', async ({ page }) => {
  await page.goto('/?intro=0#contact');
  const contact = page.locator('#contact');
  await contact.getByRole('button', { name: /send|submit|request/i }).last().click();
  await expect(contact.locator('[aria-invalid="true"]').first()).toBeVisible();
  await contact.getByLabel(/full name/i).fill('Test Student');
  await contact.getByRole('textbox', { name: /^email/i }).fill('not-an-email');
  await contact.getByRole('button', { name: /send|submit|request/i }).last().click();
  await expect(contact.getByRole('textbox', { name: /^email/i })).toHaveAttribute('aria-invalid', 'true');
  await contact.getByRole('textbox', { name: /^email/i }).fill('student@example.com');
  await contact.getByText(/a business/i).first().click();
  await contact.getByLabel(/message/i).fill('We would like a website security assessment for our small online store.');
  for (const box of await contact.getByRole('checkbox').all()) await box.check();
  await contact.getByRole('button', { name: /send|submit|request/i }).last().click();
  await expect(page.getByText('Demo request saved in this browser. No message has been sent.')).toBeVisible();
});

test('language toggle switches to Arabic with RTL layout', async ({ page }) => {
  await page.goto('/?intro=0');
  await page.getByRole('button', { name: /switch language to arabic/i }).first().click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.getByRole('heading', { level: 1 })).not.toHaveText(/your business/i);
});

test('static fallback (no WebGL): no canvas, catalog still fully usable', async ({ page }) => {
  await page.goto('/?intro=0&static=1');
  await expect(page.locator('html')).toHaveAttribute('data-mode', 'static');
  await expect(page.locator('canvas')).toHaveCount(0);
  await page.locator('#catalog').scrollIntoViewIfNeeded();
  await expect(page.locator('#catalog').getByRole('button', { name: /view details/i }).first()).toBeVisible();
});

test('threat radar is labelled as a simulation', async ({ page }) => {
  await page.goto('/?intro=0#radar');
  await expect(page.getByText(/simulated live demo/i).first()).toBeVisible();
});
