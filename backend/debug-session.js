const express = require('express');
const session = require('express-session');
const db = require('./db');

const app = express();
app.use(express.json());

// Use the same session config as the main server
app.use(session({
  secret: 'dev-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 60 * 60 * 1000, // 1 hour
    secure: false
  }
}));

app.post('/debug-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('=== DEBUG LOGIN START ===');
    console.log('Input:', { username, password });
    
    const result = await db.query(
      `SELECT id, name, username, role FROM users WHERE username = $1 AND password = $2 LIMIT 1;`,
      [username, password]
    );
    
    console.log('DB result:', result.rows);
    const row = result.rows[0];
    
    if (!row) {
      console.log('No user found');
      return res.status(401).send('Invalid username or password');
    }

    console.log('Row from DB:', row);
    console.log('Row.role:', row.role);
    console.log('Row.role type:', typeof row.role);
    console.log('Row.role === clothAura:', row.role === 'clothAura');
    
    const role = row.role || "";
    console.log('Role variable:', role);
    console.log('Role type:', typeof role);
    console.log('Role === clothAura:', role === 'clothAura');
    
    req.session.userId = row.id;
    req.session.userRole = role;
    req.session.username = row.username;
    
    console.log('Session after setting:', {
      userId: req.session.userId,
      userRole: req.session.userRole,
      username: req.session.username
    });
    
    const user = { ...row, role: req.session.userRole };
    console.log('Final user object:', user);
    console.log('Final user.role:', user.role);
    console.log('Final user.role type:', typeof user.role);
    console.log('Final user.role === clothAura:', user.role === 'clothAura');
    
    const response = { success: true, user: { ...row, role: req.session.userRole } };
    console.log('Response object:', response);
    console.log('Response user.role:', response.user.role);
    console.log('=== DEBUG LOGIN END ===');

    return res.json(response);
  } catch (err) {
    console.error('❌ Login DB error:', err);
    return res.status(500).send('Internal server error');
  }
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Debug server running on port ${PORT}`);
  
  // Test the login
  const testLogin = async () => {
    try {
      const response = await fetch(`http://localhost:${PORT}/debug-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'clothaura', password: '123' })
      });
      
      const data = await response.json();
      console.log('Final response:', data);
      
      process.exit(0);
    } catch (err) {
      console.error('Test failed:', err);
      process.exit(1);
    }
  };
  
  setTimeout(testLogin, 1000);
});
