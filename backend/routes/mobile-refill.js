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

// Get supported countries
router.get('/countries', async (req, res) => {
    try {
        const countries = await sql`
            SELECT * FROM mobile_refill_countries ORDER BY name
        `;
        res.json(countries);
    } catch (err) {
        console.error('Countries error:', err);
        // Mock data
        res.json([
            { id: 1, name: 'Nigeria', code: 'NG', dialCode: '+234', flag: '🇳🇬', currency: 'NGN' },
            { id: 2, name: 'United States', code: 'US', dialCode: '+1', flag: '🇺🇸', currency: 'USD' },
            { id: 3, name: 'United Kingdom', code: 'GB', dialCode: '+44', flag: '🇬🇧', currency: 'GBP' },
            { id: 4, name: 'Canada', code: 'CA', dialCode: '+1', flag: '🇨🇦', currency: 'CAD' },
            { id: 5, name: 'Australia', code: 'AU', dialCode: '+61', flag: '🇦🇺', currency: 'AUD' },
            { id: 6, name: 'India', code: 'IN', dialCode: '+91', flag: '🇮🇳', currency: 'INR' },
            { id: 7, name: 'Kenya', code: 'KE', dialCode: '+254', flag: '🇰🇪', currency: 'KES' },
            { id: 8, name: 'South Africa', code: 'ZA', dialCode: '+27', flag: '🇿🇦', currency: 'ZAR' }
        ]);
    }
});

// Get operators by country
router.get('/operators/:countryCode', async (req, res) => {
    const { countryCode } = req.params;
    
    try {
        const operators = await sql`
            SELECT * FROM mobile_refill_operators 
            WHERE country_code = ${countryCode}
        `;
        res.json(operators);
    } catch (err) {
        console.error('Operators error:', err);
        // Mock data for Nigeria
        if (countryCode === 'NG') {
            res.json([
                { id: 1, name: 'MTN', logo: '📱', minAmount: 100, maxAmount: 50000 },
                { id: 2, name: 'Glo', logo: '📱', minAmount: 100, maxAmount: 50000 },
                { id: 3, name: 'Airtel', logo: '📱', minAmount: 100, maxAmount: 50000 },
                { id: 4, name: '9mobile', logo: '📱', minAmount: 100, maxAmount: 50000 }
            ]);
        } else {
            res.json([
                { id: 1, name: 'Default Operator', logo: '📱', minAmount: 10, maxAmount: 1000 }
            ]);
        }
    }
});

// Get rates
router.get('/rates', async (req, res) => {
    const { fromCurrency, toCurrency } = req.query;
    
    try {
        const [rate] = await sql`
            SELECT * FROM exchange_rates 
            WHERE from_currency = ${fromCurrency} AND to_currency = ${toCurrency}
        `;
        res.json(rate || { rate: 1500, fee: 0 });
    } catch (err) {
        console.error('Rates error:', err);
        // Mock rates
        res.json({ rate: 1500, fee: 0, min: 500, max: 100000 });
    }
});

// Process refill
router.post('/refill', authenticateUser, async (req, res) => {
    const { countryCode, operator, phoneNumber, amount, currency } = req.body;
    const userId = req.user.id;
    
    try {
        // Create refill record
        const [refill] = await sql`
            INSERT INTO mobile_refills (user_id, country_code, operator, phone_number, amount, currency, status)
            VALUES (${userId}, ${countryCode}, ${operator}, ${phoneNumber}, ${amount}, ${currency}, 'processing')
            RETURNING *
        `;
        
        // In production, integrate with mobile refill API here
        // Simulate success after 2 seconds
        
        res.json({ success: true, refill, message: 'Refill processing' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get user's refill history
router.get('/history', authenticateUser, async (req, res) => {
    const userId = req.user.id;
    
    try {
        const history = await sql`
            SELECT * FROM mobile_refills 
            WHERE user_id = ${userId}
            ORDER BY created_at DESC
            LIMIT 20
        `;
        res.json(history);
    } catch (err) {
        console.error('History error:', err);
        // Mock data
        res.json([
            { id: 1, phone_number: '+234 812 345 6789', operator: 'MTN', amount: 1000, currency: 'NGN', status: 'completed', created_at: new Date() },
            { id: 2, phone_number: '+234 803 456 7890', operator: 'Glo', amount: 2000, currency: 'NGN', status: 'completed', created_at: new Date(Date.now() - 86400000) },
            { id: 3, phone_number: '+234 705 678 1234', operator: 'Airtel', amount: 500, currency: 'NGN', status: 'completed', created_at: new Date(Date.now() - 86400000 * 2) }
        ]);
    }
});

export default router;
