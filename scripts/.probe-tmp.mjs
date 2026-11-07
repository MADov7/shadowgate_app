import { chromium } from '@playwright/test';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.goto(process.argv[2], { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
const r = await page.evaluate(async () => {
  const b = document.querySelector('.per-card__book');
  b.scrollIntoView({ block: 'center' });
  await new Promise((r) => setTimeout(r, 1200));
  const rect = b.getBoundingClientRect();
  const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
  return {
    inner: innerWidth, client: document.documentElement.clientWidth, scrollX, vv: visualViewport && { w: visualViewport.width, ox: visualViewport.offsetLeft, pl: visualViewport.pageLeft },
    rect: [rect.left | 0, rect.top | 0, rect.right | 0, rect.bottom | 0],
    hit: hit && hit.className, same: hit === b || b.contains(hit),
  };
});
console.log(JSON.stringify(r));
await browser.close();
