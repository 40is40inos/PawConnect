const { expect } = require('@playwright/test');

// Demo accounts created by backend/scripts/seedDemo.js.
const PASSWORD = 'demo-password';

async function login(page, userName, password = PASSWORD) {
  await page.goto('/login');
  await page.getByLabel('Username').fill(userName);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
}

async function logout(page) {
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/login$/);
}

// YYYY-MM-DD, `offset` days from today in the browser's time zone.
function day(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

// A keeper card in search results.
const keeperCard = (page, name) => page.locator('.card', { hasText: name });

module.exports = { PASSWORD, login, logout, day, keeperCard };
