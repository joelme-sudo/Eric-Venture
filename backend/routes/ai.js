import express from 'express'
import jwt from 'jsonwebtoken'
import { sql } from '../server.js'  // 👈 ADD THIS (even if not used yet)

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

// ========== TEST ENDPOINT ==========
router.post('/command', authenticateAdmin, (req, res) => {
  const { command } = req.body
  const userId = req.user.id
  
  console.log('Command received:', command)
  console.log('User ID:', userId)
  
  res.json({ 
    success: true, 
    message: `✅ Echo: "${command}" from user ${userId}`,
    timestamp: new Date().toISOString()
  })
})

// ========== TEST ROUTE ==========
router.get('/test', (req, res) => {
  res.json({ message: 'AI route working' })
})

// ========== PRICE ENDPOINT ==========
router.get('/prices', async (req, res) => {
  try {
    const { getPrice } = await import('../services/priceService.js')
    const btc = await getPrice('btc')
    const eth = await getPrice('eth')
    res.json({ btc, eth })
  } catch (e) {
    res.json({ btc: 69420, eth: 3500, message: 'Mock prices (service unavailable)' })
  }
})

// ========== PUBLIC DEMO ==========
router.post('/demo', async (req, res) => {
  try {
    const { command } = req.body
    const lower = command.toLowerCase()
    
    console.log('Demo command:', command)
    
    // Price checks
    if (lower.includes('price of btc') || (lower.includes('btc') && lower.includes('price'))) {
      try {
        const { getPrice } = await import('../services/priceService.js')
        const price = await getPrice('btc')
        res.json({ message: `💰 Current BTC price: $${price.toLocaleString()}` })
        return
      } catch {
        res.json({ message: `💰 BTC price: $69,420 (demo mode)` })
        return
      }
    }
    
    if (lower.includes('price of eth') || (lower.includes('eth') && lower.includes('price'))) {
      try {
        const { getPrice } = await import('../services/priceService.js')
        const price = await getPrice('eth')
        res.json({ message: `💰 Current ETH price: $${price.toLocaleString()}` })
        return
      } catch {
        res.json({ message: `💰 ETH price: $3,500 (demo mode)` })
        return
      }
    }
    
    // Deposit demo
    if (lower.includes('deposit')) {
      const amount = command.match(/\d+(\.\d+)?/)?.[0] || '100'
      const currency = command.match(/usd|usdt|btc|eth/i)?.[0]?.toUpperCase() || 'USD'
      res.json({ message: `✅ Demo: Deposited ${amount} ${currency}. (Create account for real deposits!)` })
      return
    }
    
    // Convert demo
    if (lower.includes('convert') || lower.includes('swap')) {
      const amount = command.match(/\d+(\.\d+)?/)?.[0] || '0.01'
      res.json({ message: `✅ Demo: Converted ${amount} (Create account for real conversions!)` })
      return
    }
    
    res.json({ message: '🤖 Demo mode: Command received. Sign up to use all features!' })
    
  } catch (err) {
    console.error('Demo error:', err)
    res.status(500).json({ error: err.message })
  }
})

export default router
