import { test, expect } from '@playwright/test';

test.describe('Customer portal login → dashboard (happy path)', () => {
  test('demo login redirects to dashboard', async ({ page }) => {
    // Mock the login API to simulate a successful demo login
    await page.route('**/api/auth/login', async (route) => {
      const json = {
        success: true,
        user: {
          id: 'demo-id',
          email: 'demo@fisherbackflows.com',
          name: 'Demo User',
          accountNumber: 'DEMO-001',
          status: 'active',
        },
        redirect: '/portal/dashboard',
      };
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(json) });
    });

    // Stub the dashboard page to avoid middleware/protected route complexity
    await page.route('**/portal/dashboard', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `<!doctype html><html><head><title>Dashboard</title></head><body>
          <main>
            <h1>Customer Dashboard</h1>
            <div id="welcome">Welcome back, Demo User!</div>
          </main>
        </body></html>`,
      });
    });

    // Go to customer portal login page
    await page.goto('/portal');

    // Click the demo login button
    await page.getByRole('button', { name: /Try Demo Account/i }).click();

    // Expect redirect navigation to dashboard and content visible
    await expect(page).toHaveURL(/\/portal\/dashboard/);
    await expect(page.getByRole('heading', { name: /Customer Dashboard/i })).toBeVisible();
    await expect(page.locator('#welcome')).toContainText('Demo User');
  });
});

