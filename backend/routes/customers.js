const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const db = require('../db');
// 🔧 Helper Functions
function calculateEndDate(startDate, days = 100) {
  const d = new Date(startDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function calculateAmountAfterDeduction(loan_amount, file_charge, agent_fee, emi, advance_days) {
  return loan_amount - file_charge - agent_fee - (emi * advance_days);
}

// ✅ Create a new customer
router.post('/create', express.json(), (req, res) => {
  let {
    customer_code, name, contact_no, alt_contact_no,
    start_date, end_date, loan_duration, loan_amount,
    file_charge, agent_fee, emi, advance_days,
    amount_after_deduction, agent_commission, status, remark
  } = req.body;

  // Validate required fields
  if (!customer_code || !name || !contact_no || !start_date || !loan_duration || !loan_amount) {
    return res.status(400).json({ error: 'Required fields are missing' });
  }

  // Parse numeric values
  loan_amount = parseFloat(loan_amount) || 0;
  file_charge = parseFloat(file_charge) || 0;
  agent_fee = parseFloat(agent_fee) || 0;
  emi = parseFloat(emi) || 0;
  advance_days = parseInt(advance_days) || 0;
  amount_after_deduction = parseFloat(amount_after_deduction) || 0;
  agent_commission = parseFloat(agent_commission) || 0;
  loan_duration = parseInt(loan_duration) || 0;

  if (!end_date) {
    end_date = calculateEndDate(start_date);
  }

  if (!amount_after_deduction || amount_after_deduction === 0) {
    amount_after_deduction = calculateAmountAfterDeduction(
      loan_amount, file_charge, agent_fee, emi, advance_days
    );
  }

  const query = `
    INSERT INTO customers (
      customer_code, name, contact_no, alt_contact_no,
      start_date, end_date, loan_duration, loan_amount,
      file_charge, agent_fee, emi, advance_days,
      amount_after_deduction, agent_commission, status, remark
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    customer_code, name, contact_no, alt_contact_no || '',
    start_date, end_date, loan_duration, loan_amount,
    file_charge, agent_fee, emi, advance_days,
    amount_after_deduction, agent_commission,
    status || 'active', remark || ''
  ];

  db.run(query, params, function (err) {
    if (err) {
      console.error('❌ Error inserting customer:', err.message);
      return res.status(500).json({ error: 'Failed to create customer' });
    }
    res.status(201).json({ message: 'Customer created successfully', customerId: this.lastID });
  });
});

// ✅ Get customer list for display
router.get('/list', (req, res) => {
  db.all(`
    SELECT id, customer_code, name, contact_no,
           start_date, end_date, loan_duration,
           loan_amount, amount_after_deduction, status
    FROM customers
    ORDER BY start_date DESC
  `, [], (err, rows) => {
    if (err) {
      console.error('❌ Error fetching customers:', err.message);
      return res.status(500).json({ error: 'Failed to fetch customers' });
    }
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(rows);
  });
});

// ✅ Download customer template Excel
router.get('/template', (req, res) => {
  const filePath = path.join(__dirname, '../template/customer-template.xlsx');
  res.download(filePath, 'customer-template.xlsx');
});

// ✅ Upload and import Excel file
const upload = multer({ dest: 'uploads/' });

router.post('/upload-excel', upload.single('excel'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const insertStmt = db.prepare(`
      INSERT INTO customers (
        customer_code, name, contact_no, alt_contact_no,
        start_date, end_date, loan_duration, loan_amount,
        file_charge, agent_fee, emi, advance_days,
        amount_after_deduction, agent_commission, status, remark
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      for (const row of data) {
        try {
          insertStmt.run([
            row.customer_code || '',
            row.name || '',
            row.contact_no || '',
            row.alt_contact_no || '',
            row.start_date || '',
            row.end_date || calculateEndDate(row.start_date),
            parseInt(row.loan_duration) || 0,
            parseFloat(row.loan_amount) || 0,
            parseFloat(row.file_charge) || 0,
            parseFloat(row.agent_fee) || 0,
            parseFloat(row.emi) || 0,
            parseInt(row.advance_days) || 0,
            calculateAmountAfterDeduction(
              parseFloat(row.loan_amount) || 0,
              parseFloat(row.file_charge) || 0,
              parseFloat(row.agent_fee) || 0,
              parseFloat(row.emi) || 0,
              parseInt(row.advance_days) || 0
            ),
            parseFloat(row.agent_commission) || 0,
            row.status || 'active',
            row.remark || ''
          ]);
        } catch (err) {
          if (err.code === 'SQLITE_CONSTRAINT') {
            console.warn(`⚠️ Skipped duplicate: ${row.customer_code}`);
          } else {
            console.error('❌ DB Error:', err.message);
          }
        }
      }
      db.run('COMMIT');
    });

    insertStmt.finalize();
    fs.unlinkSync(req.file.path);
    res.json({ message: 'Customer imported successfully' });

  } catch (err) {
    console.error('❌ Excel import error:', err);
    res.status(500).json({ error: 'Failed to process Excel file' });
  }
});

