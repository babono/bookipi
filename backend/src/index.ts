import express from 'express';
import cors from 'cors';
import redis from './redis';
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

    // Initialize our stock to 100 items when the server starts
    await SaleService.initializeStock(100);
    console.log('Flash sale stock initialized to 100');
});