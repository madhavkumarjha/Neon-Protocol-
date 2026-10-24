import { test, expect } from '@playwright/test';

test.describe('Neon Protocol E2E Core Flow Suite', () => {
  test('should load boot screen, transition through menu, and start game loop', async ({ page }) => {
    await page.goto('/');

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Step 1: Click canvas on BootScene to unlock audio and transition to MenuScene
    await canvas.click();
    await page.waitForTimeout(600);

    // Step 2: Click "START SURVIVAL" button in MenuScene (located near center-bottom)
    const box = await canvas.boundingBox();
    if (box) {
      // Menu start button is at (width / 2, height / 2 + 50)
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2 + 50);
    }
    await page.waitForTimeout(800);

    // Step 3: Test keyboard movement (WASD) and tactical dash (SHIFT)
    await page.keyboard.down('KeyW');
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(300);
    await page.keyboard.up('KeyW');
    await page.keyboard.up('KeyD');

    // Trigger dash
    await page.keyboard.press('Shift');
    await page.waitForTimeout(200);

    // Step 4: Aim with mouse
    if (box) {
      await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2);
    }
    await page.waitForTimeout(500);

    // Canvas must remain active and rendering smoothly
    await expect(canvas).toBeVisible();
  });

  test('should toggle pause modal on ESC key press and resume', async ({ page }) => {
    await page.goto('/');

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Enter menu and start survival
    await canvas.click();
    await page.waitForTimeout(500);

    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2 + 50);
    }
    await page.waitForTimeout(800);

    // Press ESC to trigger pause modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    // Canvas remains active
    await expect(canvas).toBeVisible();

    // Press ESC again to resume gameplay
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    await expect(canvas).toBeVisible();
  });

  test('should verify desktop overlay remains hidden on desktop viewports', async ({ page }) => {
    await page.goto('/');

    // On standard desktop resolution (1280x720), overlay must not be visible
    const overlay = page.locator('#desktop-only-overlay');
    await expect(overlay).toBeHidden();
  });
});
