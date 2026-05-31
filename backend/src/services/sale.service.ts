import redis from '../redis';

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

    // Helper to start the sale
    static async initializeStock(amount: number) {
        await redis.set('sale:stock', amount);
        await redis.del('sale:users'); // Clear previous buyers if any
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
}