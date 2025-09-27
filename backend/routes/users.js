// routes/users.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const db = require('../db'); // PostgreSQL pool

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/profile');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `profile-${req.params.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// ✅ Create a new user (form or API)
router.post('/create', async (req, res) => {
  const { name, username, password, role, status } = req.body;

  if (!name || !username || !password || !role) {
    return res.status(400).json({ error: 'Name, username, password, and role are required' });
  }

  try {
    // Check for duplicate username
    const existingUser = await db.query(
      `SELECT * FROM users WHERE username = $1`,
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // Insert the new user
    const insertQuery = `
      INSERT INTO users (name, username, password, role, status)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `;

    const result = await db.query(insertQuery, [
      name,
      username,
      password,
      role,
      status || 'active'   // ✅ default to active if not provided
    ]);

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

// ✅ Update user
router.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let { name, username, password, role, status } = req.body;

    const toNull = (v) =>
      v === undefined || v === null || v === '' ? null : v;

    const query = `
      UPDATE users SET
        name = $1,
        username = $2,
        password = $3,
        role = $4,
        status = $5
      WHERE id = $6
      RETURNING *;
    `;

    const values = [
      toNull(name),
      toNull(username),
      toNull(password),
      toNull(role),
      toNull(status),
      id
    ];

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ List users (return all fields except password if sensitive)
router.get('/list', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, username, role, status, email, phone, address, profile_pic, created_at, last_login FROM users`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Delete user
router.delete('/delete/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    const result = await db.query(
      `DELETE FROM users WHERE id = $1 RETURNING id`,
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully', deletedId: userId });
  } catch (err) {
    console.error('Error deleting user:', err.message);
    res.status(500).json({ error: 'Failed to delete user: ' + err.message });
  }
});

// ✅ Get user profile
router.get('/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT id, name, username, role, email, phone, address, created_at, last_login
      FROM users 
      WHERE id = $1
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Error fetching user profile:', err.message);
    res.status(500).json({ error: 'Database error: ' + err.message });
  }
});

// ✅ Update user profile
router.put('/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, username, email, phone, address } = req.body;

    const toNull = (v) =>
      v === undefined || v === null || v === '' ? null : v;

    const query = `
      UPDATE users SET
        name = $1,
        username = $2,
        email = $3,
        phone = $4,
        address = $5
      WHERE id = $6
      RETURNING id, name, username, role, email, phone, address, created_at, last_login
    `;

    const result = await db.query(query, [
      toNull(name),
      toNull(username),
      toNull(email),
      toNull(phone),
      toNull(address),
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating profile:', err.message);
    res.status(500).json({ error: 'Database error: ' + err.message });
  }
});

// Upload profile picture
router.post('/upload-profile-pic/:id', upload.single('profile_pic'), async (req, res) => {
  try {
    const userId = req.params.id;
    console.log('Upload request for user ID:', userId);
    console.log('Request file:', req.file);
    
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File uploaded successfully:', req.file.filename);

    // Update user record with profile picture filename
    const updateQuery = `
      UPDATE users 
      SET profile_pic = $1 
      WHERE id = $2 
      RETURNING profile_pic
    `;
    
    console.log('Updating user record with filename:', req.file.filename);
    const result = await db.query(updateQuery, [req.file.filename, userId]);
    console.log('Database update result:', result.rows);
    
    if (result.rows.length === 0) {
      console.log('User not found, deleting uploaded file');
      // Delete uploaded file if user not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Profile picture uploaded successfully');
    res.json({
      message: 'Profile picture uploaded successfully',
      filename: result.rows[0].profile_pic
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    
    // Delete uploaded file on error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError);
      }
    }
    
    res.status(500).json({ error: 'Failed to upload profile picture: ' + error.message });
  }
});

module.exports = router;
