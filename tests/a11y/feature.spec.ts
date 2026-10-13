const { test, expect } = require('@playwright/test');
const { axe, checkA11y } = require('@axe-core/playwright');

test.describe('Accessibility Tests', () => {
  test('homepage passes a11y checks', async ({ page }) => {
    await page.goto('/');
    await checkA11y(page);
  });

  test('contact form is accessible', async ({ page }) => {
    await page.goto('/contact');
    await checkA11y(page);
  });
});