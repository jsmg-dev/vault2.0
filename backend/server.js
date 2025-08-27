const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const db = require('./db');
const session = require('express-session'); // <-- IMPORT HERE
const cors = require('cors');
const app = express();
require('dotenv').config();   // <--- load .env

const port = process.env.PORT || 8080;   // <--- from .env

// CORS for Angular dev server (localhost and 127.0.0.1)
app.use(cors({
  origin: [
    'http://localhost:4200',
    'http://127.0.0.1:4200',
    'https://vaultssb.netlify.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control']
}));

// Add after bodyParser middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',  // <--- from .env
  resave: false,
  saveUninitialized: false,  // only store session if modified
  cookie: { maxAge: 60 * 60 * 1000 } // 1 hour
}));



// Expose db on app locals for legacy usage if needed
app.locals.db = db;

// === Middleware ===
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// API-only server for Angular SPA; static assets served by Angular


// === Import Routes ===
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const customerRoutes = require('./routes/customers');
const depositRoutes = require('./routes/deposits');
const reportsRoutes = require('./routes/reports');

// === Mount Routes ===
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/customers', customerRoutes);
app.use('/deposits', depositRoutes);
app.use('/reports', reportsRoutes);

// === Bootstrap: ensure users table and seed default admin ===
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT
    )
  `);
  db.get(`SELECT COUNT(*) as cnt FROM users`, [], (err, row) => {
    if (!err && row && row.cnt === 0) {
      db.run(
        `INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)`,
        ['Administrator', 'admin', 'admin123', 'admin']
      );
      console.log('Seeded default admin user: admin/admin123');
    }
  });
});

// === Login Handler ===
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const query = `SELECT * FROM users WHERE username = ? AND password = ?`;

  db.get(query, [username, password], (err, row) => {
    if (err) {
      console.error('❌ Login DB error:', err.message);
      return res.status(500).send('Internal server error');
    }

 if (row) {
      // ✅ Store user info in session
      req.session.userId = row.id;
      req.session.userRole = row.role; // important for user management grid
      req.session.username = row.username;

      return res.json({ success: true, user: { id: row.id, username: row.username, role: row.role } });
    } else {
      return res.status(401).send('Invalid username or password');
    }
  });
});
// Get total customers
app.get('/customers/count', (req, res) => {
  const query = `SELECT COUNT(*) AS total FROM customers`;
  db.get(query, [], (err, row) => {
    if (err) {
      console.error('❌ Failed to fetch total customers:', err.message);
      return res.status(500).json({ total: 0 });
    }
    res.json({ total: row.total });
  });
});

// === API: Dashboard Metrics ===
app.get('/api/customers/count', (req, res) => {
  const response = {
    totalCustomers: 0,
    totalDeposits: 0,
    activeLoans: 0,
    monthlyEarnings: 140000, // Example static value
    customersPerMonth: {},
    loanTypes: {},
    revenueTrend: {}
  };

  const customersQuery = `SELECT COUNT(*) AS totalCustomers FROM customers`;
  const depositsQuery = `SELECT SUM(amount) AS totalDeposits FROM deposits`;
  const activeLoansQuery = `SELECT COUNT(*) AS activeLoans FROM customers WHERE status = "active"`;
  const customerMonthQuery = `SELECT strftime('%m', start_date) AS month, COUNT(*) AS count FROM customers GROUP BY month`;
  const loanTypeQuery = `SELECT loan_type, COUNT(*) AS count FROM customers GROUP BY loan_type`;
  const revenueQuery = `SELECT strftime('%m', date) AS month, SUM(amount) AS total FROM deposits GROUP BY month`;

  db.get(customersQuery, [], (err, row) => {
    if (!err) response.totalCustomers = row.totalCustomers;

    db.get(depositsQuery, [], (err, row) => {
      if (!err) response.totalDeposits = row.totalDeposits || 0;

      db.get(activeLoansQuery, [], (err, row) => {
        if (!err) response.activeLoans = row.activeLoans;

        db.all(customerMonthQuery, [], (err, rows) => {
          if (!err) {
            rows.forEach(r => {
              const month = new Date(2024, parseInt(r.month) - 1).toLocaleString('default', { month: 'short' });
              response.customersPerMonth[month] = r.count;
            });
          }

          db.all(loanTypeQuery, [], (err, rows) => {
            if (!err) {
              rows.forEach(r => {
                response.loanTypes[r.loan_type] = r.count;
              });
            }

            db.all(revenueQuery, [], (err, rows) => {
              if (!err) {
                rows.forEach(r => {
                  const month = new Date(2024, parseInt(r.month) - 1).toLocaleString('default', { month: 'short' });
                  response.revenueTrend[month] = r.total;
                });
              }

              res.json(response);
            });
          });
        });
      });
    });
  });
});

// === DELETE Customer ===
app.delete('/customers/delete/:id', (req, res) => {
  const id = req.params.id;
  const query = `DELETE FROM customers WHERE id = ?`;

  db.run(query, [id], function (err) {
    if (err) {
      console.error('❌ Failed to delete customer:', err.message);
      return res.status(500).json({ message: 'Failed to delete customer' });
    }
    res.json({ success: true, deletedId: id });
  });
});

// === 404 Fallback ===
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// === Start Server ===
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
// === API: Get a customer's code (by id) ===
app.get('/api/customers/:id/code', (req, res) => {
  const { id } = req.params;
  const q = `SELECT id, name, customer_code FROM customers WHERE id = ? LIMIT 1`;

  db.get(q, [id], (err, row) => {
    if (err) {
      console.error('❌ get code error:', err.message);
      return res.status(500).json({ error: 'Failed to fetch customer code' });
    }
    if (!row) return res.status(404).json({ error: 'Customer not found' });
    res.json({ id: row.id, name: row.name, customer_code: row.customer_code });
  });
});
app.get('/reports/generate', async (req, res) => {
  const { type, start, end } = req.query;

  try {
    if (type === 'emi') {
      const sql = `
        SELECT 
            c.customer_code,
            c.name,
            c.start_date,
            c.emi,
            IFNULL(SUM(d.amount), 0) AS total_received
        FROM customers c
        LEFT JOIN deposits d 
            ON c.customer_code = d.customer_code
            AND d.date BETWEEN ? AND ?
        GROUP BY c.customer_code, c.name, c.start_date, c.emi
      `;

      const rows = await db.all(sql, [start, end]);

      const result = rows.map(r => {
        const emiCount = r.emi > 0 ? Math.floor(r.total_received / r.emi) : 0;
        let nextDate = null;

        if (r.start_date && emiCount > 0) {
          const baseDate = new Date(r.start_date);
          // ✅ as per your example: treat each EMI as +1 day
          baseDate.setDate(baseDate.getDate() + emiCount);
          nextDate = baseDate.toISOString().split('T')[0];
        }

        return {
          CustomerCode: r.customer_code,
          Name: r.name,
          StartDate: r.start_date,
          EMI: r.emi,
          TotalReceived: r.total_received,
          EMI_Count: emiCount,
          NextEMIDate: nextDate || 'N/A'
        };
      });

      return res.json(result);
    }

    // keep your existing 'customer' and 'deposit' logic
  } catch (err) {
    console.error("Report generation failed:", err);
    res.status(500).json({ error: "Report generation failed" });
  }
});
// Check EMI notifications (till date)
app.get('/emi/notifications', (req, res) => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const query = `
    SELECT c.customer_code, c.name, c.start_date, c.emi, 
           IFNULL(SUM(d.amount), 0) AS total_deposit
    FROM customers c
    LEFT JOIN deposits d ON c.customer_code = d.customer_code
    GROUP BY c.customer_code
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("❌ DB error fetching EMI notifications:", err.message);
      return res.status(500).json({ error: err.message });
    }

    const notifications = [];

    rows.forEach(row => {
      const totalDeposits = row.total_deposit || 0;
      const emiAmount = row.emi || 1;
      const startDate = new Date(row.start_date);

      // Number of EMIs already paid
      const emiCount = Math.floor(totalDeposits / emiAmount);

      // Next EMI due date = start date + emiCount months
      const nextEmiDate = new Date(startDate);
      nextEmiDate.setMonth(startDate.getMonth() + emiCount);

      const nextEmiDateStr = nextEmiDate.toISOString().split("T")[0];

      // If EMI is due today or earlier → notify
      if (nextEmiDateStr <= today) {
        notifications.push({
          customer: row.name,
          dueDate: nextEmiDateStr,
          status: "EMI Due"
        });
      }
    });

    res.json({ notifications });
  });
});

