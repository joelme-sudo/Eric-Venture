import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
})

// Welcome email
export async function sendWelcomeEmail(userEmail, userName) {
    const mailOptions = {
        from: '"Eric Venture" <joeldivinedei@gmail.com>',
        to: userEmail,
        subject: 'Welcome to Eric Venture! 🎉',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0b0e; color: white; padding: 40px; border-radius: 20px;">
                <h1 style="color: #667eea; text-align: center;">Welcome to Eric Venture!</h1>
                <p style="font-size: 16px; line-height: 1.6;">Hello ${userName},</p>
                <p style="font-size: 16px; line-height: 1.6;">Thank you for joining Eric Venture. We're excited to have you on board!</p>
                
                <div style="background: #1a1b1e; padding: 20px; border-radius: 10px; margin: 30px 0;">
                    <h3 style="color: #667eea;">✨ What you can do:</h3>
                    <ul style="color: #999;">
                        <li>Deposit and withdraw crypto instantly</li>
                        <li>Convert between currencies with real rates</li>
                        <li>Use natural language commands</li>
                        <li>Track all transactions in one place</li>
                    </ul>
                </div>
                
                <div style="text-align: center;">
                    <a href="http://localhost:5500/frontend/customer-dashboard.html" 
                       style="background: linear-gradient(135deg, #667eea, #764ba2); 
                              color: white; padding: 15px 40px; 
                              text-decoration: none; border-radius: 50px; 
                              display: inline-block; font-weight: bold;">
                        Go to Dashboard →
                    </a>
                </div>
                
                <p style="margin-top: 40px; color: #666; text-align: center;">Best regards,<br>The Eric Venture Team</p>
            </div>
        `
    }
    
    try {
        await transporter.sendMail(mailOptions)
        console.log('✅ Welcome email sent to:', userEmail)
    } catch (error) {
        console.error('❌ Email error:', error)
    }
}

// Transaction confirmation email
export async function sendTransactionEmail(userEmail, userName, transaction) {
    const mailOptions = {
        from: '"Eric Venture" <joeldivinedei@gmail.com>',
        to: userEmail,
        subject: `Transaction Confirmed: ${transaction.type.toUpperCase()}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0b0e; color: white; padding: 40px; border-radius: 20px;">
                <h2 style="color: #667eea; text-align: center;">Transaction Confirmed ✅</h2>
                <p style="font-size: 16px;">Hello ${userName},</p>
                <p>Your transaction has been processed successfully.</p>
                
                <div style="background: #1a1b1e; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <p><strong style="color: #667eea;">Type:</strong> ${transaction.type}</p>
                    <p><strong style="color: #667eea;">Amount:</strong> ${transaction.amount} ${transaction.currency}</p>
                    <p><strong style="color: #667eea;">Status:</strong> ${transaction.status}</p>
                    <p><strong style="color: #667eea;">Date:</strong> ${new Date(transaction.created_at).toLocaleString()}</p>
                    <p><strong style="color: #667eea;">Transaction ID:</strong> ${transaction.id}</p>
                </div>
                
                <div style="text-align: center;">
                    <a href="http://localhost:5500/frontend/customer-dashboard.html" 
                       style="background: #667eea; color: white; padding: 12px 30px; 
                              text-decoration: none; border-radius: 50px; display: inline-block;">
                        View Details →
                    </a>
                </div>
            </div>
        `
    }
    
    try {
        await transporter.sendMail(mailOptions)
        console.log('✅ Transaction email sent to:', userEmail)
    } catch (error) {
        console.error('❌ Email error:', error)
    }
}

// Password reset email
export async function sendPasswordResetEmail(userEmail, resetToken) {
    const resetLink = `http://localhost:5001/api/auth/reset-password/${resetToken}`
    
    const mailOptions = {
        from: '"Eric Venture" <joeldivinedei@gmail.com>',
        to: userEmail,
        subject: 'Password Reset Request',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0b0e; color: white; padding: 40px; border-radius: 20px;">
                <h2 style="color: #667eea; text-align: center;">Reset Your Password</h2>
                <p style="font-size: 16px; text-align: center;">You requested to reset your password. Click the button below to proceed:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" 
                       style="background: #667eea; color: white; padding: 15px 40px; 
                              text-decoration: none; border-radius: 50px; 
                              display: inline-block; font-weight: bold;">
                        Reset Password
                    </a>
                </div>
                
                <p style="color: #666; text-align: center;">If you didn't request this, please ignore this email.</p>
                <p style="color: #666; text-align: center;">This link expires in 1 hour.</p>
                
                <p style="color: #666; font-size: 0.9rem; text-align: center; word-break: break-all;">${resetLink}</p>
            </div>
        `
    }
    
    try {
        await transporter.sendMail(mailOptions)
        console.log('✅ Password reset email sent to:', userEmail)
    } catch (error) {
        console.error('❌ Email error:', error)
    }
}
