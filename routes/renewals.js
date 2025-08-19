// routes/renewals.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Add a renewal record
router.post('/add', (req, res) => {
  const { customer_id, renewal_date, renewed_amount } = req.body;

  const query = `
    INSERT INTO renewals (customer_id, renewal_date, renewed_amount)
    VALUES (?, ?, ?)
  `;

  db.run(query, [customer_id, renewal_date, renewed_amount], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: 'Loan renewed successfully', renewalId: this.lastID });
  });
});

// Get all renewal records
router.get('/list', (req, res) => {
  db.all('SELECT * FROM renewals', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;
