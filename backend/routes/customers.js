const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

// CREATE CUSTOMER
router.post(
  '/create',
  upload.fields([{ name: 'photo' }, { name: 'document' }]),
  async (req, res) => {
    try {
      const {
        name,
        email,
        phone,
        start_date,
        end_date,
        amount,
        deduction,
        amount_after_deduction,
      } = req.body;

      if (!name || !email || !phone || !start_date || !amount) {
        return res
          .status(400)
          .json({ error: 'Required fields are missing' });
      }

      // Auto-calc end_date if missing
      const finalEndDate =
        end_date ||
        new Date(new Date(start_date).setFullYear(new Date(start_date).getFullYear() + 1));

      // Auto-calc deduction if not provided
      const finalAmountAfterDeduction =
        amount_after_deduction || (amount - (deduction || 0));

      const photo = req.files['photo']
        ? req.files['photo'][0].filename
        : null;
      const document = req.files['document']
        ? req.files['document'][0].filename
        : null;

      const query = `
        INSERT INTO customers 
        (name, email, phone, start_date, end_date, amount, deduction, amount_after_deduction, photo, document) 
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        RETURNING *`;

      const values = [
        name,
        email,
        phone,
        start_date,
        finalEndDate,
        amount,
        deduction || 0,
        finalAmountAfterDeduction,
        photo,
        document,
      ];

      const result = await db.query(query, values);
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('Error creating customer:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

// LIST CUSTOMERS
router.get('/list', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM customers ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// UPDATE CUSTOMER
router.put(
  '/update/:id',
  upload.fields([{ name: 'photo' }, { name: 'document' }]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        name,
        email,
        phone,
        start_date,
        end_date,
        amount,
        deduction,
        amount_after_deduction,
      } = req.body;

      const photo = req.files['photo']
        ? req.files['photo'][0].filename
        : null;
      const document = req.files['document']
        ? req.files['document'][0].filename
        : null;

      // Update query dynamically
      const query = `
        UPDATE customers SET
          name = COALESCE($1, name),
          email = COALESCE($2, email),
          phone = COALESCE($3, phone),
          start_date = COALESCE($4, start_date),
          end_date = COALESCE($5, end_date),
          amount = COALESCE($6, amount),
          deduction = COALESCE($7, deduction),
          amount_after_deduction = COALESCE($8, amount_after_deduction),
          photo = COALESCE($9, photo),
          document = COALESCE($10, document)
        WHERE id = $11
        RETURNING *`;

      const values = [
        name || null,
        email || null,
        phone || null,
        start_date || null,
        end_date || null,
        amount || null,
        deduction || null,
        amount_after_deduction || null,
        photo,
        document,
        id,
      ];

      const result = await db.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error('Error updating customer:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

// DELETE CUSTOMER
router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM customers WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ message: 'Customer deleted successfully', customer: result.rows[0] });
  } catch (err) {
    console.error('Error deleting customer:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
