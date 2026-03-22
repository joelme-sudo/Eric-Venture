import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('❌ DATABASE_URL is not defined in .env')
  process.exit(1)
}

console.log('🔌 Connecting to Supabase with:', connectionString.split('@')[1]) // Log host only

const sql = postgres(connectionString, {
  ssl: 'require',
  connect_timeout: 30,      // Increased timeout
  idle_timeout: 30,
  max: 5,                   // Fewer connections
  retry_limit: 3,           // Retry on failure
  retry_delay: 2000         // Wait 2 seconds between retries
})

// Test connection
try {
  await sql`SELECT 1+1 AS result`
  console.log('✅ Supabase PostgreSQL connected successfully')
} catch (err) {
  console.error('❌ Connection failed:')
  console.error('Error code:', err.code)
  console.error('Error message:', err.message)
  if (err.code === 'ECONNREFUSED') {
    console.error('❌ Connection refused. Check:')
    console.error('   1. Your IP is whitelisted in Supabase')
    console.error('   2. The connection string is correct')
    console.error('   3. Supabase is not blocking your region')
  }
  process.exit(1)
}

export default sql
