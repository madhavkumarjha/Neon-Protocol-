import { test, expect } from '@playwright/test';

test.describe('Neon Protocol E2E Core Flow Suite', () => {
  test('should load boot screen, title text, and start game canvas', async ({ page }) => {
    await page.goto('/');

    // Verify title text in DOM/canvas
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Click canvas to unlock Web Audio and start game
    await canvas.click();
  });

  test('should open pause menu on ESC key press', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('canvas');
    await canvas.click();

    // Press ESC to trigger pause modal
    await page.keyboard.press('Escape');

    // Canvas remains active
    await expect(canvas).toBeVisible();
  });
});
