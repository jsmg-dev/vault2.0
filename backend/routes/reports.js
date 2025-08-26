const express = require("express");
const router = express.Router();
const db = require("../db");
const { Parser } = require("json2csv");

// 📌 Fetch reports (Customer / Deposit / EMI)
router.get("/generate", (req, res) => {
  const { type, start, end } = req.query;

  if (!type || !start || !end) {
    return res
      .status(400)
      .json({ error: "Missing required query parameters" });
  }

  if (type === "customer") {
    // Customer details report
    const query = `
      SELECT id, customer_code, name, contact_no, start_date, end_date, loan_amount, status
      FROM customers
      WHERE DATE(start_date) BETWEEN ? AND ?
      ORDER BY start_date ASC
    `;

    db.all(query, [start, end], (err, rows) => {
      if (err) {
        console.error("❌ DB error fetching customer reports:", err.message);
        return res.status(500).json({ error: "Failed to fetch customer report" });
      }
      res.json(rows);
    });

  } else if (type === "deposit") {
    // Deposit report
    const query = `
      SELECT 
        c.customer_code, 
        c.name AS customer_name, 
        IFNULL(SUM(d.amount), 0) AS total_deposit,
        MAX(d.date) AS last_deposit_date
      FROM customers c
      LEFT JOIN deposits d ON c.customer_code = d.customer_code
      WHERE DATE(d.date) <= ?
      GROUP BY c.customer_code, c.name
      ORDER BY c.customer_code
    `;

    db.all(query, [end], (err, rows) => {
      if (err) {
        console.error("❌ DB error fetching deposit reports:", err.message);
        return res.status(500).json({ error: "Failed to fetch deposit report" });
      }
      res.json(rows);
    });

  } else if (type === "emi") {
    // Next EMI report (loan amount comes from deposits)
    const query = `
      SELECT 
        c.customer_code,
        c.name AS customer_name,
        c.start_date,
        c.emi,
        IFNULL(SUM(d.amount), 0) AS total_deposit
      FROM customers c
      LEFT JOIN deposits d ON c.customer_code = d.customer_code
      WHERE c.status = 'active'
        AND DATE(c.start_date) BETWEEN DATE(?) AND DATE(?)
      GROUP BY c.customer_code, c.name, c.start_date, c.emi
    `;

    db.all(query, [start, end], (err, rows) => {
      if (err) {
        console.error("❌ DB error fetching EMI reports:", err.message);
        return res.status(500).json({ error: "Failed to fetch EMI report" });
      }

      const result = rows.map((r) => {
        const total = r.total_deposit;
        const emi = r.emi;
        const count = emi > 0 ? Math.floor(total / emi) : 0;

        let nextDate = null;
        if (r.start_date) {
          nextDate = new Date(r.start_date);
          nextDate.setMonth(nextDate.getMonth() + count); // EMI assumed monthly
          nextDate = nextDate.toISOString().split("T")[0];
        }

        return {
          customer_name: r.customer_name,
          total_deposit: total,
          emi: emi,
          next_emi_date: nextDate,
        };
      });

      res.json(result);
    });

  } else {
    res.status(400).json({ error: "Unsupported report type" });
  }
});

// 📌 Export reports as CSV (Customer / Deposit / EMI)
router.get("/export", (req, res) => {
  const { type, start, end } = req.query;

  if (!type || !start || !end) {
    return res
      .status(400)
      .json({ error: "Missing required query parameters" });
  }

  let query;
  if (type === "customer") {
    query = `
      SELECT id, customer_code, name, contact_no, start_date, end_date, loan_amount, status
      FROM customers
      WHERE DATE(start_date) BETWEEN ? AND ?
      ORDER BY start_date ASC
    `;
  } else if (type === "deposit") {
    query = `
      SELECT 
        c.customer_code, 
        c.name AS customer_name, 
        IFNULL(SUM(d.amount), 0) AS total_deposit,
        MAX(d.date) AS last_deposit_date
      FROM customers c
      LEFT JOIN deposits d ON c.customer_code = d.customer_code
      WHERE DATE(d.date) <= ?
      GROUP BY c.customer_code, c.name
      ORDER BY c.customer_code
    `;
  } else if (type === "emi") {
    query = `
      SELECT 
        c.customer_code,
        c.name AS customer_name,
        c.start_date,
        c.emi,
        IFNULL(SUM(d.amount), 0) AS total_deposit
      FROM customers c
      LEFT JOIN deposits d ON c.customer_code = d.customer_code
      WHERE c.status = 'active'
        AND DATE(c.start_date) BETWEEN DATE(?) AND DATE(?)
      GROUP BY c.customer_code, c.name, c.start_date, c.emi
    `;
  } else {
    return res
      .status(400)
      .json({ error: "Unsupported report type for export" });
  }

  db.all(query, type === "deposit" ? [end] : [start, end], (err, rows) => {
    if (err) {
      console.error(`❌ DB error exporting ${type} report:`, err.message);
      return res.status(500).json({ error: `Failed to export ${type} report` });
    }

    let result = rows;

    if (type === "emi") {
      result = rows.map((r) => {
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
    const csv = parser.parse(result);

    res.header("Content-Type", "text/csv");
    res.attachment(`${type}_report.csv`);
    res.send(csv);
  });
});

// 📌 New: EMI Due Notifications
router.get("/emi/notifications", (req, res) => {
  const today = new Date().toISOString().split("T")[0];

  const query = `
    SELECT 
      c.customer_code,
      c.name AS customer_name,
      c.start_date,
      c.emi,
      IFNULL(SUM(d.amount), 0) AS total_deposit
    FROM customers c
    LEFT JOIN deposits d ON c.customer_code = d.customer_code
    WHERE c.status = 'active'
    GROUP BY c.customer_code, c.name, c.start_date, c.emi
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("❌ DB error fetching EMI notifications:", err.message);
      return res.status(500).json({ error: "Failed to fetch EMI notifications" });
    }

    const notifications = [];

    rows.forEach((r) => {
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
  });
});

module.exports = router;
