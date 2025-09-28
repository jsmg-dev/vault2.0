-- PostgreSQL Schema for Vault Application
-- This file contains the table definitions that match the existing SQLite schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    profile_pic TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
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
    created_by INTEGER REFERENCES users(id),
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
    created_by INTEGER REFERENCES users(id),
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
    deposit_date DATE,
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
    created_by INTEGER REFERENCES users(id),
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
    created_by INTEGER REFERENCES users(id),
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
-- Billing table for storing all generated bills
CREATE TABLE IF NOT EXISTS billing (
    id SERIAL PRIMARY KEY,
    bill_no TEXT UNIQUE NOT NULL,
    customer_id INTEGER,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_address TEXT,
    bill_date DATE NOT NULL,
    due_date DATE,
    bill_type TEXT DEFAULT 'laundry', -- laundry, policy, deposit, etc.
    items JSONB, -- Store bill items as JSON
    subtotal DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    balance_amount DECIMAL(10,2) DEFAULT 0,
    payment_status TEXT DEFAULT 'pending', -- pending, partial, paid
    payment_method TEXT,
    payment_date TIMESTAMP,
    notes TEXT,
    created_by TEXT,
    status TEXT DEFAULT 'active', -- active, cancelled, refunded
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Billing Items table for detailed item breakdown
CREATE TABLE IF NOT EXISTS billing_items (
    id SERIAL PRIMARY KEY,
    billing_id INTEGER REFERENCES billing(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    item_description TEXT,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    service_type TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Billing Payments table for payment tracking
CREATE TABLE IF NOT EXISTS billing_payments (
    id SERIAL PRIMARY KEY,
    billing_id INTEGER REFERENCES billing(id) ON DELETE CASCADE,
    payment_amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT NOT NULL,
    payment_date TIMESTAMP DEFAULT NOW(),
    payment_reference TEXT,
    notes TEXT,
    created_by TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for billing tables
CREATE INDEX IF NOT EXISTS idx_billing_bill_no ON billing(bill_no);
CREATE INDEX IF NOT EXISTS idx_billing_customer_id ON billing(customer_id);
CREATE INDEX IF NOT EXISTS idx_billing_customer_name ON billing(customer_name);
CREATE INDEX IF NOT EXISTS idx_billing_bill_date ON billing(bill_date);
CREATE INDEX IF NOT EXISTS idx_billing_payment_status ON billing(payment_status);
CREATE INDEX IF NOT EXISTS idx_billing_status ON billing(status);
CREATE INDEX IF NOT EXISTS idx_billing_created_at ON billing(created_at);
CREATE INDEX IF NOT EXISTS idx_billing_items_billing_id ON billing_items(billing_id);
CREATE INDEX IF NOT EXISTS idx_billing_payments_billing_id ON billing_payments(billing_id);
CREATE INDEX IF NOT EXISTS idx_billing_payments_payment_date ON billing_payments(payment_date);
