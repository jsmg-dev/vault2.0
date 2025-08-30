const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');

// Ensure JSON parsing middleware is applied in main server.js/app.js:
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// Helper: format date to MM/DD/YYYY
function formatToMMDDYYYY(dateStr) {
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
  return `${mm}/${dd}/${year}`;
}

// Create deposits table if not exists
db.run(`
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

// POST: Save a new deposit
router.post('/create', (req, res) => {
  console.log('Incoming /create request body:', req.body);

  let { customer_code, customer_name, amount, penalty, date, remark } = req.body;

  if (!customer_code || !customer_name || !amount || !date) {
    return res.status(400).json({ error: 'Required fields are missing' });
  }

  // Trim & sanitize inputs
  customer_code = String(customer_code).trim();
  customer_name = String(customer_name).trim();
  amount = parseFloat(amount);
  penalty = parseFloat(penalty) || 0;

  if (isNaN(amount)) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  const formattedDate = formatToMMDDYYYY(date);
  if (!formattedDate) {
    return res.status(400).json({ error: 'Invalid date format' });
  }

  const insertQuery = `
    INSERT INTO deposits (customer_code, customer_name, amount, penalty, date, remark)
    VALUES ($1, $2, $3, $4, $5, $6)
  `;
  db.run(
    insertQuery,
    [customer_code, customer_name, amount, penalty, formattedDate, remark],
    function (err) {
      if (err) {
        console.error('Deposit insert error:', err.message, {
          customer_code,
          customer_name,
          amount,
          penalty,
          formattedDate
        });
        return res.status(500).json({ error: 'Failed to save deposit' });
      }
      res.status(201).json({ message: 'Deposit recorded', depositId: this.lastID });
    }
  );
});

// GET: List all deposits
router.get('/list', (req, res) => {
  const query = `SELECT * FROM deposits ORDER BY date DESC`;
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching deposits:', err.message);
      return res.status(500).json({ error: 'Failed to fetch deposits' });
    }
    res.json(rows);
  });
});

// PUT: Update a deposit by ID
router.put('/update/:id', (req, res) => {
  const id = req.params.id;
  let { customer_code, customer_name, amount, penalty, date, remark } = req.body;

  if (!customer_code || !customer_name || !amount || !date) {
    return res.status(400).json({ error: 'Required fields are missing' });
  }

  // Trim & sanitize inputs
  customer_code = String(customer_code).trim();
  customer_name = String(customer_name).trim();
  amount = parseFloat(amount);
  penalty = parseFloat(penalty) || 0;

  if (isNaN(amount)) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  const formattedDate = formatToMMDDYYYY(date);
  if (!formattedDate) {
    return res.status(400).json({ error: 'Invalid date format' });
  }

  const updateQuery = `
    UPDATE deposits 
    SET customer_code = $1, customer_name = $2, amount = $3, penalty = $4, date = $5, remark = $6
    WHERE id = $7
  `;
  
  db.run(
    updateQuery,
    [customer_code, customer_name, amount, penalty, formattedDate, remark, id],
    function (err) {
      if (err) {
        console.error('Deposit update error:', err.message);
        return res.status(500).json({ error: 'Failed to update deposit' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Deposit not found' });
      }
      res.json({ message: 'Deposit updated successfully' });
    }
  );
});

// DELETE: Remove a single deposit by ID
router.delete('/delete/:id', (req, res) => {
  const id = req.params.id;
  db.run(`DELETE FROM deposits WHERE id = $1`, [id], function (err) {
    if (err) {
      console.error('Delete error:', err.message);
      return res.status(500).json({ error: 'Failed to delete deposit' });
    }
    res.json({ message: `Deleted deposit ${id}`, deleted: this.changes });
  });
});

// POST: Bulk delete multiple deposit records
router.post('/delete-multiple', (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'No IDs provided for deletion.' });
  }
  const placeholders = ids.map((_, index) => `$${index + 1}`).join(',');
  const sql = `DELETE FROM deposits WHERE id IN (${placeholders})`;
  db.run(sql, ids, function (err) {
    if (err) {
      console.error('Bulk delete failed:', err.message);
      return res.status(500).json({ error: 'Failed to delete deposits.' });
    }
    res.json({ message: `Deleted ${this.changes} deposit(s).` });
  });
});

// GET: Active customers only for dropdown
router.get('/dropdown/customers', (req, res) => {
  const query = `
    SELECT id, name, customer_code 
    FROM customers 
    WHERE status = 'Active' 
    ORDER BY name ASC;
  `;
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching active customers:', err.message);
      return res.status(500).json({ error: 'Failed to fetch active customers' });
    }
    res.json(rows);
  });
});



// Excel upload endpoint
const upload = multer({ dest: 'uploads/' });
router.post('/upload-excel', upload.single('excel'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    const stmt = db.prepare(`
      INSERT INTO deposits (customer_code, customer_name, amount, penalty, date)
      VALUES (?, ?, ?, ?, ?)
    `);

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      for (const row of data) {
        const cc = String(row.customer_code || '').trim();
        const cn = String(row.customer_name || '').trim();
        const amount = parseFloat(row.amount);
        const penalty = parseFloat(row.penalty) || 0;
        const formattedDate = formatToMMDDYYYY(row.date);

        if (!cc || !cn || isNaN(amount) || !formattedDate) {
          console.warn('Skipped row due to missing/invalid data:', row);
          continue;
        }
        stmt.run(cc, cn, amount, penalty, formattedDate);
      }
      db.run('COMMIT');
    });

    stmt.finalize();
    fs.unlinkSync(req.file.path);
    res.json({ message: 'Deposits imported successfully' });

  } catch (err) {
    console.error('Excel upload error:', err.message);
    res.status(500).json({ error: 'Failed to process Excel file' });
  }
});

module.exports = router;
