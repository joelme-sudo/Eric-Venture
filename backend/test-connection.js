import postgres from 'postgres'

const DATABASE_URL = 'postgresql://postgres.zgszdbkvmiwtfoazwuwl:REJOICE12REJICE%4012@3.65.151.229:6543/postgres'

console.log('Testing connection...')

try {
  const sql = postgres(DATABASE_URL, {
    ssl: 'require',
    connect_timeout: 5,
    idle_timeout: 5,
    max: 1
  })
  
  const result = await sql`SELECT 1+1 AS result`
  console.log('✅ SUCCESS:', result)
  process.exit(0)
} catch (err) {
  console.error('❌ ERROR:', err)
  console.log('\nError details:')
  console.log('Code:', err.code)
  console.log('Message:', err.message)
  process.exit(1)
}
