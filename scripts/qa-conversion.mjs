// QA flow for the conversion scenes: Build (empty + filled), Individuals, booking dialog (open → invalid → valid),
// request form (invalid → success), About the brand and footer. Also checks honesty copy, focus moves,
// localStorage records and horizontal overflow.
//
//   node scripts/qa-conversion.mjs --url http://localhost:5197 --out shots/conversion/desktop
//   node scripts/qa-conversion.mjs --url http://localhost:5197 --out shots/conversion/mobile --mobile
//   node scripts/qa-conversion.mjs --url http://localhost:5197 --out shots/conversion/ar --lang ar
//   add --static to force the static experience (?static=1)
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const args = process.argv.slice(2);
const opt = {};
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--mobile' || a === '--static') opt[a.slice(2)] = true;
  else if (a.startsWith('--')) opt[a.slice(2)] = args[++i];
}
const base = (opt.url ?? 'http://localhost:5197').replace(/\/$/, '');
const out = opt.out ?? 'shots/conversion/run';
const lang = opt.lang ?? 'en';
const width = opt.mobile ? 390 : 1440;
const height = opt.mobile ? 844 : 900;
mkdirSync(out, { recursive: true });

const query = new URLSearchParams({ intro: '0', lang });
if (opt.static) query.set('static', '1');
const url = `${base}/?${query}`;

