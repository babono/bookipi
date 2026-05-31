import { test, expect } from '@playwright/test';

test.describe('Flash Sale User Journey', () => {

    test('User should be able to buy an item and be blocked from buying twice', async ({ page }) => {
        // Generate the user ID *inside* the test so it remains consistent for this entire session
        const testUser = `testuser_${Date.now()}@example.com`;

        // 1. Navigate to the frontend
        await page.goto('http://localhost:5173');
        await expect(page.locator('text=ACTIVE')).toBeVisible();

        // 2. Attempt the first purchase
        await page.getByPlaceholder('Enter your email or ID').fill(testUser);
        await page.getByRole('button', { name: 'Buy Now' }).click();

        // 3. Verify it succeeds
        await expect(page.locator('text=✅ Purchase successful!')).toBeVisible();

        // 4. Attempt a second purchase immediately without changing the email
        await page.getByRole('button', { name: 'Buy Now' }).click();

        // 5. Verify the backend rejection reaches the UI
        await expect(page.locator('text=❌ User already purchased')).toBeVisible();
    });

});