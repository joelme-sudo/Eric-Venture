import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'joeldivinedei@gmail.com',
    pass: 'wizuibjlgtwxrdif'
  }
})

export async function sendWelcomeEmail(userEmail, userName) {
  const mailOptions = {
    from: '"Eric Venture" <joeldivinedei@gmail.com>',
    to: userEmail,
    subject: 'Welcome to Eric Venture! 🎉',
    html: `<div style="font-family: Arial; max-width: 600px; background: #0a0b0e; color: white; padding: 40px; border-radius: 16px;">
      <h1 style="color: #F0B90B; text-align: center;">Welcome to Eric Venture!</h1>
      <p>Hello ${userName},</p>
      <p>Thank you for joining Eric Venture. You can now start trading with AI-powered tools.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://eric-venture.vercel.app/customer-dashboard.html" style="background: #F0B90B; color: black; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Go to Dashboard</a>
      </div>
      <p style="color: #888;">Best regards,<br>The Eric Venture Team</p>
    </div>`
  }
  try {
    await transporter.sendMail(mailOptions)
    console.log('Welcome email sent to:', userEmail)
  } catch (error) {
    console.error('Email error:', error)
  }
}
