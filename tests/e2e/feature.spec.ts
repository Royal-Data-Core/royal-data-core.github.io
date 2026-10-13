const { test, expect } = require('@playwright/test');

test.describe('Feature X', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="home-header"]')).toBeVisible();
  });

  test('should submit contact form', async ({ page }) => {
    await page.goto('/contact');
    await page.fill('[data-testid="name-input"]', 'Test User');
    await page.fill('[data-testid="message-input"]', 'Test message');
    await page.click('[data-testid="submit-btn"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });
});