// migrate.js - PostgreSQL migration
const { Pool } = require('pg');
require('dotenv').config();

const shouldUseSSL =
  process.env.DB_SSL?.toLowerCase() === 'true' ||
  (!process.env.DB_SSL && process.env.DB_HOST && process.env.DB_HOST !== 'localhost');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'vault_db',
  password: process.env.DB_PASSWORD || 'password',
  port: Number(process.env.DB_PORT) || 5432,
  ssl: shouldUseSSL ? { rejectUnauthorized: false } : false,
});

async function migrate() {
  try {
    console.log('🚀 Starting database migration...');

    // Drop
    console.log('🗑️  Dropping existing tables...');
    await pool.query('DROP TABLE IF EXISTS deposits CASCADE;');
    await pool.query('DROP TABLE IF EXISTS lic_policy_details CASCADE;');
    await pool.query('DROP TABLE IF EXISTS customers CASCADE;');
    await pool.query('DROP TABLE IF EXISTS users CASCADE;');

    // Create
    console.log('🏗️  Creating tables...');

    await pool.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name TEXT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT,
        status TEXT DEFAULT 'active'
      );
    `);

    await pool.query(`
      CREATE TABLE customers (
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
        remark TEXT,
        photo_path TEXT,
        document_path TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE deposits (
        id SERIAL PRIMARY KEY,
        customer_code TEXT REFERENCES customers(customer_code),
        customer_name TEXT,
        amount DECIMAL(10,2),
        penalty DECIMAL(10,2) DEFAULT 0,
        date DATE,
        remark TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE lic_policy_details (
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

    // Indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_customers_customer_code ON customers(customer_code);
      CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
      CREATE INDEX IF NOT EXISTS idx_deposits_customer_code ON deposits(customer_code);
      CREATE INDEX IF NOT EXISTS idx_deposits_date ON deposits(date);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_policies_policy_no ON lic_policy_details(policy_no);
      CREATE INDEX IF NOT EXISTS idx_policies_status ON lic_policy_details(status);
      CREATE INDEX IF NOT EXISTS idx_policies_created_at ON lic_policy_details(created_at);
    `);

    // Seeds
    await pool.query(
      `INSERT INTO users (name, username, password, role)
       VALUES ('Administrator', 'admin', 'admin123', 'admin'),
              ('Akshar', 'aks', 'qwerty', 'lic')
       ON CONFLICT (username) DO NOTHING;`
    );

    await pool.query(`
      INSERT INTO customers (customer_code, name, contact_no, start_date, loan_amount, status)
      VALUES 
        ('CUST001', 'John Doe', '9876543210', '2024-01-01', 50000, 'active'),
        ('CUST002', 'Jane Smith', '9876543211', '2024-01-15', 75000, 'active')
      ON CONFLICT (customer_code) DO NOTHING;
    `);

    await pool.query(`
      INSERT INTO deposits (customer_code, customer_name, amount, penalty, date)
      VALUES
        ('CUST001', 'John Doe', 5000, 0, '2024-01-01'),
        ('CUST002', 'Jane Smith', 7500, 100, '2024-01-15');
    `);

    await pool.query(`
      INSERT INTO lic_policy_details (policy_no, fullname, plan_name, status)
      VALUES
        ('LIC001', 'John Doe', 'Jeevan Anand', 'Active'),
        ('LIC002', 'Jane Smith', 'Jeevan Anand', 'Active');
    `);

    console.log('✅ Database migration completed successfully!');
    console.log('📊 Sample data seeded');
    console.log('🔐 Default admin user: admin/admin123');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
