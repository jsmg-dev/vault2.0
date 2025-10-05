const express = require("express");
const router = express.Router();
const pool = require("../db");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// =============================
// Code Generation Functions
// =============================

// Generate 6-digit alphanumeric customer code
function generateCustomerCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate 12-digit alphanumeric ID
function generateCustomerId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Check if customer code already exists
async function isCustomerCodeUnique(code) {
  try {
    const result = await pool.query('SELECT id FROM customers WHERE customer_code = $1', [code]);
    return result.rows.length === 0;
  } catch (err) {
    console.error('Error checking customer code uniqueness:', err.message);
    return false;
  }
}

// Generate unique customer code
async function generateUniqueCustomerCode() {
  let code;
  let attempts = 0;
  const maxAttempts = 100;
  
  do {
    code = generateCustomerCode();
    attempts++;
    if (attempts > maxAttempts) {
      throw new Error('Unable to generate unique customer code after maximum attempts');
    }
  } while (!(await isCustomerCodeUnique(code)));
  
  return code;
}

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
// Get all customers (filtered by user)
// =============================
router.get("/list", async (req, res) => {
  try {
    const userId = req.session.userId;
    const userRole = req.session.userRole;
    
    let query, params;
    
    if (userRole === 'admin') {
      // Admin can see all customers
      query = "SELECT * FROM customers ORDER BY created_at DESC";
      params = [];
    } else {
      // Regular users can only see their own customers
      query = "SELECT * FROM customers WHERE created_by = $1 ORDER BY created_at DESC";
      params = [userId];
    }
    
    const result = await pool.query(query, params);
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

    // Auto-generate unique customer code
    const customer_code = await generateUniqueCustomerCode();

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

    const userId = req.session.userId;
    
    // Generate unique customer ID
    const customer_id = generateCustomerId();

    const query = `
      INSERT INTO customers (
        customer_id, customer_code, name, contact_no, alt_contact_no, start_date, end_date, loan_duration,
        loan_amount, file_charge, agent_fee, emi, advance_days, amount_after_deduction,
        agent_commission, status, loan_type, remark, photo_path, document_path, created_by
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21
      )
      RETURNING *;
    `;

    const values = [
      customer_id,
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
      documentPaths,
      userId
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

    // Extract all supported fields (customer_code cannot be changed)
    let {
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
      // Update with files (customer_code cannot be changed)
      query = `
        UPDATE customers SET
          name = $1,
          contact_no = $2,
          alt_contact_no = $3,
          start_date = $4,
          end_date = $5,
          loan_duration = $6,
          loan_amount = $7,
          file_charge = $8,
          agent_fee = $9,
          emi = $10,
          advance_days = $11,
          amount_after_deduction = $12,
          agent_commission = $13,
          status = $14,
          loan_type = $15,
          remark = $16,
          photo_path = COALESCE($17, photo_path),
          document_path = COALESCE($18, document_path)
        WHERE id = $19
        RETURNING *;
      `;
      
      values = [
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
      // Update without files (customer_code cannot be changed)
      query = `
        UPDATE customers SET
          name = $1,
          contact_no = $2,
          alt_contact_no = $3,
          start_date = $4,
          end_date = $5,
          loan_duration = $6,
          loan_amount = $7,
          file_charge = $8,
          agent_fee = $9,
          emi = $10,
          advance_days = $11,
          amount_after_deduction = $12,
          agent_commission = $13,
          status = $14,
          loan_type = $15,
          remark = $16
        WHERE id = $17
        RETURNING *;
      `;
      
      values = [
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

// =============================
// LAUNDRY CUSTOMERS ROUTES
// =============================
// These are separate from loan customers and use a different table

// Get all laundry customers
router.get('/laundry/list', async (req, res) => {
  try {
    console.log('GET /customers/laundry/list called');
    const result = await pool.query(
      `SELECT * FROM laundry_customers ORDER BY created_at DESC`
    );
    console.log('Query result:', result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching laundry customers:', err.message);
    res.status(500).json({ error: 'Failed to fetch laundry customers' });
  }
});

// Delete laundry customer
router.delete('/laundry/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('DELETE /customers/laundry/delete/' + id + ' called');

    const result = await pool.query(
      'DELETE FROM laundry_customers WHERE id = $1 RETURNING *',
      [id]
    );

    console.log('Delete result:', result.rows);

    if (result.rows.length === 0) {
      console.log('Customer not found with id:', id);
      return res.status(404).json({ error: 'Laundry customer not found' });
    }

    console.log('Customer deleted successfully:', result.rows[0]);
    res.json({ message: 'Laundry customer deleted successfully' });
  } catch (err) {
    console.error('Error deleting laundry customer:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new laundry customer
router.post('/laundry/create', async (req, res) => {
  try {
    const { name, phone, email, address, notes, status } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    // Generate a simple customer_code (e.g., LC001)
    const countResult = await pool.query(`SELECT COUNT(*) FROM laundry_customers`);
    const count = parseInt(countResult.rows[0].count);
    const customer_code = `LC${String(count + 1).padStart(3, '0')}`;

    const result = await pool.query(
      `INSERT INTO laundry_customers (customer_code, name, phone, email, address, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [customer_code, name, phone, email, address, notes, status || 'active']
    );

    res.status(201).json({ message: 'Laundry customer created successfully', customer: result.rows[0] });
  } catch (err) {
    console.error('Error creating laundry customer:', err.message);
    res.status(500).json({ error: 'Failed to create laundry customer' });
  }
});

// Update laundry customer
router.put('/laundry/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address, notes, status } = req.body;

    const result = await pool.query(
      `UPDATE laundry_customers
       SET name = $1, phone = $2, email = $3, address = $4, notes = $5, status = $6, updated_at = NOW()
       WHERE id = $7 RETURNING *`,
      [name, phone, email, address, notes, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Laundry customer not found' });
    }

    res.json({ message: 'Laundry customer updated successfully', customer: result.rows[0] });
  } catch (err) {
    console.error('Error updating laundry customer:', err.message);
    res.status(500).json({ error: 'Failed to update laundry customer' });
  }
});

module.exports = router;
