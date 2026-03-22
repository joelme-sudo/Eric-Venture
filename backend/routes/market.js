import express from 'express';
import axios from 'axios';
import { sql } from '../server.js';

const router = express.Router();

// Get all market data
router.get('/all', async (req, res) => {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
            params: {
                vs_currency: 'usd',
                order: 'market_cap_desc',
                per_page: 100,
                page: 1,
                sparkline: true
            }
        });
        
        const data = response.data.map(coin => ({
            symbol: coin.symbol.toUpperCase(),
            name: coin.name,
            price: coin.current_price,
            change: coin.price_change_percentage_24h,
            volume: coin.total_volume,
            marketCap: coin.market_cap,
            sparkline: coin.sparkline_in_7d?.price || []
        }));
        
        res.json(data);
    } catch (err) {
        console.error('Market data error:', err);
        // Fallback data
        res.json([
            { symbol: 'BTC', name: 'Bitcoin', price: 68142, change: 2.4, volume: 32400000000, marketCap: 1340000000000 },
            { symbol: 'ETH', name: 'Ethereum', price: 3502, change: 1.2, volume: 18700000000, marketCap: 421000000000 }
        ]);
    }
});

// Get single price
router.get('/price/:pair', async (req, res) => {
    const { pair } = req.params;
    const base = pair.replace('USDT', '');
    
    try {
        const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
            params: {
                ids: base.toLowerCase(),
                vs_currencies: 'usd',
                include_24hr_change: true
            }
        });
        
        const data = response.data[base.toLowerCase()];
        res.json({
            price: data.usd,
            change: data.usd_24h_change
        });
    } catch (err) {
        res.json({ price: 68142, change: 2.4 });
    }
});

// Get order book (mock for now – real matching engine later)
router.get('/orderbook/:pair', (req, res) => {
    const mockOrderBook = {
        asks: Array.from({ length: 20 }, (_, i) => ({
            price: 68142 + i * 10,
            amount: Math.random() * 2,
            total: (68142 + i * 10) * Math.random() * 2
        })),
        bids: Array.from({ length: 20 }, (_, i) => ({
            price: 68142 - i * 10,
            amount: Math.random() * 2,
            total: (68142 - i * 10) * Math.random() * 2
        }))
    };
    res.json(mockOrderBook);
});

// Get pre-market tokens
router.get('/pre-market', (req, res) => {
    res.json([
        {
            name: 'Project Aurora',
            symbol: 'AUR',
            price: 0.0234,
            fdv: 23400000,
            listingTime: Date.now() + 86400000 * 3, // 3 days
            totalSupply: '1,000,000,000'
        },
        {
            name: 'Nova Chain',
            symbol: 'NOVA',
            price: 0.0089,
            fdv: 8900000,
            listingTime: Date.now() + 86400000,
            totalSupply: '1,000,000,000'
        }
    ]);
});

export default router;
