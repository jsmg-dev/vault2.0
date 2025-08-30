// server.js
const express = require('express');
const path = require('path');
const session = require('express-session');
const cors = require('cors');
require('dotenv').config();

const config = require('./config');
const db = require('./db');

const authRoutes = require('./routes/auth');     // ensure these routes use Postgres too
const userRoutes = require('./routes/users');    // ensure Postgres
const customerRoutes = require('./routes/customers'); // updated file above
const depositRoutes = require('./routes/deposits');   // ensure Postgres
const reportsRoutes = require('./routes/reports');    // ensure Postgres
const policiesRoutes = require('./routes/policies');  // ensure Postgres

const app = express();
const port = config.server.port;

// CORS
app.use(
  cors({
    origin: ['http://localhost:4200', 'http://127.0.0.1:4200', 'https://vaultssb.netlify.app'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Cache-Control'],
  })
);

// Sessions (for production, use a store like connect-pg-simple)
app.use(session(config.session));

// Parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Mount routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/customers', customerRoutes);
app.use('/deposits', depositRoutes);
app.use('/reports', reportsRoutes);
app.use('/policies', policiesRoutes);

// Bootstrap users table + seed admin (Postgres)
(async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT
      );
    `);

    const countRes = await db.query(`SELECT COUNT(*)::int AS cnt FROM users;`);
    if ((countRes.rows[0]?.cnt ?? 0) === 0) {
      await db.query(
        `INSERT INTO users (name, username, password, role) VALUES ($1, $2, $3, $4)
         ON CONFLICT (username) DO NOTHING;`,
        ['Administrator', 'admin', 'admin123', 'admin']
      );
      console.log('Seeded default admin user: admin/admin123');
    }
  } catch (err) {
    console.error('❌ Bootstrap users failed:', err);
  }
})();

// Login (Postgres)
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await db.query(
      `SELECT id, name, username, role FROM users WHERE username = $1 AND password = $2 LIMIT 1;`,
      [username, password]
    );

    const row = result.rows[0];
    if (!row) return res.status(401).send('Invalid username or password');

    req.session.userId = row.id;
    req.session.userRole = row.role;
    req.session.username = row.username;

    return res.json({ success: true, user: row });
  } catch (err) {
    console.error('❌ Login DB error:', err);
    return res.status(500).send('Internal server error');
  }
});

// Total customers
app.get('/customers/count', async (req, res) => {
  try {
    const result = await db.query(`SELECT COUNT(*)::int AS total FROM customers;`);
    res.json({ total: result.rows[0].total });
  } catch (err) {
    console.error('❌ Failed to fetch total customers:', err);
    res.status(500).json({ total: 0 });
  }
});

// Dashboard metrics
app.get('/api/customers/count', async (req, res) => {
  try {
    const response = {
      totalCustomers: 0,
      totalDeposits: 0,
      activeLoans: 0,
      monthlyEarnings: 140000, // static placeholder
      customersPerMonth: {},
      loanTypes: {},
      revenueTrend: {},
    };

    const [{ rows: cRows }, { rows: dRows }, { rows: aRows }] = await Promise.all([
      db.query(`SELECT COUNT(*)::int AS totalCustomers FROM customers;`),
      db.query(`SELECT COALESCE(SUM(amount),0)::numeric AS totalDeposits FROM deposits;`),
      db.query(`SELECT COUNT(*)::int AS activeLoans FROM customers WHERE status = 'active';`),
    ]);

    response.totalCustomers = cRows[0].totalCustomers;
    response.totalDeposits = Number(dRows[0].totalDeposits || 0);
    response.activeLoans = aRows[0].activeLoans;

    const custMonth = await db.query(`
      SELECT EXTRACT(MONTH FROM start_date)::int AS month, COUNT(*)::int AS count
      FROM customers
      WHERE start_date IS NOT NULL
      GROUP BY 1
      ORDER BY 1;
    `);

    for (const r of custMonth.rows) {
      const monthName = new Date(2024, r.month - 1).toLocaleString('default', { month: 'short' });
      response.customersPerMonth[monthName] = r.count;
    }

    // If you have loan_type column; otherwise this will be empty
    const loanType = await db.query(`
      SELECT loan_type, COUNT(*)::int AS count
      FROM customers
      WHERE loan_type IS NOT NULL
      GROUP BY loan_type;
    `).catch(() => ({ rows: [] })); // ignore if column missing
    for (const r of loanType.rows) {
      response.loanTypes[r.loan_type] = r.count;
    }

    const revenue = await db.query(`
      SELECT EXTRACT(MONTH FROM date)::int AS month, SUM(amount)::numeric AS total
      FROM deposits
      WHERE date IS NOT NULL
      GROUP BY 1
      ORDER BY 1;
    `);
    for (const r of revenue.rows) {
      const monthName = new Date(2024, r.month - 1).toLocaleString('default', { month: 'short' });
      response.revenueTrend[monthName] = Number(r.total || 0);
    }

    res.json(response);
  } catch (err) {
    console.error('❌ Dashboard metrics error:', err);
    res.status(500).json({ error: 'Failed to compute metrics' });
  }
});

// DELETE customer
app.delete('/customers/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(`DELETE FROM customers WHERE id = $1;`, [id]);
    res.json({ success: true, deletedId: id });
  } catch (err) {
    console.error('❌ Failed to delete customer:', err);
    res.status(500).json({ message: 'Failed to delete customer' });
  }
});

// Get a customer's code (by id)
app.get('/api/customers/:id/code', async (req, res) => {
  try {
    const { id } = req.params;
    const row = await db.one(`SELECT id, name, customer_code FROM customers WHERE id = $1 LIMIT 1;`, [id]);
    if (!row) return res.status(404).json({ error: 'Customer not found' });
    res.json(row);
  } catch (err) {
    console.error('❌ get code error:', err);
    res.status(500).json({ error: 'Failed to fetch customer code' });
  }
});

// Reports: EMI example
app.get('/reports/generate', async (req, res) => {
  const { type, start, end } = req.query;
  try {
    if (type === 'emi') {
      const { rows } = await db.query(
        `
        SELECT 
          c.customer_code,
          c.name,
          c.start_date,
          c.emi,
          COALESCE(SUM(d.amount), 0) AS total_received
        FROM customers c
        LEFT JOIN deposits d
          ON c.customer_code = d.customer_code
          AND d.date BETWEEN $1 AND $2
        GROUP BY c.customer_code, c.name, c.start_date, c.emi
        ORDER BY c.customer_code;
        `,
        [start, end]
      );

      const result = rows.map((r) => {
        const emi = Number(r.emi || 0);
        const total = Number(r.total_received || 0);
        const emiCount = emi > 0 ? Math.floor(total / emi) : 0;

        let nextDate = null;
        if (r.start_date && emiCount > 0) {
          const base = new Date(r.start_date);
          base.setDate(base.getDate() + emiCount); // your stated rule: +1 day per EMI
          nextDate = base.toISOString().split('T')[0];
        }

        return {
          CustomerCode: r.customer_code,
          Name: r.name,
          StartDate: r.start_date,
          EMI: Number(r.emi || 0),
          TotalReceived: total,
          EMI_Count: emiCount,
          NextEMIDate: nextDate || 'N/A',
        };
      });

      return res.json(result);
    }

    // other report types go here...
    return res.status(400).json({ error: 'Unknown report type' });
  } catch (err) {
    console.error('Report generation failed:', err);
    res.status(500).json({ error: 'Report generation failed' });
  }
});

// EMI notifications (till date)
app.get('/emi/notifications', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { rows } = await db.query(`
      SELECT 
        c.customer_code,
        c.name,
        c.start_date,
        COALESCE(c.emi, 0) AS emi,
        COALESCE((
          SELECT SUM(d.amount) FROM deposits d WHERE d.customer_code = c.customer_code
        ), 0) AS total_deposit
      FROM customers c;
    `);

    const notifications = [];
    for (const row of rows) {
      const totalDeposits = Number(row.total_deposit || 0);
      const emiAmount = Number(row.emi || 1);
      const startDate = row.start_date ? new Date(row.start_date) : null;

      if (!startDate || emiAmount <= 0) continue;

      const emiCount = Math.floor(totalDeposits / emiAmount);

      const nextEmiDate = new Date(startDate);
      nextEmiDate.setMonth(startDate.getMonth() + emiCount);
      const nextEmiDateStr = nextEmiDate.toISOString().split('T')[0];

      if (nextEmiDateStr <= today) {
        notifications.push({
          customer: row.name,
          dueDate: nextEmiDateStr,
          status: 'EMI Due',
        });
      }
    }

    res.json({ notifications });
  } catch (err) {
    console.error('❌ DB error fetching EMI notifications:', err);
    res.status(500).json({ error: err.message });
  }
});

// 404
app.use((req, res) => res.status(404).send('Page not found'));

// Start
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
