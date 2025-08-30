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
  ]), async (req, res) => {
    try {
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
        RETURNING id;
      `;

      const params = [
        customer_code, name, contact_no, alt_contact_no || '',
        start_date, end_date, loan_duration, loan_amount,
        file_charge, agent_fee, emi, advance_days,
        amount_after_deduction, agent_commission,
        status || 'active', remark || '', photo_path, document_path
      ];

      const result = await db.query(query, params);
      res.status(201).json({ message: 'Customer created successfully', customerId: result.rows[0].id });

    } catch (err) {
      console.error('❌ Error creating customer:', err.message);
      res.status(500).json({ error: 'Failed to create customer', details: err.message });
    }
  });

  // ✅ Get customer list for display
  router.get('/list', async (req, res) => {
    try {
      const query = `
        SELECT id, customer_code, name, contact_no, alt_contact_no,
               start_date, end_date, loan_duration,
               loan_amount, file_charge, agent_fee, emi, advance_days,
               amount_after_deduction, agent_commission, status, remark,
               photo_path, document_path, created_at
        FROM customers
        ORDER BY start_date DESC
      `;
      const result = await db.query(query);
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json(result.rows);
    } catch (err) {
      console.error('❌ Error fetching customers:', err.message);
      res.status(500).json({ error: 'Failed to fetch customers', details: err.message });
    }
  });
  
  // The rest of the file remains the same...
  // ...
  return router;
};