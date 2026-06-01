import express from 'express';
import cors from 'cors';
import saleRoutes from './routes/sale.routes';
import { SaleService } from './services/sale.service';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Mount our flash sale routes
app.use('/api/sale', saleRoutes);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Flash sale server is running' });
});

app.listen(PORT, async () => {
    console.log(`Server is running on http://localhost:${PORT}`);

    // Atomically initialize a default sale config only if none exists in Redis.
    // Uses HSETNX under the hood — safe even if multiple server instances start simultaneously.
    const defaultConfig = {
        startTime: new Date(Date.now() - 10000).toISOString(),
        endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        totalStock: 100,
    };

    const wasInitialized = await SaleService.initializeSaleIfNew(defaultConfig);
    if (wasInitialized) {
        console.log('No existing sale config found — initialized defaults (100 stock, 1hr window)');
    } else {
        console.log('Existing sale config found in Redis — skipping initialization');
    }
});