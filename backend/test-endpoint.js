const express = require('express');
const session = require('express-session');
const db = require('./db');

const app = express();
app.use(express.json());
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Test login endpoint
app.post('/test-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt:', { username, password });
    
    const result = await db.query(
      `SELECT id, name, username, role FROM users WHERE username = $1 AND password = $2 LIMIT 1;`,
      [username, password]
    );
    
    console.log('Query result:', result.rows);
    const row = result.rows[0];
    
    if (!row) {
      console.log('No user found');
      return res.status(401).send('Invalid username or password');
    }

    const role = row.role || "";
    console.log('Role from DB:', role);
    console.log('Role type:', typeof role);
    
    req.session.userId = row.id;
    req.session.userRole = role;
    req.session.username = row.username;
    
    const user = { ...row, role: req.session.userRole };
    console.log('Final user object:', user);
    
    return res.json({ success: true, user: { ...row, role: req.session.userRole } });
  } catch (err) {
    console.error('❌ Login DB error:', err);
    return res.status(500).send('Internal server error');
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  
  // Test the login
  const testLogin = async () => {
    try {
      const response = await fetch(`http://localhost:${PORT}/test-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'clothaura', password: '123' })
      });
      
      const data = await response.json();
      console.log('Login response:', data);
      
      process.exit(0);
    } catch (err) {
      console.error('Test failed:', err);
      process.exit(1);
    }
  };
  
  setTimeout(testLogin, 1000);
});
