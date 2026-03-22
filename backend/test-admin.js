// test-admin.js
async function testAdminLogin() {
  try {
    const response = await fetch('http://localhost:5001/api/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'breakthrougheric981@gmail.com',
        password: 'Rejoice12'
      })
    });
    
    const data = await response.json();
    console.log('✅ Status:', response.status);
    console.log('✅ Response:', data);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAdminLogin();
