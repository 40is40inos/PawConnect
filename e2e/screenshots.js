// Retakes the README screenshots in ../docs/screenshots.
//
//   cd frontend && npm run build
//   cd ../e2e && npm run screenshots
//
// Starts the same server as the browser tests (fresh SQLite demo data on
// port 5100), then visits each page and waits for its entrance animations to
// settle before capturing. Set CHROME_PATH to use a locally installed Chrome.
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('@playwright/test');

const BASE = 'http://localhost:5100';
const OUT = path.join(__dirname, '..', 'docs', 'screenshots');
const DESKTOP = { width: 1280, height: 800 };
const TALL = { width: 1280, height: 1000 }; // dashboards and the profile
const PHONE = { width: 390, height: 844 };
const SETTLE_MS = 2600; // longest entrance animation is about 2s

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForServer() {
  for (let i = 0; i < 120; i += 1) {
    try {
      const res = await fetch(`${BASE}/api/health`);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await wait(500);
  }
  throw new Error('Server did not start');
}

async function newPage(browser, viewport = DESKTOP) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    isMobile: viewport === PHONE,
    hasTouch: viewport === PHONE,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20_000);
  return page;
}

async function login(page, userName) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('Username').fill(userName);
  await page.getByLabel('Password').fill('demo-password');
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.waitForURL(`${BASE}/`);
}

async function shoot(page, name, options = {}) {
  await wait(SETTLE_MS);
  // Park the pointer so no card is caught mid-tilt.
  await page.mouse.move(2, 2);
  await wait(400);
  await page.screenshot({ path: path.join(OUT, `${name}.jpg`), type: 'jpeg', quality: 86, ...options });
  console.log(`  ${name}.jpg`);
}

async function openTab(page, label) {
  await page.getByRole('tab', { name: label }).click();
}

async function main() {
  const server = spawn(process.execPath, ['start-server.js'], {
    cwd: __dirname,
    stdio: process.env.DEBUG ? 'inherit' : 'ignore',
  });
  let browser;
  try {
    await waitForServer();
    browser = await chromium.launch(
      process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {},
    );

    // Visitors
    let page = await newPage(browser);
    await page.goto(BASE);
    await shoot(page, 'landing');
    await page.goto(`${BASE}/guest`);
    await page.getByRole('button', { name: 'Search' }).click();
    await page.locator('.keeperCard').first().waitFor();
    await shoot(page, 'find-a-keeper');
    await page.goto(`${BASE}/login`);
    await shoot(page, 'login');
    await page.context().close();

    // Owner
    page = await newPage(browser, TALL);
    await login(page, 'maria_o');
    await page.goto(`${BASE}/keepers/eleni_k`);
    await page.locator('.miniCal').waitFor();
    await wait(1200);
    // Pick a four-night stay next month to show the range on the calendar.
    await page.getByRole('button', { name: 'Next month' }).click();
    await wait(800);
    const labels = await page
      .locator('.miniCalGrid button:not([disabled])')
      .evaluateAll((els) => els.map((el) => el.getAttribute('aria-label')));
    await page.getByRole('button', { name: labels[8], exact: true }).click();
    await page.getByRole('button', { name: labels[12], exact: true }).click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await shoot(page, 'keeper-page');
    await page.goto(BASE);
    await openTab(page, 'Bookings');
    await page.locator('.bookingCard').first().waitFor();
    await shoot(page, 'owner-bookings');
    await openTab(page, 'My pets');
    await page.locator('.petCard').first().waitFor();
    await shoot(page, 'my-pets');
    await page.context().close();

    // Keeper
    page = await newPage(browser, TALL);
    await login(page, 'eleni_k');
    await page.locator('.bookingCard').first().waitFor();
    await shoot(page, 'keeper-requests');
    await page.context().close();

    // Phone
    page = await newPage(browser, PHONE);
    await page.goto(BASE);
    await shoot(page, 'phone-landing');
    await page.goto(`${BASE}/keepers/eleni_k`);
    await shoot(page, 'phone-keeper-page');
    await page.context().close();

  } finally {
    await browser?.close();
    server.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
