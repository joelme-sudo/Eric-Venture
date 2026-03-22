import express from 'express';
import axios from 'axios';
import { sql } from '../server.js';

const router = express.Router();

// Get conversion rate
router.get('/rate', async (req, res) => {
    const { from, to, amount } = req.query;
    
    try {
        // Get prices
        const fromPrice = await getPrice(from);
        const toPrice = await getPrice(to);
        
        const rate = fromPrice / toPrice;
        const convertedAmount = amount * rate;
        
        res.json({
            rate,
            convertedAmount,
            slippage: 0.1
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Execute conversion
router.post('/execute', async (req, res) => {
    const { from, to, amount } = req.body;
    const userId = req.user.id;
    
    try {
        const fromPrice = await getPrice(from);
        const toPrice = await getPrice(to);
        
        const received = (amount * fromPrice) / toPrice;
        
        const [tx] = await sql`
            INSERT INTO transactions (user_id, type, amount, currency, status, usd_value)
            VALUES (${userId}, 'conversion', ${amount}, ${from}, 'completed', ${amount * fromPrice})
            RETURNING *
        `;
        
        res.json({ success: true, received, transaction: tx });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

async function getPrice(symbol) {
    const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
        params: {
            ids: symbol.toLowerCase(),
            vs_currencies: 'usd'
        }
    });
    return response.data[symbol.toLowerCase()]?.usd || 0;
}

export default router;
