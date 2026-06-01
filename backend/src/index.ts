import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import saleRoutes from './routes/sale.routes';
import { SaleService } from './services/sale.service';
import redis from './redis';

const app = express();
const PORT = process.env.PORT || 3001;

const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    optionsSuccessStatus: 200 // some legacy browsers choke on 204
};
app.use(cors(corsOptions));
app.use(express.json());

// Mount our flash sale routes
app.use('/api/sale', saleRoutes);

app.get('/health', async (req, res) => {
    try {
        await redis.ping();
        res.status(200).json({ status: 'ok', message: 'Flash sale server is running', redis: 'connected' });
    } catch (error) {
        console.error('Health check failed - Redis is unreachable:', error);
        res.status(503).json({ status: 'error', message: 'Service Unavailable - Redis is down', redis: 'disconnected' });
    }
});

app.listen(PORT, async () => {
    console.log(`Server is running on http://localhost:${PORT}`);

    // Atomically initialize a default sale config only if none exists in Redis.
    // Uses HSETNX under the hood — safe even if multiple server instances start simultaneously.
    const defaultStock = parseInt(process.env.DEFAULT_STOCK || '100', 10);
    const defaultConfig = {
        startTime: new Date(Date.now() - 10000).toISOString(),
        endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        totalStock: defaultStock,
    };

    const wasInitialized = await SaleService.initializeSaleIfNew(defaultConfig);
    if (wasInitialized) {
        console.log('No existing sale config found — initialized defaults (100 stock, 1hr window)');
    } else {
        console.log('Existing sale config found in Redis — skipping initialization');
    }
});