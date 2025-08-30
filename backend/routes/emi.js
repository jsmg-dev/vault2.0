// routes/emi.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // PostgreSQL client

// Example: get customers with EMI due in next 5 days
router.get('/next', async (req, res) => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const future = new Date();
    future.setDate(future.getDate() + 5);
    const futureStr = future.toISOString().split('T')[0];

    const query = `
      SELECT c.id, c.name, c.contact_number, l.next_emi_date
      FROM customers c
      JOIN loans l ON c.id = l.customer_id
      WHERE l.next_emi_date BETWEEN $1 AND $2
      ORDER BY l.next_emi_date ASC
    `;

    const { rows } = await db.query(query, [todayStr, futureStr]);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching EMI data:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
