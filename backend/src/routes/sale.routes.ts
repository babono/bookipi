import { Router } from 'express';
import { SaleController } from '../controllers/sale.controller';

const router = Router();

router.get('/status', SaleController.getStatus);
router.post('/purchase', SaleController.purchase);
router.get('/purchase-status', SaleController.checkPurchaseStatus);

// Admin / config endpoints
router.get('/config', SaleController.getConfig);
router.post('/config', SaleController.setConfig);

export default router;