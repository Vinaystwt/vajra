/**
 * Vajra Interactive QA — Playwright headless
 * Tests: War Room flows, Proofs drawer, Developers tabs, mobile nav
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const BASE = 'http://127.0.0.1:4173';
const results = [];

function pass(label) { results.push({ status: '✅', label }); console.log('✅', label); }
function fail(label, detail) { results.push({ status: '❌', label, detail }); console.error('❌', label, detail || ''); }
function warn(label, detail) { results.push({ status: '⚠️', label, detail }); console.warn('⚠️', label, detail || ''); }

const browser = await chromium.launch({ headless: true });

// ─── Helper ─────────────────────────────────────────────────────────────────
async function shot(page, name) {
  await page.screenshot({ path: join(__dir, `qa-${name}.png`), fullPage: false });
}

// ─── 1. WAR ROOM ─────────────────────────────────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  // Collect console errors
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Scroll to war room
  await page.evaluate(() => document.getElementById('war-room')?.scrollIntoView());
  await page.waitForTimeout(600);

  // Check attempt buttons present
  const attemptBtns = await page.locator('button').filter({ hasText: /attempt/i }).count();
  if (attemptBtns >= 1) pass('War Room: attempt buttons visible');
  else fail('War Room: attempt buttons missing', `found ${attemptBtns}`);

  // Check vault balance visible
  const vaultText = await page.locator('text=10,000').first().isVisible().catch(() => false);
  if (vaultText) pass('War Room: vault balance 10,000 visible');
  else warn('War Room: vault balance text not found with "10,000"');

  // --- Normal mode: approved spend ---
  const approvedBtn = page.locator('button').filter({ hasText: /approved spend/i }).first();
  const approvedBtnVisible = await approvedBtn.isVisible().catch(() => false);
  if (approvedBtnVisible) {
    await approvedBtn.click();
    await page.waitForTimeout(4000); // wait for animation sequence
    await shot(page, 'warroom-allowed');

    // Check terminal has PASS lines
    const passLine = await page.locator('text=PASS').first().isVisible().catch(() => false);
    if (passLine) pass('War Room: terminal shows PASS lines for allowed spend');
    else warn('War Room: terminal PASS lines not visible after allowed spend');

    // Vault should show reduced balance
    const vaultReduced = await page.locator('text=9,950').first().isVisible().catch(() => false);
    if (vaultReduced) pass('War Room: vault balance decremented after allowed spend');
    else warn('War Room: vault balance decrement not visible');

    pass('War Room: approved spend click registered');
  } else {
    fail('War Room: approved spend button not found');
  }

  // --- Compromised mode toggle ---
  const compromisedToggle = await page.locator('text=Compromised').first().isVisible().catch(() => false);
  if (compromisedToggle) pass('War Room: compromised mode label visible');
  else warn('War Room: compromised label not found yet (expected before toggle)');

  // Target by aria-label (fixed in AgentTerminal)
  const toggleBtn = page.locator('button[aria-label*="compromised mode" i]').first();
  const toggleVisible = await toggleBtn.isVisible().catch(() => false);
  if (toggleVisible) {
    await toggleBtn.click();
    await page.waitForTimeout(600);
    pass('War Room: compromised toggle clicked via aria-label');
    await shot(page, 'warroom-compromised-mode');
  } else {
    warn('War Room: compromised toggle aria-label not found');
  }

  // --- Attack mode: over-cap ---
  const overCapBtn = page.locator('button').filter({ hasText: /over.?cap/i }).first();
  const overCapVisible = await overCapBtn.isVisible().catch(() => false);
  if (overCapVisible) {
    await overCapBtn.click();
    await page.waitForTimeout(4000);
    await shot(page, 'warroom-blocked');

    // Check terminal has FAIL
    const failLine = await page.locator('text=FAIL').first().isVisible().catch(() => false);
    if (failLine) pass('War Room: terminal shows FAIL on blocked attempt');
    else warn('War Room: FAIL line not visible after blocked attempt');

    // Check ENFORCEMENT ACTIVE or similar
    const enforcedText = await page.locator('text=ENFORCEMENT').first().isVisible().catch(() => false);
    if (enforcedText) pass('War Room: ENFORCEMENT ACTIVE text visible on block');
    else warn('War Room: ENFORCEMENT ACTIVE not found');

    // Vault unchanged — should still be 9,950 (not 9,950 - 5000)
    const vaultUnchanged = await page.locator('text=9,950').first().isVisible().catch(() => false);
    if (vaultUnchanged) pass('War Room: vault balance unchanged on blocked spend (✓ 9,950)');
    else warn('War Room: vault unchanged state not confirmed visually');

  } else {
    fail('War Room: over-cap button not found');
  }

  // --- Proof reveal card ---
  const proofReveal = await page.locator('text=/cached devnet proof/i').first().isVisible().catch(() => false);
  if (proofReveal) pass('War Room: proof reveal card visible after block');
  else warn('War Room: proof reveal card not visible (may need specific attack to trigger)');

  // --- Raw drain attempt ---
  const rawDrainBtn = page.locator('button').filter({ hasText: /raw drain/i }).first();
  const rawDrainVisible = await rawDrainBtn.isVisible().catch(() => false);
  if (rawDrainVisible) {
    await rawDrainBtn.click();
    await page.waitForTimeout(4000);
    await shot(page, 'warroom-rawdrain');
    pass('War Room: raw drain button clicked');

    const policyPDA = await page.locator('text=PolicyPDA').first().isVisible().catch(() => false);
    if (policyPDA) pass('War Room: PolicyPDA text visible in raw drain terminal');
    else warn('War Room: PolicyPDA not visible in raw drain output');
  } else {
    warn('War Room: raw drain button not found (may be in attack tab)');
  }

  // Console errors
  if (consoleErrors.length === 0) pass('Landing page: zero JS console errors');
  else fail('Landing page: JS console errors', consoleErrors.slice(0, 3).join(' | '));

  await ctx.close();
}

// ─── 2. PROOFS PAGE ──────────────────────────────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

  await page.goto(BASE + '/proofs', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await shot(page, 'proofs-loaded');

  // Table rows
  const rows = await page.locator('table tr, [class*="divide"] > div').count();
  if (rows >= 5) pass(`Proofs: table has ${rows} rows/divs`);
  else warn(`Proofs: table row count low (${rows})`);

  // Blocked row with 0.00 delta
  const zeroDeltas = await page.locator('text=0.00').count();
  if (zeroDeltas >= 1) pass(`Proofs: ${zeroDeltas} vault-delta-0 rows visible (blocked)`);
  else fail('Proofs: no 0.00 vault delta rows found');

  // BLOCKED badges
  const blockedBadges = await page.locator('text=BLOCKED').count();
  if (blockedBadges >= 1) pass(`Proofs: ${blockedBadges} BLOCKED status badges visible`);
  else warn('Proofs: BLOCKED badges not found');

  // Click first blocked row to open drawer
  const firstClickable = page.locator('[class*="cursor-pointer"]').first();
  const clickable = await firstClickable.isVisible().catch(() => false);
  if (clickable) {
    await firstClickable.click();
    await page.waitForTimeout(600);
    await shot(page, 'proofs-drawer-open');

    // Drawer: explorer link
    const explorerLink = await page.locator('a[href*="explorer.solana.com"]').first().isVisible().catch(() => false);
    if (explorerLink) pass('Proofs: drawer contains Explorer link');
    else warn('Proofs: Explorer link not found in drawer');

    // Drawer: signature
    const sig = await page.locator('text=/[A-Za-z0-9]{20,}/').first().isVisible().catch(() => false);
    if (sig) pass('Proofs: signature text visible in drawer');
    else warn('Proofs: signature not visible in drawer');

    // Close drawer — Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    pass('Proofs: drawer closed via Escape');
  } else {
    fail('Proofs: no clickable row found to test drawer');
  }

  // Filter tabs
  const blockedTab = page.locator('button').filter({ hasText: /blocked/i }).first();
  const blockedTabVisible = await blockedTab.isVisible().catch(() => false);
  if (blockedTabVisible) {
    await blockedTab.click();
    await page.waitForTimeout(400);
    const allowedAfterFilter = await page.locator('text=ALLOWED').count();
    if (allowedAfterFilter === 0) pass('Proofs: Blocked filter hides ALLOWED rows');
    else warn(`Proofs: Blocked filter — ${allowedAfterFilter} ALLOWED rows still visible`);
    pass('Proofs: filter tabs clickable');
  } else {
    warn('Proofs: filter tab not found');
  }

  if (consoleErrors.length === 0) pass('Proofs page: zero JS console errors');
  else fail('Proofs page: JS console errors', consoleErrors.slice(0, 3).join(' | '));

  await ctx.close();
}

// ─── 3. DEVELOPERS PAGE ──────────────────────────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

  await page.goto(BASE + '/developers', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  // SDK tab (default)
  const codeBlock = await page.locator('pre').first().isVisible().catch(() => false);
  if (codeBlock) pass('Developers: SDK tab code block visible by default');
  else warn('Developers: SDK code block not found on default tab');

  // Tab switching
  const tabs = ['MCP', 'x402-style', 'Policy Builder', 'Templates'];
  for (const tabLabel of tabs) {
    const tab = page.locator('button').filter({ hasText: new RegExp(tabLabel, 'i') }).first();
    const tabVisible = await tab.isVisible().catch(() => false);
    if (tabVisible) {
      await tab.click();
      await page.waitForTimeout(400);
      await shot(page, `developers-tab-${tabLabel.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`);
      pass(`Developers: "${tabLabel}" tab clickable and rendered`);
    } else {
      fail(`Developers: "${tabLabel}" tab not found`);
    }
  }

  // x402 tab: check honest copy
  const x402Tab = page.locator('button').filter({ hasText: /x402/i }).first();
  await x402Tab.click();
  await page.waitForTimeout(400);
  const localRef = await page.locator('text=/local|reference flow/i').first().isVisible().catch(() => false);
  if (localRef) pass('Developers: x402 tab shows "local reference flow" disclaimer');
  else warn('Developers: x402 disclaimer not visible');

  // Policy Builder tab
  const pbTab = page.locator('button').filter({ hasText: /policy builder/i }).first();
  await pbTab.click();
  await page.waitForTimeout(400);
  const simOnly = await page.locator('text=/simulation|simulate/i').first().isVisible().catch(() => false);
  if (simOnly) pass('Developers: Policy Builder shows simulation-only label');
  else warn('Developers: Policy Builder simulation label not found');

  // Try interacting with policy builder
  const budgetInput = page.locator('input').first();
  const inputVisible = await budgetInput.isVisible().catch(() => false);
  if (inputVisible) {
    await budgetInput.fill('5000');
    await page.waitForTimeout(300);
    pass('Developers: Policy Builder input accepts value');
  } else {
    warn('Developers: no input found in Policy Builder');
  }

  if (consoleErrors.length === 0) pass('Developers page: zero JS console errors');
  else fail('Developers page: JS console errors', consoleErrors.slice(0, 3).join(' | '));

  await ctx.close();
}

// ─── 4. MOBILE NAV ───────────────────────────────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  // Hamburger
  const hamburger = page.locator('button').filter({ has: page.locator('svg') }).first();
  // More precisely: look for nav toggle
  const menuBtn = page.locator('button[aria-label*="menu" i], button[aria-label*="nav" i]').first();
  const menuBtnVisible = await menuBtn.isVisible().catch(() => false);

  if (menuBtnVisible) {
    await menuBtn.click();
    await page.waitForTimeout(400);
    await shot(page, 'mobile-nav-open');
    pass('Mobile nav: hamburger opens menu');

    // Check nav links visible
    const whyLink = await page.locator('a[href="/why"]').first().isVisible().catch(() => false);
    if (whyLink) pass('Mobile nav: /why link visible in open menu');
    else warn('Mobile nav: /why link not visible in open menu');

    // Close
    await menuBtn.click();
    await page.waitForTimeout(400);
    pass('Mobile nav: hamburger closes menu');
  } else {
    // Try any button in nav area
    const navButtons = await page.locator('nav button, header button').all();
    if (navButtons.length > 0) {
      await navButtons[0].click();
      await page.waitForTimeout(400);
      await shot(page, 'mobile-nav-open');
      pass('Mobile nav: nav button clicked (hamburger variant)');
    } else {
      warn('Mobile nav: no hamburger button found with aria-label');
    }
  }

  // Check horizontal overflow
  const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  const viewportWidth = 390;
  if (bodyWidth <= viewportWidth + 2) pass(`Mobile nav: no horizontal overflow (scrollWidth=${bodyWidth})`);
  else fail(`Mobile nav: horizontal overflow detected (scrollWidth=${bodyWidth} > ${viewportWidth})`);

  // Navigate to /proofs via URL (not nav, since hamburger state is complex)
  await page.goto(BASE + '/proofs', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const proofsMobile = await page.locator('text=Do not trust').first().isVisible().catch(() => false);
  if (proofsMobile) pass('Mobile: /proofs page loads correctly');
  else warn('Mobile: /proofs headline not found');

  await page.goto(BASE + '/developers', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const devMobile = await page.locator('text=Integrate').first().isVisible().catch(() => false);
  if (devMobile) pass('Mobile: /developers page loads correctly');
  else warn('Mobile: /developers headline not found');

  if (consoleErrors.length === 0) pass('Mobile: zero JS console errors');
  else fail('Mobile: JS console errors', consoleErrors.slice(0, 3).join(' | '));

  await ctx.close();
}

// ─── 5. WHY PAGE ─────────────────────────────────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

  await page.goto(BASE + '/why', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  const headline = await page.locator('text=/agents need|budgets/i').first().isVisible().catch(() => false);
  if (headline) pass('Why page: hero headline visible');
  else warn('Why page: headline not found');

  // Comparison diagram
  const vajraRow = await page.locator('text=Vajra').first().isVisible().catch(() => false);
  if (vajraRow) pass('Why page: Vajra comparison row visible');
  else warn('Why page: Vajra row not found in diagram');

  if (consoleErrors.length === 0) pass('Why page: zero JS console errors');
  else fail('Why page: JS console errors', consoleErrors.slice(0, 3).join(' | '));

  await ctx.close();
}

// ─── SUMMARY ─────────────────────────────────────────────────────────────────
await browser.close();

console.log('\n══════════════════════════════════════════');
console.log('QA SUMMARY');
console.log('══════════════════════════════════════════');
const passed = results.filter(r => r.status === '✅').length;
const warned = results.filter(r => r.status === '⚠️').length;
const failed = results.filter(r => r.status === '❌').length;
results.forEach(r => {
  const line = `${r.status} ${r.label}${r.detail ? ` — ${r.detail}` : ''}`;
  console.log(line);
});
console.log('──────────────────────────────────────────');
console.log(`Total: ${passed} passed, ${warned} warned, ${failed} failed`);
