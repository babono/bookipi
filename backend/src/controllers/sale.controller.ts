import { Request, Response } from 'express';
import { SaleService } from '../services/sale.service';

export class SaleController {

    // Endpoint to check the status of the flash sale
    static async getStatus(req: Request, res: Response) {
        try {
            const config = await SaleService.getSaleConfig();
            const stock = await SaleService.getStock();
            const now = new Date();
            const start = new Date(config.startTime);
            const end = new Date(config.endTime);

            let status = 'active';
            if (now < start) status = 'upcoming';
            else if (now > end) status = 'ended';

            res.json({
                status,
                startTime: config.startTime,
                endTime: config.endTime,
                stock,
                totalStock: config.totalStock,
            });
        } catch (error) {
            console.error('Status error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Endpoint for a user to attempt a purchase
    static async purchase(req: Request, res: Response): Promise<any> {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        try {
            // Enforce the time window from Redis config
            const config = await SaleService.getSaleConfig();
            const now = new Date();
            const start = new Date(config.startTime);
            const end = new Date(config.endTime);

            if (now < start) return res.status(400).json({ error: 'Sale has not started yet' });
            if (now > end) return res.status(400).json({ error: 'Sale has ended' });

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

    // --- Admin / Config Endpoints ---

    // GET /api/sale/config — Retrieve current sale configuration
    static async getConfig(req: Request, res: Response) {
        try {
            const config = await SaleService.getSaleConfig();
            res.json(config);
        } catch (error) {
            console.error('Get config error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // POST /api/sale/config — Update sale configuration (resets stock & clears buyers)
    static async setConfig(req: Request, res: Response): Promise<any> {
        const { startTime, endTime, totalStock } = req.body;

        if (!startTime || !endTime || totalStock == null) {
            return res.status(400).json({
                error: 'startTime, endTime, and totalStock are all required',
            });
        }

        if (new Date(endTime) <= new Date(startTime)) {
            return res.status(400).json({ error: 'endTime must be after startTime' });
        }

        if (typeof totalStock !== 'number' || totalStock < 1) {
            return res.status(400).json({ error: 'totalStock must be a positive number' });
        }

        try {
            await SaleService.setSaleConfig({ startTime, endTime, totalStock });
            res.json({
                success: true,
                message: 'Sale configuration updated. Stock reset and buyers cleared.',
            });
        } catch (error) {
            console.error('Set config error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}