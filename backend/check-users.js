const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'vault_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

async function checkUsers() {
  try {
    console.log('🔍 Checking users in database...');
    
    const result = await pool.query('SELECT id, username, name, role FROM users ORDER BY id');
    
    if (result.rows.length === 0) {
      console.log('❌ No users found in database!');
      console.log('💡 You need to create a user first.');
    } else {
      console.log('✅ Found users:');
      result.rows.forEach(user => {
        console.log(`   ID: ${user.id}, Username: ${user.username}, Name: ${user.name}, Role: ${user.role}`);
      });
    }
    
    // Check if admin user exists
    const adminResult = await pool.query('SELECT * FROM users WHERE username = $1', ['admin']);
    if (adminResult.rows.length === 0) {
      console.log('⚠️  Admin user not found! Creating default admin...');
      
      await pool.query(`
        INSERT INTO users (name, username, password, role, email, phone, address) 
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, ['Admin User', 'admin', 'admin123', 'admin', 'admin@vault.com', '1234567890', 'Admin Address']);
      
      console.log('✅ Default admin user created!');
      console.log('   Username: admin');
      console.log('   Password: admin123');
    } else {
      console.log('✅ Admin user exists');
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error.message);
  } finally {
    await pool.end();
  }
}

checkUsers();
