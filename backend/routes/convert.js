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

async function getPrice(symbol) {
  try {
    const axios = (await import('axios')).default
    const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
      params: { ids: symbol.toLowerCase(), vs_currencies: 'usd' }
    })
    return response.data[symbol.toLowerCase()]?.usd || 0
  } catch {
    const prices = { btc: 68142, eth: 3502, bnb: 578, sol: 145 }
    return prices[symbol.toLowerCase()] || 1
  }
}

router.get('/rate', async (req, res) => {
  const { from, to, amount } = req.query
  try {
    const fromPrice = await getPrice(from)
    const toPrice = await getPrice(to)
    const rate = fromPrice / toPrice
    res.json({ rate, convertedAmount: amount * rate, slippage: 0.1 })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/execute', authenticateUser, async (req, res) => {
  const { from, to, amount } = req.body
  const userId = req.user.id
  try {
    const fromPrice = await getPrice(from)
    const toPrice = await getPrice(to)
    const received = (amount * fromPrice) / toPrice
    const [tx] = await sql`
      INSERT INTO transactions (user_id, type, amount, currency, status, usd_value)
      VALUES (${userId}, 'conversion', ${amount}, ${from}, 'completed', ${amount * fromPrice})
      RETURNING *
    `
    res.json({ success: true, received, transaction: tx })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
