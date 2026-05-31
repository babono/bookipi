import Redis from 'ioredis';

// Connect to the local Redis container on the default port
const redis = new Redis({
    host: 'localhost',
    port: 6379,
});

redis.on('connect', () => {
    console.log('Successfully connected to Redis');
});

redis.on('error', (err) => {
    console.error('Redis connection error:', err);
});

export default redis;