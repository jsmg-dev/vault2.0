const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'vault_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

async function testLogin(username, password) {
  try {
    console.log(`🔍 Testing login for username: ${username}`);
    
    const result = await pool.query(
      'SELECT id, name, username, role, password FROM users WHERE username = $1 AND password = $2 LIMIT 1',
      [username, password]
    );
    
    if (result.rows.length === 0) {
      console.log('❌ Login failed - Invalid credentials');
      
      // Check if user exists but password is wrong
      const userCheck = await pool.query('SELECT username, password FROM users WHERE username = $1', [username]);
      if (userCheck.rows.length > 0) {
        console.log(`⚠️  User exists but password doesn't match`);
        console.log(`   Stored password: ${userCheck.rows[0].password}`);
        console.log(`   Provided password: ${password}`);
      } else {
        console.log('❌ User does not exist');
      }
    } else {
      console.log('✅ Login successful!');
      console.log('   User:', result.rows[0]);
    }
    
  } catch (error) {
    console.error('❌ Error testing login:', error.message);
  } finally {
    await pool.end();
  }
}

// Test with common credentials
const testCredentials = [
  { username: 'admin', password: 'admin123' },
  { username: 'admin', password: 'admin' },
  { username: 'aks', password: 'aks' },
  { username: 'nuser', password: 'nuser' },
  { username: 'clothaura', password: 'clothaura' },
  { username: 'user1', password: 'user1' }
];

async function runTests() {
  for (const cred of testCredentials) {
    await testLogin(cred.username, cred.password);
    console.log('---');
  }
}

runTests();