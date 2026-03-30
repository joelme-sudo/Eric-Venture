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

router.post('/spot', authenticateUser, async (req, res) => {
  const { pair, type, price, amount } = req.body
  const userId = req.user.id
  try {
    const [tx] = await sql`
      INSERT INTO transactions (user_id, type, amount, currency, status, usd_value)
      VALUES (${userId}, ${type}, ${amount}, ${pair.replace('USDT', '')}, 'completed', ${price * amount})
      RETURNING *
    `
    res.json({ success: true, transaction: tx })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