// Get customer by ID (for View Customer)
router.get('/:id', (req, res) => {
  const id = req.params.id;

  db.get('SELECT * FROM customers WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Error fetching customer:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!row) return res.status(404).json({ error: 'Customer not found' });

    // Append public path for photo/document if available
    row.photo_path = row.photo_path
      ? '/uploads/' + row.photo_path
      : '';
    row.document_path = row.document_path
      ? '/uploads/' + row.document_path
      : '';

    res.json(row);
  });
});
// routes/customers.js


const sqlite3 = require('sqlite3').verbose();


// === Multer for File Uploads ===
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
// === POST: Create Customer ===
router.post('/create', upload.fields([
  { name: 'customerphoto', maxCount: 1 },
  { name: 'customerdocument', maxCount: 1 }
]), async (req, res) => {
  try {
    const { customer_code, name, contact_no, /* etc. */ } = req.body;

    const photoBuffer = req.files['customerphoto']?.[0]?.buffer || null;
    const docBuffer = req.files['customerdocument']?.[0]?.buffer || null;

    const stmt = await db.prepare(`
      INSERT INTO customers 
      (customer_code, name, contact_no, customerphoto, customerdocument) 
      VALUES (?, ?, ?, ?, ?)
    `);

    await stmt.run(customer_code, name, contact_no, photoBuffer, docBuffer);
    res.redirect('/pages/customer-list.html');
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).send('Failed to create customer');
  }
});

// === GET: All Customers ===
router.get('/list', (req, res) => {
  const query = `SELECT * FROM customers ORDER BY id DESC`;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('❌ Error fetching customers:', err.message);
      return res.status(500).json({ success: false });
    }
    res.json(rows);
  });
});

// === GET: View Single Customer by ID ===
router.get('/:id', (req, res) => {
  const id = req.params.id;
  const query = `SELECT * FROM customers WHERE id = ?`;

  db.get(query, [id], (err, row) => {
    if (err) {
      console.error('❌ Error fetching customer by ID:', err.message);
      return res.status(500).json({ success: false });
    }
    res.json(row);
  });
});
// Update customer by ID
router.post('/update/:id', async (req, res) => {
  const customerId = req.params.id;
  const {
    customer_code, name, contact_no, alt_contact_no,
    start_date, end_date, loan_duration, loan_amount,
    file_charge, agent_fee, emi, advance_days,
    amount_after_deduction, agent_commission,
    status, remark
  } = req.body;

  const sql = `
    UPDATE customers SET
      customer_code = ?, name = ?, contact_no = ?, alt_contact_no = ?,
      start_date = ?, end_date = ?, loan_duration = ?, loan_amount = ?,
      file_charge = ?, agent_fee = ?, emi = ?, advance_days = ?,
      amount_after_deduction = ?, agent_commission = ?, status = ?, remark = ?
    WHERE id = ?
  `;

  const values = [
    customer_code, name, contact_no, alt_contact_no,
    start_date, end_date, loan_duration, loan_amount,
    file_charge, agent_fee, emi, advance_days,
    amount_after_deduction, agent_commission, status, remark,
    customerId
  ];

  try {
    await db.run(sql, values);
    res.json({ success: true, message: 'Customer updated successfully' });
  } catch (err) {
    console.error('Error updating customer:', err);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});
// Get customer by ID
router.get('/get/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.get('SELECT * FROM customers WHERE id = ?', [id]);
    if (!result) return res.status(404).json({ error: 'Customer not found' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update customer
router.put('/update/:id', async (req, res) => {
  const { id } = req.params;
  const { name, father_name, village, phone, email, aadhar_no, pan_no } = req.body;

  try {
    await db.run(
      `UPDATE customers SET name = ?, father_name = ?, village = ?, phone = ?, email = ?, aadhar_no = ?, pan_no = ? WHERE id = ?`,
      [name, father_name, village, phone, email, aadhar_no, pan_no, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



module.exports = router;
