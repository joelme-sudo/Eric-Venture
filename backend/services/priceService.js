import axios from 'axios'

// Cache prices to avoid too many API calls
let priceCache = {
  btc: { price: 0, lastUpdated: null },
  eth: { price: 0, lastUpdated: null },
  usdt: { price: 1, lastUpdated: new Date() } // USDT is always $1
}

const CACHE_DURATION = 60000 // 60 seconds

async function fetchCoinGeckoPrice(coinId) {
  try {
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
    )
    return response.data[coinId]?.usd || 0
  } catch (error) {
    console.error(`Error fetching ${coinId} price:`, error.message)
    return null
  }
}

export async function getPrice(currency) {
  const curr = currency.toLowerCase()
  
  // USDT always 1
  if (curr === 'usdt') return 1
  
  // Check cache
  const cached = priceCache[curr]
  if (cached && cached.lastUpdated) {
    const age = Date.now() - cached.lastUpdated
    if (age < CACHE_DURATION && cached.price > 0) {
      return cached.price
    }
  }
  
  // Fetch new price
  let coinId = curr
  if (curr === 'btc') coinId = 'bitcoin'
  if (curr === 'eth') coinId = 'ethereum'
  
  const price = await fetchCoinGeckoPrice(coinId)
  
  if (price) {
    priceCache[curr] = {
      price,
      lastUpdated: Date.now()
    }
    return price
  }
  
  return cached?.price || 0
}

export async function convertAmount(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) return amount
  
  const fromPrice = await getPrice(fromCurrency)
  const toPrice = await getPrice(toCurrency)
  
  if (fromPrice === 0 || toPrice === 0) return 0
  
  // Convert to USD first then to target
  const usdValue = amount * fromPrice
  return usdValue / toPrice
}
