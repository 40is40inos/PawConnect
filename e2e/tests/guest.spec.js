const { test, expect } = require('@playwright/test');
const { keeperCard } = require('./helpers');

test.describe('guest', () => {
  test('searches keepers by city and species', async ({ page }) => {
    await page.goto('/guest');
    await expect(keeperCard(page, 'Eleni Kostaki')).toBeVisible();
    await expect(page.locator('.card', { hasText: '/day' })).toHaveCount(4);

    await page.getByLabel('City').fill('heraklion');
    await page.getByLabel('Pet').selectOption('DOG');
    await page.getByRole('button', { name: 'Search' }).click();

    await expect(page.locator('.card', { hasText: '/day' })).toHaveCount(1);
    await expect(keeperCard(page, 'Eleni Kostaki')).toBeVisible();
    // Guests can't book.
    await expect(page.getByRole('button', { name: 'Request booking' })).toHaveCount(0);
  });

  test('sees a keeper page with reviews but no contact details', async ({ page }) => {
    await page.goto('/guest');
    await keeperCard(page, 'Eleni Kostaki').getByRole('link', { name: 'Profile and reviews' }).click();

    await expect(page).toHaveURL(/\/keepers\/eleni_k$/);
    await expect(page.getByRole('heading', { name: /Reviews \(\d+\)/ })).toBeVisible();
    await expect(page.getByText('Rex came back tired and happy')).toBeVisible();
    await expect(page.getByText('+306900000000')).toHaveCount(0);
    await expect(page.getByText('to see contact details')).toBeVisible();
  });

  test('sees the landing page at the root and can go on to search', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Care that feels like home/);
    await expect(page.getByRole('banner').getByRole('link', { name: 'Log in' })).toBeVisible();
    // The featured keepers come from the public search.
    await expect(page.locator('.coverCard', { hasText: 'Eleni Kostaki' })).toHaveCount(1);
    await page.getByRole('link', { name: 'Find a keeper' }).first().click();
    await expect(page).toHaveURL(/\/guest$/);
  });

  test('works on a phone screen without sideways scrolling', async ({ browser }) => {
    const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
    for (const url of ['/', '/guest', '/keepers/eleni_k', '/login', '/register']) {
      await phone.goto(url);
      await phone.waitForLoadState('networkidle');
      const overflow = await phone.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `horizontal overflow on ${url}`).toBeLessThanOrEqual(0);
    }
    await phone.close();
  });
});
