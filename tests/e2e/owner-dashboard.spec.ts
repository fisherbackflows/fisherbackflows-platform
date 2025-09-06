import { test, expect } from '@playwright/test';

test.describe('Owner Dashboard shell', () => {
  test('renders cards with metrics via API fallback', async ({ page }) => {
    await page.goto('/owner');

    await expect(page.getByRole('heading', { name: /Owner Dashboard/i })).toBeVisible();

    await expect(page.getByText(/Upcoming Inspections/i)).toBeVisible();
    await expect(page.getByText(/Open Work Orders/i)).toBeVisible();
    await expect(page.getByText(/Total Customers/i)).toBeVisible();
  });
});

