import { test, expect } from '@playwright/test';

test('homepage loads correctly', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Angular/);
});

test('can navigate to products', async ({ page }) => {
  await page.goto('/');
  // Add your specific navigation tests here
});
