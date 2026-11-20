const { test, expect } = require('@playwright/test');
const { login, PASSWORD } = require('./helpers');

test('admin deletes a user', async ({ page, request }) => {
  // A throwaway account created through the API.
  const userName = `todelete_${Date.now().toString(36)}`;
  const res = await request.post('/api/auth/register', {
    data: {
      userName,
      password: PASSWORD,
      email: `${userName}@example.com`,
      firstName: 'Delete',
      lastName: 'Me',
      birthdate: '1990-01-01',
      sex: 'O',
      type: 'PETOWNER',
      country: 'Greece',
      city: 'Patras',
      address: 'Street 1',
      phoneNumber: '+306922222222',
    },
  });
  expect(res.status()).toBe(201);

  await login(page, 'demo_admin');
  await expect(page.getByRole('heading', { name: 'Admin page' })).toBeVisible();
  await page.getByRole('button', { name: 'Show users' }).click();

  const card = page.locator('.user', { hasText: userName });
  await expect(card).toBeVisible();
  page.once('dialog', (dialog) => dialog.accept());
  await card.getByRole('button', { name: 'Delete user' }).click();
  await expect(page.locator('.user', { hasText: userName })).toHaveCount(0);

  // The deleted account can no longer log in.
  await page.getByRole('button', { name: 'Log out' }).click();
  await login(page, userName);
  await expect(page.getByText('Wrong username or password')).toBeVisible();
});
