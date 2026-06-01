import Redis from 'ioredis';

// Connect to Redis using environment variables (loaded by dotenv in index.ts)
const redis = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL)
    : new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
    });

redis.on('connect', () => {
    console.log('Successfully connected to Redis');
});

redis.on('error', (err) => {
    console.error('Redis connection error:', err);
});

export default redis;