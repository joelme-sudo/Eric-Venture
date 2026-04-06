import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { sql } from '../server.js'

const router = express.Router()
const JWT_SECRET = 'your-super-secret-key-change-this'

// Register
router.post('/register', async (req, res) => {
  const { email, password, full_name } = req.body
  
  try {
    if (!sql) throw new Error('Database not connected')
    
    // Check if user exists
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered' })
    }
    
    const hashedPassword = await bcrypt.hash(password, 10)
    const [user] = await sql`
      INSERT INTO users (email, password, full_name, kyc_status)
      VALUES (${email}, ${hashedPassword}, ${full_name}, 'pending')
      RETURNING id, email, full_name
    `
    res.status(201).json({ message: 'User created successfully', user })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ error: err.message })
  }
})

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  
  try {
    if (!sql) throw new Error('Database not connected')
    
    const users = await sql`SELECT * FROM users WHERE email = ${email}`
    const user = users[0]
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }
    
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: 'user' },
      JWT_SECRET,
      { expiresIn: '7d' }
    )
    
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        full_name: user.full_name 
      } 
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: err.message })
  }
})

// Admin login
router.post('/admin-login', async (req, res) => {
  const { email, password } = req.body
  
  // Hardcoded admin
  if (email === 'breakthrougheric981@gmail.com' && password === 'Rejoice12') {
    const token = jwt.sign(
      { id: 1, email, role: 'admin', isAdmin: true },
      JWT_SECRET,
      { expiresIn: '7d' }
    )
    return res.json({ token, isAdmin: true, user: { id: 1, email, full_name: 'Admin User' } })
  }
  
  res.status(401).json({ error: 'Invalid admin credentials' })
})

export default router
