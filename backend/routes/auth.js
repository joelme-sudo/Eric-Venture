import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { sql } from '../server.js'

const router = express.Router()
const JWT_SECRET = 'your-super-secret-key-change-this'

// Register new user
router.post('/register', async (req, res) => {
  const { email, password, full_name } = req.body
  
  try {
    if (!sql) throw new Error('Database not connected')
    const hashedPassword = await bcrypt.hash(password, 10)
    const [user] = await sql`
      INSERT INTO users (email, password, full_name, kyc_status)
      VALUES (${email}, ${hashedPassword}, ${full_name}, 'pending')
      RETURNING id, email, full_name
    `
    res.json(user)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  
  try {
    if (!sql) throw new Error('Database not connected')
    const users = await sql`SELECT * FROM users WHERE email = ${email}`
    const user = users[0]
    
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: 'user' },
      JWT_SECRET,
      { expiresIn: '24h' }
    )
    
    res.json({ token, user: { id: user.id, email: user.email, full_name: user.full_name } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Admin login (with hardcoded fallback)
router.post('/admin-login', async (req, res) => {
  const { email, password } = req.body
  
  // Hardcoded admin for emergency access
  if (email === 'breakthrougheric981@gmail.com' && password === 'Rejoice12') {
    const token = jwt.sign(
      { id: 1, email, role: 'admin', isAdmin: true },
      JWT_SECRET,
      { expiresIn: '4h' }
    )
    return res.json({ token, isAdmin: true, user: { id: 1, email, full_name: 'Admin User', role: 'admin' } })
  }
  
  // Database admin check
  try {
    if (!sql) throw new Error('Database not connected')
    const users = await sql`SELECT * FROM users WHERE email = ${email} AND is_admin = true`
    const user = users[0]
    
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign(
        { id: user.id, email: user.email, role: 'admin' },
        JWT_SECRET,
        { expiresIn: '4h' }
      )
      return res.json({ token, isAdmin: true, user: { id: user.id, email: user.email, full_name: user.full_name, role: 'admin' } })
    }
  } catch (err) {
    console.error('Admin login error:', err)
  }
  
  res.status(401).json({ error: 'Invalid admin credentials' })
})

// Verify admin token
router.get('/verify-admin', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    if (decoded.role === 'admin' || decoded.isAdmin) {
      return res.json({ valid: true, user: decoded })
    }
    res.status(403).json({ error: 'Not admin' })
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
})

export default router
