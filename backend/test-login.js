const db = require('./db');

async function testLogin() {
  try {
    console.log('Testing clothAura user login...');
    
    // Test the exact query from the login endpoint
    const result = await db.query(
      `SELECT id, name, username, role FROM users WHERE username = $1 AND password = $2 LIMIT 1;`,
      ['clothaura', '123']
    );
    
    console.log('Query result:', result.rows);
    
    if (result.rows.length > 0) {
      const row = result.rows[0];
      console.log('User found:', row);
      console.log('Role:', row.role);
      console.log('Role type:', typeof row.role);
      console.log('Role === clothAura:', row.role === 'clothAura');
    } else {
      console.log('No user found with these credentials');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

testLogin();
