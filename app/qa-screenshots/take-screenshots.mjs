import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));

const routes = [
  { path: '/', name: 'home' },
  { path: '/why', name: 'why' },
  { path: '/proofs', name: 'proofs' },
  { path: '/developers', name: 'developers' },
];
const BASE = 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true });

async function scrollAndCapture(page, name) {
  // Scroll through entire page so whileInView animations trigger
  const height = await page.evaluate(() => document.body.scrollHeight);
  const step = 600;
  for (let y = 0; y < height; y += step) {
    await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
    await page.waitForTimeout(120);
  }
  // Scroll back to top for clean screenshot
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(__dir, `${name}.png`), fullPage: true });
  console.log(`✓ ${name}.png`);
}

const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
for (const r of routes) {
  const page = await desktop.newPage();
  await page.goto(BASE + r.path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await scrollAndCapture(page, `${r.name}-desktop`);
  await page.close();
}

const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
for (const r of [routes[0], routes[2], routes[3]]) {
  const page = await mobile.newPage();
  await page.goto(BASE + r.path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await scrollAndCapture(page, `${r.name}-mobile`);
  await page.close();
}

await browser.close();
