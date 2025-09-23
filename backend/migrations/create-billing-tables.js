const db = require('../db');

async function createBillingTables() {
  try {
    console.log('Creating billing tables...');

    // Create billing table
    await db.query(`
      CREATE TABLE IF NOT EXISTS billing (
        id SERIAL PRIMARY KEY,
        bill_no TEXT UNIQUE NOT NULL,
        customer_id INTEGER,
        customer_name TEXT NOT NULL,
        customer_phone TEXT,
        customer_address TEXT,
        bill_date DATE NOT NULL,
        due_date DATE,
        bill_type TEXT DEFAULT 'laundry',
        items JSONB,
        subtotal DECIMAL(10,2) DEFAULT 0,
        tax_amount DECIMAL(10,2) DEFAULT 0,
        discount_amount DECIMAL(10,2) DEFAULT 0,
        total_amount DECIMAL(10,2) NOT NULL,
        paid_amount DECIMAL(10,2) DEFAULT 0,
        balance_amount DECIMAL(10,2) DEFAULT 0,
        payment_status TEXT DEFAULT 'pending',
        payment_method TEXT,
        payment_date TIMESTAMP,
        notes TEXT,
        created_by TEXT,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ billing table created');

    // Create billing_items table
    await db.query(`
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
      )
    `);
    console.log('✅ billing_items table created');

    // Create billing_payments table
    await db.query(`
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
      )
    `);
    console.log('✅ billing_payments table created');

    // Create indexes
    await db.query(`CREATE INDEX IF NOT EXISTS idx_billing_bill_no ON billing(bill_no)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_billing_customer_id ON billing(customer_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_billing_customer_name ON billing(customer_name)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_billing_bill_date ON billing(bill_date)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_billing_payment_status ON billing(payment_status)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_billing_status ON billing(status)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_billing_created_at ON billing(created_at)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_billing_items_billing_id ON billing_items(billing_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_billing_payments_billing_id ON billing_payments(billing_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_billing_payments_payment_date ON billing_payments(payment_date)`);
    
    console.log('✅ All billing indexes created');
    console.log('🎉 Billing tables migration completed successfully!');

  } catch (error) {
    console.error('❌ Error creating billing tables:', error.message);
    throw error;
  }
}

createBillingTables().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
