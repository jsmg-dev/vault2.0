const express = require('express');
const router = express.Router();
const db = require('../db');

// === Add New Policy ===
router.post('/add', (req, res) => {
  const {
    policy_no,
    fullname,
    dob,
    gender,
    marital_status,
    aadhaar_pan,
    email,
    mobile,
    address,
    plan_name,
    start_date,
    end_date,
    mode_of_payment,
    next_premium_date,
    sum_assured,
    policy_term,
    premium_term,
    premium,
    maturity_value,
    nominee_name,
    nominee_relation,
    height_cm,
    weight_kg,
    health_lifestyle,
    bank_account,
    ifsc_code,
    bank_name,
    agent_code,
    branch_code,
    status
  } = req.body;

  const sql = `
    INSERT INTO lic_policy_details (
      policy_no, fullname, dob, gender, marital_status, aadhaar_pan, email, mobile, address,
      plan_name, start_date, end_date, mode_of_payment, next_premium_date, sum_assured,
      policy_term, premium_term, premium, maturity_value, nominee_name, nominee_relation,
      height_cm, weight_kg, health_lifestyle, bank_account, ifsc_code, bank_name,
      agent_code, branch_code, status, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, NOW())
  `;

  db.run(sql, [
    policy_no, fullname, dob, gender, marital_status, aadhaar_pan, email, mobile, address,
    plan_name, start_date, end_date, mode_of_payment, next_premium_date, sum_assured,
    policy_term, premium_term, premium, maturity_value, nominee_name, nominee_relation,
    height_cm, weight_kg, health_lifestyle, bank_account, ifsc_code, bank_name,
    agent_code, branch_code, status
  ], function(err) {
    if (err) {
      console.error("❌ Failed to insert policy:", err.message);
      return res.status(500).json({ error: "Failed to add policy" });
    }

    res.json({ success: true, policy_id: this.lastID });
  });
});

// === Get All Policies ===
router.get('/list', (req, res) => {
  db.all(`SELECT * FROM lic_policy_details ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) {
      console.error("❌ Failed to fetch policies:", err.message);
      return res.status(500).json({ error: "Failed to fetch policies" });
    }

    res.json(rows);
  });
});

// === Update Policy ===
router.put('/update/:id', (req, res) => {
  const id = req.params.id;
  const {
    policy_no,
    fullname,
    dob,
    gender,
    marital_status,
    aadhaar_pan,
    email,
    mobile,
    address,
    plan_name,
    start_date,
    end_date,
    mode_of_payment,
    next_premium_date,
    sum_assured,
    policy_term,
    premium_term,
    premium,
    maturity_value,
    nominee_name,
    nominee_relation,
    height_cm,
    weight_kg,
    health_lifestyle,
    bank_account,
    ifsc_code,
    bank_name,
    agent_code,
    branch_code,
    status
  } = req.body;

  const sql = `
    UPDATE lic_policy_details SET 
      policy_no = $1, fullname = $2, dob = $3, gender = $4, marital_status = $5,
      aadhaar_pan = $6, email = $7, mobile = $8, address = $9, plan_name = $10,
      start_date = $11, end_date = $12, mode_of_payment = $13, next_premium_date = $14,
      sum_assured = $15, policy_term = $16, premium_term = $17, premium = $18,
      maturity_value = $19, nominee_name = $20, nominee_relation = $21, height_cm = $22,
      weight_kg = $23, health_lifestyle = $24, bank_account = $25, ifsc_code = $26,
      bank_name = $27, agent_code = $28, branch_code = $29, status = $30
    WHERE id = $31
  `;

  db.run(sql, [
    policy_no, fullname, dob, gender, marital_status, aadhaar_pan, email, mobile, address,
    plan_name, start_date, end_date, mode_of_payment, next_premium_date, sum_assured,
    policy_term, premium_term, premium, maturity_value, nominee_name, nominee_relation,
    height_cm, weight_kg, health_lifestyle, bank_account, ifsc_code, bank_name,
    agent_code, branch_code, status, id
  ], function(err) {
    if (err) {
      console.error("❌ Failed to update policy:", err.message);
      return res.status(500).json({ error: "Failed to update policy" });
    }
    res.json({ success: true });
  });
});

// === Delete Policy ===
router.delete('/delete/:id', (req, res) => {
  db.run(`DELETE FROM lic_policy_details WHERE id = $1`, [req.params.id], function(err) {
    if (err) {
      console.error("❌ Failed to delete policy:", err.message);
      return res.status(500).json({ error: "Failed to delete policy" });
    }
    res.json({ success: true });
  });
});

module.exports = router;
