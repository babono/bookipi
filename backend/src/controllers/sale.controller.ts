import { Request, Response } from 'express';
import { SaleService } from '../services/sale.service';

// Mock configuration for the flash sale window.
// We'll set it to start 10 seconds ago and end in 1 hour so you can test it immediately.
const SALE_START = new Date(Date.now() - 10000);
const SALE_END = new Date(Date.now() + 60 * 60 * 1000);

export class SaleController {

    // Endpoint to check the status of the flash sale
    static async getStatus(req: Request, res: Response) {
        const now = new Date();
        let status = 'active';

        if (now < SALE_START) status = 'upcoming';
        else if (now > SALE_END) status = 'ended';

        res.json({ status, startTime: SALE_START, endTime: SALE_END });
    }

    // Endpoint for a user to attempt a purchase
    static async purchase(req: Request, res: Response): Promise<any> {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        // Enforce the time window
        const now = new Date();
        if (now < SALE_START) return res.status(400).json({ error: 'Sale has not started yet' });
        if (now > SALE_END) return res.status(400).json({ error: 'Sale has ended' });

        try {
            const result = await SaleService.attemptPurchase(userId);

            if (result === 1) return res.json({ success: true, message: 'Purchase successful!' });
            if (result === -1) return res.status(400).json({ success: false, message: 'User already purchased' });
            if (result === 0) return res.status(400).json({ success: false, message: 'Sold out' });

        } catch (error) {
            console.error('Purchase error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Endpoint for a user to check if they have successfully secured an item
    static async checkPurchaseStatus(req: Request, res: Response): Promise<any> {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ error: 'userId is required' });

        try {
            const hasPurchased = await SaleService.hasPurchased(userId as string);
            res.json({ hasPurchased });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}