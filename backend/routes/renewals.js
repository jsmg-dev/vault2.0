// routes/renewals.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Add a renewal record
router.post('/add', async (req, res) => {
  const { customer_id, renewal_date, renewed_amount } = req.body;

  const query = `
    INSERT INTO renewals (customer_id, renewal_date, renewed_amount)
    VALUES ($1, $2, $3)
    RETURNING id
  `;

  try {
    const result = await db.query(query, [customer_id, renewal_date, renewed_amount]);
    res.status(201).json({
      message: 'Loan renewed successfully',
      renewalId: result.rows[0].id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all renewal records
router.get('/list', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM renewals');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
