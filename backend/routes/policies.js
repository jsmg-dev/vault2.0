// routes/policies.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// === Add New Policy ===
router.post('/add', async (req, res) => {
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

  // Normalize inputs: convert empty strings to NULL and coerce numbers
  const toNull = (v) => (v === undefined || v === null || v === '' ? null : v);
  const toNum = (v) => (v === undefined || v === null || v === '' ? null : Number(v));

  const payload = {
    policy_no: toNull(policy_no),
    fullname: toNull(fullname),
    dob: toNull(dob),
    gender: toNull(gender),
    marital_status: toNull(marital_status),
    aadhaar_pan: toNull(aadhaar_pan),
    email: toNull(email),
    mobile: toNull(mobile),
    address: toNull(address),
    plan_name: toNull(plan_name),
    start_date: toNull(start_date),
    end_date: toNull(end_date),
    mode_of_payment: toNull(mode_of_payment),
    next_premium_date: toNull(next_premium_date),
    sum_assured: toNum(sum_assured),
    policy_term: toNum(policy_term),
    premium_term: toNum(premium_term),
    premium: toNum(premium),
    maturity_value: toNum(maturity_value),
    nominee_name: toNull(nominee_name),
    nominee_relation: toNull(nominee_relation),
    height_cm: toNum(height_cm),
    weight_kg: toNum(weight_kg),
    health_lifestyle: toNull(health_lifestyle),
    bank_account: toNull(bank_account),
    ifsc_code: toNull(ifsc_code),
    bank_name: toNull(bank_name),
    agent_code: toNull(agent_code),
    branch_code: toNull(branch_code),
    status: toNull(status)
  };

  const sql = `
    INSERT INTO lic_policy_details (
      policy_no, fullname, dob, gender, marital_status, aadhaar_pan, email, mobile, address,
      plan_name, start_date, end_date, mode_of_payment, next_premium_date, sum_assured,
      policy_term, premium_term, premium, maturity_value, nominee_name, nominee_relation,
      height_cm, weight_kg, health_lifestyle, bank_account, ifsc_code, bank_name,
      agent_code, branch_code, status, created_at
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
      $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
      $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,NOW()
    )
    RETURNING id;
  `;

  try {
    const result = await db.query(sql, [
      payload.policy_no, payload.fullname, payload.dob, payload.gender, payload.marital_status, payload.aadhaar_pan, payload.email, payload.mobile, payload.address,
      payload.plan_name, payload.start_date, payload.end_date, payload.mode_of_payment, payload.next_premium_date, payload.sum_assured,
      payload.policy_term, payload.premium_term, payload.premium, payload.maturity_value, payload.nominee_name, payload.nominee_relation,
      payload.height_cm, payload.weight_kg, payload.health_lifestyle, payload.bank_account, payload.ifsc_code, payload.bank_name,
      payload.agent_code, payload.branch_code, payload.status
    ]);
    res.json({ success: true, policy_id: result.rows[0].id });
  } catch (err) {
    console.error("❌ Failed to insert policy:", err.message);
    res.status(500).json({ error: "Failed to add policy" });
  }
});

// === Get All Policies ===
router.get('/list', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM lic_policy_details ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Failed to fetch policies:", err.message);
    res.status(500).json({ error: "Failed to fetch policies" });
  }
});

// === Update Policy ===
router.put('/update/:id', async (req, res) => {
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

  const toNull = (v) => (v === undefined || v === null || v === '' ? null : v);
  const toNum = (v) => (v === undefined || v === null || v === '' ? null : Number(v));
  const payload = {
    policy_no: toNull(policy_no),
    fullname: toNull(fullname),
    dob: toNull(dob),
    gender: toNull(gender),
    marital_status: toNull(marital_status),
    aadhaar_pan: toNull(aadhaar_pan),
    email: toNull(email),
    mobile: toNull(mobile),
    address: toNull(address),
    plan_name: toNull(plan_name),
    start_date: toNull(start_date),
    end_date: toNull(end_date),
    mode_of_payment: toNull(mode_of_payment),
    next_premium_date: toNull(next_premium_date),
    sum_assured: toNum(sum_assured),
    policy_term: toNum(policy_term),
    premium_term: toNum(premium_term),
    premium: toNum(premium),
    maturity_value: toNum(maturity_value),
    nominee_name: toNull(nominee_name),
    nominee_relation: toNull(nominee_relation),
    height_cm: toNum(height_cm),
    weight_kg: toNum(weight_kg),
    health_lifestyle: toNull(health_lifestyle),
    bank_account: toNull(bank_account),
    ifsc_code: toNull(ifsc_code),
    bank_name: toNull(bank_name),
    agent_code: toNull(agent_code),
    branch_code: toNull(branch_code),
    status: toNull(status)
  };

  const sql = `
    UPDATE lic_policy_details SET 
      policy_no=$1, fullname=$2, dob=$3, gender=$4, marital_status=$5,
      aadhaar_pan=$6, email=$7, mobile=$8, address=$9, plan_name=$10,
      start_date=$11, end_date=$12, mode_of_payment=$13, next_premium_date=$14,
      sum_assured=$15, policy_term=$16, premium_term=$17, premium=$18,
      maturity_value=$19, nominee_name=$20, nominee_relation=$21, height_cm=$22,
      weight_kg=$23, health_lifestyle=$24, bank_account=$25, ifsc_code=$26,
      bank_name=$27, agent_code=$28, branch_code=$29, status=$30
    WHERE id=$31
  `;

  try {
    const result = await db.query(sql, [
      payload.policy_no, payload.fullname, payload.dob, payload.gender, payload.marital_status, payload.aadhaar_pan, payload.email, payload.mobile, payload.address,
      payload.plan_name, payload.start_date, payload.end_date, payload.mode_of_payment, payload.next_premium_date, payload.sum_assured,
      payload.policy_term, payload.premium_term, payload.premium, payload.maturity_value, payload.nominee_name, payload.nominee_relation,
      payload.height_cm, payload.weight_kg, payload.health_lifestyle, payload.bank_account, payload.ifsc_code, payload.bank_name,
      payload.agent_code, payload.branch_code, payload.status, id
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Policy not found" });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Failed to update policy:", err.message);
    res.status(500).json({ error: "Failed to update policy" });
  }
});

// === Delete Policy ===
router.delete('/delete/:id', async (req, res) => {
  try {
    const result = await db.query(
      `DELETE FROM lic_policy_details WHERE id=$1`,
      [req.params.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Policy not found" });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Failed to delete policy:", err.message);
    res.status(500).json({ error: "Failed to delete policy" });
  }
});

module.exports = router;
