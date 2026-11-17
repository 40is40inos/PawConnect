const { test, expect } = require('@playwright/test');
const { login, day, keeperCard } = require('./helpers');

test.describe('pet owner', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'maria_o');
    await expect(page.getByRole('heading', { name: 'Hi Maria' })).toBeVisible();
  });

  test('requests a booking with a price preview, then withdraws it', async ({ page }) => {
    const card = keeperCard(page, 'Anna Mavraki');
    await card.getByRole('button', { name: 'Request booking' }).click();
    await card.getByLabel('From', { exact: true }).fill(day(60));
    await card.getByLabel('To', { exact: true }).fill(day(62));
    await expect(card.getByText('3 days')).toBeVisible();
    await expect(card.getByText('€90.00')).toBeVisible(); // 3 × €30
    await card.getByLabel('Message to the keeper (optional)').fill('Rex needs two long walks a day.');
    await card.getByRole('button', { name: 'Send request' }).click();
    await expect(page.getByText('Request sent to Anna')).toBeVisible();

    await page.getByRole('tab', { name: /Bookings/ }).click();
    const booking = page.locator('.card', { hasText: 'Rex needs two long walks' });
    await expect(booking.getByText('Waiting for keeper')).toBeVisible();
    await expect(booking.getByText('Contact details are shared once the keeper accepts.')).toBeVisible();

    page.once('dialog', (dialog) => dialog.accept());
    await booking.getByRole('button', { name: 'Withdraw request' }).click();
    await expect(booking.getByText('Cancelled')).toBeVisible();
  });

  test("can't book a keeper who doesn't look after her pets", async ({ page }) => {
    const card = keeperCard(page, 'Giorgos Papadakis');
    await card.getByRole('button', { name: 'Request booking' }).click();
    await expect(card.getByText(/looks after bird, rabbit, rodent, fish only/)).toBeVisible();
  });

  test('adds, edits and removes a pet', async ({ page }) => {
    await page.getByRole('tab', { name: 'My pets' }).click();
    await page.getByRole('button', { name: 'Add a pet' }).click();
    const form = page.locator('form', { hasText: 'Add a pet' });
    await form.getByLabel('Name').fill('Coco');
    await form.getByLabel('Species').selectOption('RABBIT');
    await form.getByLabel('Care notes for keepers').fill('Fresh hay daily.');
    await form.getByRole('button', { name: 'Save' }).click();

    const coco = page.locator('.card', { hasText: 'Coco' });
    await expect(coco.getByText('Fresh hay daily.')).toBeVisible();

    await coco.getByRole('button', { name: 'Edit' }).click();
    await page.locator('form', { hasText: 'Edit Coco' }).getByLabel('Breed').fill('Dwarf lop');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.locator('.card', { hasText: 'Coco' }).getByText('Dwarf lop')).toBeVisible();

    page.once('dialog', (dialog) => dialog.accept());
    await page.locator('.card', { hasText: 'Coco' }).getByRole('button', { name: 'Remove' }).click();
    await expect(page.locator('.card', { hasText: 'Coco' })).toHaveCount(0);
  });

  test("can't remove a pet that has an upcoming booking", async ({ page }) => {
    await page.getByRole('tab', { name: 'My pets' }).click();
    page.once('dialog', (dialog) => dialog.accept());
    await page.locator('.card', { hasText: 'Rex' }).getByRole('button', { name: 'Remove' }).click();
    await expect(page.getByText('Rex has upcoming bookings')).toBeVisible();
  });

  test('reviews a completed stay', async ({ page }) => {
    await page.getByRole('tab', { name: /Bookings/ }).click();
    const stay = page.locator('.card', { hasText: 'Nikos Tzanakis' });
    await expect(stay.getByText('Completed')).toBeVisible();
    // The keeper's contact details are visible after an accepted stay.
    await expect(stay.getByText('nikos_t@example.com')).toBeVisible();

    await stay.getByRole('button', { name: 'Review keeper' }).click();
    await stay.getByLabel('Rating').selectOption('4');
    await stay.getByLabel('How did it go? (optional)').fill('Luna was relaxed when we came back.');
    await stay.getByRole('button', { name: 'Post review' }).click();

    await expect(stay.getByText('Luna was relaxed when we came back.')).toBeVisible();
    await expect(stay.getByRole('button', { name: 'Review keeper' })).toHaveCount(0);

    await page.goto('/keepers/nikos_t');
    await expect(page.getByText('Luna was relaxed when we came back.')).toBeVisible();
  });
});
