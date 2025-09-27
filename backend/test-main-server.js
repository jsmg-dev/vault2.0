const express = require('express');
const session = require('express-session');
const cors = require('cors');
const db = require('./db');
const config = require('./config');

const app = express();

// Use the exact same configuration as the main server
app.use(
  cors({
    origin: ['http://localhost:4200', 'http://localhost:4201', 'http://127.0.0.1:4200', 'https://vaultssb.netlify.app', /^http:\/\/192\.168\.\d+\.\d+:4200$/, /^http:\/\/10\.\d+\.\d+\.\d+:4200$/],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Cache-Control'],
  })
);

app.use(session(config.session));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Test login endpoint with exact same code as main server
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('=== MAIN SERVER LOGIN TEST ===');
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
    
    const role = row.role || "";
    console.log('Role variable:', role);
    console.log('Role type:', typeof role);
    
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
    
    const response = { success: true, user: { ...row, role: req.session.userRole } };
    console.log('Response object:', response);
    console.log('Response user.role:', response.user.role);
    console.log('=== MAIN SERVER LOGIN TEST END ===');

    return res.json(response);
  } catch (err) {
    console.error('❌ Login DB error:', err);
    return res.status(500).send('Internal server error');
  }
});

const PORT = 3003;
app.listen(PORT, () => {
  console.log(`Main server test running on port ${PORT}`);
  
  // Test the login
  const testLogin = async () => {
    try {
      const response = await fetch(`http://localhost:${PORT}/login`, {
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
