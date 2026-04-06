// FORCE DEPLOY - v2
import express from 'express'
import cors from 'cors'
import postgres from 'postgres'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/user.js'

// Database connection
const DATABASE_URL = 'postgresql://postgres.zgszdbkvmiwtfoazwuwl:REJOICE12REJICE%4012@aws-1-eu-central-1.pooler.supabase.com:5432/postgres'
console.log('🔌 Connecting to database...')

const sql = postgres(DATABASE_URL, {
  ssl: 'require',
  connect_timeout: 15,
  idle_timeout: 20,
  max: 10,
  prepare: false  // Add this line to disable prepared statements
})

// Test connection
try {
  await sql`SELECT 1+1 AS result`
  console.log('✅ Database connected successfully')
} catch (err) {
  console.error('❌ Database connection failed:', err.message)
}

const app = express()

// CORS - Allow your frontend
app.use(cors({
  origin: ['https://eric-venture.vercel.app', 'http://localhost:5500', 'http://127.0.0.1:5500'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Eric Venture API is running',
    database: sql ? 'connected ✅' : 'disconnected ❌',
    timestamp: new Date()
  })
})

const PORT = process.env.PORT || 5001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export { sql }
