const express = require('express');
const router = express.Router();
const db = require('../db'); // <-- make sure this points to your db.js file




// GET /auth/logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/'); // Back to login page
  });
});

module.exports = router;