const express = require('express');
const router = express.Router();
const db = require('../db'); // This is your PostgreSQL pool wrapper
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');

// Helper: format date to YYYY-MM-DD for PostgreSQL
function formatToYYYYMMDD(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.includes('-') ? dateStr.split('-') : dateStr.split('/');
  let year, month, day;
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      year = parts[0];
      month = parts[1];
      day = parts[2];
    } else {
      // MM/DD/YYYY
      month = parts[0];
      day = parts[1];
      year = parts[2];
    }
  } else {
    return null;
  }
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

// Ensure deposits table exists
(async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS deposits (
      id SERIAL PRIMARY KEY,
      customer_code TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      penalty DECIMAL(10,2) DEFAULT 0,
      date DATE NOT NULL,
      remark TEXT
    )
  `);
})();

// POST: Save a new deposit
router.post('/create', async (req, res) => {
  try {
    let { customer_code, customer_name, amount, penalty, date, remark } = req.body;

    if (!customer_code || !customer_name || !amount || !date) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    amount = parseFloat(amount);
    penalty = parseFloat(penalty) || 0;
    if (isNaN(amount)) return res.status(400).json({ error: 'Invalid amount' });

    const formattedDate = formatToYYYYMMDD(date);
    if (!formattedDate) return res.status(400).json({ error: 'Invalid date format' });

    const insertQuery = `
      INSERT INTO deposits (customer_code, customer_name, amount, penalty, date, remark)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
    `;
    const result = await db.query(insertQuery, [customer_code, customer_name, amount, penalty, formattedDate, remark]);

    res.status(201).json({ message: 'Deposit recorded', depositId: result.rows[0].id });
  } catch (err) {
    console.error('Deposit insert error:', err.message);
    res.status(500).json({ error: 'Failed to save deposit' });
  }
});

// GET: List all deposits
router.get('/list', async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM deposits ORDER BY date DESC`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching deposits:', err.message);
    res.status(500).json({ error: 'Failed to fetch deposits' });
  }
});

// PUT: Update a deposit
router.put('/update/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let { customer_code, customer_name, amount, penalty, date, remark } = req.body;

    if (!customer_code || !customer_name || !amount || !date) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    amount = parseFloat(amount);
    penalty = parseFloat(penalty) || 0;
    if (isNaN(amount)) return res.status(400).json({ error: 'Invalid amount' });

    const formattedDate = formatToYYYYMMDD(date);
    if (!formattedDate) return res.status(400).json({ error: 'Invalid date format' });

    const updateQuery = `
      UPDATE deposits 
      SET customer_code = $1, customer_name = $2, amount = $3, penalty = $4, date = $5, remark = $6
      WHERE id = $7
    `;
    const result = await db.query(updateQuery, [customer_code, customer_name, amount, penalty, formattedDate, remark, id]);

    if (result.rowCount === 0) return res.status(404).json({ error: 'Deposit not found' });
    res.json({ message: 'Deposit updated successfully' });
  } catch (err) {
    console.error('Deposit update error:', err.message);
    res.status(500).json({ error: 'Failed to update deposit' });
  }
});

// DELETE: Single deposit
router.delete('/delete/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await db.query(`DELETE FROM deposits WHERE id = $1`, [id]);
    res.json({ message: `Deleted deposit ${id}`, deleted: result.rowCount });
  } catch (err) {
    console.error('Delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete deposit' });
  }
});

// POST: Bulk delete
router.post('/delete-multiple', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No IDs provided for deletion.' });
    }
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    const sql = `DELETE FROM deposits WHERE id IN (${placeholders})`;
    const result = await db.query(sql, ids);

    res.json({ message: `Deleted ${result.rowCount} deposit(s).` });
  } catch (err) {
    console.error('Bulk delete failed:', err.message);
    res.status(500).json({ error: 'Failed to delete deposits.' });
  }
});

// GET: Active customers for dropdown
router.get('/dropdown/customers', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, name, customer_code 
      FROM customers 
      WHERE status = 'Active' 
      ORDER BY name ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching active customers:', err.message);
    res.status(500).json({ error: 'Failed to fetch active customers' });
  }
});

// Excel upload
const upload = multer({ dest: 'uploads/' });
router.post('/upload-excel', upload.single('excel'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      for (const row of data) {
        const cc = String(row.customer_code || '').trim();
        const cn = String(row.customer_name || '').trim();
        const amount = parseFloat(row.amount);
        const penalty = parseFloat(row.penalty) || 0;
        const formattedDate = formatToYYYYMMDD(row.date);

        if (!cc || !cn || isNaN(amount) || !formattedDate) {
          console.warn('Skipped row due to invalid data:', row);
          continue;
        }

        await client.query(
          `INSERT INTO deposits (customer_code, customer_name, amount, penalty, date) VALUES ($1, $2, $3, $4, $5)`,
          [cc, cn, amount, penalty, formattedDate]
        );
      }

      await client.query('COMMIT');
      res.json({ message: 'Deposits imported successfully' });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Excel upload transaction error:', err.message);
      res.status(500).json({ error: 'Failed to process Excel file' });
    } finally {
      client.release();
      fs.unlinkSync(req.file.path);
    }
  } catch (err) {
    console.error('Excel upload error:', err.message);
    res.status(500).json({ error: 'Failed to process Excel file' });
  }
});

module.exports = router;
