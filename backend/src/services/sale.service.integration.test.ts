import { SaleService } from './sale.service';
import redis from '../redis';

/**
 * Integration tests — these hit a real Redis instance.
 * Requires Docker Redis to be running: `docker-compose up -d`
 *
 * Run separately with: npm run test:integration
 */
describe('SaleService - Integration (Real Redis)', () => {
    beforeAll(async () => {
        // Use setSaleConfig to forcefully reset stock for a clean test
        await SaleService.setSaleConfig({
            startTime: new Date(Date.now() - 10000).toISOString(),
            endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            totalStock: 2,
        });
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

    it('should correctly report stock count after purchases', async () => {
        const stock = await SaleService.getStock();
        expect(stock).toBe(0);
    });

    it('should correctly report purchase status', async () => {
        expect(await SaleService.hasPurchased('user1@example.com')).toBe(true);
        expect(await SaleService.hasPurchased('user3@example.com')).toBe(false);
    });
});