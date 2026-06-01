import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { SaleController } from '../controllers/sale.controller';

const router = Router();

// Protect the purchase endpoint from abuse/DoS
const purchaseLimiter = rateLimit({
    windowMs: 10 * 1000, // 10 seconds
    max: process.env.NODE_ENV === 'test' ? 10000 : 10, // Allow high volume for local stress tests
    message: { error: 'Too many purchase attempts, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

router.get('/status', SaleController.getStatus);
router.get('/stream', SaleController.streamUpdates);
router.post('/purchase', purchaseLimiter, SaleController.purchase);
router.get('/purchase-status', SaleController.checkPurchaseStatus);

// Admin / config endpoints
router.get('/config', SaleController.getConfig);
router.post('/config', SaleController.setConfig);
router.get('/buyers', SaleController.getBuyers);

export default router;