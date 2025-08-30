// routes/auth.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // <-- make sure this points to your db.js file

// POST /auth/login (this is just a reference, main login may be in app.js)
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === 'admin123') {
    // Save role in session
    req.session.userRole = 'admin';
    req.session.username = username;
    return res.status(200).json({ message: 'Login successful', role: 'admin' });
  }

  return res.status(401).json({ message: 'Invalid credentials' });
});

// ✅ List all users (only for admins)
router.get('/list', async (req, res) => {
  console.log('Session at /auth/list:', req.session); // Debugging log

  const userRole = req.session?.userRole;

  if (!userRole) {
    return res.status(401).json({ error: 'Unauthorized. Please login.' });
  }

  if (userRole !== 'admin') {
    return res.status(403).json({ error: 'Forbidden. Admins only.' });
  }

  try {
    const result = await db.query(`SELECT id, name, username, role FROM users`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /auth/logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/'); // Back to login page
  });
});

module.exports = router;
