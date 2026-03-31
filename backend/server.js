import express from 'express'
import cors from 'cors'
import postgres from 'postgres'
import adminRoutes from './routes/admin.js'
import authRoutes from './routes/auth.js';
import aiRoutes from './routes/ai.js'
import userRoutes from './routes/user.js'
import marketRoutes from './routes/market.js'
import tradeRoutes from './routes/trade.js'
import convertRoutes from './routes/convert.js'

// Database connection - use the IP address directly
const DATABASE_URL = 'postgresql://postgres.zgszdbkvmiwtfoazwuwl:REJOICE12REJICE%4012@3.65.151.229:6543/postgres'

console.log('🔌 Connecting to database...')

const sql = postgres(DATABASE_URL, {
  ssl: 'require',
  connect_timeout: 15,
  idle_timeout: 20,
  max: 10
})

// Test connection
try {
  await sql`SELECT 1+1 AS result`
  console.log('✅ Database connected successfully')
} catch (err) {
  console.error('❌ Database connection failed:', err.message)
}

const app = express()

// CORS - allow all origins for testing
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Routes
app.use('/api/admin', adminRoutes)
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes)
app.use('/api/user', userRoutes)
app.use('/api/market', marketRoutes)
app.use('/api/trade', tradeRoutes)
app.use('/api/convert', convertRoutes)

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Eric Venture API is running',
    database: sql ? 'connected ✅' : 'disconnected ❌',
    timestamp: new Date()
  })
})

app.get('/test-db', async (req, res) => {
  if (!sql) return res.json({ database: 'disconnected ❌' })
  try {
    const result = await sql`SELECT 1+1 AS result`
    res.json({ database: 'connected ✅', result: result[0] })
  } catch (err) {
    res.json({ database: 'disconnected ❌', error: err.message })
  }
})

const PORT = process.env.PORT || 5001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export { sql }
