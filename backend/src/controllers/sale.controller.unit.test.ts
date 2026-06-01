/**
 * Unit tests for SaleController — mocks SaleService entirely.
 * Tests request validation, time window enforcement, and response shaping.
 *
 * Run with: npm test
 */

import { Request, Response } from 'express';
import { SaleController } from './sale.controller';
import { SaleService } from '../services/sale.service';

// Mock both Redis (to prevent real connection) and SaleService (to isolate controller logic)
jest.mock('../redis', () => ({ __esModule: true, default: {} }));
jest.mock('../services/sale.service');

const MockedSaleService = SaleService as jest.Mocked<typeof SaleService>;

// Helper to create a mock Express response
function mockResponse(): Response {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
}

describe('SaleController - Unit Tests', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --- purchase ---

    describe('purchase', () => {
        it('should reject requests without a userId', async () => {
            const req = { body: {} } as Request;
            const res = mockResponse();

            await SaleController.purchase(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'userId must be a valid string' });
        });

        it('should reject purchases before the sale starts', async () => {
            MockedSaleService.getSaleConfig.mockResolvedValue({
                startTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1hr in future
                endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
                totalStock: 100,
            });

            const req = { body: { userId: 'user@test.com' } } as Request;
            const res = mockResponse();

            await SaleController.purchase(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Sale has not started yet' });
            expect(MockedSaleService.attemptPurchase).not.toHaveBeenCalled();
        });

        it('should reject purchases after the sale ends', async () => {
            MockedSaleService.getSaleConfig.mockResolvedValue({
                startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                endTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1hr ago
                totalStock: 100,
            });

            const req = { body: { userId: 'user@test.com' } } as Request;
            const res = mockResponse();

            await SaleController.purchase(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Sale has ended' });
            expect(MockedSaleService.attemptPurchase).not.toHaveBeenCalled();
        });

        it('should return success for a valid purchase (result=1)', async () => {
            MockedSaleService.getSaleConfig.mockResolvedValue({
                startTime: new Date(Date.now() - 10000).toISOString(),
                endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                totalStock: 100,
            });
            MockedSaleService.attemptPurchase.mockResolvedValue(1);

            const req = { body: { userId: 'user@test.com' } } as Request;
            const res = mockResponse();

            await SaleController.purchase(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Purchase successful!' });
        });

        it('should return 400 for duplicate purchase (result=-1)', async () => {
            MockedSaleService.getSaleConfig.mockResolvedValue({
                startTime: new Date(Date.now() - 10000).toISOString(),
                endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                totalStock: 100,
            });
            MockedSaleService.attemptPurchase.mockResolvedValue(-1);

            const req = { body: { userId: 'user@test.com' } } as Request;
            const res = mockResponse();

            await SaleController.purchase(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'User already purchased' });
        });

        it('should return 400 when sold out (result=0)', async () => {
            MockedSaleService.getSaleConfig.mockResolvedValue({
                startTime: new Date(Date.now() - 10000).toISOString(),
                endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                totalStock: 100,
            });
            MockedSaleService.attemptPurchase.mockResolvedValue(0);

            const req = { body: { userId: 'user@test.com' } } as Request;
            const res = mockResponse();

            await SaleController.purchase(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Sold out' });
        });

        it('should return 500 on unexpected service error', async () => {
            MockedSaleService.getSaleConfig.mockRejectedValue(new Error('Redis down'));

            const req = { body: { userId: 'user@test.com' } } as Request;
            const res = mockResponse();

            await SaleController.purchase(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
        });
    });

    // --- setConfig ---

    describe('setConfig', () => {
        it('should reject when required fields are missing', async () => {
            const req = { body: { startTime: '2026-06-01T00:00:00Z' } } as Request;
            const res = mockResponse();

            await SaleController.setConfig(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: 'startTime, endTime, and totalStock are all required',
            });
        });

        it('should reject when endTime is before startTime', async () => {
            const req = {
                body: {
                    startTime: '2026-06-02T00:00:00Z',
                    endTime: '2026-06-01T00:00:00Z',
                    totalStock: 100,
                },
            } as Request;
            const res = mockResponse();

            await SaleController.setConfig(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'endTime must be after startTime' });
        });

        it('should reject non-positive totalStock', async () => {
            const req = {
                body: {
                    startTime: '2026-06-01T00:00:00Z',
                    endTime: '2026-06-01T23:59:59Z',
                    totalStock: 0,
                },
            } as Request;
            const res = mockResponse();

            await SaleController.setConfig(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'totalStock must be a positive number' });
        });

        it('should save valid config and return success', async () => {
            MockedSaleService.setSaleConfig.mockResolvedValue();

            const req = {
                body: {
                    startTime: '2026-06-01T00:00:00Z',
                    endTime: '2026-06-01T23:59:59Z',
                    totalStock: 100,
                },
            } as Request;
            const res = mockResponse();

            await SaleController.setConfig(req, res);

            expect(MockedSaleService.setSaleConfig).toHaveBeenCalledWith({
                startTime: '2026-06-01T00:00:00Z',
                endTime: '2026-06-01T23:59:59Z',
                totalStock: 100,
            });
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Sale configuration updated. Stock reset and buyers cleared.',
            });
        });
    });

    // --- checkPurchaseStatus ---

    describe('checkPurchaseStatus', () => {
        it('should reject when userId query param is missing', async () => {
            const req = { query: {} } as Request;
            const res = mockResponse();

            await SaleController.checkPurchaseStatus(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return hasPurchased: true for a buyer', async () => {
            MockedSaleService.hasPurchased.mockResolvedValue(true);

            const req = { query: { userId: 'buyer@test.com' } } as unknown as Request;
            const res = mockResponse();

            await SaleController.checkPurchaseStatus(req, res);

            expect(res.json).toHaveBeenCalledWith({ hasPurchased: true });
        });

        it('should return hasPurchased: false for a non-buyer', async () => {
            MockedSaleService.hasPurchased.mockResolvedValue(false);

            const req = { query: { userId: 'nobody@test.com' } } as unknown as Request;
            const res = mockResponse();

            await SaleController.checkPurchaseStatus(req, res);

            expect(res.json).toHaveBeenCalledWith({ hasPurchased: false });
        });
    });
});
