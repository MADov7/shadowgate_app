import { defineConfig, devices } from '@playwright/test';

// Read-only smoke checks against the PUBLISHED site (default: Netlify production).
// Only e2e/smoke.spec.ts runs here: it never creates accounts or writes to the database.
// e2e/day4.spec.ts signs up test users, so it runs against the local server only (playwright.config.ts).
// Usage: npx playwright test -c playwright.live.config.ts   (override with LIVE_URL=https://...)
const LIVE_URL = process.env.LIVE_URL ?? 'https://shadow-gate-storefront.netlify.app';
// Optional: LIVE_IP=<address> pins the live host to an address resolved beforehand (useful when the local DNS
// resolver is flaky). TLS/SNI still use the real host name, so certificates are verified normally.
const LIVE_IP = process.env.LIVE_IP;
const resolverArgs = LIVE_IP ? [`--host-resolver-rules=MAP ${new URL(LIVE_URL).hostname} ${LIVE_IP}`] : [];

export default defineConfig({
  testDir: './e2e',
  testMatch: 'smoke.spec.ts',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 2,
  retries: 1,
  reporter: [['list']],
  use: {
    baseURL: LIVE_URL,
    trace: 'retain-on-failure',
    launchOptions: {
      args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', ...resolverArgs],
    },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
