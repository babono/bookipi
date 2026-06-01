import redis from '../redis';

export interface SaleConfig {
    startTime: string;
    endTime: string;
    totalStock: number;
}

export class SaleService {
    // The atomic Lua script to prevent race conditions
    private static purchaseScript = `
    -- Check if user already purchased (KEYS[2] = users set, ARGV[1] = userId)
    if redis.call('SISMEMBER', KEYS[2], ARGV[1]) == 1 then
        return -1
    end

    -- Check stock (KEYS[1] = stock counter)
    local stock = tonumber(redis.call('GET', KEYS[1]))
    if stock == nil or stock <= 0 then
        return 0
    end

    -- Decrement stock and record successful user
    redis.call('DECR', KEYS[1])
    redis.call('SADD', KEYS[2], ARGV[1])
    
    return 1
  `;

    // --- Sale Configuration (stored in Redis) ---

    static async setSaleConfig(config: SaleConfig) {
        await redis.hset('sale:config', {
            startTime: config.startTime,
            endTime: config.endTime,
            totalStock: config.totalStock.toString(),
        });

        // Reset stock and clear previous buyers when config is applied
        await redis.set('sale:stock', config.totalStock);
        await redis.del('sale:users');
    }

    static async getSaleConfig(): Promise<SaleConfig> {
        const config = await redis.hgetall('sale:config');

        // Return defaults if nothing is configured yet
        if (!config || !config.startTime) {
            const defaultConfig: SaleConfig = {
                startTime: new Date(Date.now() - 10000).toISOString(),
                endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                totalStock: 100,
            };
            return defaultConfig;
        }

        return {
            startTime: config.startTime,
            endTime: config.endTime,
            totalStock: parseInt(config.totalStock, 10),
        };
    }

    // --- Stock Management ---

    static async initializeStock(amount: number) {
        await redis.set('sale:stock', amount);
        await redis.del('sale:users');
    }

    static async getStock(): Promise<number> {
        const stock = await redis.get('sale:stock');
        return parseInt(stock || '0', 10);
    }

    // The core purchase method
    static async attemptPurchase(userId: string): Promise<number> {
        // ioredis eval syntax: eval(script, numberOfKeys, key1, key2, arg1)
        const result = await redis.eval(
            this.purchaseScript,
            2,
            'sale:stock',
            'sale:users',
            userId
        );

        return result as number;
    }

    // Check if a user is already in the success set
    static async hasPurchased(userId: string): Promise<boolean> {
        const result = await redis.sismember('sale:users', userId);
        return result === 1;
    }
}