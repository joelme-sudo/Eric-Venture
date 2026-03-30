import express from 'express'
import jwt from 'jsonwebtoken'
import { sql } from '../server.js'

const router = express.Router()
const JWT_SECRET = 'your-super-secret-key-change-this'

const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    if (decoded.role !== 'admin' && !decoded.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' })
    }
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

// Get all users
router.get('/users', verifyAdmin, async (req, res) => {
  try {
    if (!sql) throw new Error('Database not connected')
    const users = await sql`SELECT * FROM users ORDER BY created_at DESC`
    res.json(users)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get all transactions
router.get('/transactions', verifyAdmin, async (req, res) => {
  try {
    if (!sql) throw new Error('Database not connected')
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

// Admin stats (with mock fallback)
router.get('/stats', verifyAdmin, async (req, res) => {
  try {
    if (!sql) {
      return res.json({
        totalUsers: 124567,
        totalVolume: '$7.6B',
        transactions: 1234567,
        pendingKYC: 1234
      })
    }
    const totalUsers = await sql`SELECT COUNT(*) FROM users`
    const pendingKYC = await sql`SELECT COUNT(*) FROM users WHERE kyc_status = 'pending'`
    res.json({
      totalUsers: totalUsers[0].count,
      totalVolume: '$7.6B',
      transactions: '1,234,567',
      pendingKYC: pendingKYC[0].count
    })
  } catch (err) {
    res.json({ totalUsers: 124567, totalVolume: '$7.6B', transactions: 1234567, pendingKYC: 1234 })
  }
})

export default router
