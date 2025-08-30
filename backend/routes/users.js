// routes/users.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // PostgreSQL pool

// ✅ Create a new user (form or API)
router.post('/create', async (req, res) => {
  const { name, username, password, role } = req.body;

  if (!name || !username || !password || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Check for duplicate username
    const existingUser = await db.query(`SELECT * FROM users WHERE username = $1`, [username]);

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // Insert the new user
    const insertQuery = `
      INSERT INTO users (name, username, password, role)
      VALUES ($1, $2, $3, $4) RETURNING id
    `;
    const result = await db.query(insertQuery, [name, username, password, role]);

    const isForm = req.headers['content-type']?.includes('application/x-www-form-urlencoded');
    if (isForm) {
      return res.redirect('/pages/user-management.html');
    }

    res.status(201).json({
      message: 'User created successfully',
      userId: result.rows[0].id
    });
  } catch (err) {
    console.error('Error creating user:', err.message);
    res.status(500).json({ error: 'Database error: ' + err.message });
  }
});

// ✅ List all users (only for admins)
router.get('/list', async (req, res) => {
  const userRole = req.session?.userRole;


  try {
    const result = await db.query(`SELECT id, name, username, role FROM users`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Delete a user by ID
router.delete('/delete/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    const result = await db.query(`DELETE FROM users WHERE id = $1 RETURNING id`, [userId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully', deletedId: userId });
  } catch (err) {
    console.error('Error deleting user:', err.message);
    res.status(500).json({ error: 'Failed to delete user: ' + err.message });
  }
});

module.exports = router;
