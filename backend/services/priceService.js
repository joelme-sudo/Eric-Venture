import axios from 'axios'

let priceCache = {
  btc: { price: 0, lastUpdated: null },
  eth: { price: 0, lastUpdated: null }
}
const CACHE_DURATION = 60000 // 1 minute

export async function getPrice(currency) {
  const curr = currency.toLowerCase()
  if (curr === 'usdt') return 1
  
  const cached = priceCache[curr]
  if (cached && cached.lastUpdated && Date.now() - cached.lastUpdated < CACHE_DURATION && cached.price > 0) {
    return cached.price
  }
  
  try {
    let coinId = curr === 'btc' ? 'bitcoin' : curr === 'eth' ? 'ethereum' : curr
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
    )
    const price = response.data[coinId]?.usd || 0
    if (price) {
      priceCache[curr] = { price, lastUpdated: Date.now() }
    }
    return price
  } catch (error) {
    console.error(`Error fetching ${curr} price:`, error.message)
    return cached?.price || (curr === 'btc' ? 68142 : curr === 'eth' ? 3502 : 0)
  }
}
