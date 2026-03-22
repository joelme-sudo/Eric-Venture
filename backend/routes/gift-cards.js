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

// Get all gift card brands
router.get('/brands', async (req, res) => {
    try {
        const brands = await sql`
            SELECT * FROM gift_card_brands ORDER BY name
        `;
        res.json(brands);
    } catch (err) {
        console.error('Gift card brands error:', err);
        // Mock data
        res.json([
            { id: 1, name: 'Amazon', category: 'Shopping', logo: '🛒', countries: ['US', 'UK', 'CA', 'DE'], minAmount: 10, maxAmount: 500 },
            { id: 2, name: 'Steam', category: 'Gaming', logo: '🎮', countries: ['US', 'UK', 'EU'], minAmount: 5, maxAmount: 200 },
            { id: 3, name: 'Apple', category: 'Electronics', logo: '🍎', countries: ['US', 'UK', 'CA', 'JP'], minAmount: 15, maxAmount: 300 },
            { id: 4, name: 'Google Play', category: 'Apps', logo: '▶️', countries: ['US', 'UK', 'CA', 'AU'], minAmount: 10, maxAmount: 200 },
            { id: 5, name: 'Starbucks', category: 'Food', logo: '☕', countries: ['US', 'UK', 'CA'], minAmount: 5, maxAmount: 100 },
            { id: 6, name: 'Spotify', category: 'Music', logo: '🎵', countries: ['US', 'UK', 'EU'], minAmount: 10, maxAmount: 120 },
            { id: 7, name: 'Netflix', category: 'Entertainment', logo: '📺', countries: ['US', 'UK', 'CA'], minAmount: 15, maxAmount: 150 },
            { id: 8, name: 'Xbox', category: 'Gaming', logo: '🎮', countries: ['US', 'UK', 'CA'], minAmount: 25, maxAmount: 200 },
            { id: 9, name: 'PlayStation', category: 'Gaming', logo: '🎮', countries: ['US', 'UK', 'JP'], minAmount: 25, maxAmount: 200 },
            { id: 10, name: 'Airbnb', category: 'Travel', logo: '🏠', countries: ['Global'], minAmount: 50, maxAmount: 1000 }
        ]);
    }
});

// Get gift cards by brand
router.get('/brand/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const cards = await sql`
            SELECT * FROM gift_cards WHERE brand_id = ${id} AND status = 'available'
        `;
        res.json(cards);
    } catch (err) {
        console.error('Gift cards error:', err);
        // Mock data
        res.json([
            { id: 1, brandId: 1, amount: 25, price: 25, currency: 'USD', code: 'XXXX-XXXX-1234' },
            { id: 2, brandId: 1, amount: 50, price: 50, currency: 'USD', code: 'XXXX-XXXX-5678' },
            { id: 3, brandId: 1, amount: 100, price: 100, currency: 'USD', code: 'XXXX-XXXX-9012' }
        ]);
    }
});

// Purchase gift card
router.post('/purchase', authenticateUser, async (req, res) => {
    const { brandId, amount, currency } = req.body;
    const userId = req.user.id;
    
    try {
        // Generate unique code
        const code = Array.from({ length: 4 }, () => 
            Math.random().toString(36).substring(2, 6).toUpperCase()
        ).join('-');
        
        // Create gift card
        const [giftCard] = await sql`
            INSERT INTO gift_cards (user_id, brand_id, amount, currency, code, status)
            VALUES (${userId}, ${brandId}, ${amount}, ${currency}, ${code}, 'active')
            RETURNING *
        `;
        
        res.json({ success: true, giftCard });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get user's gift cards
router.get('/my-cards', authenticateUser, async (req, res) => {
    const userId = req.user.id;
    
    try {
        const cards = await sql`
            SELECT 
                gc.*,
                gb.name as brand_name,
                gb.logo as brand_logo
            FROM gift_cards gc
            JOIN gift_card_brands gb ON gc.brand_id = gb.id
            WHERE gc.user_id = ${userId}
            ORDER BY gc.created_at DESC
        `;
        res.json(cards);
    } catch (err) {
        console.error('My gift cards error:', err);
        // Mock data
        res.json([
            { id: 1, brand_name: 'Amazon', brand_logo: '🛒', amount: 25, code: 'AMZN-ABCD-1234', status: 'active', created_at: new Date() },
            { id: 2, brand_name: 'Steam', brand_logo: '🎮', amount: 10, code: 'STM-EFGH-5678', status: 'active', created_at: new Date(Date.now() - 86400000 * 2) }
        ]);
    }
});

// Redeem gift card
router.post('/redeem/:id', authenticateUser, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    
    try {
        await sql`
            UPDATE gift_cards 
            SET status = 'redeemed', redeemed_at = NOW()
            WHERE id = ${id} AND user_id = ${userId} AND status = 'active'
        `;
        res.json({ success: true, message: 'Gift card redeemed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
