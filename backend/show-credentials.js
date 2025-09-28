const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'vault_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

async function showAllCredentials() {
  try {
    console.log('🔍 All user credentials:');
    
    const result = await pool.query('SELECT username, password, name, role FROM users ORDER BY id');
    
    result.rows.forEach(user => {
      console.log(`   Username: ${user.username} | Password: ${user.password} | Name: ${user.name} | Role: ${user.role}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

showAllCredentials();
