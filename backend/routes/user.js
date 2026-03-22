import express from 'express';
import jwt from 'jsonwebtoken';
import { sql } from '../server.js';
import { generateWallet, encryptPrivateKey, getSupportedCoins, getWalletBalance } from '../services/walletService.js';

const router = express.Router();
const JWT_SECRET = 'your-super-secret-key-change-this';

// Middleware to verify user
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

// Get user's balance
router.get('/balance', authenticateUser, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await sql`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'deposit' THEN amount WHEN type = 'withdrawal' THEN -amount ELSE 0 END), 0) as total_usd,
        COALESCE(SUM(CASE WHEN currency = 'BTC' AND type = 'deposit' THEN amount WHEN currency = 'BTC' AND type = 'withdrawal' THEN -amount ELSE 0 END), 0) as btc,
        COALESCE(SUM(CASE WHEN currency = 'ETH' AND type = 'deposit' THEN amount WHEN currency = 'ETH' AND type = 'withdrawal' THEN -amount ELSE 0 END), 0) as eth,
        COALESCE(SUM(CASE WHEN currency = 'USDT' AND type = 'deposit' THEN amount WHEN currency = 'USDT' AND type = 'withdrawal' THEN -amount ELSE 0 END), 0) as usdt
      FROM transactions
      WHERE user_id = ${userId} AND status = 'completed'
    `;
    res.json({
      totalUSD: parseFloat(result[0].total_usd) || 0,
      btc: parseFloat(result[0].btc) || 0,
      eth: parseFloat(result[0].eth) || 0,
      usdt: parseFloat(result[0].usdt) || 0
    });
  } catch (err) {
    console.error('Balance error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get user's transactions
router.get('/transactions', authenticateUser, async (req, res) => {
  const userId = req.user.id;
  try {
    const transactions = await sql`
      SELECT * FROM transactions
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 20
    `;
    res.json(transactions);
  } catch (err) {
    console.error('Transactions error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Handle AI commands
router.post('/command', authenticateUser, async (req, res) => {
  const { command } = req.body;
  const userId = req.user.id;
  const lower = command.toLowerCase();
  
  try {
    let response = { success: true, message: '' };
    
    if (lower.includes('deposit') || lower.includes('add')) {
      const amount = parseFloat(command.match(/\d+(\.\d+)?/)?.[0] || 0);
      const currency = command.match(/usd|usdt|btc|eth/i)?.[0]?.toUpperCase() || 'USD';
      if (amount <= 0) throw new Error('Invalid amount');
      
      let usdValue = amount;
      if (currency !== 'USD' && currency !== 'USDT') {
        const { getPrice } = await import('../services/priceService.js');
        const price = await getPrice(currency);
        usdValue = amount * price;
      }
      
      const [tx] = await sql`
        INSERT INTO transactions (user_id, type, amount, currency, status, usd_value)
        VALUES (${userId}, 'deposit', ${amount}, ${currency}, 'completed', ${usdValue})
        RETURNING *
      `;
      
      const { sendTransactionEmail } = await import('../services/emailService.js');
      const [user] = await sql`SELECT email, full_name FROM users WHERE id = ${userId}`;
      sendTransactionEmail(user.email, user.full_name, tx).catch(console.error);
      
      response.message = `✅ Deposited ${amount} ${currency}`;
    }
    
    else if (lower.includes('withdraw') || lower.includes('send')) {
      const amount = parseFloat(command.match(/\d+(\.\d+)?/)?.[0] || 0);
      const currency = command.match(/usd|usdt|btc|eth/i)?.[0]?.toUpperCase() || 'USD';
      if (amount <= 0) throw new Error('Invalid amount');
      
      const [tx] = await sql`
        INSERT INTO transactions (user_id, type, amount, currency, status, usd_value)
        VALUES (${userId}, 'withdrawal', ${amount}, ${currency}, 'completed', ${amount})
        RETURNING *
      `;
      
      const { sendTransactionEmail } = await import('../services/emailService.js');
      const [user] = await sql`SELECT email, full_name FROM users WHERE id = ${userId}`;
      sendTransactionEmail(user.email, user.full_name, tx).catch(console.error);
      
      response.message = `✅ Withdrawn ${amount} ${currency}`;
    }
    
    else if (lower.includes('convert') || lower.includes('swap')) {
      const amount = parseFloat(command.match(/\d+(\.\d+)?/)?.[0] || 0);
      const from = command.match(/usd|usdt|btc|eth/i)?.[0]?.toUpperCase() || 'USD';
      const to = command.match(/to (\w+)/i)?.[1]?.toUpperCase() || 'BTC';
      
      const [tx] = await sql`
        INSERT INTO transactions (user_id, type, amount, currency, status)
        VALUES (${userId}, 'conversion', ${amount}, ${from}, 'completed')
        RETURNING *
      `;
      
      const { sendTransactionEmail } = await import('../services/emailService.js');
      const [user] = await sql`SELECT email, full_name FROM users WHERE id = ${userId}`;
      sendTransactionEmail(user.email, user.full_name, tx).catch(console.error);
      
      response.message = `✅ Converted ${amount} ${from} to ${to}`;
    }
    
    else if (lower.includes('balance') || lower.includes('how much')) {
      const balances = await sql`
        SELECT currency, 
          SUM(CASE WHEN type = 'deposit' THEN amount WHEN type = 'withdrawal' THEN -amount ELSE 0 END) as balance
        FROM transactions
        WHERE user_id = ${userId} AND status = 'completed'
        GROUP BY currency
      `;
      
      if (balances.length === 0) {
        response.message = '💰 No balances found';
      } else {
        response.message = '💰 Your balances:\n' + 
          balances.map(b => `${b.currency}: ${parseFloat(b.balance).toFixed(4)}`).join('\n');
      }
    }
    
    else {
      response = { success: false, message: 'Command not recognized. Try "deposit", "withdraw", "convert", or "balance".' };
    }
    
    res.json(response);
    
  } catch (err) {
    console.error('Command error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ========== WALLET ROUTES ==========

router.get('/supported-coins', authenticateUser, async (req, res) => {
    try {
        const coins = await getSupportedCoins();
        res.json(coins);
    } catch (err) {
        console.error('Supported coins error:', err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/wallets', authenticateUser, async (req, res) => {
    const userId = req.user.id;
    try {
        const wallets = await sql`
            SELECT id, symbol, address, chain, created_at 
            FROM user_wallets 
            WHERE user_id = ${userId}
            ORDER BY created_at DESC
        `;
        
        for (let wallet of wallets) {
            wallet.balance = await getWalletBalance(wallet.address, wallet.symbol);
        }
        
        res.json(wallets);
    } catch (err) {
        console.error('Wallets fetch error:', err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/wallets/generate', authenticateUser, async (req, res) => {
    const { symbol } = req.body;
    const userId = req.user.id;
    
    try {
        const existing = await sql`
            SELECT id FROM user_wallets 
            WHERE user_id = ${userId} AND symbol = ${symbol}
        `;
        
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Wallet already exists for this coin' });
        }
        
        const wallet = await generateWallet(symbol);
        const encryptedKey = encryptPrivateKey(wallet.privateKey);
        
        await sql`
            INSERT INTO user_wallets (user_id, symbol, address, private_key_encrypted, chain)
            VALUES (${userId}, ${symbol}, ${wallet.address}, ${encryptedKey}, ${wallet.chain})
        `;
        
        res.json({
            success: true,
            address: wallet.address,
            symbol: wallet.symbol,
            chain: wallet.chain
        });
    } catch (err) {
        console.error('Wallet generation error:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
