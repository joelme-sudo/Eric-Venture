import express from 'express'
import jwt from 'jsonwebtoken'
import { sql } from '../server.js'

const router = express.Router()
const JWT_SECRET = 'your-super-secret-key-change-this'

const authenticateUser = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

// Get user balance
router.get('/balance', authenticateUser, async (req, res) => {
  const userId = req.user.id
  
  try {
    if (!sql) throw new Error('Database not connected')
    
    const result = await sql`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'deposit' THEN amount WHEN type = 'withdrawal' THEN -amount ELSE 0 END), 0) as total_usd
      FROM transactions
      WHERE user_id = ${userId} AND status = 'completed'
    `
    res.json({ totalUSD: parseFloat(result[0].total_usd) || 0 })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// AI Command
router.post('/command', authenticateUser, async (req, res) => {
  const { command } = req.body
  const userId = req.user.id
  const lower = command.toLowerCase()
  
  try {
    let response = { success: true, message: '' }
    
    if (lower.includes('deposit') || lower.includes('add')) {
      const amount = parseFloat(command.match(/\d+(\.\d+)?/)?.[0] || 0)
      const currency = command.match(/usd|usdt|btc|eth/i)?.[0]?.toUpperCase() || 'USD'
      
      if (amount <= 0) throw new Error('Invalid amount')
      
      await sql`
        INSERT INTO transactions (user_id, type, amount, currency, status)
        VALUES (${userId}, 'deposit', ${amount}, ${currency}, 'completed')
      `
      response.message = `✅ Deposited ${amount} ${currency}`
    }
    
    else if (lower.includes('balance') || lower.includes('how much')) {
      const balances = await sql`
        SELECT currency, 
          SUM(CASE WHEN type = 'deposit' THEN amount WHEN type = 'withdrawal' THEN -amount ELSE 0 END) as balance
        FROM transactions
        WHERE user_id = ${userId} AND status = 'completed'
        GROUP BY currency
      `
      if (balances.length === 0) {
        response.message = '💰 No balances found'
      } else {
        response.message = '💰 Your balances:\n' + 
          balances.map(b => `${b.currency}: ${parseFloat(b.balance).toFixed(4)}`).join('\n')
      }
    }
    
    else {
      response = { success: false, message: 'Command not recognized. Try "deposit" or "balance".' }
    }
    
    res.json(response)
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

export default router
