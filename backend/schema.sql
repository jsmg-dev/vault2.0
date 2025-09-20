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

-- Laundry Customers table
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

-- Laundry Services table (for service types and pricing)
CREATE TABLE IF NOT EXISTS laundry_services (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
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
CREATE INDEX IF NOT EXISTS idx_laundry_customers_status ON laundry_customers(status);
CREATE INDEX IF NOT EXISTS idx_laundry_customers_phone ON laundry_customers(phone);
CREATE INDEX IF NOT EXISTS idx_laundry_customers_order_date ON laundry_customers(order_date);
CREATE INDEX IF NOT EXISTS idx_laundry_services_category ON laundry_services(category);
CREATE INDEX IF NOT EXISTS idx_laundry_services_active ON laundry_services(is_active);
