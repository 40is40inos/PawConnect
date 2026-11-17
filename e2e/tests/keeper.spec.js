const { test, expect } = require('@playwright/test');
const { login } = require('./helpers');

test.describe('pet keeper', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'eleni_k');
    await expect(page.getByRole('heading', { name: 'Hi Eleni' })).toBeVisible();
  });

  test('accepts and declines requests', async ({ page }) => {
    await expect(page.getByText('Waiting for your answer')).toBeVisible();

    const luna = page.locator('.card', { hasText: 'Luna is shy but sweet' });
    await expect(luna.getByText('Needs your answer')).toBeVisible();
    await expect(luna.getByText('Hides under the bed')).toBeVisible(); // care notes
    await expect(luna.getByText('maria_o@example.com')).toHaveCount(0); // not shared yet

    await luna.getByRole('button', { name: 'Accept' }).click();
    const accepted = page.locator('.card', { hasText: 'Luna is shy but sweet' });
    await expect(accepted.getByText('Accepted')).toBeVisible();
    await expect(accepted.getByText('maria_o@example.com')).toBeVisible();

    const bruno = page.locator('.card', { hasText: 'Bruno' }).filter({ has: page.getByRole('button', { name: 'Decline' }) });
    page.once('dialog', (dialog) => dialog.accept());
    await bruno.getByRole('button', { name: 'Decline' }).click();
    await expect(page.getByRole('button', { name: 'Decline' })).toHaveCount(0);
    await expect(page.getByText('Declined')).toBeVisible();
  });

  test('updates her keeper profile', async ({ page }) => {
    await page.getByRole('tab', { name: 'Keeper profile' }).click();
    await page.getByLabel('Price per day (€)').fill('26');
    await page.getByLabel('Rabbit').check();
    await page.getByRole('button', { name: 'Save profile' }).click();
    await expect(page.getByText('Saved. Owners can now find you in search.')).toBeVisible();

    await page.goto('/keepers/eleni_k');
    await expect(page.getByText('€26.00/day')).toBeVisible();
    await expect(page.locator('.chip', { hasText: 'Rabbit' })).toBeVisible();
  });

  test("can't open the admin page", async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login$/);
  });
});
