const express = require("express");
const router = express.Router();
const pool = require("../db");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// =============================
// Configure multer for file uploads
// =============================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/customers');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// =============================
// Get all customers
// =============================
router.get("/list", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM customers ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching customers:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// =============================
// Serve uploaded files
// =============================
router.get("/files/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads/customers', filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// =============================
// Add a new customer
// =============================

router.post('/create', upload.fields([
  { name: 'customerphoto', maxCount: 10 },
  { name: 'customerdocument', maxCount: 10 }
]), async (req, res) => {
  try {
    let {
      customer_code,
      name,
      contact_no,
      alt_contact_no,
      start_date,
      end_date,
      loan_duration,
      loan_amount,
      file_charge,
      agent_fee,
      emi,
      advance_days,
      amount_after_deduction,
      agent_commission,
      status,
      loan_type,
      remark
    } = req.body;

    // Convert empty strings to null for numeric and date fields
    start_date = start_date || null;
    end_date = end_date || null;
    loan_duration = loan_duration ? Number(loan_duration) : null;
    loan_amount = loan_amount ? Number(loan_amount) : null;
    file_charge = file_charge ? Number(file_charge) : null;
    agent_fee = agent_fee ? Number(agent_fee) : null;
    emi = emi ? Number(emi) : null;
    advance_days = advance_days ? Number(advance_days) : null;
    amount_after_deduction = amount_after_deduction ? Number(amount_after_deduction) : null;
    agent_commission = agent_commission ? Number(agent_commission) : null;

    // Handle file uploads
    let photoPaths = null;
    let documentPaths = null;

    if (req.files) {
      // Process photos
      if (req.files.customerphoto && req.files.customerphoto.length > 0) {
        photoPaths = req.files.customerphoto.map(file => file.filename).join(',');
      }
      
      // Process documents
      if (req.files.customerdocument && req.files.customerdocument.length > 0) {
        documentPaths = req.files.customerdocument.map(file => file.filename).join(',');
      }
    }

    const query = `
      INSERT INTO customers (
        customer_code, name, contact_no, alt_contact_no, start_date, end_date, loan_duration,
        loan_amount, file_charge, agent_fee, emi, advance_days, amount_after_deduction,
        agent_commission, status, loan_type, remark, photo_path, document_path
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19
      )
      RETURNING *;
    `;

    const values = [
      customer_code,
      name,
      contact_no,
      alt_contact_no,
      start_date,
      end_date,
      loan_duration,
      loan_amount,
      file_charge,
      agent_fee,
      emi,
      advance_days,
      amount_after_deduction,
      agent_commission,
      status,
      loan_type || 'Personal Loan',
      remark,
      photoPaths,
      documentPaths
    ];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding customer:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// =============================
// Get single customer by ID
// =============================
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT * FROM customers WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching customer:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// =============================
// Update customer
// =============================
router.put("/update/:id", upload.fields([
  { name: 'customerphoto', maxCount: 10 },
  { name: 'customerdocument', maxCount: 10 }
]), async (req, res) => {
  try {
    const { id } = req.params;

    // Extract all supported fields
    let {
      customer_code,
      name,
      contact_no,
      alt_contact_no,
      start_date,
      end_date,
      loan_duration,
      loan_amount,
      file_charge,
      agent_fee,
      emi,
      advance_days,
      amount_after_deduction,
      agent_commission,
      status,
      loan_type,
      remark
    } = req.body;

    // Normalize types / blanks to null
    const toNull = (v) => (v === undefined || v === null || v === '' ? null : v);
    const toNum = (v) => (v === undefined || v === null || v === '' ? null : Number(v));

    start_date = toNull(start_date);
    end_date = toNull(end_date);
    loan_duration = toNum(loan_duration);
    loan_amount = toNum(loan_amount);
    file_charge = toNum(file_charge);
    agent_fee = toNum(agent_fee);
    emi = toNum(emi);
    advance_days = toNum(advance_days);
    amount_after_deduction = toNum(amount_after_deduction);
    agent_commission = toNum(agent_commission);

    // Handle file uploads
    let photoPaths = null;
    let documentPaths = null;

    // Get existing file paths from request body
    const existingPhotoPaths = req.body.existing_photo_paths || '';
    const existingDocumentPaths = req.body.existing_document_paths || '';

    if (req.files) {
      // Process photos
      if (req.files.customerphoto && req.files.customerphoto.length > 0) {
        const newPhotoPaths = req.files.customerphoto.map(file => file.filename);
        photoPaths = existingPhotoPaths ? 
          existingPhotoPaths + ',' + newPhotoPaths.join(',') : 
          newPhotoPaths.join(',');
      } else {
        photoPaths = existingPhotoPaths;
      }
      
      // Process documents
      if (req.files.customerdocument && req.files.customerdocument.length > 0) {
        const newDocumentPaths = req.files.customerdocument.map(file => file.filename);
        documentPaths = existingDocumentPaths ? 
          existingDocumentPaths + ',' + newDocumentPaths.join(',') : 
          newDocumentPaths.join(',');
      } else {
        documentPaths = existingDocumentPaths;
      }
    } else {
      photoPaths = existingPhotoPaths;
      documentPaths = existingDocumentPaths;
    }

    // Build dynamic query based on whether files are uploaded
    let query, values;
    
    if (photoPaths || documentPaths) {
      // Update with files
      query = `
        UPDATE customers SET
          customer_code = $1,
          name = $2,
          contact_no = $3,
          alt_contact_no = $4,
          start_date = $5,
          end_date = $6,
          loan_duration = $7,
          loan_amount = $8,
          file_charge = $9,
          agent_fee = $10,
          emi = $11,
          advance_days = $12,
          amount_after_deduction = $13,
          agent_commission = $14,
          status = $15,
          loan_type = $16,
          remark = $17,
          photo_path = COALESCE($18, photo_path),
          document_path = COALESCE($19, document_path)
        WHERE id = $20
        RETURNING *;
      `;
      
      values = [
        toNull(customer_code),
        toNull(name),
        toNull(contact_no),
        toNull(alt_contact_no),
        start_date,
        end_date,
        loan_duration,
        loan_amount,
        file_charge,
        agent_fee,
        emi,
        advance_days,
        amount_after_deduction,
        agent_commission,
        toNull(status),
        toNull(loan_type) || 'Personal Loan',
        toNull(remark),
        photoPaths,
        documentPaths,
        id
      ];
    } else {
      // Update without files
      query = `
        UPDATE customers SET
          customer_code = $1,
          name = $2,
          contact_no = $3,
          alt_contact_no = $4,
          start_date = $5,
          end_date = $6,
          loan_duration = $7,
          loan_amount = $8,
          file_charge = $9,
          agent_fee = $10,
          emi = $11,
          advance_days = $12,
          amount_after_deduction = $13,
          agent_commission = $14,
          status = $15,
          loan_type = $16,
          remark = $17
        WHERE id = $18
        RETURNING *;
      `;
      
      values = [
        toNull(customer_code),
        toNull(name),
        toNull(contact_no),
        toNull(alt_contact_no),
        start_date,
        end_date,
        loan_duration,
        loan_amount,
        file_charge,
        agent_fee,
        emi,
        advance_days,
        amount_after_deduction,
        agent_commission,
        toNull(status),
        toNull(loan_type) || 'Personal Loan',
        toNull(remark),
        id
      ];
    }

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating customer:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// =============================
// Delete customer
// =============================
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM customers WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json({ message: "Customer deleted successfully" });
  } catch (err) {
    console.error("Error deleting customer:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
