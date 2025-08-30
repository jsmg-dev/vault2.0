-- PostgreSQL Schema for Vault Application
-- This file contains the table definitions that match the existing SQLite schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT
);

-- Customers table (assuming this exists based on the queries)
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
    remark TEXT,
    photo_path TEXT,
    document_path TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Deposits table (assuming this exists based on the queries)
CREATE TABLE IF NOT EXISTS deposits (
    id SERIAL PRIMARY KEY,
    customer_code TEXT REFERENCES customers(customer_code),
    customer_name TEXT,
    amount DECIMAL(10,2),
    penalty DECIMAL(10,2) DEFAULT 0,
    date DATE,
    remark TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default admin user if not exists
INSERT INTO users (name, username, password, role) 
VALUES ('Administrator', 'admin', 'admin123', 'admin')
ON CONFLICT (username) DO NOTHING;

-- LIC Policy Details table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_customer_code ON customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_deposits_customer_code ON deposits(customer_code);
CREATE INDEX IF NOT EXISTS idx_deposits_date ON deposits(date);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_policies_policy_no ON lic_policy_details(policy_no);
CREATE INDEX IF NOT EXISTS idx_policies_status ON lic_policy_details(status);
CREATE INDEX IF NOT EXISTS idx_policies_created_at ON lic_policy_details(created_at);
