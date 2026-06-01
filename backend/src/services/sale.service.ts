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

    // Atomic Lua script for safe initialization — only sets config if none exists.
    // Returns 1 if initialized, 0 if config already existed.
    private static initScript = `
    local existed = redis.call('HSETNX', KEYS[1], 'startTime', ARGV[1])
    if existed == 0 then
        return 0
    end
    redis.call('HSET', KEYS[1], 'endTime', ARGV[2], 'totalStock', ARGV[3])
    redis.call('SET', KEYS[2], ARGV[3])
    redis.call('DEL', KEYS[3])
    return 1
  `;

    // --- Sale Configuration (stored in Redis) ---

    // Explicitly set (or reset) the sale config — used by the admin API.
    // This intentionally overwrites any existing config.
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

    // Atomically initialize the sale only if no config exists yet.
    // Safe for concurrent server starts — uses HSETNX so the first writer wins.
    static async initializeSaleIfNew(config: SaleConfig): Promise<boolean> {
        const result = await redis.eval(
            this.initScript,
            3,
            'sale:config',
            'sale:stock',
            'sale:users',
            config.startTime,
            config.endTime,
            config.totalStock.toString()
        );
        return result === 1;
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

    // Only sets stock if the key doesn't already exist (NX).
    // Returns true if stock was set, false if it was already present.
    static async initializeStock(amount: number): Promise<boolean> {
        const result = await redis.set('sale:stock', amount, 'NX');
        if (result === 'OK') {
            await redis.del('sale:users');
            return true;
        }
        return false;
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

    // Get all successful buyers
    static async getBuyers(): Promise<string[]> {
        return await redis.smembers('sale:users');
    }
}