import express from 'express'
import jwt from 'jsonwebtoken'
import { sql } from '../server.js'

const router = express.Router()
const JWT_SECRET = 'your-super-secret-key-change-this'

const authenticateAdmin = (req, res, next) => {
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

// Get all users
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const users = await sql`SELECT * FROM users ORDER BY created_at DESC`
    res.json(users)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get all transactions
router.get('/transactions', authenticateAdmin, async (req, res) => {
  try {
    const transactions = await sql`
      SELECT transactions.*, users.email 
      FROM transactions 
      JOIN users ON transactions.user_id = users.id 
      ORDER BY created_at DESC
    `
    res.json(transactions)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get chart data
router.get('/charts', authenticateAdmin, async (req, res) => {
  try {
    // Daily transactions for last 7 days
    const dailyTx = await sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        SUM(amount) as volume
      FROM transactions
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `
    
    // Currency distribution
    const currencyDist = await sql`
      SELECT 
        currency,
        COUNT(*) as count,
        SUM(amount) as total
      FROM transactions
      GROUP BY currency
    `
    
    res.json({
      daily: dailyTx,
      currencies: currencyDist
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
