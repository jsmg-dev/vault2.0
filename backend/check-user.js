const db = require('./db');

async function checkUser() {
  try {
    const result = await db.query('SELECT id, name, username, role FROM users WHERE username = $1', ['clothaura']);
    console.log('User from DB:', result.rows[0]);
    console.log('Role value:', result.rows[0].role);
    console.log('Role type:', typeof result.rows[0].role);
    console.log('Role length:', result.rows[0].role.length);
    console.log('Role char codes:', result.rows[0].role.split('').map(c => c.charCodeAt(0)));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkUser();
