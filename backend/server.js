// server.js
const express = require('express');
const path = require('path');
const session = require('express-session');
const cors = require('cors');
require('dotenv').config();

const config = require('./config');
const db = require('./db');
const whatsappService = require('./services/whatsapp.service');
const cron = require('node-cron');

const authRoutes = require('./routes/auth');     // ensure these routes use Postgres too
const userRoutes = require('./routes/users');    // ensure Postgres
const customerRoutes = require('./routes/customers'); // updated file above
const depositRoutes = require('./routes/deposits');   // ensure Postgres
const reportsRoutes = require('./routes/reports');    // ensure Postgres
const policiesRoutes = require('./routes/policies');  // ensure Postgres
const dashboardRoutes = require('./routes/dashboard'); // new dashboard routes
const laundryCustomerRoutes = require('./routes/laundry-customers'); // new laundry routes
const laundryServiceRoutes = require('./routes/laundry-services');
const whatsappConfigRoutes = require('./routes/whatsapp-config'); // new laundry service routes
const whatsappNotificationRoutes = require('./routes/whatsapp-notifications'); // new WhatsApp notification routes
const billingRoutes = require('./routes/billing'); // new billing routes
const billingConfigRoutes = require('./routes/billing-config'); // new billing configuration routes

const app = express();
const port = config.server.port;

