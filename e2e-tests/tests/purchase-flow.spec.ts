import { test, expect } from '@playwright/test';

test.describe('Flash Sale User Journey', () => {

    test('User should be able to secure a spot and be blocked from doing it twice', async ({ page }) => {
        // Generate the user ID *inside* the test so it remains consistent for this entire session
        const testUser = `testuser_${Date.now()}@example.com`;

        // 1. Navigate to the frontend
        await page.goto('http://localhost:5173');
        await expect(page.locator('text=ACTIVE')).toBeVisible();

        // 2. Attempt the first purchase
        await page.getByPlaceholder('Enter your email').fill(testUser);
        await page.getByRole('button', { name: 'Claim My Lifetime Deal' }).click();

        // 3. Verify it succeeds — the new UI shows "Email sent" on success
        await expect(page.locator('text=Email sent')).toBeVisible();

        // 4. Clear the input field and re-enter the same email to attempt a second purchase
        await page.getByPlaceholder('Enter your email').clear();
        await page.getByPlaceholder('Enter your email').fill(testUser);
        await page.getByRole('button', { name: 'Claim My Lifetime Deal' }).click();

        // 5. Verify the backend rejection reaches the UI
        await expect(page.locator('text=User already purchased')).toBeVisible();
    });

});