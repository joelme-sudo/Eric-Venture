import express from 'express';
import { sql } from '../server.js';

const router = express.Router();

// Place spot order
router.post('/spot', async (req, res) => {
    const { pair, type, price, amount } = req.body;
    const userId = req.user.id;
    
    try {
        // Create transaction
        const [tx] = await sql`
            INSERT INTO transactions (user_id, type, amount, currency, status, usd_value)
            VALUES (${userId}, ${type}, ${amount}, ${pair.replace('USDT', '')}, 'completed', ${price * amount})
            RETURNING *
        `;
        
        res.json({ success: true, transaction: tx });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
