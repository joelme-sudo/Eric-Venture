import express from 'express'
import jwt from 'jsonwebtoken'

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

// Get real prices
router.get('/prices', async (req, res) => {
  try {
    const { getPrice } = await import('../services/priceService.js')
    const btc = await getPrice('btc')
    const eth = await getPrice('eth')
    res.json({ btc, eth })
  } catch {
    res.json({ btc: 69420, eth: 3500 })
  }
})

// Public demo endpoint
router.post('/demo', async (req, res) => {
  const { command } = req.body
  const lower = command.toLowerCase()
  
  try {
    const { getPrice } = await import('../services/priceService.js')
    
    if (lower.includes('price of btc') || (lower.includes('btc') && lower.includes('price'))) {
      const price = await getPrice('btc')
      return res.json({ message: `💰 Current BTC price: $${price.toLocaleString()}` })
    }
    
    if (lower.includes('price of eth') || (lower.includes('eth') && lower.includes('price'))) {
      const price = await getPrice('eth')
      return res.json({ message: `💰 Current ETH price: $${price.toLocaleString()}` })
    }
    
    if (lower.includes('deposit')) {
      const amount = command.match(/\d+(\.\d+)?/)?.[0] || '100'
      const currency = command.match(/usd|usdt|btc|eth/i)?.[0]?.toUpperCase() || 'USD'
      return res.json({ message: `✅ Demo: Deposited ${amount} ${currency}. (Create account for real deposits!)` })
    }
    
    res.json({ message: '🤖 Demo mode: Command received. Sign up to use all features!' })
  } catch (err) {
    res.json({ message: '🤖 Try "price of btc" to see live prices!' })
  }
})

export default router
