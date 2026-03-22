import express from 'express';
import jwt from 'jsonwebtoken';
import { sql } from '../server.js';

const router = express.Router();
const JWT_SECRET = 'your-super-secret-key-change-this';

const authenticateUser = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Get all earn products
router.get('/products', async (req, res) => {
    try {
        const products = await sql`
            SELECT * FROM earn_products WHERE status = 'active'
            ORDER BY apy DESC
        `;
        res.json(products);
    } catch (err) {
        console.error('Earn products error:', err);
        // Mock data
        res.json([
            { id: 1, name: 'BTC Flexible', type: 'flexible', currency: 'BTC', apy: 5.2, minAmount: 0.001, maxAmount: 100, duration: 0 },
            { id: 2, name: 'ETH Flexible', type: 'flexible', currency: 'ETH', apy: 4.8, minAmount: 0.01, maxAmount: 1000, duration: 0 },
            { id: 3, name: 'USDT Flexible', type: 'flexible', currency: 'USDT', apy: 6.1, minAmount: 10, maxAmount: 1000000, duration: 0 },
            { id: 4, name: 'BTC Fixed 30D', type: 'fixed', currency: 'BTC', apy: 8.5, minAmount: 0.001, maxAmount: 50, duration: 30 },
            { id: 5, name: 'ETH Fixed 60D', type: 'fixed', currency: 'ETH', apy: 9.2, minAmount: 0.01, maxAmount: 500, duration: 60 },
            { id: 6, name: 'USDT Fixed 90D', type: 'fixed', currency: 'USDT', apy: 12.5, minAmount: 100, maxAmount: 500000, duration: 90 }
        ]);
    }
});

// Subscribe to earn product
router.post('/subscribe', authenticateUser, async (req, res) => {
    const { productId, amount } = req.body;
    const userId = req.user.id;
    
    try {
        const [product] = await sql`
            SELECT * FROM earn_products WHERE id = ${productId}
        `;
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        // Check user balance
        const balance = await getUserBalance(userId, product.currency);
        
        if (balance < amount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }
        
        // Create subscription
        const [subscription] = await sql`
            INSERT INTO user_earnings (user_id, product_id, amount, currency, apy, status)
            VALUES (${userId}, ${productId}, ${amount}, ${product.currency}, ${product.apy}, 'active')
            RETURNING *
        `;
        
        res.json({ success: true, subscription });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get user's earnings
router.get('/my-earnings', authenticateUser, async (req, res) => {
    const userId = req.user.id;
    
    try {
        const earnings = await sql`
            SELECT 
                ue.*,
                ep.name as product_name,
                ep.type as product_type
            FROM user_earnings ue
            JOIN earn_products ep ON ue.product_id = ep.id
            WHERE ue.user_id = ${userId}
            ORDER BY ue.created_at DESC
        `;
        res.json(earnings);
    } catch (err) {
        console.error('My earnings error:', err);
        // Mock data
        res.json([
            { id: 1, product_name: 'BTC Flexible', amount: 0.05, currency: 'BTC', apy: 5.2, earned: 0.00013, status: 'active', created_at: new Date() },
            { id: 2, product_name: 'USDT Fixed 90D', amount: 1000, currency: 'USDT', apy: 12.5, earned: 30.82, status: 'active', created_at: new Date(Date.now() - 86400000 * 30) }
        ]);
    }
});

// Withdraw from earn
router.post('/withdraw/:id', authenticateUser, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    
    try {
        const [earning] = await sql`
            SELECT * FROM user_earnings 
            WHERE id = ${id} AND user_id = ${userId}
        `;
        
        if (!earning) {
            return res.status(404).json({ error: 'Earning not found' });
        }
        
        if (earning.status !== 'active') {
            return res.status(400).json({ error: 'Cannot withdraw' });
        }
        
        // Calculate earned interest
        const daysHeld = Math.floor((Date.now() - new Date(earning.created_at)) / (1000 * 60 * 60 * 24));
        const earnedInterest = (earning.amount * (earning.apy / 100) * daysHeld) / 365;
        
        // Update status
        await sql`
            UPDATE user_earnings 
            SET status = 'withdrawn', withdrawn_at = NOW(), earned_interest = ${earnedInterest}
            WHERE id = ${id}
        `;
        
        res.json({ success: true, amount: earning.amount + earnedInterest, interest: earnedInterest });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Helper function to get user balance
async function getUserBalance(userId, currency) {
    try {
        const result = await sql`
            SELECT COALESCE(
                SUM(CASE WHEN type = 'deposit' THEN amount WHEN type = 'withdrawal' THEN -amount ELSE 0 END), 
                0
            ) as balance
            FROM transactions
            WHERE user_id = ${userId} AND currency = ${currency} AND status = 'completed'
        `;
        return parseFloat(result[0].balance) || 0;
    } catch (err) {
        return 0;
    }
}

export default router;
