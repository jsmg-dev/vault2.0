// Migration script to create laundry tables
const { query } = require('./db');

async function migrate() {
  try {
    console.log('🔄 Starting laundry tables migration...');

    // Create laundry_customers table
    await query(`
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
    console.log('✅ Created laundry_customers table');

    // Create laundry_services table
    await query(`
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
    console.log('✅ Created laundry_services table');

    // Create indexes
    await query(`CREATE INDEX IF NOT EXISTS idx_laundry_customers_status ON laundry_customers(status);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_laundry_customers_phone ON laundry_customers(phone);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_laundry_customers_order_date ON laundry_customers(order_date);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_laundry_services_category ON laundry_services(category);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_laundry_services_active ON laundry_services(is_active);`);
    console.log('✅ Created indexes');

    // Seed default services
    const serviceCount = await query(`SELECT COUNT(*)::int AS cnt FROM laundry_services;`);
    if ((serviceCount.rows[0]?.cnt ?? 0) === 0) {
      await query(`
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
      console.log('✅ Seeded default laundry services');
    } else {
      console.log('ℹ️  Laundry services already exist, skipping seed');
    }

    console.log('🎉 Laundry migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrate().then(() => {
    console.log('Migration finished');
    process.exit(0);
  });
}

module.exports = migrate;
