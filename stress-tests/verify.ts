import Redis from 'ioredis';

// Connect to the local Redis instance (matching the backend config)
const redis = new Redis({
    host: 'localhost',
    port: 6379,
});

async function verifyStressTest(): Promise<void> {
    console.log('🔍 Verifying Flash Sale Invariants...\n');

    try {
        // 1. Fetch current sale config (to know what the total stock was)
        const config = await redis.hgetall('sale:config');
        if (!config || !config.totalStock) {
            console.error('❌ Error: No sale configuration found in Redis. Did the backend start?');
            process.exit(1);
        }

        const initialStock = parseInt(config.totalStock, 10);
        console.log(`Expected Initial Stock: ${initialStock}`);

        // 2. Fetch remaining stock (should be exactly 0 after a stress test if demand > supply)
        const remainingStockStr = await redis.get('sale:stock');
        const remainingStock = parseInt(remainingStockStr || '0', 10);
        
        // 3. Fetch total number of successful purchases (size of the users set)
        const successfulPurchases = await redis.scard('sale:users');

        console.log(`Remaining Stock:      ${remainingStock}`);
        console.log(`Successful Purchases: ${successfulPurchases}`);
        console.log('----------------------------------------');

        let passed = true;

        // --- INVARIANT 1: No Overselling ---
        if (remainingStock < 0) {
            console.error(`❌ FAILED: Overselling detected! Stock is negative (${remainingStock}).`);
            passed = false;
        } else if (remainingStock > 0) {
            console.warn(`⚠️ WARNING: Stock did not sell out. Remaining: ${remainingStock}. (Did the stress test run?)`);
        } else {
            console.log('✅ PASS: Stock reached exactly 0 (no overselling).');
        }

        // --- INVARIANT 2: Exact User Count ---
        // If stock is 0, the number of successful users MUST exactly equal the initial stock.
        // This proves that a single user didn't purchase twice, and no ghosts got an item.
        if (remainingStock === 0) {
            if (successfulPurchases === initialStock) {
                console.log(`✅ PASS: Exactly ${initialStock} unique users successfully purchased an item.`);
            } else {
                console.error(`❌ FAILED: Mismatch! Expected ${initialStock} purchases, but recorded ${successfulPurchases}.`);
                passed = false;
            }
        }

        console.log('\n' + (passed ? '🎉 All invariants passed!' : '💥 Verification failed!'));
        process.exit(passed ? 0 : 1);

    } catch (error) {
        console.error('Error during verification:', error);
        process.exit(1);
    } finally {
        await redis.quit();
    }
}

verifyStressTest();
