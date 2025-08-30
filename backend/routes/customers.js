const express = require("express");
const router = express.Router();
const pool = require("../db");
const multer = require('multer');

// =============================
// Get all customers
// =============================
router.get("/list", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM customers");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching customers:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// =============================
// Add a new customer
// =============================
const upload = multer();

router.post('/create', upload.none(), async (req, res) => {
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

    const query = `
      INSERT INTO customers (
        customer_code, name, contact_no, alt_contact_no, start_date, end_date, loan_duration,
        loan_amount, file_charge, agent_fee, emi, advance_days, amount_after_deduction,
        agent_commission, status, remark
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16
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
      remark
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
router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    const result = await pool.query(
      "UPDATE customers SET name = $1, email = $2 WHERE id = $3 RETURNING *",
      [name, email, id]
    );

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
