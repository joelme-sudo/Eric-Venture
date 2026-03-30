import express from 'express'
import axios from 'axios'

const router = express.Router()

// Get all market data
router.get('/all', async (req, res) => {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 20,
        page: 1,
        sparkline: false
      }
    })
    const data = response.data.map(coin => ({
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      price: coin.current_price,
      change: coin.price_change_percentage_24h,
      volume: coin.total_volume,
      marketCap: coin.market_cap
    }))
    res.json(data)
  } catch (err) {
    // Fallback mock data if API fails
    res.json([
      { symbol: 'BTC', name: 'Bitcoin', price: 68142, change: 2.4, volume: 32400000000, marketCap: 1340000000000 },
      { symbol: 'ETH', name: 'Ethereum', price: 3502, change: 1.2, volume: 18700000000, marketCap: 421000000000 },
      { symbol: 'BNB', name: 'BNB', price: 578, change: -0.3, volume: 8900000000, marketCap: 89000000000 },
      { symbol: 'SOL', name: 'Solana', price: 145, change: 5.7, volume: 4200000000, marketCap: 62000000000 }
    ])
  }
})

// Get single price
router.get('/price/:pair', async (req, res) => {
  const { pair } = req.params
  const base = pair.replace('USDT', '').toLowerCase()
  try {
    const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
      params: { ids: base, vs_currencies: 'usd', include_24hr_change: true }
    })
    const data = response.data[base]
    res.json({ price: data.usd, change: data.usd_24h_change })
  } catch (err) {
    res.json({ price: 68142, change: 2.4 })
  }
})

export default router
