import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { sql } from '../server.js'
import { sendWelcomeEmail, sendPasswordResetEmail } from '../services/emailService.js'

const router = express.Router()
const JWT_SECRET = 'your-super-secret-key-change-this'
// Admin verification middleware
const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin' && !decoded.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
// ==================== REGISTER ====================
router.post('/register', async (req, res) => {
    const { email, password, full_name } = req.body
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10)
        
        const [user] = await sql`
            INSERT INTO users (email, password, full_name, kyc_status)
            VALUES (${email}, ${hashedPassword}, ${full_name}, 'pending')
            RETURNING id, email, full_name
        `
        
        // Send welcome email in background
        sendWelcomeEmail(user.email, user.full_name).catch(console.error)
        
        res.json(user)
        
    } catch (err) {
        res.status(400).json({ error: err.message })
    }
})

// ==================== LOGIN ====================
router.post('/login', async (req, res) => {
    const { email, password } = req.body
    
    try {
        const users = await sql`SELECT * FROM users WHERE email = ${email}`
        const user = users[0]
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' })
        }
        
        const valid = await bcrypt.compare(password, user.password)
        if (!valid) {
            return res.status(401).json({ error: 'Invalid credentials' })
        }
        
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

// ==================== GOOGLE OAUTH ====================
router.get('/google', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Google Sign-In</title>
            <style>
                body { 
                    background: #0a0b0e; 
                    color: white; 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    text-align: center; 
                    padding: 50px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                }
                .box {
                    background: #1a1b1e;
                    padding: 40px;
                    border-radius: 20px;
                    border: 1px solid #2a2b2e;
                    max-width: 400px;
                }
                h2 { color: #667eea; margin-bottom: 20px; }
                p { color: #999; margin-bottom: 30px; }
                a {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    text-decoration: none;
                    padding: 12px 30px;
                    border-radius: 10px;
                    display: inline-block;
                    font-weight: 600;
                }
                a:hover { transform: translateY(-2px); }
            </style>
        </head>
        <body>
            <div class="box">
                <h2>🔧 Google Sign-In Coming Soon</h2>
                <p>For now, please use email registration.</p>
                <a href="http://127.0.0.1:5500/frontend/customer-register.html">← Back to Sign Up</a>
            </div>
        </body>
        </html>
    `)
})

// ==================== APPLE OAUTH ====================
router.get('/apple', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Apple Sign-In</title>
            <style>
                body { 
                    background: #0a0b0e; 
                    color: white; 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    text-align: center; 
                    padding: 50px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                }
                .box {
                    background: #1a1b1e;
                    padding: 40px;
                    border-radius: 20px;
                    border: 1px solid #2a2b2e;
                    max-width: 400px;
                }
                h2 { color: #667eea; margin-bottom: 20px; }
                p { color: #999; margin-bottom: 30px; }
                a {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    text-decoration: none;
                    padding: 12px 30px;
                    border-radius: 10px;
                    display: inline-block;
                    font-weight: 600;
                }
                a:hover { transform: translateY(-2px); }
            </style>
        </head>
        <body>
            <div class="box">
                <h2>🔧 Apple Sign-In Coming Soon</h2>
                <p>For now, please use email registration.</p>
                <a href="http://127.0.0.1:5500/frontend/customer-register.html">← Back to Sign Up</a>
            </div>
        </body>
        </html>
    `)
})

// ==================== FORGOT PASSWORD ====================
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body
    
    try {
        const users = await sql`SELECT id, email, full_name FROM users WHERE email = ${email}`
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'Email not found' })
        }
        
        const user = users[0]
        const resetToken = Math.random().toString(36).substring(2, 15) + 
                          Math.random().toString(36).substring(2, 15)
        
        await sql`
            INSERT INTO password_resets (user_id, token, expires_at)
            VALUES (${user.id}, ${resetToken}, NOW() + INTERVAL '1 hour')
        `
        
        // Send email
        await sendPasswordResetEmail(user.email, resetToken)
        
        res.json({ message: 'Reset link sent to your email' })
        
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// ==================== RESET PASSWORD PAGE ====================
router.get('/reset-password/:token', async (req, res) => {
    const { token } = req.params
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Reset Password</title>
            <style>
                body { background: #0a0b0e; color: white; font-family: Arial; display: flex; justify-content: center; align-items: center; height: 100vh; }
                .box { background: #1a1b1e; padding: 40px; border-radius: 20px; max-width: 400px; }
                input { width: 100%; padding: 10px; margin: 10px 0; background: #2a2b2e; border: none; color: white; border-radius: 5px; }
                button { width: 100%; padding: 10px; background: #667eea; border: none; color: white; border-radius: 5px; cursor: pointer; }
                .error { color: #ef4444; margin-top: 10px; }
            </style>
        </head>
        <body>
            <div class="box">
                <h2>Reset Password</h2>
                <p>Enter your new password</p>
                <input type="password" id="password" placeholder="New password">
                <input type="password" id="confirm" placeholder="Confirm password">
                <button onclick="resetPassword('${token}')">Reset Password</button>
                <div id="error" class="error"></div>
            </div>
            <script>
                async function resetPassword(token) {
                    const password = document.getElementById('password').value;
                    const confirm = document.getElementById('confirm').value;
                    
                    if (password !== confirm) {
                        document.getElementById('error').textContent = 'Passwords do not match';
                        return;
                    }
                    
                    const res = await fetch('/api/auth/reset-password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token, password })
                    });
                    
                    const data = await res.json();
                    
                    if (res.ok) {
                        alert('Password reset successful!');
                        window.location.href = 'http://127.0.0.1:5500/frontend/customer-login.html';
                    } else {
                        document.getElementById('error').textContent = data.error;
                    }
                }
            </script>
        </body>
        </html>
    `)
})

// ==================== RESET PASSWORD SUBMIT ====================
router.post('/reset-password', async (req, res) => {
    const { token, password } = req.body
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10)
        
        await sql`
            UPDATE users 
            SET password = ${hashedPassword}
            WHERE id = (SELECT user_id FROM password_resets WHERE token = ${token} AND expires_at > NOW())
        `
        
        await sql`DELETE FROM password_resets WHERE token = ${token}`
        
        res.json({ message: 'Password reset successful' })
        
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})
// Admin login (works without database)
router.post('/admin-login', async (req, res) => {
    const { email, password } = req.body;
    
    // Hardcoded admin credentials for emergency access
    if (email === 'breakthrougheric981@gmail.com' && password === 'Rejoice12') {
        // Create a token manually
        const token = jwt.sign(
            { 
                id: 1, 
                email: email, 
                role: 'admin',
                isAdmin: true 
            },
            JWT_SECRET,
            { expiresIn: '4h' }
        );
        
        return res.json({ 
            token, 
            isAdmin: true,
            user: { 
                id: 1, 
                email: email, 
                full_name: 'Admin User',
                role: 'admin'
            } 
        });
    }
    
    // If not hardcoded, try database (if connected)
    try {
        if (sql) {
            const users = await sql`
                SELECT * FROM users 
                WHERE email = ${email} AND is_admin = true
            `;
            const user = users[0];
            
            if (user && await bcrypt.compare(password, user.password)) {
                const token = jwt.sign(
                    { id: user.id, email: user.email, role: 'admin' },
                    JWT_SECRET,
                    { expiresIn: '4h' }
                );
                
                return res.json({ 
                    token, 
                    isAdmin: true,
                    user: { 
                        id: user.id, 
                        email: user.email, 
                        full_name: user.full_name,
                        role: 'admin'
                    } 
                });
            }
        }
    } catch (err) {
        console.log('Database error in admin login:', err.message);
    }
    
    res.status(401).json({ error: 'Invalid admin credentials' });
});

// Verify admin token (bypasses DB)
router.get('/verify-admin', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role === 'admin' || decoded.isAdmin) {
            return res.json({ valid: true, user: decoded });
        }
        res.status(403).json({ error: 'Not admin' });
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
});

// Example admin-only route
router.get('/admin/stats', verifyAdmin, async (req, res) => {
    try {
        const totalUsers = await sql`SELECT COUNT(*) FROM users`;
        const totalVolume = await sql`SELECT SUM(amount) FROM transactions WHERE status = 'completed'`;
        const pendingKYC = await sql`SELECT COUNT(*) FROM users WHERE kyc_status = 'pending'`;
        
        res.json({
            totalUsers: totalUsers[0].count,
            totalVolume: totalVolume[0].sum || 0,
            pendingKYC: pendingKYC[0].count
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
export default router
