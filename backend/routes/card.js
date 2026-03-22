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

// Get user's card
router.get('/my-card', authenticateUser, async (req, res) => {
    const userId = req.user.id;
    
    try {
        const [card] = await sql`
            SELECT * FROM user_cards WHERE user_id = ${userId}
        `;
        
        if (!card) {
            // Create default card if none exists
            const [newCard] = await sql`
                INSERT INTO user_cards (user_id, card_number, card_holder, expiry, cvv, status)
                VALUES (
                    ${userId}, 
                    '**** **** **** ' || floor(random() * 9000 + 1000)::text,
                    (SELECT full_name FROM users WHERE id = ${userId}),
                    to_char(now() + interval '3 years', 'MM/YY'),
                    floor(random() * 900 + 100)::text,
                    'active'
                )
                RETURNING *
            `;
            return res.json(newCard);
        }
        
        res.json(card);
    } catch (err) {
        console.error('Card error:', err);
        // Mock data
        res.json({
            id: 1,
            user_id: userId,
            card_number: '**** **** **** 4321',
            card_holder: 'JOHN DOE',
            expiry: '12/26',
            cvv: '***',
            balance: 12450.00,
            daily_limit: 5000,
            monthly_limit: 20000,
            status: 'active'
        });
    }
});

// Get card transactions
router.get('/transactions', authenticateUser, async (req, res) => {
    const userId = req.user.id;
    
    try {
        const transactions = await sql`
            SELECT * FROM card_transactions 
            WHERE user_id = ${userId}
            ORDER BY created_at DESC
            LIMIT 20
        `;
        res.json(transactions);
    } catch (err) {
        console.error('Card transactions error:', err);
        // Mock data
        res.json([
            { id: 1, merchant: 'Amazon.com', amount: -124.50, date: new Date(), status: 'completed', category: 'Shopping' },
            { id: 2, merchant: 'Top Up', amount: 500.00, date: new Date(Date.now() - 86400000), status: 'completed', category: 'Transfer' },
            { id: 3, merchant: 'Starbucks', amount: -8.75, date: new Date(Date.now() - 86400000 * 2), status: 'completed', category: 'Food' },
            { id: 4, merchant: 'Uber', amount: -24.80, date: new Date(Date.now() - 86400000 * 3), status: 'completed', category: 'Transport' }
        ]);
    }
});

// Top up card
router.post('/top-up', authenticateUser, async (req, res) => {
    const { amount, fromCurrency } = req.body;
    const userId = req.user.id;
    
    try {
        // Create transaction
        const [tx] = await sql`
            INSERT INTO card_transactions (user_id, merchant, amount, category, status)
            VALUES (${userId}, 'Card Top Up', ${amount}, 'Transfer', 'completed')
            RETURNING *
        `;
        
        // Update card balance
        await sql`
            UPDATE user_cards 
            SET balance = balance + ${amount}
            WHERE user_id = ${userId}
        `;
        
        res.json({ success: true, transaction: tx });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Freeze/unfreeze card
router.post('/toggle-freeze', authenticateUser, async (req, res) => {
    const { frozen } = req.body;
    const userId = req.user.id;
    
    try {
        await sql`
            UPDATE user_cards 
            SET status = ${frozen ? 'frozen' : 'active'}
            WHERE user_id = ${userId}
        `;
        res.json({ success: true, message: frozen ? 'Card frozen' : 'Card activated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update card limits
router.put('/limits', authenticateUser, async (req, res) => {
    const { dailyLimit, monthlyLimit } = req.body;
    const userId = req.user.id;
    
    try {
        await sql`
            UPDATE user_cards 
            SET daily_limit = ${dailyLimit}, monthly_limit = ${monthlyLimit}
            WHERE user_id = ${userId}
        `;
        res.json({ success: true, message: 'Limits updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
