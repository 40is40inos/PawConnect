// @ts-check
const { defineConfig, devices } = require('@playwright/test');

// Two ways to run:
// - E2E_BASE_URL set (CI): test an app that is already running, e.g. the
//   Docker Compose stack at http://localhost:5000.
// - Otherwise: start-server.js builds nothing, it starts the API in production
//   mode on a fresh SQLite file with demo data, serving ../frontend/build.
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:5100';

module.exports = defineConfig({
  testDir: './tests',
  // The tests share one seeded database, so they run one after another.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  // No retries: the tests change shared data, so a retry wouldn't start clean.
  retries: 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Use a locally installed Chrome when CHROME_PATH is set.
    launchOptions: process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {},
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'node start-server.js',
        url: `${baseURL}/api/health`,
        timeout: 60_000,
        reuseExistingServer: false,
      },
});
