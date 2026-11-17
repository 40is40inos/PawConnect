const { test, expect } = require('@playwright/test');
const { login, logout, day, keeperCard, PASSWORD } = require('./helpers');

// The whole marketplace loop with a brand-new account:
// register -> add a pet -> request a keeper -> keeper accepts -> contact shared.
test('a new owner books a keeper who accepts', async ({ page }) => {
  const userName = `newowner_${Date.now().toString(36)}`;

  await page.goto('/register');
  await page.getByLabel('Username').fill(userName);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByLabel('Email').fill(`${userName}@example.com`);
  await page.getByLabel('Birthdate').fill('1996-03-14');
  await page.getByLabel('First name').fill('Dimitra');
  await page.getByLabel('Last name').fill('Nikolaou');
  await page.getByLabel('Account type').selectOption('PETOWNER');
  await page.getByLabel('Country').fill('Greece');
  await page.getByLabel('City').fill('Heraklion');
  await page.getByLabel('Address').fill('Kalokairinou 10');
  await page.getByLabel('Phone number').fill('+306911111111');
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page.getByRole('heading', { name: 'Hi Dimitra' })).toBeVisible();

  // No pets yet, so booking asks for one first.
  const eleni = keeperCard(page, 'Eleni Kostaki');
  await eleni.getByRole('button', { name: 'Request booking' }).click();
  await expect(eleni.getByText('Add a pet in the “My pets” tab first.')).toBeVisible();

  await page.getByRole('tab', { name: 'My pets' }).click();
  await page.getByRole('button', { name: 'Add a pet' }).click();
  await page.getByLabel('Name').fill('Milo');
  await page.getByLabel('Species').selectOption('CAT');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('.card', { hasText: 'Milo' })).toBeVisible();

  await page.getByRole('tab', { name: 'Find a keeper' }).click();
  await keeperCard(page, 'Eleni Kostaki').getByRole('button', { name: 'Request booking' }).click();
  const form = keeperCard(page, 'Eleni Kostaki');
  await form.getByLabel('From', { exact: true }).fill(day(40));
  await form.getByLabel('To', { exact: true }).fill(day(41));
  await form.getByLabel('Message to the keeper (optional)').fill('Milo is a first-timer.');
  await form.getByRole('button', { name: 'Send request' }).click();
  await expect(page.getByText('Request sent to Eleni')).toBeVisible();
  await logout(page);

  await login(page, 'eleni_k');
  const request = page.locator('.card', { hasText: 'Milo is a first-timer.' });
  await expect(request.getByText('Dimitra Nikolaou')).toBeVisible();
  await request.getByRole('button', { name: 'Accept' }).click();
  await expect(page.locator('.card', { hasText: 'Milo is a first-timer.' }).getByText('Accepted')).toBeVisible();
  await logout(page);

  await login(page, userName);
  await page.getByRole('tab', { name: /Bookings/ }).click();
  const booking = page.locator('.card', { hasText: 'Milo' });
  await expect(booking.getByText('Accepted')).toBeVisible();
  await expect(booking.getByText('eleni_k@example.com')).toBeVisible();
});
