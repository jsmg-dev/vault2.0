const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const router = express.Router();

module.exports = (db) => {
  // 🔧 Helper Functions
  function calculateEndDate(startDate, days = 100) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  function calculateAmountAfterDeduction(loan_amount, file_charge, agent_fee, emi, advance_days) {
    return loan_amount - file_charge - agent_fee - (emi * advance_days);
  }

  // === Multer for File Uploads ===
  const upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
      }
    })
  });

  // ✅ Create a new customer
  router.post('/create', upload.fields([
    { name: 'customerphoto', maxCount: 1 },
    { name: 'customerdocument', maxCount: 1 }
  ]), (req, res) => {
    let {
      customer_code, name, contact_no, alt_contact_no,
      start_date, end_date, loan_duration, loan_amount,
      file_charge, agent_fee, emi, advance_days,
      amount_after_deduction, agent_commission, status, remark
    } = req.body;

    const missingFields = [];
    if (!customer_code) missingFields.push('Customer Code');
    if (!name) missingFields.push('Name');
    if (!contact_no) missingFields.push('Contact No');
    if (!start_date) missingFields.push('Start Date');
    if (!loan_duration) missingFields.push('Loan Duration');
    if (!loan_amount) missingFields.push('Loan Amount');
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

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

    const photo_path = req.files?.customerphoto ? req.files.customerphoto[0].filename : null;
    const document_path = req.files?.customerdocument ? req.files.customerdocument[0].filename : null;

    const query = `
      INSERT INTO customers (
        customer_code, name, contact_no, alt_contact_no,
        start_date, end_date, loan_duration, loan_amount,
        file_charge, agent_fee, emi, advance_days,
        amount_after_deduction, agent_commission, status, remark,
        photo_path, document_path
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    `;

    const params = [
      customer_code, name, contact_no, alt_contact_no || '',
      start_date, end_date, loan_duration, loan_amount,
      file_charge, agent_fee, emi, advance_days,
      amount_after_deduction, agent_commission,
      status || 'active', remark || '', photo_path, document_path
    ];

    db.query(query, params, (err, result) => {
      if (err) {
        console.error('❌ Error inserting customer:', err.message);
        return res.status(500).json({ error: 'Failed to create customer' });
      }
      res.status(201).json({ message: 'Customer created successfully', customerId: result.rows[0].id });
    });
  });

  // ✅ Get customer list for display
  router.get('/list', (req, res) => {
    const query = `
      SELECT id, customer_code, name, contact_no, alt_contact_no,
             start_date, end_date, loan_duration,
             loan_amount, file_charge, agent_fee, emi, advance_days,
             amount_after_deduction, agent_commission, status, remark,
             photo_path, document_path, created_at
      FROM customers
      ORDER BY start_date DESC
    `;

    db.query(query, (err, result) => {
      if (err) {
        console.error('❌ Error fetching customers:', err.message);
        return res.status(500).json({ error: 'Failed to fetch customers' });
      }
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json(result.rows);
    });
  });

  // ✅ Download customer template Excel
  router.get('/template', (req, res) => {
    const filePath = path.join(__dirname, '../template/customer-template.xlsx');
    res.download(filePath, 'customer-template.xlsx');
  });

  // ✅ Upload and import Excel file
  const excelUpload = multer({ dest: 'uploads/' });

  router.post('/upload-excel', excelUpload.single('excel'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    try {
      const workbook = xlsx.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

      const insertQuery = `
        INSERT INTO customers (
          customer_code, name, contact_no, alt_contact_no,
          start_date, end_date, loan_duration, loan_amount,
          file_charge, agent_fee, emi, advance_days,
          amount_after_deduction, agent_commission, status, remark
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `;
      
      db.query('BEGIN').then(() => {
        const promises = data.map(row => {
          const params = [
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
          ];
          return db.query(insertQuery, params).catch(err => {
            if (err.code === '23505') { // PostgreSQL unique violation error code
              console.warn(`⚠️ Skipped duplicate: ${row.customer_code}`);
              return Promise.resolve();
            }
            return Promise.reject(err);
          });
        });

        Promise.all(promises).then(() => {
          db.query('COMMIT');
          fs.unlinkSync(req.file.path);
          res.json({ message: 'Customer imported successfully' });
        }).catch(err => {
          db.query('ROLLBACK');
          console.error('❌ Excel import transaction error:', err);
          fs.unlinkSync(req.file.path);
          res.status(500).json({ error: 'Failed to process Excel file' });
        });
      });
      
    } catch (err) {
      console.error('❌ Excel import error:', err);
      res.status(500).json({ error: 'Failed to process Excel file' });
    }
  });

  // Get customer by ID (for View Customer)
  router.get('/:id', (req, res) => {
    const id = req.params.id;
    db.query('SELECT * FROM customers WHERE id = $1', [id], (err, result) => {
      if (err) {
        console.error('Error fetching customer:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      const row = result.rows[0];
      if (!row) return res.status(404).json({ error: 'Customer not found' });

      row.photo_path = row.photo_path
        ? '/uploads/' + row.photo_path
        : '';
      row.document_path = row.document_path
        ? '/uploads/' + row.document_path
        : '';

      res.json(row);
    });
  });

  // Update customer by ID
  router.put('/update/:id', (req, res) => {
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
        customer_code = $1, name = $2, contact_no = $3, alt_contact_no = $4,
        start_date = $5, end_date = $6, loan_duration = $7, loan_amount = $8,
        file_charge = $9, agent_fee = $10, emi = $11, advance_days = $12,
        amount_after_deduction = $13, agent_commission = $14, status = $15, remark = $16
      WHERE id = $17
    `;

    const values = [
      customer_code, name, contact_no, alt_contact_no,
      start_date, end_date, loan_duration, loan_amount,
      file_charge, agent_fee, emi, advance_days,
      amount_after_deduction, agent_commission, status, remark,
      customerId
    ];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('Error updating customer:', err);
        return res.status(500).json({ error: 'Failed to update customer' });
      }
      res.json({ success: true, message: 'Customer updated successfully' });
    });
  });

  // Get customer by ID
  router.get('/get/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM customers WHERE id = $1', [id], (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      const row = result.rows[0];
      if (!row) return res.status(404).json({ error: 'Customer not found' });
      res.json(row);
    });
  });

  return router;
};