/**
 * Unit tests — no Redis connection required.
 * Tests business logic by mocking the Redis module.
 *
 * Run with: npm test
 */

// Mock the entire Redis module before any imports
jest.mock('../redis', () => ({
    __esModule: true,
    default: {
        hset: jest.fn(),
        hgetall: jest.fn(),
        set: jest.fn(),
        get: jest.fn(),
        del: jest.fn(),
        eval: jest.fn(),
        sismember: jest.fn(),
    },
}));

import { SaleService, SaleConfig } from './sale.service';
import redis from '../redis';

const mockRedis = redis as jest.Mocked<typeof redis>;

describe('SaleService - Unit Tests (Mocked Redis)', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --- attemptPurchase ---

    describe('attemptPurchase', () => {
        it('should return 1 when Lua script indicates success', async () => {
            mockRedis.eval.mockResolvedValue(1);

            const result = await SaleService.attemptPurchase('user@test.com');

            expect(result).toBe(1);
            expect(mockRedis.eval).toHaveBeenCalledWith(
                expect.any(String), // Lua script
                2,
                'sale:stock',
                'sale:users',
                'user@test.com'
            );
        });

        it('should return -1 when user already purchased', async () => {
            mockRedis.eval.mockResolvedValue(-1);

            const result = await SaleService.attemptPurchase('user@test.com');

            expect(result).toBe(-1);
        });

        it('should return 0 when sold out', async () => {
            mockRedis.eval.mockResolvedValue(0);

            const result = await SaleService.attemptPurchase('user@test.com');

            expect(result).toBe(0);
        });
    });

    // --- hasPurchased ---

    describe('hasPurchased', () => {
        it('should return true when user is in the buyers set', async () => {
            mockRedis.sismember.mockResolvedValue(1);

            const result = await SaleService.hasPurchased('buyer@test.com');

            expect(result).toBe(true);
            expect(mockRedis.sismember).toHaveBeenCalledWith('sale:users', 'buyer@test.com');
        });

        it('should return false when user is not in the buyers set', async () => {
            mockRedis.sismember.mockResolvedValue(0);

            const result = await SaleService.hasPurchased('stranger@test.com');

            expect(result).toBe(false);
        });
    });

    // --- getStock ---

    describe('getStock', () => {
        it('should parse and return the stock count', async () => {
            mockRedis.get.mockResolvedValue('42');

            const result = await SaleService.getStock();

            expect(result).toBe(42);
            expect(mockRedis.get).toHaveBeenCalledWith('sale:stock');
        });

        it('should return 0 when stock key is missing', async () => {
            mockRedis.get.mockResolvedValue(null);

            const result = await SaleService.getStock();

            expect(result).toBe(0);
        });
    });

    // --- setSaleConfig ---

    describe('setSaleConfig', () => {
        it('should write config to Redis hash and reset stock/buyers', async () => {
            const config: SaleConfig = {
                startTime: '2026-06-01T00:00:00Z',
                endTime: '2026-06-01T23:59:59Z',
                totalStock: 50,
            };

            await SaleService.setSaleConfig(config);

            expect(mockRedis.hset).toHaveBeenCalledWith('sale:config', {
                startTime: '2026-06-01T00:00:00Z',
                endTime: '2026-06-01T23:59:59Z',
                totalStock: '50',
            });
            expect(mockRedis.set).toHaveBeenCalledWith('sale:stock', 50);
            expect(mockRedis.del).toHaveBeenCalledWith('sale:users');
        });
    });

    // --- getSaleConfig ---

    describe('getSaleConfig', () => {
        it('should return parsed config when data exists in Redis', async () => {
            mockRedis.hgetall.mockResolvedValue({
                startTime: '2026-06-01T00:00:00Z',
                endTime: '2026-06-01T23:59:59Z',
                totalStock: '200',
            });

            const config = await SaleService.getSaleConfig();

            expect(config).toEqual({
                startTime: '2026-06-01T00:00:00Z',
                endTime: '2026-06-01T23:59:59Z',
                totalStock: 200,
            });
        });

        it('should return sensible defaults when no config exists', async () => {
            mockRedis.hgetall.mockResolvedValue({});

            const config = await SaleService.getSaleConfig();

            expect(config.totalStock).toBe(100);
            expect(new Date(config.startTime).getTime()).toBeLessThan(Date.now());
            expect(new Date(config.endTime).getTime()).toBeGreaterThan(Date.now());
        });
    });

    // --- initializeStock (NX semantics) ---

    describe('initializeStock', () => {
        it('should return true and clear buyers when stock key is new', async () => {
            mockRedis.set.mockResolvedValue('OK');

            const result = await SaleService.initializeStock(100);

            expect(result).toBe(true);
            expect(mockRedis.set).toHaveBeenCalledWith('sale:stock', 100, 'NX');
            expect(mockRedis.del).toHaveBeenCalledWith('sale:users');
        });

        it('should return false and not clear buyers when stock already exists', async () => {
            mockRedis.set.mockResolvedValue(null);

            const result = await SaleService.initializeStock(100);

            expect(result).toBe(false);
            expect(mockRedis.del).not.toHaveBeenCalled();
        });
    });

    // --- initializeSaleIfNew (atomic HSETNX) ---

    describe('initializeSaleIfNew', () => {
        it('should return true when no config existed (first-time init)', async () => {
            mockRedis.eval.mockResolvedValue(1);

            const result = await SaleService.initializeSaleIfNew({
                startTime: '2026-06-01T00:00:00Z',
                endTime: '2026-06-01T23:59:59Z',
                totalStock: 100,
            });

            expect(result).toBe(true);
            expect(mockRedis.eval).toHaveBeenCalledWith(
                expect.any(String), // Lua init script
                3,
                'sale:config',
                'sale:stock',
                'sale:users',
                '2026-06-01T00:00:00Z',
                '2026-06-01T23:59:59Z',
                '100'
            );
        });

        it('should return false when config already existed', async () => {
            mockRedis.eval.mockResolvedValue(0);

            const result = await SaleService.initializeSaleIfNew({
                startTime: '2026-06-01T00:00:00Z',
                endTime: '2026-06-01T23:59:59Z',
                totalStock: 100,
            });

            expect(result).toBe(false);
        });
    });
});