const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'],
});
const context = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor: 1,
  isMobile: !!opt.mobile,
  hasTouch: !!opt.mobile,
});
const page = await context.newPage();
const logs = [];
const checks = [];
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`);
});
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));

function check(name, ok, detail = '') {
  checks.push(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
}
let n = 0;
async function shot(name, locator) {
  const file = `${out}-${String(++n).padStart(2, '0')}-${name}.png`;
  if (locator) await locator.screenshot({ path: file });
  else await page.screenshot({ path: file });
  console.log('saved', file);
}
async function scrollTo(id, frac = 0) {
  await page.evaluate(
    ([sid, f]) => {
      const el = document.getElementById(sid);
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      const y = top + Math.max(0, el.offsetHeight - window.innerHeight) * f;
      const lenis = window.__lenis;
      if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
      window.scrollTo(0, y);
    },
    [id, frac],
  );
  await page.waitForTimeout(900);
}
async function overflow() {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}
/** Unclipped elements that stick out of the viewport horizontally (diagnostic for the overflow check). */
async function overflowCulprits(scope = 'body *') {
  return page.evaluate((selector) => {
    const vw = document.documentElement.clientWidth;
    const out = [];
    for (const el of document.querySelectorAll(selector)) {
      const b = el.getBoundingClientRect();
      if (b.width === 0 || (b.right <= vw + 1 && b.left >= -1)) continue;
      let p = el.parentElement;
      let clipped = false;
      while (p && p !== document.body) {
        const cs = getComputedStyle(p);
        if (cs.overflowX !== 'visible' || cs.position === 'fixed') {
          clipped = true;
          break;
        }
        p = p.parentElement;
      }
      const cls = typeof el.className === 'string' ? el.className : '';
      if (!clipped) out.push(`${el.tagName.toLowerCase()}.${cls.slice(0, 50)} [${b.left | 0}→${b.right | 0}]`);
    }
    return out.slice(0, 12);
  }, scope);
}
// Elements of the conversion scenes only (other sections are owned by other builders).
const OWN_SCOPE = ['#build', '#personal', '#contact', '#about-brand', 'footer.sg-footer', 'dialog.bk-dialog']
  .map((s) => `${s} *`)
  .join(', ');

/** Navigation that survives dev-server reloads triggered by other agents editing files. */
async function load() {
  // Other agents edit files in parallel: wait until the app actually renders (no Vite error overlay).
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForSelector('.build-meter', { timeout: 8000 });
      await page.waitForTimeout(1500);
      return;
    } catch (e) {
      if (attempt === 39) throw e;
      console.log('app not ready, retrying…');
      await page.waitForTimeout(5000);
    }
  }
}

// Fresh state
await load();
await page.evaluate(() => localStorage.clear());
await load();

// ---------- Build: empty ----------
await scrollTo('build', 0.5);
check('build empty state', await page.getByText(lang === 'ar' ? 'هيكلك في الانتظار' : 'Your structure is waiting').isVisible());
check('build symbolic note visible', await page.locator('.build__note').isVisible());
await shot('build-empty');

// ---------- Build: filled (package + services incl. pen-testing) ----------
await page.evaluate(() =>
  localStorage.setItem(
    'sg-basket-v1',
    JSON.stringify({
      state: { serviceIds: ['pen-testing', 'ecommerce-review', 'backup-recovery', 'personal-accounts'], packageId: 'business' },
      version: 1,
    }),
  ),
);
await load();
await scrollTo('build', 0.5);
const meter = await page.locator('.build-meter').getAttribute('aria-valuenow');
check('meter counts services + package', meter === '5', `aria-valuenow=${meter}`);
await shot('build-filled');
// remove one service via the summary
await page.locator('.build-row__remove').last().click();
await page.waitForTimeout(500);
const meter2 = await page.locator('.build-meter').getAttribute('aria-valuenow');
check('remove from summary updates meter', meter2 === '4', `aria-valuenow=${meter2}`);
check('focus stays in summary after remove', await page.evaluate(() => !!document.activeElement?.closest('.build-sum')));

// ---------- Individuals ----------
await scrollTo('personal');
await page.waitForTimeout(600);
await shot('personal-top');
if (opt.mobile) {
  await page.evaluate(() => window.scrollBy(0, window.innerHeight * 0.9));
  await page.waitForTimeout(800);
  await shot('personal-cards');
}
await shot('personal-section', page.locator('#personal'));

// ---------- Booking dialog ----------
await page.locator('.per-card__book').first().click();
await page.waitForTimeout(700);
const dialog = page.locator('dialog.bk-dialog');
check('booking dialog opens', await dialog.evaluate((d) => d.open));
check('booking service prefilled', (await page.locator('#bk-serviceId').inputValue()) === 'personal-accounts');
const dayCount = await page.locator('.bk-day').count();
check('10 weekday chips', dayCount === 10, `count=${dayCount}`);
await shot('booking-open');
await page.locator('button[form="bk-form"]').click();
await page.waitForTimeout(500);
check('booking error summary', await page.locator('#bk-errors').isVisible());
check('booking focus on summary', await page.evaluate(() => document.activeElement?.id === 'bk-errors'));
await shot('booking-invalid');
// fill
await page.locator('.bk-day').nth(2).click();
await page.locator('.bk-time').nth(1).click();
await page.locator('label[for="bk-format-online"]').click();
await page.fill('#bk-name', 'Omar Test');
await page.fill('#bk-email', 'omar@example');
await page.locator('button[form="bk-form"]').click();
await page.waitForTimeout(300);
check('booking email format error', await page.locator('#bk-email-error').isVisible());
await page.fill('#bk-email', 'omar@example.com');
await page.locator('button[form="bk-form"]').click();
await page.waitForTimeout(700);
const bkNote = (await page.locator('.bk-done__note').textContent())?.trim();
check(
  'booking confirmation copy',
  bkNote ===
    (lang === 'ar'
      ? 'تم حفظ الحجز التجريبي في هذا المتصفح. لم يتم إجراء أي حجز.'
      : 'Demo booking saved in this browser. No booking has been made.'),
  bkNote,
);
const ref = (await page.locator('.bk-ticket__ref').textContent())?.trim();
check('booking reference format', /^SG-DEMO-[A-Z2-9]{4}$/.test(ref ?? ''), ref);
check('booking stored locally', await page.evaluate(() => JSON.parse(localStorage.getItem('sg-demo-bookings') || '[]').length === 1));
await shot('booking-confirmed');
await page.keyboard.press('Escape');
await page.waitForTimeout(400);
check('Escape closes booking dialog', !(await dialog.evaluate((d) => d.open)));

// ---------- Contact form ----------
await scrollTo('contact');
await page.waitForTimeout(500);
check('authorization checkbox shown for pen-testing', await page.locator('#cf-authorization').isVisible());
await shot('contact-form');
await page.locator('.contact-form button[type="submit"]').click();
await page.waitForTimeout(900);
check('contact error summary role=alert', (await page.locator('.contact-form .sg-errsum').getAttribute('role')) === 'alert');
check('contact focus on summary', await page.evaluate(() => document.activeElement?.classList.contains('sg-errsum')));
check('fields marked aria-invalid', (await page.locator('.contact-form [aria-invalid="true"]').count()) >= 4);
await shot('contact-invalid');
// summary link focuses its field
await page.locator('.contact-form .sg-errsum__list a').first().click();
await page.waitForTimeout(500);
check('summary link focuses field', await page.evaluate(() => document.activeElement?.id === 'cf-fullName'));
await page.fill('#cf-fullName', 'Layla Haddad');
await page.fill('#cf-email', 'layla@example.com');
await page.fill('#cf-organisation', 'Haddad Store');
await page.locator('label[for="cf-customerType-business"]').click();
await page.locator('label[for="cf-contactMethod-phone"]').click();
await page.fill('#cf-message', 'Short');
await page.locator('.contact-form button[type="submit"]').click();
await page.waitForTimeout(600);
check('phone required when preferred', await page.locator('#cf-phone-error').isVisible());
check('message min length', await page.locator('#cf-message-error').isVisible());
await shot('contact-partial', page.locator('.contact__panel'));
await page.fill('#cf-phone', '+965 2222 3333');
await page.fill('#cf-message', 'We would like a review of our online store and admin accounts.');
await page.locator('#cf-authorization').check();
await page.locator('#cf-acknowledge').check();
await page.locator('.contact-form button[type="submit"]').click();
await page.waitForTimeout(1200);
const doneNote = (await page.locator('.contact-done__note').textContent())?.trim();
check(
  'request confirmation exact copy',
  doneNote ===
    (lang === 'ar'
      ? 'تم حفظ طلب العرض التوضيحي في هذا المتصفح. لم يتم إرسال أي رسالة.'
      : 'Demo request saved in this browser. No message has been sent.'),
  doneNote,
);
check('focus moved to confirmation', await page.evaluate(() => document.activeElement?.id === 'contact-done'));
check('request stored locally', await page.evaluate(() => JSON.parse(localStorage.getItem('sg-demo-requests') || '[]').length === 1));
await shot('contact-success');
await shot('contact-success-panel', page.locator('.contact__panel'));

// ---------- About the brand + footer ----------
await shot('about-brand', page.locator('#about-brand'));
await shot('footer', page.locator('footer.sg-footer'));
await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
await page.waitForTimeout(800);
await shot('page-end');

const ov = await overflow();
const ownCulprits = await overflowCulprits(OWN_SCOPE);
check('conversion scenes stay inside the viewport', ownCulprits.length === 0, JSON.stringify(ownCulprits));
if (ov > 0) console.log(`INFO page-level overflow=${ov}px from: ${JSON.stringify(await overflowCulprits())}`);

console.log('\nCHECKS:\n' + checks.join('\n'));
if (logs.length) console.log('CONSOLE:\n' + [...new Set(logs)].slice(0, 30).join('\n'));
else console.log('CONSOLE: clean');
await browser.close();
