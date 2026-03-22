import express from 'express';
import jwt from 'jsonwebtoken';
import { sql } from '../server.js';

const router = express.Router();
const JWT_SECRET = 'your-super-secret-key-change-this';

// Middleware
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

// Get leaderboard of top traders
router.get('/leaderboard', authenticateUser, async (req, res) => {
    try {
        const traders = await sql`
            SELECT 
                u.id,
                u.full_name as name,
                COUNT(DISTINCT t.id) as total_trades,
                COALESCE(SUM(CASE WHEN t.type = 'deposit' THEN t.amount ELSE 0 END), 0) as total_volume,
                COALESCE(
                    (SELECT COUNT(*) FROM copy_trading_follows WHERE trader_id = u.id), 0
                ) as followers,
                COALESCE(
                    (SELECT AVG(rating) FROM copy_trading_reviews WHERE trader_id = u.id), 4.5
                ) as rating
            FROM users u
            LEFT JOIN transactions t ON u.id = t.user_id AND t.status = 'completed'
            WHERE u.id IN (SELECT DISTINCT trader_id FROM copy_trading_follows)
            GROUP BY u.id
            ORDER BY total_volume DESC
            LIMIT 20
        `;
        res.json(traders);
    } catch (err) {
        console.error('Leaderboard error:', err);
        // Mock data for demo
        res.json([
            { id: 1, name: 'Harisonjones', total_trades: 1234, total_volume: 567890, followers: 1234, rating: 4.9, roi: '+19.35%' },
            { id: 2, name: 'UltraPump', total_trades: 892, total_volume: 345678, followers: 892, rating: 4.7, roi: '+8.87%' },
            { id: 3, name: 'DsLev', total_trades: 567, total_volume: 234567, followers: 567, rating: 4.8, roi: '+12.81%' },
            { id: 4, name: 'CryptoWhale', total_trades: 2341, total_volume: 1234567, followers: 2341, rating: 5.0, roi: '+24.3%' },
            { id: 5, name: 'BTCKing', total_trades: 1876, total_volume: 987654, followers: 1876, rating: 4.9, roi: '+15.7%' }
        ]);
    }
});

// Get trader details
router.get('/trader/:id', authenticateUser, async (req, res) => {
    const { id } = req.params;
    try {
        const [trader] = await sql`
            SELECT 
                u.id,
                u.full_name as name,
                u.created_at as joined_date,
                COUNT(DISTINCT t.id) as total_trades,
                COALESCE(SUM(CASE WHEN t.type = 'deposit' THEN t.amount ELSE 0 END), 0) as total_volume,
                COALESCE(
                    (SELECT COUNT(*) FROM copy_trading_follows WHERE trader_id = u.id), 0
                ) as followers
            FROM users u
            LEFT JOIN transactions t ON u.id = t.user_id AND t.status = 'completed'
            WHERE u.id = ${id}
            GROUP BY u.id
        `;
        
        // Get recent trades
        const recentTrades = await sql`
            SELECT * FROM transactions 
            WHERE user_id = ${id} AND status = 'completed'
            ORDER BY created_at DESC
            LIMIT 10
        `;
        
        res.json({ trader, recentTrades });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Follow a trader
router.post('/follow', authenticateUser, async (req, res) => {
    const { traderId, amount, leverage } = req.body;
    const userId = req.user.id;
    
    try {
        // Check if already following
        const existing = await sql`
            SELECT id FROM copy_trading_follows 
            WHERE user_id = ${userId} AND trader_id = ${traderId}
        `;
        
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Already following this trader' });
        }
        
        // Create follow relationship
        await sql`
            INSERT INTO copy_trading_follows (user_id, trader_id, amount, leverage, status)
            VALUES (${userId}, ${traderId}, ${amount}, ${leverage}, 'active')
        `;
        
        res.json({ success: true, message: 'Now following trader' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get user's followed traders
router.get('/my-follows', authenticateUser, async (req, res) => {
    const userId = req.user.id;
    
    try {
        const follows = await sql`
            SELECT 
                f.*,
                u.full_name as trader_name,
                u.email as trader_email
            FROM copy_trading_follows f
            JOIN users u ON f.trader_id = u.id
            WHERE f.user_id = ${userId}
        `;
        res.json(follows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Unfollow a trader
router.delete('/unfollow/:traderId', authenticateUser, async (req, res) => {
    const { traderId } = req.params;
    const userId = req.user.id;
    
    try {
        await sql`
            DELETE FROM copy_trading_follows 
            WHERE user_id = ${userId} AND trader_id = ${traderId}
        `;
        res.json({ success: true, message: 'Unfollowed successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update follow settings
router.put('/follow/:traderId', authenticateUser, async (req, res) => {
    const { traderId } = req.params;
    const { amount, leverage } = req.body;
    const userId = req.user.id;
    
    try {
        await sql`
            UPDATE copy_trading_follows 
            SET amount = ${amount}, leverage = ${leverage}
            WHERE user_id = ${userId} AND trader_id = ${traderId}
        `;
        res.json({ success: true, message: 'Settings updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
