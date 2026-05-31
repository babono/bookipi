import { SaleService } from './sale.service';
import redis from '../redis';

describe('SaleService - Core Logic', () => {
    beforeAll(async () => {
        // Initialize exactly 2 items in stock for our test scenario
        await SaleService.initializeStock(2);
    });

    afterAll(async () => {
        // Disconnect from Redis after tests finish so Jest can exit cleanly
        await redis.quit();
    });

    it('should allow a successful purchase', async () => {
        const result = await SaleService.attemptPurchase('user1@example.com');
        expect(result).toBe(1); // 1 = Success
    });

    it('should prevent the same user from purchasing twice', async () => {
        const result = await SaleService.attemptPurchase('user1@example.com');
        expect(result).toBe(-1); // -1 = Already Purchased
    });

    it('should allow a second user to purchase the last item', async () => {
        const result = await SaleService.attemptPurchase('user2@example.com');
        expect(result).toBe(1); // 1 = Success
    });

    it('should prevent a third user from purchasing when out of stock', async () => {
        const result = await SaleService.attemptPurchase('user3@example.com');
        expect(result).toBe(0); // 0 = Sold Out
    });
});