// CORS
app.use(
  cors({
    origin: ['http://localhost:4200', 'http://localhost:4201', 'http://127.0.0.1:4200', 'https://vaultssb.netlify.app', 'https://vaultsbbf.netlify.app', /^http:\/\/192\.168\.\d+\.\d+:4200$/, /^http:\/\/10\.\d+\.\d+\.\d+:4200$/],
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

// Static file serving for uploads
app.use('/uploads', express.static('uploads'));
app.use('/uploads/profile', express.static('uploads/profile'));

// Mount routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/customers', customerRoutes);
app.use('/deposits', depositRoutes);
app.use('/reports', reportsRoutes);
app.use('/policies', policiesRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/laundry-customers', laundryCustomerRoutes);
app.use('/laundry-services', laundryServiceRoutes);
app.use('/whatsapp', whatsappConfigRoutes);
app.use('/whatsapp-notifications', whatsappNotificationRoutes);
app.use('/billing', billingRoutes);
app.use('/billing-config', billingConfigRoutes);

// Bootstrap database tables (Postgres)
(async () => {
  try {
    console.log('🔧 Creating database tables...');
    
    // Create all tables from schema.sql
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = schemaSQL.split(';').filter(stmt => stmt.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        await db.query(statement);
      }
    }
    
    console.log('✅ Database tables created successfully');

    const countRes = await db.query(`SELECT COUNT(*)::int AS cnt FROM users;`);
    if ((countRes.rows[0]?.cnt ?? 0) === 0) {
      await db.query(
        `INSERT INTO users (name, username, password, role) VALUES ($1, $2, $3, $4), ($5, $6, $7, $8)
         ON CONFLICT (username) DO NOTHING;`,
        ['Administrator', 'admin', 'admin123', 'admin', 'Akshar', 'aks', 'qwerty', 'lic']
      );
      console.log('Seeded default admin user: admin/admin123');
    }
    // Ensure base tables exist (idempotent)
    await db.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        customer_code TEXT UNIQUE,
        name TEXT,
        contact_no TEXT,
        alt_contact_no TEXT,
        start_date DATE,
        end_date DATE,
        loan_duration INTEGER,
        loan_amount DECIMAL(15,2),
        file_charge DECIMAL(10,2),
        agent_fee DECIMAL(10,2),
        emi DECIMAL(10,2),
        advance_days INTEGER,
        amount_after_deduction DECIMAL(15,2),
        agent_commission DECIMAL(10,2),
        status TEXT DEFAULT 'active',
        loan_type TEXT DEFAULT 'Personal Loan',
        remark TEXT,
        photo_path TEXT,
        document_path TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Add loan_type column if it doesn't exist (for existing tables)
    await db.query(`
      ALTER TABLE customers 
      ADD COLUMN IF NOT EXISTS loan_type TEXT DEFAULT 'Personal Loan';
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS deposits (
        id SERIAL PRIMARY KEY,
        customer_code TEXT,
        customer_name TEXT,
        amount DECIMAL(10,2),
        penalty DECIMAL(10,2) DEFAULT 0,
        date DATE,
        remark TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Ensure LIC policies table exists (idempotent)
    await db.query(`
      CREATE TABLE IF NOT EXISTS lic_policy_details (
        id SERIAL PRIMARY KEY,
        policy_no TEXT,
        fullname TEXT,
        dob DATE,
        gender TEXT,
        marital_status TEXT,
        aadhaar_pan TEXT,
        email TEXT,
        mobile TEXT,
        address TEXT,
        plan_name TEXT,
        start_date DATE,
        end_date DATE,
        mode_of_payment TEXT,
        next_premium_date DATE,
        sum_assured DECIMAL(15,2),
        policy_term INTEGER,
        premium_term INTEGER,
        premium DECIMAL(10,2),
        maturity_value DECIMAL(15,2),
        nominee_name TEXT,
        nominee_relation TEXT,
        height_cm INTEGER,
        weight_kg INTEGER,
        health_lifestyle TEXT,
        bank_account TEXT,
        ifsc_code TEXT,
        bank_name TEXT,
        agent_code TEXT,
        branch_code TEXT,
        status TEXT DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await db.query(`CREATE INDEX IF NOT EXISTS idx_policies_policy_no ON lic_policy_details(policy_no);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_policies_status ON lic_policy_details(status);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_policies_created_at ON lic_policy_details(created_at);`);

    // Add payment_status column if it doesn't exist
    await db.query(`
      ALTER TABLE lic_policy_details 
      ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'due';
    `);

    // Add last_payment_date column if it doesn't exist
    await db.query(`
      ALTER TABLE lic_policy_details 
      ADD COLUMN IF NOT EXISTS last_payment_date DATE;
    `);

    // Create laundry tables
    await db.query(`
      CREATE TABLE IF NOT EXISTS laundry_customers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        alt_phone TEXT,
        address TEXT,
        email TEXT,
        status TEXT DEFAULT 'received',
        order_date TIMESTAMP DEFAULT NOW(),
        expected_delivery_date DATE,
        delivery_date TIMESTAMP,
        items TEXT,
        service_type TEXT,
        total_amount DECIMAL(10,2),
        paid_amount DECIMAL(10,2) DEFAULT 0,
        balance_amount DECIMAL(10,2),
        special_instructions TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS laundry_services (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT,
        price DECIMAL(10,2) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create indexes for laundry tables
    await db.query(`CREATE INDEX IF NOT EXISTS idx_laundry_customers_status ON laundry_customers(status);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_laundry_customers_phone ON laundry_customers(phone);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_laundry_customers_order_date ON laundry_customers(order_date);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_laundry_services_category ON laundry_services(category);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_laundry_services_active ON laundry_services(is_active);`);

    // Seed default laundry services if table is empty
    const serviceCount = await db.query(`SELECT COUNT(*)::int AS cnt FROM laundry_services;`);
    if ((serviceCount.rows[0]?.cnt ?? 0) === 0) {
      await db.query(`
        INSERT INTO laundry_services (name, category, price, description) VALUES
        ('Wash & Iron', 'Basic', 25.00, 'Basic wash and iron service'),
        ('Dry Clean', 'Premium', 50.00, 'Dry cleaning service'),
        ('Express Wash', 'Express', 35.00, 'Same day wash and iron'),
        ('Iron Only', 'Basic', 10.00, 'Ironing service only'),
        ('Wash Only', 'Basic', 20.00, 'Washing service only'),
        ('Bleach Service', 'Special', 15.00, 'Bleaching service'),
        ('Stain Removal', 'Special', 30.00, 'Professional stain removal'),
        ('Suit Dry Clean', 'Premium', 80.00, 'Formal suit dry cleaning'),
        ('Curtain Wash', 'Special', 60.00, 'Curtain washing service'),
        ('Carpet Clean', 'Special', 100.00, 'Carpet cleaning service')
      `);
      console.log('Seeded default laundry services');
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
      `SELECT id, name, username, role, profile_pic FROM users WHERE username = $1 AND password = $2 LIMIT 1;`,
      [username, password]
    );
    console.log(result);
    const row = result.rows[0];
    if (!row) return res.status(401).send('Invalid username or password');

    const role = row.role || "";
    console.log('Original role from DB:', role);
    console.log('Role type:', typeof role);
    
    req.session.userId = row.id;
    req.session.userRole = role;
    req.session.username = row.username;
    
    console.log('Session role:', req.session.userRole);
    const user = { ...row, role: req.session.userRole }
    console.log('Final user object:', user);

    return res.json({ success: true, user: { ...row, role: req.session.userRole } });
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

// Update payment status and calculate next premium date
app.put('/api/policies/:id/payment-status', async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status } = req.body;

    if (!payment_status || !['due', 'paid'].includes(payment_status)) {
      return res.status(400).json({ error: 'Invalid payment status. Must be "due" or "paid"' });
    }

    // Get the policy details
    const policy = await db.one(`
      SELECT id, policy_no, start_date, mode_of_payment, next_premium_date, payment_status
      FROM lic_policy_details 
      WHERE id = $1
    `, [id]);

    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    let nextPremiumDate = policy.next_premium_date;
    let lastPaymentDate = null;

    // If payment status is being set to 'paid', calculate next premium date
    if (payment_status === 'paid') {
      const today = new Date();
      lastPaymentDate = today.toISOString().split('T')[0];

      // Calculate next premium date based on payment mode
      const paymentMode = (policy.mode_of_payment || '').toLowerCase();
      let baseDate = policy.next_premium_date ? new Date(policy.next_premium_date) : today;

      if (paymentMode.includes('monthly') || paymentMode.includes('month')) {
        // Add 1 month
        baseDate.setMonth(baseDate.getMonth() + 1);
      } else if (paymentMode.includes('quarterly') || paymentMode.includes('quarter')) {
        // Add 3 months
        baseDate.setMonth(baseDate.getMonth() + 3);
      } else if (paymentMode.includes('yearly') || paymentMode.includes('year') || paymentMode.includes('annual')) {
        // Add 1 year
        baseDate.setFullYear(baseDate.getFullYear() + 1);
      } else if (paymentMode.includes('half yearly') || paymentMode.includes('half-yearly')) {
        // Add 6 months
        baseDate.setMonth(baseDate.getMonth() + 6);
      } else {
        // Default to monthly if mode is unclear
        baseDate.setMonth(baseDate.getMonth() + 1);
      }

      nextPremiumDate = baseDate.toISOString().split('T')[0];
    }

    // Update the policy with new payment status and dates
    const result = await db.query(`
      UPDATE lic_policy_details 
      SET payment_status = $1, next_premium_date = $2, last_payment_date = $3
      WHERE id = $4
    `, [payment_status, nextPremiumDate, lastPaymentDate, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    res.json({ 
      success: true, 
      message: `Payment status updated to ${payment_status}`,
      next_premium_date: nextPremiumDate,
      last_payment_date: lastPaymentDate
    });

  } catch (err) {
    console.error('❌ Failed to update payment status:', err);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
});

// Get policy payment details
app.get('/api/policies/:id/payment-details', async (req, res) => {
  try {
    const { id } = req.params;

    const policy = await db.one(`
      SELECT 
        id, policy_no, fullname, start_date, mode_of_payment, 
        next_premium_date, payment_status, last_payment_date,
        premium, status
      FROM lic_policy_details 
      WHERE id = $1
    `, [id]);

    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    res.json(policy);
  } catch (err) {
    console.error('❌ Failed to fetch payment details:', err);
    res.status(500).json({ error: 'Failed to fetch payment details' });
  }
});

// Check policies with premium due today and send WhatsApp messages
app.post('/api/whatsapp/send-premium-due-notifications', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get all policies with premium due today
    const policies = await db.query(`
      SELECT 
        id, policy_no, fullname, mobile, plan_name, 
        premium, mode_of_payment, next_premium_date, status
      FROM lic_policy_details 
      WHERE next_premium_date = $1 
      AND status = 'Active'
      AND mobile IS NOT NULL 
      AND mobile != ''
    `, [today]);

    if (policies.rows.length === 0) {
      return res.json({
        success: true,
        message: 'No policies with premium due today',
        count: 0,
        notifications: []
      });
    }

    const results = [];
    
    for (const policy of policies.rows) {
      try {
        const message = whatsappService.generatePremiumDueMessage(policy);
        const result = await whatsappService.sendMessage(policy.mobile, message);
        
        results.push({
          policy_id: policy.id,
          policy_no: policy.policy_no,
          customer_name: policy.fullname,
          mobile: policy.mobile,
          success: result.success,
          messageId: result.messageId,
          error: result.error || null,
          url: result.url || null
        });
        
        // Add small delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Failed to send WhatsApp to ${policy.fullname}:`, error);
        results.push({
          policy_id: policy.id,
          policy_no: policy.policy_no,
          customer_name: policy.fullname,
          mobile: policy.mobile,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    
    res.json({
      success: true,
      message: `WhatsApp notifications sent: ${successCount}/${results.length} successful`,
      count: results.length,
      successCount: successCount,
      notifications: results
    });

  } catch (err) {
    console.error('❌ Failed to send premium due notifications:', err);
    res.status(500).json({ error: 'Failed to send notifications' });
  }
});

// Get policies with premium due today (without sending messages)
app.get('/api/policies/premium-due-today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const policies = await db.query(`
      SELECT 
        id, policy_no, fullname, mobile, plan_name, 
        premium, mode_of_payment, next_premium_date, status
      FROM lic_policy_details 
      WHERE next_premium_date = $1 
      AND status = 'Active'
      AND mobile IS NOT NULL 
      AND mobile != ''
      ORDER BY fullname ASC
    `, [today]);

    res.json({
      date: today,
      count: policies.rows.length,
      policies: policies.rows
    });

  } catch (err) {
    console.error('❌ Failed to fetch premium due policies:', err);
    res.status(500).json({ error: 'Failed to fetch policies' });
  }
});

// Send WhatsApp message to specific policy
app.post('/api/whatsapp/send-to-policy/:policyId', async (req, res) => {
  try {
    const { policyId } = req.params;
    const { customMessage } = req.body;

    // Get policy details
    const policy = await db.one(`
      SELECT 
        id, policy_no, fullname, mobile, plan_name, 
        premium, mode_of_payment, next_premium_date, status
      FROM lic_policy_details 
      WHERE id = $1 AND mobile IS NOT NULL AND mobile != ''
    `, [policyId]);

    if (!policy) {
      return res.status(404).json({ error: 'Policy not found or no mobile number' });
    }

    const message = customMessage || whatsappService.generatePremiumDueMessage(policy);
    const result = await whatsappService.sendMessage(policy.mobile, message);

    res.json({
      success: result.success,
      policy: {
        id: policy.id,
        policy_no: policy.policy_no,
        customer_name: policy.fullname,
        mobile: policy.mobile
      },
      messageId: result.messageId,
      url: result.url,
      error: result.error || null
    });

  } catch (err) {
    console.error('❌ Failed to send WhatsApp to policy:', err);
    res.status(500).json({ error: 'Failed to send WhatsApp message' });
  }
});

// 404
app.use((req, res) => res.status(404).send('Page not found'));

// Scheduled job to check for premium due policies daily at 9 AM
cron.schedule('0 9 * * *', async () => {
  try {
    console.log('🔄 Running daily premium due check...');
    
    const today = new Date().toISOString().split('T')[0];
    
    // Get policies with premium due today
    const policies = await db.query(`
      SELECT 
        id, policy_no, fullname, mobile, plan_name, 
        premium, mode_of_payment, next_premium_date, status
      FROM lic_policy_details 
      WHERE next_premium_date = $1 
      AND status = 'Active'
      AND mobile IS NOT NULL 
      AND mobile != ''
    `, [today]);

    if (policies.rows.length === 0) {
      console.log('✅ No policies with premium due today');
      return;
    }

    console.log(`📱 Found ${policies.rows.length} policies with premium due today`);
    
    let successCount = 0;
    for (const policy of policies.rows) {
      try {
        const message = whatsappService.generatePremiumDueMessage(policy);
        const result = await whatsappService.sendMessage(policy.mobile, message);
        
        if (result.success) {
          successCount++;
          console.log(`✅ WhatsApp sent to ${policy.fullname} (${policy.policy_no})`);
        } else {
          console.log(`❌ Failed to send WhatsApp to ${policy.fullname}: ${result.error}`);
        }
        
        // Add delay between messages
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ Error sending WhatsApp to ${policy.fullname}:`, error.message);
      }
    }
    
    console.log(`📊 Daily WhatsApp notifications: ${successCount}/${policies.rows.length} successful`);
    
  } catch (error) {
    console.error('❌ Daily premium due check failed:', error);
  }
}, {
  timezone: "Asia/Kolkata"
});

// Start
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
  console.log(`📅 Scheduled WhatsApp notifications: Daily at 9:00 AM IST`);
});
