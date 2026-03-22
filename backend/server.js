import express from 'express'
import cors from 'cors'
import postgres from 'postgres'
import adminRoutes from './routes/admin.js'
import authRoutes from './routes/auth.js'
import aiRoutes from './routes/ai.js'
import userRoutes from './routes/user.js'
import marketRoutes from './routes/market.js';
import tradeRoutes from './routes/trade.js';
import convertRoutes from './routes/convert.js';
import p2pRoutes from './routes/p2p.js';
import copyTradingRoutes from './routes/copy-trading.js';
import launchpadRoutes from './routes/launchpad.js';
import cardRoutes from './routes/card.js';
import giftCardsRoutes from './routes/gift-cards.js';
import mobileRefillRoutes from './routes/mobile-refill.js';
import earnRoutes from './routes/earn.js';

// HARDCODED IP ADDRESS - NO DNS NEEDED
const DATABASE_URL = 'postgresql://postgres.zgszdbkvmiwtfoazwuwl:REJOICE12REJICE%4012@3.65.151.229:6543/postgres'

console.log('🔌 Connecting to Supabase with IP address...')

let sql

try {
  sql = postgres(DATABASE_URL, {
    ssl: 'require',
    connect_timeout: 10,
    idle_timeout: 20,
    max: 5
  })
  
  console.log('✅ Connection pool created')
} catch (err) {
  console.error('❌ Failed to create connection pool:', err.message)
  console.log('⚠️ Server will start with mock data mode')
}

const app = express()

// CORS first
app.use(cors({ origin: 'http://127.0.0.1:5502' }))

// Then other middleware
app.use(express.json())

// Then routes
app.use('/api/auth', authRoutes)

// Routes
app.use('/api/admin', adminRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/user', userRoutes)
app.use('/api/market', marketRoutes);
app.use('/api/trade', tradeRoutes);
app.use('/api/convert', convertRoutes);
app.use('/api/p2p', p2pRoutes);
app.use('/api/copy-trading', copyTradingRoutes);
app.use('/api/launchpad', launchpadRoutes);
app.use('/api/card', cardRoutes);
app.use('/api/gift-cards', giftCardsRoutes);
app.use('/api/mobile-refill', mobileRefillRoutes);
app.use('/api/earn', earnRoutes);

app.get('/', (req, res) => {
  res.json({ 
    message: 'Ever Finance API is running',
    database: sql ? 'pool created ✅' : 'disconnected ❌',
    timestamp: new Date()
  })
})

app.get('/test-db', async (req, res) => {
  if (!sql) {
    return res.json({ database: 'disconnected ❌', error: 'No database connection' })
  }
  
  try {
    const result = await sql`SELECT 1+1 AS result`
    res.json({ database: 'connected ✅', result: result[0] })
  } catch (err) {
    res.json({ database: 'disconnected ❌', error: err.message })
  }
})

// Admin stats endpoint with mock data fallback
app.get('/api/admin/stats', async (req, res) => {
  if (!sql) {
    return res.json({
      totalUsers: '124,567',
      totalVolume: '$7.6B',
      transactions: '1,234,567',
      pendingKYC: '1,234'
    });
  }
  
  try {
    const totalUsers = await sql`SELECT COUNT(*) FROM users`;
    const totalVolume = await sql`SELECT SUM(amount) FROM transactions WHERE status = 'completed'`;
    const pendingKYC = await sql`SELECT COUNT(*) FROM users WHERE kyc_status = 'pending'`;
    
    res.json({
      totalUsers: totalUsers[0].count,
      totalVolume: totalVolume[0].sum || 0,
      transactions: '1,234,567', // Replace with real query
      pendingKYC: pendingKYC[0].count
    });
  } catch (err) {
    res.json({
      totalUsers: '124,567',
      totalVolume: '$7.6B',
      transactions: '1,234,567',
      pendingKYC: '1,234'
    });
  }
});

const PORT = 5001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export { sql }
