// routes/auth.js
const express = require('express');
const router = express.Router();

// POST /auth/login (not used in your current app.js, but shown here as reference)
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Dummy login logic (optional, actual login is in app.js)
  if (username === 'admin' && password === 'admin123') {
    res.status(200).json({ message: 'Login successful', role: 'admin' });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// GET /auth/logout
router.get('/logout', (req, res) => {
  res.redirect('/'); // Back to login page
});

module.exports = router;
