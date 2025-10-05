// routes/reports.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const { Parser } = require("json2csv");

// 📌 Fetch reports (Customer / Deposit / EMI)
router.get("/generate", async (req, res) => {
  const { type, start, end, customer_id } = req.query;

  if (!type || !start || !end) {
    return res.status(400).json({ error: "Missing required query parameters" });
  }

  try {
    let result;

    if (type === "customer") {
      const query = `
        SELECT id, customer_code, name, contact_no, start_date, end_date, loan_amount, status
        FROM customers
        WHERE start_date::date BETWEEN $1 AND $2
        ORDER BY start_date ASC
      `;
      result = await db.query(query, [start, end]);
    } else if (type === "deposit") {
      let query = `
        SELECT 
          c.customer_code, 
          c.name AS customer_name, 
          COALESCE(SUM(d.amount), 0) AS total_deposit,
          MAX(d.date) AS last_deposit_date,
          COUNT(d.id) AS deposit_count
        FROM customers c
        LEFT JOIN deposits d ON c.customer_code = d.customer_code AND d.date::date BETWEEN $1 AND $2
      `;
      
      let params = [start, end];
      
      // Add customer filter if customer_id is provided
      if (customer_id) {
        query += ` WHERE c.id = $3`;
        params.push(parseInt(customer_id));
        console.log('Deposit report - Customer ID:', customer_id);
        console.log('Deposit report - Start Date:', start);
        console.log('Deposit report - End Date:', end);
        console.log('Deposit report - Final Query:', query);
        console.log('Deposit report - Params:', params);
      }
      
      query += `
        GROUP BY c.customer_code, c.name
        ORDER BY c.customer_code
      `;
      
      result = await db.query(query, params);
      console.log('Deposit report - Result rows:', result.rows.length);
    } else if (type === "emi") {
      const query = `
        SELECT 
          c.customer_code,
          c.name AS customer_name,
          c.start_date,
          c.emi,
          COALESCE(SUM(d.amount), 0) AS total_deposit
        FROM customers c
        LEFT JOIN deposits d ON c.customer_code = d.customer_code
        WHERE c.status = 'active'
          AND c.start_date::date BETWEEN $1 AND $2
        GROUP BY c.customer_code, c.name, c.start_date, c.emi
      `;
      result = await db.query(query, [start, end]);

      // Post-process EMI next date
      result.rows = result.rows.map((r) => {
        const total = r.total_deposit;
        const emi = r.emi;
        const count = emi > 0 ? Math.floor(total / emi) : 0;

        let nextDate = null;
        if (r.start_date) {
          nextDate = new Date(r.start_date);
          nextDate.setMonth(nextDate.getMonth() + count);
          nextDate = nextDate.toISOString().split("T")[0];
        }

        return {
          customer_name: r.customer_name,
          total_deposit: total,
          emi: emi,
          next_emi_date: nextDate,
        };
      });
    } else {
      return res.status(400).json({ error: "Unsupported report type" });
    }

    res.json(result.rows || result);
  } catch (err) {
    console.error("❌ DB error fetching reports:", err.message);
    res.status(500).json({ error: "Failed to fetch report" });
  }
});

// 📌 Export reports as CSV (Customer / Deposit / EMI)
router.get("/export", async (req, res) => {
  const { type, start, end } = req.query;

  if (!type || !start || !end) {
    return res.status(400).json({ error: "Missing required query parameters" });
  }

  try {
    let query, params;

    if (type === "customer") {
      query = `
        SELECT id, customer_code, name, contact_no, start_date, end_date, loan_amount, status
        FROM customers
        WHERE start_date::date BETWEEN $1 AND $2
        ORDER BY start_date ASC
      `;
      params = [start, end];
    } else if (type === "deposit") {
      query = `
        SELECT 
          c.customer_code, 
          c.name AS customer_name, 
          COALESCE(SUM(d.amount), 0) AS total_deposit,
          MAX(d.date) AS last_deposit_date
        FROM customers c
        LEFT JOIN deposits d ON c.customer_code = d.customer_code
        WHERE d.date::date <= $1
        GROUP BY c.customer_code, c.name
        ORDER BY c.customer_code
      `;
      params = [end];
    } else if (type === "emi") {
      query = `
        SELECT 
          c.customer_code,
          c.name AS customer_name,
          c.start_date,
          c.emi,
          COALESCE(SUM(d.amount), 0) AS total_deposit
        FROM customers c
        LEFT JOIN deposits d ON c.customer_code = d.customer_code
        WHERE c.status = 'active'
          AND c.start_date::date BETWEEN $1 AND $2
        GROUP BY c.customer_code, c.name, c.start_date, c.emi
      `;
      params = [start, end];
    } else {
      return res
        .status(400)
        .json({ error: "Unsupported report type for export" });
    }

    const result = await db.query(query, params);

    let rows = result.rows;

    if (type === "emi") {
      rows = rows.map((r) => {
        const total = r.total_deposit;
        const emi = r.emi;
        const count = emi > 0 ? Math.floor(total / emi) : 0;

        let nextDate = null;
        if (r.start_date) {
          nextDate = new Date(r.start_date);
          nextDate.setMonth(nextDate.getMonth() + count);
          nextDate = nextDate.toISOString().split("T")[0];
        }

        return {
          customer_name: r.customer_name,
          total_deposit: total,
          emi: emi,
          next_emi_date: nextDate,
        };
      });
    }

    const parser = new Parser();
    const csv = parser.parse(rows);

    res.header("Content-Type", "text/csv");
    res.attachment(`${type}_report.csv`);
    res.send(csv);
  } catch (err) {
    console.error(`❌ DB error exporting ${type} report:`, err.message);
    res.status(500).json({ error: `Failed to export ${type} report` });
  }
});

// 📌 EMI Due Notifications
router.get("/emi/notifications", async (req, res) => {
  const today = new Date().toISOString().split("T")[0];

  const query = `
    SELECT 
      c.customer_code,
      c.name AS customer_name,
      c.start_date,
      c.emi,
      COALESCE(SUM(d.amount), 0) AS total_deposit
    FROM customers c
    LEFT JOIN deposits d ON c.customer_code = d.customer_code
    WHERE c.status = 'active'
    GROUP BY c.customer_code, c.name, c.start_date, c.emi
  `;

  try {
    const result = await db.query(query);

    const notifications = [];

    result.rows.forEach((r) => {
      const emi = r.emi;
      if (!emi) return;

      const totalDeposits = r.total_deposit || 0;
      const emiPaidCount = Math.floor(totalDeposits / emi);

      const nextEmiDate = new Date(r.start_date);
      nextEmiDate.setMonth(nextEmiDate.getMonth() + emiPaidCount);
      const nextEmiDateStr = nextEmiDate.toISOString().split("T")[0];

      if (nextEmiDateStr <= today) {
        notifications.push({
          customer: r.customer_name,
          dueDate: nextEmiDateStr,
        });
      }
    });

    res.json({ notifications });
  } catch (err) {
    console.error("❌ DB error fetching EMI notifications:", err.message);
    res.status(500).json({ error: "Failed to fetch EMI notifications" });
  }
});

module.exports = router;
