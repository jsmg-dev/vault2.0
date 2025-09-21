const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'vault_db',
  password: 'postgres',
  port: 5432,
});

async function addItemsJsonField() {
  const client = await pool.connect();
  
  try {
    console.log('Adding items_json field to laundry_customers table...');

    // Add the items_json field
    await client.query(`
      ALTER TABLE laundry_customers 
      ADD COLUMN IF NOT EXISTS items_json JSONB;
    `);
    console.log('✅ Added items_json field');

    // Create index for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_laundry_customers_items_json 
      ON laundry_customers USING GIN (items_json);
    `);
    console.log('✅ Created index on items_json field');

    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migration
addItemsJsonField()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
