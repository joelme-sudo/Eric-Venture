import express from 'express';
import { sql } from '../server.js';

const router = express.Router();

// Get P2P ads
router.get('/ads', async (req, res) => {
    const { fiat, crypto } = req.query;
    
    // Mock data – replace with real database
    res.json([
        {
            trader: 'Ibrahimkay',
            completedOrders: 687,
            completionRate: 99,
            price: 1484.88,
            available: 22032,
            min: 15000000,
            max: 32715358,
            paymentMethods: ['Bank Transfer']
        },
        {
            trader: 'CryptoKing',
            completedOrders: 1234,
            completionRate: 98,
            price: 1485.00,
            available: 15000,
            min: 10000000,
            max: 25000000,
            paymentMethods: ['Bank Transfer', 'Paypal']
        }
    ]);
});

export default router;
